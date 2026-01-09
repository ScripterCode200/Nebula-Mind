
import { NextRequest, NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';
import { r2Client, R2_BUCKET_NAME } from '@/lib/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { transcribeAudioWithGemini } from './gemini-audio';

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

        console.log(`\n--- [YOUTUBE TRANSCRIBER] START ---`);
        console.log(`[Target URL]: ${url}`);

        // Strategy 1: Direct Caption Strategy (Lightweight)
        console.log(`[Strategy 1]: ATTEMPTING DIRECT CAPTION EXTRACTION (Fastest)`);
        try {
            const transcriptItems = await YoutubeTranscript.fetchTranscript(url);

            if (transcriptItems && transcriptItems.length > 0) {
                const transcriptText = transcriptItems.map(item => item.text).join(' ');
                console.log(`[Strategy 1 SUCCESS]: Found generic captions | Length: ${transcriptText.length} characters`);

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

                console.log(`[YOUTUBE TRANSCRIBER] FINISHED | COMPLETED VIA DIRECT CAPTIONS\n`);

                return NextResponse.json({
                    success: true,
                    strategy: 'direct-captions',
                    text: transcriptText,
                    r2Key: fileKey,
                    videoId: url
                });
            } else {
                throw new Error('No transcript items returned');
            }

        } catch (captionError) {
            console.warn(`[Strategy 1 FAILED]: Direct caption extraction failed or not available.`);
            console.log(`[Error Details]: ${captionError instanceof Error ? captionError.message : String(captionError)}`);

            // Strategy 2: Audio Download + Gemini Strategy (Heavyweight)
            console.log(`[Strategy 2]: FALLING BACK TO AUDIO DOWNLOAD + GEMINI 1.5 FLASH (Standard)`);
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
