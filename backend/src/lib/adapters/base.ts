import {
  ProviderAdapter,
  ProviderCapabilities,
  ProviderNetworkPolicy,
  ProviderReference,
  ProviderTier,
  NormalizedSearchResult,
  NormalizedManga,
  NormalizedChapter,
  ChapterPage,
} from "../../types";

export abstract class BaseAdapter implements ProviderAdapter {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly baseUrl: string;
  abstract readonly tier: ProviderTier;
  abstract readonly capabilities: ProviderCapabilities;
  abstract readonly networkPolicy: ProviderNetworkPolicy;

  protected defaultTimeoutMs = 8000;
  protected defaultUserAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

  abstract search(query: string, options?: { limit?: number }): Promise<NormalizedSearchResult[]>;
  abstract getMangaDetail(manga: ProviderReference): Promise<NormalizedManga>;
  abstract getChapters(manga: ProviderReference): Promise<NormalizedChapter[]>;
  abstract getPages(chapter: ProviderReference): Promise<ChapterPage[]>;

  protected async fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeoutMs: number = this.defaultTimeoutMs
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const mergedHeaders: Record<string, string> = {
      "User-Agent": this.defaultUserAgent,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Sec-Ch-Ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
      "Sec-Ch-Ua-Mobile": "?0",
      "Sec-Ch-Ua-Platform": '"Windows"',
      ...(options.headers as Record<string, string>),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers: mergedHeaders,
        signal: controller.signal,
      });

      return response;
    } catch (err: any) {
      if (err.name === "AbortError") {
        throw new Error(`[${this.name}] Request timed out after ${timeoutMs}ms: ${url}`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  protected async fetchHtml(url: string, options: RequestInit = {}): Promise<string> {
    const response = await this.fetchWithTimeout(url, options);
    if (!response.ok) {
      throw new Error(`[${this.name}] HTTP ${response.status} ${response.statusText} for ${url}`);
    }
    const html = await response.text();
    if (this.detectCloudflareBlock(html, response.headers)) {
      throw new Error(`[${this.name}] Cloudflare anti-bot challenge encountered`);
    }
    return html;
  }

  protected async fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
    const response = await this.fetchWithTimeout(url, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.headers as Record<string, string>),
      },
    });
    if (!response.ok) {
      throw new Error(`[${this.name}] HTTP ${response.status} ${response.statusText} for ${url}`);
    }
    return (await response.json()) as T;
  }

  protected detectCloudflareBlock(html: string, headers?: Headers): boolean {
    const cfPatterns = [
      /checking your browser/i,
      /attention required.*cloudflare/i,
      /challenge-platform/i,
      /cf-chl-bypass/i,
      /ddos protection by cloudflare/i,
    ];
    return cfPatterns.some((pattern) => pattern.test(html));
  }

  public extractChapterNumber(rawStr: string): string {
    if (!rawStr) return "1";
    const cleaned = rawStr.trim();
    const match = cleaned.match(/(?:chapter|ch\.?|ep\.?|episode|special|sp\.?)\s*([0-9]+(?:\.[0-9]+)?)/i);
    if (match) return match[1];

    const numMatch = cleaned.match(/^([0-9]+(?:\.[0-9]+)?)$/);
    if (numMatch) return numMatch[1];

    return cleaned;
  }

  public parseNumericChapter(numStr: string): number | undefined {
    const match = numStr.match(/([0-9]+(?:\.[0-9]+)?)/);
    if (match) {
      const val = parseFloat(match[1]);
      return isNaN(val) ? undefined : val;
    }
    return undefined;
  }
}
