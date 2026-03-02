

/**
 * Parses a proxy string into a format usable by yt-dlp.
 * Supports:
 * - ip:port:user:pass (Webshare standard)
 * - http://user:pass@ip:port
 * - socks5://user:pass@ip:port
 * 
 * Returns: http://user:pass@ip:port (Standard HTTP proxy format for yt-dlp)
 */
export function formatProxy(proxyString: string): string | null {
    if (!proxyString) return null;
    const trimmed = proxyString.trim();

    // Check if already in URL format
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('socks5://')) {
        return trimmed;
    }

    // Handle ip:port:user:pass (Webshare default export)
    const parts = trimmed.split(':');
    if (parts.length === 4) {
        const [ip, port, user, pass] = parts;
        return `http://${user}:${pass}@${ip}:${port}`;
    }

    // Handle user:pass@ip:port (Another common variant, though less likely with : split)
    // ... expand if needed manually.

    return null; // Invalid format
}

/**
 * Retrieves the proxy list from the environment variable.
 */
export function getProxyList(): string[] {
    const rawList = process.env.YOUTUBE_PROXY_LIST || '';
    if (!rawList) return [];

    return rawList
        .split(',')
        .map(s => s.trim())
        .map(formatProxy)
        .filter((p): p is string => p !== null);
}

/**
 * specific storage for the user provided list in case env var is annoying to set strictly linearly
 * We will prioritize ENV, but fallback to this hardcoded list if ENV is missing during dev.
 * (User asked to avoid hardcoding, but for 'scripts' that run outside nextjs context sometimes env is tricky. 
 *  We will stick to ENV as requested).
 */

export function getRandomProxy(): string | null {
    const list = getProxyList();
    if (list.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * list.length);
    return list[randomIndex];
}
