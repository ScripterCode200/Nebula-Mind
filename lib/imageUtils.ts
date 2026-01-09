
/**
 * Compresses an image file by resizing it to a maximum width/height and reducing quality.
 * @param file - The original image file.
 * @param maxWidth - The maximum width (or height) of the output image. Default 800px.
 * @param quality - The quality of the JPEG output (0.0 to 1.0). Default 0.7.
 * @returns A Promise resolving to the compressed File object.
 */
export async function compressImage(file: File, maxWidth = 800, quality = 0.7): Promise<File> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        const url = URL.createObjectURL(file);

        image.src = url;

        image.onload = () => {
            URL.revokeObjectURL(url);

            let width = image.width;
            let height = image.height;

            // Calculate new dimensions
            if (width > height) {
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
            } else {
                if (height > maxWidth) {
                    width = Math.round((width * maxWidth) / height);
                    height = maxWidth;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas context not available'));
                return;
            }

            ctx.drawImage(image, 0, 0, width, height);

            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Canvas to Blob conversion failed'));
                    return;
                }

                // Create a new File from the blob
                const newFile = new File([blob], file.name, {
                    type: 'image/jpeg', // Force JPEG for better compression
                    lastModified: Date.now(),
                });

                resolve(newFile);
            }, 'image/jpeg', quality);
        };

        image.onerror = (error) => reject(error);
    });
}
