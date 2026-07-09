const API_BASE = process.env.MANGADEX_API_URL || "https://api.mangadex.org";
const API_VERSION = "v2";

interface FetchOptions {
  method?: string;
  params?: Record<string, string | string[] | number | undefined>;
  retries?: number;
}

async function fetchMangadex<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { method = "GET", params = {}, retries = 3 } = options;
  const url = new URL(`${API_BASE}/${API_VERSION}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined) return;
    if (Array.isArray(value)) {
      value.forEach(v => v !== undefined && url.searchParams.append(key, String(v)));
    } else {
      url.searchParams.set(key, String(value));
    }
  });

  let lastError: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url.toString(), {
        method,
        headers: {
          "Accept": "application/json",
          "User-Agent": "MangaHub/1.0",
        },
      });
      if (!response.ok) {
        throw new Error(`MangaDex API error: ${response.status} ${response.statusText}`);
      }
      return response.json() as Promise<T>;
    } catch (error) {
      lastError = error;
      if (attempt < retries - 1) {
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
  }
  throw lastError;
}

export { fetchMangadex };
export type { FetchOptions };