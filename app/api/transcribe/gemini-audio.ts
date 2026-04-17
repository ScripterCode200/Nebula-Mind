import { HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { getGenerativeModel } from '@/lib/gemini';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { spawn } from 'child_process';

/**
 * Extracts a YouTube video ID from a URL.
 */
function extractVideoId(url: string): string | null {
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname === 'youtu.be') {
            return urlObj.pathname.slice(1);
        }
        if (urlObj.hostname.includes('youtube.com')) {
            return urlObj.searchParams.get('v');
        }
    } catch (e) {
        // Fallback for non-url strings
        const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11}).*/);
        if (match) return match[1];
    }
    return null;
}

async function getVideoDuration(url: string, ytDlpPath: string): Promise<number> {
    return new Promise((resolve, reject) => {
        const process = spawn(ytDlpPath, ['--print', 'duration', '--no-playlist', url]);
        let output = '';
        process.stdout.on('data', (d) => output += d.toString());
        process.on('close', (code) => {
            if (code === 0 && output.trim()) resolve(parseFloat(output.trim()));
            else reject(new Error('Failed to get video duration'));
        });
    });
}

function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

async function generateWithPrompt(model: any, base64Audio: string, start: number, end?: number, retries = 3): Promise<string> {
    let prompt = "Transcribe the audio from this file accurately. Output ONLY the transcript text, no other commentary.";

    if (end !== undefined) {
        const startStr = formatTime(start);
        const endStr = formatTime(end);
        prompt = `Please transcribe the audio specifically between timestamp ${startStr} and ${endStr}. Ignore any audio before ${startStr} or after ${endStr}. Output ONLY the transcript for this segment.`;
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const result = await model.generateContent({
                contents: [{
                    role: 'user',
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType: 'audio/mp4', data: base64Audio } }
                    ]
                }]
            });

            const response = await result.response;
            return response.candidates?.[0].content.parts[0].text || '';
        } catch (error: any) {
            console.warn(`[Vertex Audio] Attempt ${attempt} failed: ${error.message}`);
            // If it's a 503 error or we haven't exhausted retries yet, we wait and try again
            if (attempt === retries) throw error;
            
            // Exponential backoff: Wait 2s, 4s, 8s -> helps if the server is temporarily overloaded
            const waitTime = Math.pow(2, attempt) * 1000;
            console.log(`[Vertex Audio] Server might be busy. Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
    return '';
}

export async function transcribeAudioWithGemini(url: string): Promise<string> {
    const videoId = extractVideoId(url);
    if (!videoId) throw new Error('Could not extract video ID');

    const model = await getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: {
            maxOutputTokens: 8192,
            temperature: 0.1,
            topP: 0.8,
        },
        safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH }
        ]
    });

    const tempDir = os.tmpdir();
    // Unique ID for this job
    const uniqueId = uuidv4();
    const tempFilePath = path.join(tempDir, `${uniqueId}.m4a`); // using m4a/mp4 container
    const ytDlpPath = path.join(process.cwd(), 'scripts', 'yt-dlp.exe');

    try {
        const duration = await getVideoDuration(url, ytDlpPath);
        console.log(`[Vertex Audio] Video Duration: ${duration}s`);

        // 1. Download FULL Audio (Compressed)
        console.log(`[Vertex Audio] Downloading FULL Audio (Compressed)...`);
        await new Promise<void>((resolve, reject) => {
            // Force low bitrate (<=50k) to keep file small.
            // Using 'bestaudio' may default to opus/webm which Gemini might accept, but m4a is safer for inlineData mime 'audio/mp4'.
            // [abr<=50] tries to find low bitrate.
            const dlArgs = [
                '-f', 'bestaudio[abr<=50][ext=m4a]/bestaudio[abr<=50]/bestaudio',
                '-o', '-',
                '--no-playlist',
                url
            ];

            const dlProcess = spawn(ytDlpPath, dlArgs);
            const writer = fs.createWriteStream(tempFilePath);
            dlProcess.stdout.pipe(writer);

            dlProcess.stderr.on('data', (d) => {
                const s = d.toString();
                // Log errors but ignore routine info
                if (s.includes('ERROR:')) console.error(`[yt-dlp]: ${s}`);
            });

            dlProcess.on('close', (code) => {
                if (code === 0) resolve();
                else reject(new Error(`yt-dlp exited with ${code}`));
            });
            dlProcess.on('error', reject);
            writer.on('error', reject);
        });

        const stats = fs.statSync(tempFilePath);
        console.log(`[Vertex Audio] Download Complete. Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

        // Warning if > 20MB (approx inline limit). Gemini might handle slightly more but 20MB is safe bet.
        if (stats.size > 22 * 1024 * 1024) {
            console.warn(`[Vertex Audio] Warning: File size ${(stats.size / 1024 / 1024).toFixed(2)}MB is large. Transcription might fail if over inline limit.`);
        }

        const audioBuffer = fs.readFileSync(tempFilePath);
        const base64Audio = audioBuffer.toString('base64');

        // Chunking Logic (Prompt-based)
        const MAX_CHUNK_DURATION = 15 * 60; // 15 minutes
        const OVERLAP = 60; // 60 seconds overlap

        let transcript = '';

        if (duration <= MAX_CHUNK_DURATION) {
            // Single Pass
            console.log(`[Vertex Audio] Processing Single Pass...`);
            transcript = await generateWithPrompt(model, base64Audio, 0, undefined);
        } else {
            // Iterative Pass
            let start = 0;
            let chunkIndex = 1;

            while (start < duration) {
                let end = start + MAX_CHUNK_DURATION;
                if (end >= duration) end = duration;

                console.log(`[Vertex Audio] Processing Segment ${chunkIndex}: ${formatTime(start)} - ${formatTime(end)}`);
                const chunkText = await generateWithPrompt(model, base64Audio, start, end);

                transcript += (transcript ? ' ' : '') + chunkText;

                start = end;
                chunkIndex++;

                // If there are more chunks to process, enforce a strict delay to bypass rate limits
                if (start < duration) {
                    const delaySeconds = 65; // Wait 65 seconds between chunks (Free tier Gemini 2.5 flash throttles frequently)
                    console.log(`[Vertex Audio] Rate limit cooldown: Waiting ${delaySeconds} seconds before processing the next chunk...`);
                    await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
                }
            }
        }

        return transcript;

    } catch (error) {
        console.error('[Vertex Audio] Error:', error);
        throw error;
    } finally {
        if (fs.existsSync(tempFilePath)) {
            try { fs.unlinkSync(tempFilePath); } catch (e) { }
        }
    }
}
