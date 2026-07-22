import { RawProviderChapter } from "../providers/shared/types";
import {
  CanonicalChapter,
  ChapterSource,
  StructuredChapterKey,
  AGGREGATION_VERSION,
} from "./types";
import { computeEffectiveConfidence } from "./confidence-model";
import crypto from "crypto";

export function parseStructuredChapterKey(
  rawTitle: string,
  chapterNum?: number
): StructuredChapterKey {
  const str = (rawTitle || "").toLowerCase();

  // Volume extraction
  const volMatch = str.match(/(?:vol|volume)\.?\s*(\d+)/i);
  const volume = volMatch ? parseInt(volMatch[1], 10) : undefined;

  // Chapter extraction
  let chNum = chapterNum ?? 0;
  if (!chapterNum || chapterNum <= 0) {
    const chMatch = str.match(/(?:ch|chapter|ep|episode)\.?\s*(\d+(?:\.\d+)?)/i) || str.match(/(\d+(?:\.\d+)?)/);
    if (chMatch) {
      chNum = parseFloat(chMatch[1]);
    }
  }

  // Part extraction (e.g., "10.1", "10 part 2", "10.5")
  let part: number | undefined;
  const partMatch = str.match(/(?:part|\.|\-)\s*(\d+)/i);
  if (partMatch && str.includes("part")) {
    part = parseInt(partMatch[1], 10);
  } else if (chNum % 1 !== 0) {
    const decimalStr = chNum.toString().split(".")[1];
    part = parseInt(decimalStr, 10);
  }

  const isSpecial = str.includes("special") || str.includes("ova") || str.includes("omake");
  const isExtra = str.includes("extra") || str.includes("bonus");

  // Construct deterministic sort key string: "v03_c010_p01_special0"
  const vPad = volume !== undefined ? `v${volume.toString().padStart(2, "0")}` : "v00";
  const mainCh = Math.floor(chNum);
  const cPad = `c${mainCh.toString().padStart(4, "0")}`;
  const pPad = part !== undefined ? `p${part.toString().padStart(2, "0")}` : "p00";
  const sPad = isSpecial ? "s1" : isExtra ? "e1" : "m0";

  const key = `${vPad}_${cPad}_${pPad}_${sPad}`;

  return {
    volume,
    chapter: chNum,
    part,
    isSpecial,
    isExtra,
    key,
  };
}

export function aggregateChapters(
  canonicalMangaId: string,
  providerChapters: Array<{ providerId: string; chapters: RawProviderChapter[] }>
): CanonicalChapter[] {
  const chapterMap = new Map<string, { key: StructuredChapterKey; title: string; sources: ChapterSource[] }>();

  providerChapters.forEach(({ providerId, chapters }) => {
    const confidence = computeEffectiveConfidence(providerId);

    chapters.forEach((ch) => {
      const sKey = parseStructuredChapterKey(ch.title || `Chapter ${ch.number}`, ch.number ?? undefined);
      const mapKey = sKey.key;

      const source: ChapterSource = {
        providerId,
        providerChapterId: ch.id,
        sourceScore: confidence,
        url: "",
        publishedAt: ch.publishedAt ? new Date(ch.publishedAt).toISOString() : undefined,
      };

      if (!chapterMap.has(mapKey)) {
        chapterMap.set(mapKey, {
          key: sKey,
          title: ch.title || `Chapter ${sKey.chapter}`,
          sources: [source],
        });
      } else {
        const existing = chapterMap.get(mapKey)!;
        existing.sources.push(source);
      }
    });
  });

  // Convert map to CanonicalChapter array and sort by key
  const canonicalChapters: CanonicalChapter[] = Array.from(chapterMap.entries())
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([keyStr, data]) => {
      // Sort sources within chapter by sourceScore descending
      const sortedSources = [...data.sources].sort((a, b) => b.sourceScore - a.sourceScore);
      const chHash = crypto.createHash("md5").update(`${canonicalMangaId}:${keyStr}`).digest("hex").slice(0, 12);
      const traceId = `trace_ch_${chHash}`;

      return {
        id: `cch_${chHash}`,
        aggregationVersion: AGGREGATION_VERSION,
        canonicalMangaId,
        key: data.key,
        title: data.title,
        sources: sortedSources,
        traceId,
      };
    });

  return canonicalChapters;
}
