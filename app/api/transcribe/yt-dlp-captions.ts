import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { getProxyList } from '@/lib/proxies';

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

    return textLines.join(' ');
}

/**
 * Internal function to fetch captions with a specific proxy (or directly).
 */
async function _fetchCaptionsInternal(url: string, videoId: string, proxy: string | null): Promise<{ success: boolean; text: string | null; error?: any; type?: 'BLOCK' | 'UNAVAILABLE' | 'OTHER' }> {
    const tempDir = os.tmpdir();
    const uniqueId = uuidv4();
    const outputPrefix = path.join(tempDir, uniqueId);

    const args = [
        '--skip-download',
        '--write-subs',
        '--write-auto-subs',
        '--sub-lang', 'en,en-orig,en-US,en-GB',
        '--sub-format', 'vtt',
        '--output', `${outputPrefix}.%(ext)s`,
        '--socket-timeout', '5', // Fail fast on dead proxies
        url
    ];

    if (proxy) {
        args.splice(1, 0, '--proxy', proxy);
    }

    // console.log(`[yt-dlp-captions] Spawning yt-dlp for ${videoId} | Proxy: ${proxy ? 'YES' : 'NO'}...`);
    // Mask proxy details in logs
    const logProxy = proxy ? `...${proxy.slice(-5)}` : 'DIRECT';
    console.log(`[yt-dlp-captions] Spawning yt-dlp... Proxy: ${logProxy}`);

    return new Promise((resolve) => {
        const process = spawn(ytDlpPath, args);
        let errorOutput = '';

        process.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        process.on('close', async (code) => {
            // Check specific yt-dlp errors from stderr
            if (errorOutput.includes('Video unavailable') || errorOutput.includes('Private video') || errorOutput.includes('404 Not Found')) {
                return resolve({ success: false, text: null, error: 'Video Unavailable', type: 'UNAVAILABLE' });
            }
            if (errorOutput.includes('Sign in to confirm') || errorOutput.includes('HTTP Error 429') || errorOutput.includes('bot')) {
                return resolve({ success: false, text: null, error: 'Blocked/Bot Detected', type: 'BLOCK' });
            }

            // Attempt to find the generated file
            try {
                const files = fs.readdirSync(tempDir);
                const captionFile = files.find(f => f.startsWith(uniqueId) && f.endsWith('.vtt'));

                if (!captionFile) {
                    // If blocked or network error, code usually != 0
                    if (code !== 0) {
                        // Double check if it looks like a block or network issue
                        return resolve({ success: false, text: null, error: `Exit Code ${code}: ${errorOutput.slice(0, 100)}...`, type: 'OTHER' });
                    }
                    // console.warn('[yt-dlp-captions] No VTT file generated, but no obvious error.');
                    return resolve({ success: false, text: null, error: 'No VTT generated', type: 'OTHER' });
                }

                const fullPath = path.join(tempDir, captionFile);
                const content = fs.readFileSync(fullPath, 'utf8');
                fs.unlinkSync(fullPath);

                const parsedText = parseVtt(content);
                if (!parsedText || parsedText.length < 50) {
                    return resolve({ success: false, text: null, error: 'Transcript too short', type: 'OTHER' });
                }

                resolve({ success: true, text: parsedText });

            } catch (err) {
                resolve({ success: false, text: null, error: err, type: 'OTHER' });
            }
        });

        process.on('error', (err) => {
            resolve({ success: false, text: null, error: err, type: 'OTHER' });
        });
    });
}

/**
 * Public function to fetch captions with robust proxy rotation and retries.
 */
export async function fetchCaptionsWithYtDlp(url: string): Promise<string | null> {
    const videoId = extractVideoId(url);
    if (!videoId) {
        console.warn('[yt-dlp-captions] Could not extract video ID');
        return null;
    }

    const proxies = getProxyList();
    // Shuffle proxies for better distribution
    const shuffledProxies = [...proxies].sort(() => 0.5 - Math.random());

    // Attempt list: proxies first, then direct as fallback (optional, maybe direct is blocked too)
    // If user specifically bought proxies to avoid blocking, maybe we should ONLY use proxies?
    // But if they all fail, trying direct is a valid last resort.
    const attemptList = [...shuffledProxies];
    if (attemptList.length > 0) {
        attemptList.push(null as unknown as string); // Add null for direct
    } else {
        attemptList.push(null as unknown as string);
    }

    // Cap attempts
    const MAX_ATTEMPTS = Math.min(attemptList.length, 6); // Try up to 6 distinct IPs

    for (let i = 0; i < MAX_ATTEMPTS; i++) {
        const proxy = attemptList[i];
        // console.log(`\n[Transcribe] Attempt ${i + 1}/${MAX_ATTEMPTS} | Proxy: ${proxy ? '***' : 'DIRECT'}`);

        const result = await _fetchCaptionsInternal(url, videoId, proxy);

        if (result.success && result.text) {
            console.log(`[Transcribe] Success on attempt ${i + 1}`);
            return result.text;
        }

        console.warn(`[Transcribe] Attempt ${i + 1} Failed: ${typeof result.error === 'string' ? result.error : 'Unknown Error'}`);

        if (result.type === 'UNAVAILABLE') {
            console.error('[Transcribe] Video is unavailable (404/403). Aborting retries.');
            return null; // Don't retry for purely content errors
        }

        // If BLOCK or OTHER (Network), continue
        if (i < MAX_ATTEMPTS - 1) {
            console.log('[Transcribe] Switching logic...');
        }
    }

    console.error('[Transcribe] All attempts failed.');
    return null;
}
