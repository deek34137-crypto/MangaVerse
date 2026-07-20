export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const dns = await import("dns");
    // Force Node.js to prefer IPv4 over IPv6 when resolving DNS to prevent 15-30s NAT64 timeouts
    dns.setDefaultResultOrder("ipv4first");
    console.log("[Bootstrap] Configured global DNS resolution order: ipv4first");
  }
}
