import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

const ytDlpPath = path.join(process.cwd(), 'scripts', 'yt-dlp.exe');

/**
 * Extracts video ID to ensure we can identify the output file.
 */
export function extractVideoId(url: string): string | null {
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname === 'youtu.be') {
            return urlObj.pathname.slice(1);
        }
        if (urlObj.hostname.includes('youtube.com')) {
            return urlObj.searchParams.get('v');
        }
    } catch (e) {
        const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11}).*/);
        if (match) return match[1];
    }
    return null;
}

/**
 * Parses VTT content into plain text.
 * Removes headers, timestamps, and tags.
 */
function parseVtt(vttContent: string): string {
    const lines = vttContent.split('\n');
    const textLines: string[] = [];

    // Regex for timestamps: 00:00:00.000 --> 00:00:00.000
    const timestampRegex = /^\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}/;

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        if (line.startsWith('WEBVTT')) continue;
        if (line.startsWith('NOTE')) continue;
        if (timestampRegex.test(line)) continue;

        // Remove HTML-like tags (e.g. <c.colorE5E5E5>)
        line = line.replace(/<[^>]*>/g, '');

        // Unescape entities if needed (basic ones)
        line = line.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

        // Avoid exact duplicates (common in some caption formats)
        if (textLines.length > 0 && textLines[textLines.length - 1] === line) {
            continue;
        }

        textLines.push(line);
    }

    // Join with spaces for flow, or newlines? 
    // Captions are often short phrases. Joining with space usually makes a readable paragraph.
    return textLines.join(' ');
}

export async function fetchCaptionsWithYtDlp(url: string): Promise<string | null> {
    const videoId = extractVideoId(url);
    if (!videoId) {
        console.warn('[yt-dlp-captions] Could not extract video ID');
        return null;
    }

    const tempDir = os.tmpdir();
    const uniqueId = uuidv4();
    // Prefix for output files: tempDir/uuid
    const outputPrefix = path.join(tempDir, uniqueId);

    // yt-dlp will append .en.vtt or .vtt depending on what it finds
    // We use -o to control the filename base.
    // Argument order:
    // --skip-download: Don't get the video
    // --write-subs: Get manual subs
    // --write-auto-subs: Get auto subs if manual not found (default behavior with specific flags?)
    // Actually you usually pass both to get what's available. 
    // --sub-lang en: Prefer English
    // --sub-format vtt: Ensure VTT format

    const args = [
        '--skip-download',
        '--write-subs',
        '--write-auto-subs',
        '--sub-lang', 'en,en-orig,en-US,en-GB', // Try various english codes
        '--sub-format', 'vtt',
        '--output', `${outputPrefix}.%(ext)s`,
        url
    ];

    console.log(`[yt-dlp-captions] Spawning yt-dlp for ${videoId}...`);

    return new Promise<string | null>((resolve, reject) => {
        const process = spawn(ytDlpPath, args);

        process.on('close', async (code) => {
            if (code !== 0) {
                console.warn(`[yt-dlp-captions] yt-dlp exited with code ${code}`);
                // Proceed to check for files anyway? Sometimes it errors on other things.
            }

            // Find the generated file
            // It should be named uniqueId.en.vtt or something similar.
            try {
                const files = fs.readdirSync(tempDir);
                const captionFile = files.find(f => f.startsWith(uniqueId) && f.endsWith('.vtt'));

                if (!captionFile) {
                    console.warn('[yt-dlp-captions] No VTT file generated.');
                    return resolve(null);
                }

                const fullPath = path.join(tempDir, captionFile);
                console.log(`[yt-dlp-captions] Found caption file: ${fullPath}`);

                const content = fs.readFileSync(fullPath, 'utf8');

                // Cleanup
                fs.unlinkSync(fullPath);

                const parsedText = parseVtt(content);
                if (!parsedText || parsedText.length < 50) {
                    console.warn('[yt-dlp-captions] Parsed text too short or empty.');
                    return resolve(null);
                }

                resolve(parsedText);

            } catch (err) {
                console.error('[yt-dlp-captions] Error processing file:', err);
                resolve(null); // Fallback gracefully
            }
        });

        process.on('error', (err) => {
            console.error('[yt-dlp-captions] Spawn error:', err);
            resolve(null);
        });
    });
}
