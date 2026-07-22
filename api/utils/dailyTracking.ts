import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const TTL_SECONDS = 172800; // 48h — survives long enough for the next day's cron to read it

export function getDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export async function trackDailyRun(toolId: string | undefined) {
  if (!toolId) return;
  try {
    const dateString = getDateString();
    await redis.zincrby('lazysuite:tool-clicks', 1, toolId);
    const key = `lazysuite:daily:${dateString}:runs:${toolId}`;
    await redis.incr(key);
    await redis.expire(key, TTL_SECONDS);
  } catch (e) {
    console.error('Failed to track daily run:', e);
  }
}

export async function trackDailyFailure(toolId: string | undefined) {
  if (!toolId) return;
  try {
    const dateString = getDateString();
    const key = `lazysuite:daily:${dateString}:failures:${toolId}`;
    await redis.incr(key);
    await redis.expire(key, TTL_SECONDS);
  } catch (e) {
    console.error('Failed to track daily failure:', e);
  }
}

export async function trackDailyUnlock() {
  try {
    const dateString = getDateString();
    const key = `lazysuite:daily:${dateString}:unlocks`;
    await redis.incr(key);
    await redis.expire(key, TTL_SECONDS);
  } catch (e) {
    console.error('Failed to track daily unlock:', e);
  }
}

export async function trackDailyUnlimited() {
  try {
    const dateString = getDateString();
    const key = `lazysuite:daily:${dateString}:unlimited`;
    await redis.incr(key);
    await redis.expire(key, TTL_SECONDS);
  } catch (e) {
    console.error('Failed to track daily unlimited trigger:', e);
  }
}