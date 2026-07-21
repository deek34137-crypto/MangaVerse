import { requireAuth } from "@/lib/auth-utils";
import { LibraryClient } from "./LibraryClient";

export default async function LibraryPage() {
  await requireAuth("/library");

  return <LibraryClient />;
}