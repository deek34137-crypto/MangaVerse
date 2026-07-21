/**
 * Reader Engine Capability-Based Off-Main-Thread Image Decode Layer
 * 
 * Pipeline Contract:
 * ImageResponse / Src URL -> Capability Decoder -> DecodedBitmap / ImageHandle
 */

export interface DecodedImageResult {
  image: HTMLImageElement | ImageBitmap;
  width: number;
  height: number;
  decodeTimeMs: number;
  strategy: "createImageBitmap" | "imageDecode" | "traditional";
}

export class ImageDecodeLayer {
  public static async decodeImage(
    src: string,
    signal?: AbortSignal
  ): Promise<DecodedImageResult> {
    if (typeof window === "undefined") {
      throw new Error("Decoding only supported on client");
    }

    const start = performance.now();

    // Capability 1: createImageBitmap off-main-thread decoding
    if ("createImageBitmap" in window) {
      try {
        const response = await fetch(src, { signal, mode: "cors" });
        if (response.ok) {
          const blob = await response.blob();
          const bitmap = await createImageBitmap(blob);
          return {
            image: bitmap,
            width: bitmap.width,
            height: bitmap.height,
            decodeTimeMs: Math.round(performance.now() - start),
            strategy: "createImageBitmap",
          };
        }
      } catch (err: any) {
        if (err.name === "AbortError") throw err;
        // Fallthrough to Strategy 2
      }
    }

    // Capability 2: HTMLImageElement decode()
    return new Promise<DecodedImageResult>((resolve, reject) => {
      if (signal?.aborted) {
        return reject(new DOMException("Aborted", "AbortError"));
      }

      const img = new Image();
      img.crossOrigin = "anonymous";

      const onAbort = () => {
        img.src = "";
        reject(new DOMException("Aborted", "AbortError"));
      };

      if (signal) {
        signal.addEventListener("abort", onAbort, { once: true });
      }

      img.onload = () => {
        if (signal) signal.removeEventListener("abort", onAbort);
        resolve({
          image: img,
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
          decodeTimeMs: Math.round(performance.now() - start),
          strategy: "traditional",
        });
      };

      img.onerror = () => {
        if (signal) signal.removeEventListener("abort", onAbort);
        reject(new Error(`Failed to load image: ${src}`));
      };

      img.src = src;

      if ("decode" in img) {
        img
          .decode()
          .then(() => {
            if (signal) signal.removeEventListener("abort", onAbort);
            resolve({
              image: img,
              width: img.naturalWidth || img.width,
              height: img.naturalHeight || img.height,
              decodeTimeMs: Math.round(performance.now() - start),
              strategy: "imageDecode",
            });
          })
          .catch(() => {
            // Handled by img.onload fallback
          });
      }
    });
  }
}
