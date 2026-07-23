/**
 * Cover Quality Scoring Pipeline (RFC-002 / Phase 2)
 * Evaluates artwork candidates by weighted quality score and discards low-quality placeholders or hotlink logos.
 * Scoring: Official (100) -> DB Cache (95) -> MangaDex (90) -> Mirrors (85) -> Generated (20)
 */

export interface ArtworkCandidate {
  url: string;
  source: "official" | "db" | "mangadex" | "comick" | "mirror" | "generated";
  width?: number;
  height?: number;
}

export function scoreArtwork(candidate: ArtworkCandidate): number {
  if (!candidate.url || typeof candidate.url !== "string") return 0;
  const url = candidate.url.toLowerCase().trim();

  // Discard known placeholders and website logos
  if (
    url.includes("mangadex.png") ||
    url.includes("placeholder") ||
    url.includes("no-cover") ||
    url.includes("404") ||
    url === "https://mangadex.org/"
  ) {
    return 0;
  }

  let baseScore = 50;

  switch (candidate.source) {
    case "official":
      baseScore = 100;
      break;
    case "db":
      baseScore = 95;
      break;
    case "mangadex":
      baseScore = 90;
      break;
    case "comick":
    case "mirror":
      baseScore = 85;
      break;
    case "generated":
      baseScore = 20;
      break;
  }

  // Bonus for HTTPS & CDN image domain
  if (url.startsWith("https://")) baseScore += 5;
  if (url.includes("uploads.mangadex.org") || url.includes("meo.comick.pictures")) baseScore += 5;

  return baseScore;
}

export function selectBestArtwork(candidates: ArtworkCandidate[], fallbackUrl = "/placeholders/cover.jpg"): string {
  if (!candidates || candidates.length === 0) return fallbackUrl;

  const scored = candidates
    .map((c) => ({ candidate: c, score: scoreArtwork(c) }))
    .filter((sc) => sc.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length > 0) {
    return scored[0].candidate.url;
  }

  return fallbackUrl;
}
