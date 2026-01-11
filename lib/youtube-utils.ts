/**
 * Extracts a YouTube video ID from a URL.
 * valid for both Client and Server side usage.
 */
export function extractVideoId(url: string): string | null {
    if (!url) return null;
    try {
        // Handle common formats
        // https://www.youtube.com/watch?v=VIDEO_ID
        // https://youtu.be/VIDEO_ID
        // https://www.youtube.com/embed/VIDEO_ID

        const urlObj = new URL(url);
        if (urlObj.hostname === 'youtu.be') {
            return urlObj.pathname.slice(1);
        }
        if (urlObj.hostname.includes('youtube.com')) {
            if (urlObj.pathname.includes('/embed/')) {
                return urlObj.pathname.split('/embed/')[1];
            }
            return urlObj.searchParams.get('v');
        }
    } catch (e) {
        // Fallback for partial strings or other formats checking via regex
        const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11}).*/);
        if (match) return match[1];
    }
    return null;
}
