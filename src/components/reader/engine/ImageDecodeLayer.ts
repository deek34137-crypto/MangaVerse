/**
 * Reader Engine v2 Image Decode Layer
 * Uses browser-native decoding APIs (createImageBitmap / HTMLImageElement.decode())
 * with graceful fallback to standard HTMLImageElement loading.
 */

export class ImageDecodeLayer {
  public static async decodeImage(src: string): Promise<HTMLImageElement | ImageBitmap> {
    if (typeof window === "undefined") {
      throw new Error("Decoding only supported on client");
    }

    // Strategy 1: createImageBitmap if response blob fetch succeeds
    if ("createImageBitmap" in window) {
      try {
        const response = await fetch(src, { mode: "cors" });
        if (response.ok) {
          const blob = await response.blob();
          return await createImageBitmap(blob);
        }
      } catch {
        // Fallback to Image element decode
      }
    }

    // Strategy 2: HTMLImageElement decode()
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));

      img.src = src;

      if ("decode" in img) {
        img.decode().then(() => resolve(img)).catch(() => {
          // Handled by img.onload / img.onerror fallback
        });
      }
    });
  }
}
