import { requireAuth } from "@/lib/auth-utils";
import { RecommendationsClient } from "./RecommendationsClient";

export default async function RecommendationsPage() {
  await requireAuth("/recommendations");

  return <RecommendationsClient />;
}