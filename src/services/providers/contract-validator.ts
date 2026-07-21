import type { RawProviderManga, RawProviderChapter, RawProviderPage } from "./shared/types";

export interface ValidationResult<T> {
  isValid: boolean;
  sanitized: T | null;
  errors: string[];
}

export class ContractValidator {
  /**
   * Validates and sanitizes raw manga metadata from provider scrapers/APIs.
   */
  public static validateManga(raw: RawProviderManga, providerId: string): ValidationResult<RawProviderManga> {
    const errors: string[] = [];

    if (!raw || typeof raw !== "object") {
      return { isValid: false, sanitized: null, errors: ["Raw manga payload must be a non-null object"] };
    }

    if (!raw.id || typeof raw.id !== "string" || raw.id.trim() === "") {
      errors.push("Provider manga ID is required and must be a non-empty string");
    }

    if (!raw.title || typeof raw.title !== "string" || raw.title.trim() === "") {
      errors.push("Manga title is required and must be a non-empty string");
    }

    // SSRF & protocol validation for coverImage
    let sanitizedCover = raw.coverImage;
    if (sanitizedCover) {
      if (typeof sanitizedCover !== "string" || !this.isValidHttpUrl(sanitizedCover)) {
        errors.push(`Invalid cover image URL: ${sanitizedCover}`);
        sanitizedCover = undefined;
      }
    }

    const sanitized: RawProviderManga = {
      ...raw,
      id: raw.id ? raw.id.trim() : "",
      title: raw.title ? raw.title.trim() : "Unknown Title",
      altTitles: Array.isArray(raw.altTitles) ? raw.altTitles.filter((t) => typeof t === "string" && t.trim() !== "") : [],
      description: typeof raw.description === "string" ? raw.description.trim() : undefined,
      coverImage: sanitizedCover,
      genres: Array.isArray(raw.genres) ? raw.genres.filter((g) => typeof g === "string" && g.trim() !== "") : [],
      authors: Array.isArray(raw.authors) ? raw.authors.filter((a) => typeof a === "string" && a.trim() !== "") : [],
      artists: Array.isArray(raw.artists) ? raw.artists.filter((a) => typeof a === "string" && a.trim() !== "") : [],
      year: typeof raw.year === "number" && raw.year > 1800 && raw.year < 2100 ? raw.year : undefined,
    };

    return {
      isValid: errors.length === 0,
      sanitized: errors.length === 0 ? sanitized : null,
      errors,
    };
  }

  /**
   * Validates and sanitizes raw chapter metadata.
   */
  public static validateChapter(raw: RawProviderChapter, providerId: string): ValidationResult<RawProviderChapter> {
    const errors: string[] = [];

    if (!raw || typeof raw !== "object") {
      return { isValid: false, sanitized: null, errors: ["Raw chapter payload must be a non-null object"] };
    }

    if (!raw.id || typeof raw.id !== "string" || raw.id.trim() === "") {
      errors.push("Provider chapter ID is required and must be a non-empty string");
    }

    const sanitized: RawProviderChapter = {
      ...raw,
      id: raw.id ? raw.id.trim() : "",
      number: typeof raw.number === "number" && !isNaN(raw.number) ? raw.number : null,
      title: typeof raw.title === "string" ? raw.title.trim() : undefined,
      language: typeof raw.language === "string" && raw.language.trim() !== "" ? raw.language.trim() : "en",
      displayNumber: typeof raw.displayNumber === "string" ? raw.displayNumber.trim() : undefined,
      pageCount: typeof raw.pageCount === "number" && raw.pageCount >= 0 ? raw.pageCount : 0,
    };

    return {
      isValid: errors.length === 0,
      sanitized: errors.length === 0 ? sanitized : null,
      errors,
    };
  }

  /**
   * Validates an array of chapter page objects (image URLs).
   */
  public static validatePages(pages: RawProviderPage[], providerId: string): ValidationResult<RawProviderPage[]> {
    const errors: string[] = [];

    if (!Array.isArray(pages)) {
      return { isValid: false, sanitized: null, errors: ["Pages payload must be an array"] };
    }

    const sanitizedPages: RawProviderPage[] = [];

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      if (!page || typeof page !== "object") {
        errors.push(`Page at index ${i} is invalid`);
        continue;
      }

      if (!page.url || typeof page.url !== "string" || !this.isValidHttpUrl(page.url)) {
        errors.push(`Page ${i + 1} has an invalid or unsafe URL: ${page.url}`);
        continue;
      }

      sanitizedPages.push({
        number: typeof page.number === "number" ? page.number : i + 1,
        url: page.url.trim(),
        width: typeof page.width === "number" ? page.width : undefined,
        height: typeof page.height === "number" ? page.height : undefined,
        size: typeof page.size === "number" ? page.size : undefined,
      });
    }

    return {
      isValid: errors.length === 0 && sanitizedPages.length > 0,
      sanitized: sanitizedPages.length > 0 ? sanitizedPages : null,
      errors,
    };
  }

  /**
   * Helper to ensure URLs use http/https protocols to prevent SSRF or javascript: injection.
   */
  private static isValidHttpUrl(urlString: string): boolean {
    try {
      const url = new URL(urlString);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }
}

export default ContractValidator;
