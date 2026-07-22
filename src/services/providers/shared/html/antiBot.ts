import { ProviderBlocked } from "../errors";

export const DEFAULT_ANTIBOT_SIGNATURES = [
  "attention required! | cloudflare",
  "cf-browser-verification",
  "cf-captcha-container",
  "just a moment...",
  "enable javascript and cookies to continue",
  "ddos-guard",
  "ddos protection by cloudflare",
  "access denied",
  "checking your browser",
  "checking if the site connection is secure",
  "please turn javascript on and reload the page",
  "ray id:",
  "security check",
  "bot verification",
  "site is under maintenance",
  "503 service unavailable",
];

/**
 * Shared utility to inspect response HTML against a list of anti-bot,
 * Cloudflare, or CAPTCHA signature strings. Throws ProviderBlocked if matched.
 */
export function checkAntiBotSignatures(
  html: string,
  providerDisplayName: string,
  additionalSignatures: string[] = []
): void {
  if (!html || typeof html !== "string") return;

  const lowerHtml = html.toLowerCase();
  const allSignatures = [...DEFAULT_ANTIBOT_SIGNATURES, ...additionalSignatures];

  for (const signature of allSignatures) {
    if (lowerHtml.includes(signature.toLowerCase())) {
      throw new ProviderBlocked(
        providerDisplayName,
        `Anti-bot or Cloudflare challenge detected ("${signature}")`
      );
    }
  }
}
