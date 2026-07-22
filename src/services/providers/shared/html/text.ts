import type { Cheerio } from "cheerio";

/**
 * Shared utility for safe DOM text extraction and string normalization.
 */
export function cleanText(input: string | Cheerio<any> | null | undefined): string {
  if (!input) return "";

  let text: string;
  if (typeof input === "string") {
    text = input;
  } else if (typeof input.text === "function") {
    text = input.text();
  } else {
    return "";
  }

  return text.replace(/\s+/g, " ").trim();
}

/**
 * Extracts digits/numbers from a string (e.g. "Chapter 12.5" -> 12.5).
 */
export function parseNumber(input: string | null | undefined): number | null {
  if (!input) return null;
  const match = input.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const val = parseFloat(match[1]);
  return isNaN(val) ? null : val;
}

/**
 * Normalizes title string for canonical comparison.
 */
export function normalizeTitle(title: string): string {
  if (!title) return "";
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^\w\s]/g, " ")       // replace punctuation with space
    .replace(/\s+/g, " ")
    .trim();
}
