import { VertexAI } from '@google-cloud/vertexai';
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

export async function transcribeAudioWithGemini(url: string): Promise<string> {
    const projectId = process.env.GOOGLE_PROJECT_ID || 'nebula-mind-480116';
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!clientEmail || !privateKey) {
        throw new Error('Vertex AI credentials (GOOGLE_CLIENT_EMAIL/PRIVATE_KEY) are not defined');
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
        throw new Error('Could not extract video ID from URL: ' + url);
    }

    // Initialize Vertex AI
    const vertexAI = new VertexAI({
        project: projectId,
        location: 'us-central1',
        googleAuthOptions: {
            credentials: {
                client_email: clientEmail,
                private_key: privateKey,
                project_id: projectId
            }
        }
    });

    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `${uuidv4()}.mp3`);
    const ytDlpPath = path.join(process.cwd(), 'scripts', 'yt-dlp.exe');

    try {
        let currentFilePath = tempFilePath;
        let success = false;
        let attempt = 1;

        // Attempt 1: Prefer moderate bitrate (96k)
        // Attempt 2: Forced low bitrate (48k or lower)
        while (attempt <= 2 && !success) {
            console.log(`[Vertex Audio] Download attempt ${attempt} for: ${videoId} using yt-dlp`);

            const formatStr = attempt === 1
                ? 'bestaudio[abr<=96][ext=m4a]/bestaudio[abr<=96]/bestaudio[ext=m4a]/bestaudio'
                : 'bestaudio[abr<=48][ext=m4a]/bestaudio[abr<=48]/bestaudio';

            await new Promise<void>((resolve, reject) => {
                const process = spawn(ytDlpPath, [
                    '-f', formatStr,
                    '-o', '-',
                    '--no-playlist',
                    url
                ]);

                const writer = fs.createWriteStream(currentFilePath);
                process.stdout.pipe(writer);

                process.stderr.on('data', (data) => {
                    const msg = data.toString();
                    if (msg.includes('ERROR:')) console.error(`[yt-dlp Error]: ${msg}`);
                });

                process.on('close', (code) => {
                    if (code === 0) resolve();
                    else reject(new Error(`yt-dlp exited with code ${code}`));
                });

                writer.on('error', (err) => reject(err));
                process.on('error', (err) => reject(err));
            });

            const stats = fs.statSync(currentFilePath);
            console.log(`[Vertex Audio] Attempt ${attempt} complete. Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

            if (stats.size <= 25 * 1024 * 1024) {
                success = true;
            } else if (attempt === 1) {
                console.log(`[Vertex Audio] File too large (${(stats.size / 1024 / 1024).toFixed(2)} MB). Retrying with lower bitrate...`);
                if (fs.existsSync(currentFilePath)) fs.unlinkSync(currentFilePath);
                attempt++;
            } else {
                throw new Error(`Audio file still too large after compression (${(stats.size / 1024 / 1024).toFixed(2)} MB).`);
            }
        }

        const audioBuffer = fs.readFileSync(currentFilePath);
        const base64Audio = audioBuffer.toString('base64');

        console.log(`[Vertex Audio] Generating transcript via Gemini 2.0 Flash...`);

        const model = vertexAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const result = await model.generateContent({
            contents: [{
                role: 'user',
                parts: [
                    { text: "Transcribe the audio from this file accurately. Output ONLY the transcript text, no other commentary." },
                    {
                        inlineData: {
                            mimeType: 'audio/mp4',
                            data: base64Audio
                        }
                    }
                ]
            }]
        });

        const response = await result.response;
        const text = response.candidates?.[0].content.parts[0].text || '';

        console.log(`[Vertex Audio] Transcription complete. Length: ${text.length}`);

        return text;

    } catch (error) {
        console.error('[Vertex Audio] Error:', error);
        throw error;
    } finally {
        if (fs.existsSync(tempFilePath)) {
            try { fs.unlinkSync(tempFilePath); } catch (e) { }
        }
    }
}
