import { Redis } from "@upstash/redis";
import { db } from "@/db";
import { sql } from "drizzle-orm";

let redisClient: Redis | null = null;
const hasRedis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

if (hasRedis) {
  redisClient = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

function hashStringTo32BitInt(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32-bit signed integer
  }
  return Math.abs(hash);
}

export async function acquireLock(key: string, ttlSeconds = 30): Promise<boolean> {
  if (redisClient) {
    try {
      const acquired = await redisClient.set(`lock:${key}`, "locked", { nx: true, ex: ttlSeconds });
      return acquired === "OK";
    } catch (err) {
      console.warn("[lock] Redis lock acquire failed, falling back to PG advisory lock:", err);
    }
  }

  // Fallback: PostgreSQL Session-level Advisory Lock
  const hash = hashStringTo32BitInt(key);
  try {
    const res = await db.execute(sql`SELECT pg_try_advisory_lock(${hash}) as locked`);
    // PostgreSQL returns raw result, map the column 'locked' boolean
    return !!res[0]?.locked;
  } catch (err) {
    console.error("[lock] Postgres advisory lock acquire failed:", err);
    return false;
  }
}

export async function releaseLock(key: string): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.del(`lock:${key}`);
      return;
    } catch (err) {
      console.warn("[lock] Redis lock release failed, falling back to PG advisory release:", err);
    }
  }

  // Fallback: PostgreSQL Advisory Unlock
  const hash = hashStringTo32BitInt(key);
  try {
    await db.execute(sql`SELECT pg_advisory_unlock(${hash})`);
  } catch (err) {
    console.error("[lock] Postgres advisory lock release failed:", err);
  }
}

/**
 * Executes syncFn inside a lock wrapper.
 * If the lock is held elsewhere, returns the existing DB record (stale read)
 * or returns { syncing: true } immediately without blocking.
 */
export async function withSyncLock<T>(
  key: string,
  syncFn: () => Promise<void>,
  checkDbFn: () => Promise<T | null>,
  ttlSeconds = 30
): Promise<T | { syncing: boolean } | null> {
  // 1. Check if the database/cache already has the data
  const existing = await checkDbFn();
  if (existing) return existing;

  // 2. Try to acquire the lock to run sync ourselves
  const locked = await acquireLock(key, ttlSeconds);
  if (locked) {
    try {
      await syncFn();
    } finally {
      await releaseLock(key);
    }
    // Return the newly synced data
    return await checkDbFn();
  }

  // 3. Lock not acquired (sync already running).
  // Return existing data if present (stale read) or indicate active sync immediately
  const staleData = await checkDbFn();
  if (staleData) return staleData;

  return { syncing: true };
}
