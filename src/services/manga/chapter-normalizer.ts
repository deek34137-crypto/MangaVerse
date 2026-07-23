/**
 * Chapter Number & Decimal Normalizer (RFC-002 / Operational Readiness)
 * Normalizes decimal chapters (0.5, 1.5, 122.1), prologues (0), specials, extras, and volume numbers.
 */

export interface RawChapterInput {
  id: string;
  number?: string | number | null;
  title?: string | null;
  volume?: string | number | null;
  type?: string | null;
}

export interface NormalizedChapter {
  id: string;
  number: number | null;
  formattedNumber: string;
  displayTitle: string;
  sortKey: number;
  isDecimal: boolean;
  isSpecial: boolean;
  isPrologue: boolean;
}

export function parseChapterNumber(rawNumber?: string | number | null, title?: string | null): number | null {
  if (rawNumber != null && rawNumber !== "") {
    const parsed = parseFloat(String(rawNumber));
    if (!isNaN(parsed)) return parsed;
  }

  if (title) {
    // Try to extract chapter number from title e.g. "Chapter 54.5 - The Festival"
    const match = title.match(/(?:chapter|ch\.?)\s*([\d.]+)/i);
    if (match && match[1]) {
      const parsed = parseFloat(match[1]);
      if (!isNaN(parsed)) return parsed;
    }
    if (/prologue/i.test(title)) return 0;
  }

  return null;
}

export function normalizeChapter(input: RawChapterInput): NormalizedChapter {
  const num = parseChapterNumber(input.number, input.title);
  const title = input.title?.trim() || "";

  const isPrologue = num === 0 || /prologue/i.test(title);
  const isSpecial = /special|extra|bonus|oneshot/i.test(title) || input.type === "special";
  const isDecimal = num != null && !Number.isInteger(num);

  let sortKey = 0;
  if (num != null) {
    sortKey = num;
  } else if (isPrologue) {
    sortKey = 0;
  } else if (isSpecial) {
    sortKey = 999999; // Sort specials at top
  }

  let formattedNumber = num != null ? String(num) : "Special";
  if (isPrologue && (num === 0 || num == null)) {
    formattedNumber = "0 (Prologue)";
  }

  let displayTitle = title;
  if (!displayTitle) {
    displayTitle = isPrologue ? "Prologue" : num != null ? `Chapter ${num}` : "Special Chapter";
  }

  return {
    id: input.id,
    number: num,
    formattedNumber,
    displayTitle,
    sortKey,
    isDecimal,
    isSpecial,
    isPrologue,
  };
}

export function sortChapters(chapters: RawChapterInput[]): NormalizedChapter[] {
  return chapters
    .map(normalizeChapter)
    .sort((a, b) => b.sortKey - a.sortKey); // Descending sort (latest chapter first)
}
