import { requireAuth } from "@/lib/auth-utils";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  await requireAuth("/settings");

  return <SettingsClient />;
}