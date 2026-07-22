import { CanonicalManga, CanonicalChapter, QualityMetricsComponent, QualityTier } from "./types";

export interface ValidationReport {
  isValid: boolean;
  quality: QualityMetricsComponent;
  tier: QualityTier;
  issues: string[];
}

export class SchemaValidator {
  public validate(manga: Partial<CanonicalManga>): { pass: boolean; issue?: string } {
    if (!manga.canonicalId) return { pass: false, issue: "Missing canonicalId" };
    if (!manga.title?.value || manga.title.value.trim().length === 0) return { pass: false, issue: "Missing or empty title" };
    return { pass: true };
  }
}

export class ContentValidator {
  public evaluate(manga: Partial<CanonicalManga>): { score: number; issues: string[] } {
    const issues: string[] = [];
    let score = 1.0;

    if (!manga.description?.value || manga.description.value.trim().length < 20) {
      score -= 0.2;
      issues.push("Short or missing description");
    }

    if (!manga.coverImage?.value || !manga.coverImage.value.startsWith("http")) {
      score -= 0.3;
      issues.push("Invalid or missing cover image URL");
    }

    if (manga.authors?.value.length === 0) {
      score -= 0.1;
      issues.push("Missing author metadata");
    }

    if (manga.genres?.value.length === 0) {
      score -= 0.1;
      issues.push("Missing genre metadata");
    }

    return { score: Math.max(0.0, parseFloat(score.toFixed(2))), issues };
  }
}

export class ReaderValidator {
  public validateChapterPages(pages: Array<{ number: number; url: string; width?: number; height?: number }>): {
    isValid: boolean;
    brokenRatio: number;
    issues: string[];
  } {
    const issues: string[] = [];
    if (!pages || pages.length === 0) {
      issues.push("Zero pages in chapter");
      return { isValid: false, brokenRatio: 1.0, issues };
    }

    let brokenCount = 0;
    const urlSet = new Set<string>();

    pages.forEach((p) => {
      if (!p.url || !p.url.startsWith("http")) {
        brokenCount++;
      }
      if (urlSet.has(p.url)) {
        issues.push(`Duplicate image URL detected: ${p.url}`);
      }
      urlSet.add(p.url);
    });

    const brokenRatio = brokenCount / pages.length;
    if (brokenRatio >= 0.05) {
      issues.push(`Broken image ratio (${(brokenRatio * 100).toFixed(1)}%) exceeds 5% threshold`);
      return { isValid: false, brokenRatio, issues };
    }

    return { isValid: true, brokenRatio, issues };
  }
}

export class ContentQualityPipeline {
  private schemaValidator = new SchemaValidator();
  private contentValidator = new ContentValidator();
  private readerValidator = new ReaderValidator();

  public evaluateManga(manga: Partial<CanonicalManga>, chaptersCount: number = 1): ValidationReport {
    const issues: string[] = [];

    // 1. Schema Validation
    const schemaRes = this.schemaValidator.validate(manga);
    if (!schemaRes.pass) {
      issues.push(schemaRes.issue!);
      const failQuality: QualityMetricsComponent = { metadata: 0, reader: 0, images: 0, chapters: 0, overall: 0 };
      return { isValid: false, quality: failQuality, tier: "TIER_C_HIDDEN", issues };
    }

    // 2. Content & Metadata Validation
    const contentRes = this.contentValidator.evaluate(manga);
    issues.push(...contentRes.issues);

    const metadataScore = contentRes.score;
    const imageScore = manga.coverImage?.value && manga.coverImage.value.startsWith("http") ? 1.0 : 0.0;
    const chapterScore = chaptersCount > 0 ? 1.0 : 0.0;
    const readerScore = 0.95; // Base reader score

    const overallScore = parseFloat(
      (0.35 * metadataScore + 0.25 * imageScore + 0.25 * chapterScore + 0.15 * readerScore).toFixed(2)
    );

    const quality: QualityMetricsComponent = {
      metadata: metadataScore,
      reader: readerScore,
      images: imageScore,
      chapters: chapterScore,
      overall: overallScore,
    };

    let tier: QualityTier = "TIER_C_HIDDEN";
    if (overallScore >= 0.90 && chaptersCount > 0) {
      tier = "TIER_A_PRODUCTION";
    } else if (overallScore >= 0.70) {
      tier = "TIER_B_PARTIAL";
    }

    return {
      isValid: tier !== "TIER_C_HIDDEN",
      quality,
      tier,
      issues,
    };
  }

  public getReaderValidator(): ReaderValidator {
    return this.readerValidator;
  }
}

export const qualityPipeline = new ContentQualityPipeline();
