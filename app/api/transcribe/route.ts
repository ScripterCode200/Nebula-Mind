import { NextRequest, NextResponse } from 'next/server';
// import { YoutubeTranscript } from 'youtube-transcript'; // REMOVED
import { r2Client, R2_BUCKET_NAME } from '@/lib/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { transcribeAudioWithGemini } from './gemini-audio';
import { fetchCaptionsWithYtDlp, extractVideoId } from './yt-dlp-captions';
import connectToDatabase from '@/lib/db';
import CachedTranscript from '@/models/CachedTranscript';

export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // Validate YouTube URL (Basic check)
        if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
            return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
        }

        const videoId = extractVideoId(url);
        if (!videoId) {
            return NextResponse.json({ error: 'Could not extract Video ID' }, { status: 400 });
        }

        console.log(`\n--- [YOUTUBE TRANSCRIBER] START ---`);
        console.log(`[Target URL]: ${url}`);
        console.log(`[Video ID]: ${videoId}`);

        // 0. CACHE CHECK
        try {
            await connectToDatabase();
            const cached = await CachedTranscript.findOne({ videoId });
            if (cached) {
                console.log(`[CACHE HIT]: Found existing transcript -> ${cached.r2Key}`);
                return NextResponse.json({
                    success: true,
                    strategy: cached.strategy + ' (cached)',
                    r2Key: cached.r2Key,
                    fromCache: true,
                    videoId: url
                });
            } else {
                console.log(`[CACHE MISS]: Processing new transcription...`);
            }
        } catch (dbError) {
            console.warn(`[CACHE ERROR]: Database check failed, proceeding without cache.`, dbError);
        }

        // Check Global Settings (Compliance)
        const SystemSetting = (await import('@/models/SystemSetting')).default;
        const globalSettings = await SystemSetting.findOne({ key: 'global' });
        const enableDirectCaptions = globalSettings?.enableDirectCaptions ?? true; // Default ON to restore transcription functionality
        const enableArtificialProxy = globalSettings?.enableArtificialProxy ?? true;


        // Strategy 1: Direct Caption Strategy (Lightweight but Robust with yt-dlp)
        console.log(`[Strategy 1]: ATTEMPTING DIRECT CAPTION EXTRACTION (yt-dlp)`);
        try {
            if (!enableDirectCaptions) {
                console.log('[Strategy 1]: SKIPPING - Disabled by Global Settings (Compliance Mode)');
                throw new Error('Compliance: Direct scraping disabled');
            }
            const transcriptText = await fetchCaptionsWithYtDlp(url, enableArtificialProxy);

            if (transcriptText && transcriptText.length > 50) {
                console.log(`[Strategy 1 SUCCESS]: Found captions | Length: ${transcriptText.length} characters`);

                // Upload to R2
                const fileId = uuidv4();
                const fileKey = `transcripts/${fileId}.txt`;
                console.log(`[R2 Storage]: Saving transcript to -> ${fileKey}`);

                await r2Client.send(new PutObjectCommand({
                    Bucket: R2_BUCKET_NAME,
                    Key: fileKey,
                    Body: transcriptText,
                    ContentType: 'text/plain',
                }));

                // SAVE TO CACHE
                try {
                    await CachedTranscript.create({
                        videoId,
                        r2Key: fileKey,
                        strategy: 'direct-captions',
                        transcriptPreview: transcriptText.substring(0, 100)
                    });
                    console.log(`[CACHE SAVE]: Saved to cache.`);
                } catch (saveError: any) {
                    // Ignore duplicate key errors (race conditions)
                    if (saveError.code !== 11000) {
                        console.warn(`[CACHE SAVE FAIL]:`, saveError);
                    }
                }

                console.log(`[YOUTUBE TRANSCRIBER] FINISHED | COMPLETED VIA YT-DLP CAPTIONS\n`);

                return NextResponse.json({
                    success: true,
                    strategy: 'direct-captions',
                    text: transcriptText,
                    r2Key: fileKey,
                    videoId: url
                });
            } else {
                throw new Error('No valid captions found via yt-dlp');
            }

        } catch (captionError) {
            console.warn(`[Strategy 1 FAILED]: Direct caption extraction failed or not available.`);
            console.log(`[Error Details]: ${captionError instanceof Error ? captionError.message : String(captionError)}`);

            // Strategy 2: Audio Download + Gemini Strategy (Heavyweight)
            console.log(`[Strategy 2]: FALLING BACK TO AUDIO DOWNLOAD + GEMINI 2.0 FLASH (Standard)`);
            try {
                const geminiText = await transcribeAudioWithGemini(url);
                console.log(`[Strategy 2 SUCCESS]: Gemini Generated Transcript | Length: ${geminiText.length} characters`);

                // Upload to R2
                const fileId = uuidv4();
                const fileKey = `transcripts/${fileId}.txt`;
                console.log(`[R2 Storage]: Saving Gemini transcript to -> ${fileKey}`);

                await r2Client.send(new PutObjectCommand({
                    Bucket: R2_BUCKET_NAME,
                    Key: fileKey,
                    Body: geminiText,
                    ContentType: 'text/plain',
                }));

                // SAVE TO CACHE
                try {
                    await CachedTranscript.create({
                        videoId,
                        r2Key: fileKey,
                        strategy: 'gemini-audio',
                        transcriptPreview: geminiText.substring(0, 100)
                    });
                    console.log(`[CACHE SAVE]: Saved to cache.`);
                } catch (saveError: any) {
                    if (saveError.code !== 11000) {
                        console.warn(`[CACHE SAVE FAIL]:`, saveError);
                    }
                }

                console.log(`[YOUTUBE TRANSCRIBER] FINISHED | COMPLETED VIA GEMINI AUDIO\n`);

                return NextResponse.json({
                    success: true,
                    strategy: 'gemini-audio',
                    text: geminiText,
                    r2Key: fileKey,
                    videoId: url
                });

            } catch (geminiError) {
                console.error(`[Strategy 2 FAILED]: Audio transcription failed.`);
                console.error(geminiError);

                return NextResponse.json({
                    error: 'Both caption extraction and audio transcription failed.',
                    details: String(geminiError)
                }, { status: 500 });
            }
        }

    } catch (error) {
        console.error('[Transcribe] API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
