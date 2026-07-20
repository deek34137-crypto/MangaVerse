import { mangadexCircuitBreaker } from "@/lib/circuit-breaker";

const API_BASE = process.env.MANGADEX_API_URL || "https://api.mangadex.org";

interface FetchOptions {
  method?: string;
  params?: Record<string, string | string[] | number | undefined>;
  retries?: number;
  timeoutMs?: number;
}

async function fetchMangadex<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { method = "GET", params = {}, retries = 3, timeoutMs = 5000 } = options;
  const url = new URL(`${API_BASE}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined) return;
    if (Array.isArray(value)) {
      const paramName = key.endsWith("[]") ? key : `${key}[]`;
      value.forEach(v => v !== undefined && url.searchParams.append(paramName, String(v)));
    } else {
      url.searchParams.set(key, String(value));
    }
  });

  return mangadexCircuitBreaker.execute(async () => {
    let lastError: unknown;
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        
        const response = await fetch(url.toString(), {
          method,
          headers: {
            "Accept": "application/json",
            "User-Agent": "MangaHub/1.0",
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`MangaDex API error: ${response.status} ${response.statusText}`);
        }
        return response.json() as Promise<T>;
      } catch (error) {
        if (attempt < retries - 1) {
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
        }
        throw error;
      }
    }
    throw lastError;
  });
}

export { fetchMangadex };
export type { FetchOptions };