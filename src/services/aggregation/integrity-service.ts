import { CanonicalSnapshot, CanonicalManga, SnapshotFailureReason } from "./types";

export interface IntegrityCheckResult {
  passed: boolean;
  reason?: SnapshotFailureReason;
  message?: string;
}

export class ContentIntegrityService {
  /**
   * Verifies that a new snapshot does not suffer from silent data corruption or regression relative to the prior snapshot.
   */
  public verifyIntegrity(
    previous: CanonicalSnapshot<CanonicalManga> | null,
    incoming: CanonicalManga
  ): IntegrityCheckResult {
    if (!previous || !previous.data) {
      return { passed: true };
    }

    const prevData = previous.data;

    // Integrity Check 1: Title Destruction
    if (prevData.title?.value && (!incoming.title?.value || incoming.title.value.trim().length === 0)) {
      return {
        passed: false,
        reason: "INTEGRITY_REGRESSION",
        message: `Incoming snapshot destroyed title (was "${prevData.title.value}")`,
      };
    }

    // Integrity Check 2: Cover Destruction
    if (prevData.coverImage?.value && (!incoming.coverImage?.value || !incoming.coverImage.value.startsWith("http"))) {
      return {
        passed: false,
        reason: "NO_COVER",
        message: `Incoming snapshot destroyed cover image URL`,
      };
    }

    // Integrity Check 3: Sudden Provider Collapse
    if (prevData.providerMappings.length >= 3 && incoming.providerMappings.length === 1) {
      return {
        passed: false,
        reason: "LOW_CONFIDENCE",
        message: `Provider mappings collapsed from ${prevData.providerMappings.length} to ${incoming.providerMappings.length}`,
      };
    }

    return { passed: true };
  }

  public verifyChapterIntegrity(
    prevChapterCount: number,
    incomingChapterCount: number
  ): IntegrityCheckResult {
    // Integrity Check 4: Chapter count drop > 50%
    if (prevChapterCount >= 10 && incomingChapterCount < prevChapterCount / 2) {
      return {
        passed: false,
        reason: "NO_CHAPTERS",
        message: `Chapter count collapsed from ${prevChapterCount} to ${incomingChapterCount} (>50% loss)`,
      };
    }

    return { passed: true };
  }
}

export const integrityService = new ContentIntegrityService();
