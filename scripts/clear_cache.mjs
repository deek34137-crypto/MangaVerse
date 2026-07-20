import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

async function run() {
  if (!redisUrl || !redisToken) {
    console.warn("Upstash Redis credentials not configured. Skipping cache flush.");
    return;
  }

  try {
    console.log("Flushing all cache keys on Upstash Redis...");
    const res = await fetch(`${redisUrl}/flushall`, {
      headers: {
        Authorization: `Bearer ${redisToken}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Redis HTTP error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    console.log("✓ Cache flushed:", data);
  } catch (err) {
    console.error("Failed to clear Redis cache:", err);
  }
}

run();
