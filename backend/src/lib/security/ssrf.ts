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

export const METADATA_NETWORK_POLICY: ProviderNetworkPolicy = {
  allowedHosts: [...METADATA_IMAGE_CDN_ALLOWLIST],
  allowedHostSuffixes: [".anilist.co", ".kitsu.app", ".kitsu.io", ".myanimelist.net"],
};

export interface SSRFValidationResult {
  valid: boolean;
  reason?: string;
  sanitizedUrl?: string;
}

export function validateUrlAgainstNetworkPolicy(
  rawUrl: string,
  policy: ProviderNetworkPolicy
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

  // Block private and internal IP ranges / hostnames
  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      return { valid: false, reason: `Blocked private or local address: ${hostname}` };
    }
  }

  // Check against provider policy allowed hosts
  const isExactMatch = policy.allowedHosts.some(
    (allowed) => allowed.toLowerCase() === hostname
  );

  if (isExactMatch) {
    return { valid: true, sanitizedUrl: parsed.toString() };
  }

  // Check against provider policy allowed host suffixes (e.g. .mangadex.org)
  if (policy.allowedHostSuffixes && policy.allowedHostSuffixes.length > 0) {
    const isSuffixMatch = policy.allowedHostSuffixes.some((suffix) => {
      const cleanSuffix = suffix.startsWith(".") ? suffix.toLowerCase() : `.${suffix.toLowerCase()}`;
      return hostname.endsWith(cleanSuffix);
    });

    if (isSuffixMatch) {
      return { valid: true, sanitizedUrl: parsed.toString() };
    }
  }

  return {
    valid: false,
    reason: `Hostname "${hostname}" is not authorized by the provider network policy.`,
  };
}
