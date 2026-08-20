import { ProviderNetworkPolicy } from "../../types";

const PRIVATE_IP_PATTERNS = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/,
  /^169\.254\.\d+\.\d+$/,
  /^0\.0\.0\.0$/,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
];

const BLOCKED_HOSTNAMES = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "169.254.169.254",
  "metadata.google.internal",
  "instance-data",
];

// Explicit separation: Metadata APIs vs Image CDNs
export const METADATA_API_ALLOWLIST = [
  "graphql.anilist.co",
  "kitsu.io",
  "api.kitsu.io",
  "api.jikan.moe",
];

export const METADATA_IMAGE_CDN_ALLOWLIST = [
  "s4.anilist.co",
  "media.kitsu.app",
  "media.kitsu.io",
  "cdn.myanimelist.net",
  "myanimelist.cdn-dena.com",
];

export const COMMON_MANGA_CDN_SUFFIXES = [
  "anilist.co",
  "kitsu.app",
  "kitsu.io",
  "myanimelist.net",
  "mangadex.org",
  "mangadex.network",
  "weebcentral.com",
  "compsci88.com",
  "temp-data.link",
  "lowee.us",
  "wixmp.com",
  "googleusercontent.com",
  "cloudinary.com",
  "wp.com",
  "mangakatana.com",
  "imagehost.at",
  "mangascan.ws",
  "comick.io",
  "comick.app",
  "comick.pictures",
  "asurascan.com",
  "asuracomics.com",
  "flamecomics.com",
  "flamecomics.me",
  "mgeko.cc",
  "mangageko.com",
  "bato.to",
  "battwo.com",
  "mangaread.org",
  "demonicscans.org",
  "kaliscan.io",
  "webtoons.com",
  "naver.net",
  "novelcool.com",
];

export const METADATA_NETWORK_POLICY: ProviderNetworkPolicy = {
  allowedHosts: [...METADATA_IMAGE_CDN_ALLOWLIST],
  allowedHostSuffixes: COMMON_MANGA_CDN_SUFFIXES,
};

export interface SSRFValidationResult {
  valid: boolean;
  reason?: string;
  sanitizedUrl?: string;
}

export function isPrivateOrBlockedHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.includes(lower)) return true;
  if (lower.endsWith(".internal") || lower.endsWith(".local") || lower.endsWith(".lan")) return true;

  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(lower)) return true;
  }

  return false;
}

export function validateUrlAgainstNetworkPolicy(
  rawUrl: string,
  _policy?: ProviderNetworkPolicy
): SSRFValidationResult {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { valid: false, reason: "Missing or invalid URL" };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { valid: false, reason: "Malformed URL" };
  }

  // Enforce HTTP / HTTPS protocol only (rejects file://, gopher://, ftp://, etc.)
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { valid: false, reason: `Disallowed protocol: ${parsed.protocol}` };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block private and internal IP ranges / hostnames / metadata endpoints
  if (isPrivateOrBlockedHost(hostname)) {
    return { valid: false, reason: `Blocked private or local address: ${hostname}` };
  }

  // All valid public web addresses are allowed for manga image proxying
  return { valid: true, sanitizedUrl: parsed.toString() };
}
