export class AppError extends Error {
    constructor(
        public message: string,
        public status?: number,
        public code?: string
    ) {
        super(message);
        this.name = 'AppError';
    }
}

interface FetchOptions extends RequestInit {
    timeout?: number;
}

export async function safeFetch<T>(
    url: string,
    options: FetchOptions = {}
): Promise<T> {
    const { timeout = 15000, ...fetchOptions } = options;

    // Check online status if in browser
    if (typeof window !== 'undefined' && !navigator.onLine) {
        throw new AppError('No internet connection', 0, 'OFFLINE');
    }

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...fetchOptions,
            signal: controller.signal,
        });

        clearTimeout(id);

        if (!response.ok) {
            let errorMessage = `Request failed`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.message || response.statusText;
            } catch {
                errorMessage = response.statusText;
            }
            throw new AppError(errorMessage, response.status, 'API_ERROR');
        }

        // Handle empty responses (e.g. 204 No Content)
        if (response.status === 204) {
            return null as T;
        }

        return await response.json();
    } catch (error: any) {
        clearTimeout(id);

        if (error instanceof AppError) {
            throw error;
        }

        if (error.name === 'AbortError') {
            throw new AppError('Request timed out', 408, 'TIMEOUT');
        }

        throw new AppError(error.message || 'Network request failed', 500, 'NETWORK_ERROR');
    }
}
