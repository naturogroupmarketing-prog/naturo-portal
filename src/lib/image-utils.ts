/**
 * Client-side image compression utility.
 * Resizes and compresses images before upload to reduce bandwidth and storage.
 */

/**
 * Compress an image file to a target max dimension and quality.
 * Returns a base64 data URL of the compressed JPEG.
 *
 * @param file - The image File to compress
 * @param maxDim - Maximum width or height in pixels (default 1200)
 * @param quality - JPEG quality 0-1 (default 0.7)
 * @returns base64 data URL string
 */
export function compressImage(file: File, maxDim = 1200, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas not supported")); return; }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
