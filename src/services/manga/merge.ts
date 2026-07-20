import crypto from "crypto";
import { MangaRepository, ProviderRepository, DomainManga } from "./repositories";
import { RawProviderManga } from "../providers/types";
import { AuditLogRepository } from "./repositories";

const PROVIDER_PRIORITY: Record<string, number> = {
  mangadex: 1, // Lowest numeric value = Highest priority
  webtoon: 2,
  comick: 3,
  weebcentral: 4,
  mangakatana: 5,
  mangasee: 6,
  manganato: 7,
};

function calculateValueHash(value: any): string {
  const str = typeof value === "string" ? value : JSON.stringify(value || "");
  return crypto.createHash("md5").update(str).digest("hex");
}

export class MergeEngine {
  private mangaRepo = new MangaRepository();
  private auditLogRepo = new AuditLogRepository();

  public async mergeMangaMetadata(
    mangaId: string,
    incoming: RawProviderManga,
    provider: string,
    traceId?: string
  ): Promise<boolean> {
    const canonical = await this.mangaRepo.findById(mangaId);
    if (!canonical) {
      throw new Error(`Canonical manga with ID ${mangaId} not found`);
    }

    const provenanceList = await this.mangaRepo.getProvenance(mangaId);
    const provenanceMap = new Map<string, { provider: string; hash: string }>();
    
    for (const prov of provenanceList) {
      provenanceMap.set(prov.fieldName, {
        provider: prov.provider,
        hash: prov.valueHash || "",
      });
    }

    const updatedFields: Partial<DomainManga> = {};
    let hasChanges = false;

    // Helper to evaluate field update based on priority/provenance
    const shouldUpdateField = (fieldName: string, incomingValue: any): boolean => {
      if (incomingValue === undefined || incomingValue === null || incomingValue === "") {
        return false; // Don't replace existing data with empty incoming data
      }

      const existingProv = provenanceMap.get(fieldName);
      if (!existingProv) {
        return true; // No provenance yet, always write initial value
      }

      const incomingPriority = PROVIDER_PRIORITY[provider.toLowerCase()] ?? 99;
      const existingPriority = PROVIDER_PRIORITY[existingProv.provider.toLowerCase()] ?? 99;

      if (incomingPriority < existingPriority) {
        return true; // Incoming provider has higher priority
      }

      if (incomingPriority === existingPriority) {
        // Equal priority: only update if value actually changed
        const incomingHash = calculateValueHash(incomingValue);
        return incomingHash !== existingProv.hash;
      }

      // Incoming provider has lower priority: only update if current value is empty/null
      const canonicalValue = (canonical as any)[fieldName];
      return canonicalValue === undefined || canonicalValue === null || canonicalValue === "";
    };

    // 1. Single Value Fields
    const singleFields = ["title", "description", "coverImage", "bannerImage", "status", "type", "demographic"];
    for (const field of singleFields) {
      const incomingVal = (incoming as any)[field];
      const currentVal = (canonical as any)[field];
      
      if (shouldUpdateField(field, incomingVal)) {
        (updatedFields as any)[field] = incomingVal;
        hasChanges = true;

        await this.mangaRepo.saveProvenance(
          mangaId,
          field,
          provider,
          calculateValueHash(incomingVal)
        );

        await this.auditLogRepo.logChange(
          provider,
          `manga.${field}`,
          String(currentVal || ""),
          String(incomingVal),
          "MergeEngine priority update",
          traceId
        );
      }
    }

    // 2. Merged Array Fields: altTitles
    if (incoming.altTitles && incoming.altTitles.length > 0) {
      const currentAlt = canonical.altTitles || [];
      const mergedAlt = Array.from(new Set([...currentAlt, ...incoming.altTitles]));
      if (mergedAlt.length > currentAlt.length) {
        updatedFields.altTitles = mergedAlt;
        hasChanges = true;

        await this.mangaRepo.saveProvenance(
          mangaId,
          "altTitles",
          provider,
          calculateValueHash(mergedAlt)
        );

        await this.auditLogRepo.logChange(
          provider,
          "manga.altTitles",
          JSON.stringify(currentAlt),
          JSON.stringify(mergedAlt),
          "MergeEngine array union",
          traceId
        );
      }
    }

    if (hasChanges) {
      console.log(`[MergeEngine] Saving merged updates for Manga ID ${mangaId}...`);
      // Update DB using the canonical's current version (optimistic locking)
      let attempts = 0;
      let success = false;
      
      while (attempts < 3 && !success) {
        const freshCanonical = await this.mangaRepo.findById(mangaId);
        if (!freshCanonical) break;

        success = await this.mangaRepo.save(
          { ...updatedFields, id: mangaId },
          freshCanonical.version
        );

        if (!success) {
          attempts++;
          console.warn(`[MergeEngine] Concurrency collision on save attempt ${attempts} for Manga ID ${mangaId}. Retrying...`);
          await new Promise((r) => setTimeout(r, 100)); // Brief sleep before retry
        }
      }

      if (!success) {
        console.error(`[MergeEngine] Failed to save merged updates for Manga ID ${mangaId} after 3 attempts due to concurrency conflicts.`);
        return false;
      }
    }

    return true;
  }
}
export default MergeEngine;
