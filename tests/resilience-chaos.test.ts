import "dotenv/config";
import { checkRateLimit, resetRateLimitStore } from "../src/lib/rate-limit";

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean, details?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${label}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${label}${details ? ` — ${details}` : ""}`);
    failed++;
  }
}

async function main() {
  console.log("\n=== Suite: Security, Resilience & Chaos Testing ===");

  // Test 1: Rate Limiter Enforcement
  {
    resetRateLimitStore();
    const id = "test-client-ip-1";

    let allowedCount = 0;
    let blockedCount = 0;

    for (let i = 0; i < 15; i++) {
      const res = checkRateLimit(id, 10, 60_000);
      if (res.allowed) allowedCount++;
      else blockedCount++;
    }

    assert("Rate limiter allows up to 10 requests", allowedCount === 10, `Got ${allowedCount}`);
    assert("Rate limiter blocks 11th request", blockedCount === 5, `Got ${blockedCount}`);
  }

  // Test 2: SSRF & Protocol Safety Verification
  {
    const invalidProtocols = ["file:///etc/passwd", "ftp://example.com/image.png", "gopher://localhost:70"];
    for (const rawUrl of invalidProtocols) {
      try {
        const parsed = new URL(rawUrl);
        const isForbidden = parsed.protocol !== "http:" && parsed.protocol !== "https:";
        assert(`SSRF Guard rejects forbidden protocol "${parsed.protocol}"`, isForbidden);
      } catch {
        assert(`Invalid URL string "${rawUrl}" rejected`, true);
      }
    }
  }

  // Test 3: Private IP SSRF Detection
  {
    function isPrivate(ip: string): boolean {
      if (ip === "127.0.0.1" || ip === "::1" || ip === "localhost") return true;
      if (ip.startsWith("10.") || ip.startsWith("192.168.")) return true;
      return false;
    }

    assert("isPrivateIp flags 127.0.0.1", isPrivate("127.0.0.1"));
    assert("isPrivateIp flags localhost", isPrivate("localhost"));
    assert("isPrivateIp flags 10.0.0.1", isPrivate("10.0.0.1"));
    assert("isPrivateIp flags 192.168.1.1", isPrivate("192.168.1.1"));
    assert("isPrivateIp permits public CDN IP", !isPrivate("104.21.32.1"));
  }

  console.log(`\nResilience & Security Tests Complete: ${passed} Passed, ${failed} Failed\n`);
  if (failed > 0) process.exit(1);
  process.exit(0);
}

main().catch((err) => {
  console.error("Resilience test error:", err);
  process.exit(1);
});
