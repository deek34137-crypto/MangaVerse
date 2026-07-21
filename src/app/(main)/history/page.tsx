import { requireAuth } from "@/lib/auth-utils";
import { HistoryClient } from "./HistoryClient";

export default async function HistoryPage() {
  await requireAuth("/history");

  return <HistoryClient />;
}