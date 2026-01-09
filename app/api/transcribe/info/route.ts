import { NextRequest, NextResponse } from 'next/server';
import { Innertube } from 'youtubei.js';

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

export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        const videoId = extractVideoId(url);
        if (!videoId) {
            return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
        }

        console.log(`[Transcribe Info] Fetching metadata for: ${videoId} using youtubei.js (Default client)`);

        const yt = await Innertube.create();
        const info = await yt.getInfo(videoId);

        const durationSeconds = info.basic_info.duration || 0;
        const title = info.basic_info.title || 'Untitled Video';
        const thumbnail = info.basic_info.thumbnail?.[0]?.url;

        return NextResponse.json({
            success: true,
            title,
            durationSeconds,
            thumbnail
        });

    } catch (error) {
        console.error('[Transcribe Info] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch video information' }, { status: 500 });
    }
}
