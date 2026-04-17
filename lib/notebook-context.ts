import { r2Client, R2_BUCKET_NAME } from '@/lib/r2';
import { GetObjectCommand } from '@aws-sdk/client-s3';

export async function getNotebookContent(notebook: any, selectedSourceIds?: string[]): Promise<string> {
    console.log('[Context] getNotebookContent called');
    console.log(`[Context] Notebook ID: ${notebook._id}, Provider: ${notebook.storageProvider}, Key: ${notebook.contentKey}`);

    // Global Filter: If explicit empty array is passed, it means "no sources selected".
    if (selectedSourceIds && selectedSourceIds.length === 0) {
        console.log('[Context] Explicitly no sources selected (empty list). Returning empty context.');
        return '';
    }

    // Multi-source handling
    if (notebook.sources && notebook.sources.length > 0) {
        // If selectedSourceIds is provided, filter. Otherwise use all.
        // If explicit empty array is passed, it means "no sources selected".
        const sourcesToFetch = selectedSourceIds
            ? notebook.sources.filter((s: any) => selectedSourceIds.includes(s._id.toString()))
            : notebook.sources;

        if (sourcesToFetch.length === 0) {
            console.log('[Context] No sources selected.');
            return '';
        }

        console.log(`[Context] Fetching content for ${sourcesToFetch.length} sources...`);

        const contentPromises = sourcesToFetch.map(async (source: any) => {
            if (source.contentKey && source.contentKey.startsWith('legacy_migration_')) {
                // Return legacy MongoDB text for migrated single-source un-formatted notebooks
                return `--- SOURCE: ${source.name} ---\n${notebook.pdfContent || ''}\n`;
            }
            try {
                const command = new GetObjectCommand({
                    Bucket: R2_BUCKET_NAME,
                    Key: source.contentKey,
                });
                const response = await r2Client.send(command);
                if (!response.Body) return '';
                const text = await response.Body.transformToString();
                return `--- SOURCE: ${source.name} ---\n${text}\n`;
            } catch (err) {
                console.error(`[Context] Failed to fetch source ${source.name}:`, err);
                return '';
            }
        });

        const contents = await Promise.all(contentPromises);
        return contents.join('\n\n');
    }

    // Legacy Single-Source R2 Fallback
    if (notebook.storageProvider === 'r2' && notebook.contentKey) {
        try {
            console.log(`[Context] Fetching checkable content from R2: ${notebook.contentKey}`);
            const command = new GetObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: notebook.contentKey,
            });
            const response = await r2Client.send(command);
            if (!response.Body) return '';
            const str = await response.Body.transformToString();
            return str;
        } catch (error) {
            console.error('[Context] CRITICAL ERROR fetching context from R2:', error);
            return '';
        }
    }

    // Default to MongoDB legacy field
    if (notebook.pdfContent) {
        return notebook.pdfContent;
    }

    return '';
}
