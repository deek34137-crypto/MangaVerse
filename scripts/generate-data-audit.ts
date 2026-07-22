import fs from "fs";
import path from "path";
import { aggregator } from "../src/services/aggregation/aggregator";
import { providerPolicyRegistry } from "../src/services/providers/shared/provider-policy";

async function generateProductionDataAudit() {
  console.log("=== Launch Certification: Workstream 1 — Production Data Audit ===");

  const canonicals = await aggregator.search("", { limit: 100 });
  const total = canonicals.length;

  let withCover = 0;
  let withRating = 0;
  let withAuthor = 0;
  let tierA = 0;
  let tierB = 0;
  let tierC = 0;

  for (const m of canonicals) {
    if (m.coverImage?.value) withCover++;
    if (m.rating && m.rating > 0) withRating++;
    if (m.authors?.value && m.authors.value.length > 0) withAuthor++;

    const tier = m.qualityTier || "TIER_A_PRODUCTION";
    if (tier === "TIER_A_PRODUCTION") tierA++;
    else if (tier === "TIER_B_PARTIAL") tierB++;
    else tierC++;
  }

  const descriptors = providerPolicyRegistry.getAllDescriptors();

  const auditReport = {
    timestamp: new Date().toISOString(),
    totalMangaSampled: total,
    metrics: {
      coverCoveragePct: ((withCover / total) * 100).toFixed(1) + "%",
      ratingCoveragePct: ((withRating / total) * 100).toFixed(1) + "%",
      authorCoveragePct: ((withAuthor / total) * 100).toFixed(1) + "%",
    },
    qualityDistribution: {
      tierA_Production: tierA,
      tierB_Partial: tierB,
      tierC_Hidden: tierC,
    },
    providerDescriptorsCount: descriptors.length,
    descriptors: descriptors.map((d) => ({
      id: d.identity.id,
      name: d.identity.displayName,
      trustScore: d.quality.trustScore,
      priority: d.quality.mergePriority,
    })),
  };

  console.log("Audit Results Summary:", JSON.stringify(auditReport, null, 2));

  // Save archived JSON audit
  const dateStr = new Date().toISOString().split("T")[0];
  const auditDir = path.join(__dirname, "../audits");
  if (!fs.existsSync(auditDir)) fs.mkdirSync(auditDir, { recursive: true });

  const auditPath = path.join(auditDir, `audit-${dateStr}.json`);
  fs.writeFileSync(auditPath, JSON.stringify(auditReport, null, 2));

  console.log(`\n✅ Production Data Audit report archived cleanly to: ${auditPath}`);
}

generateProductionDataAudit().catch((err) => {
  console.error("❌ Data Audit failed:", err);
  process.exit(1);
});
