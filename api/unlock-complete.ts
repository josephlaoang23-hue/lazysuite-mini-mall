import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const DAILY_UNLOCK_CAP = 1;
const DAILY_LIMIT = 10;
const MIN_WATCH_MS = 10000;
const BONUS_RUNS = 5;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed.' });
  }

  const { sessionId } = req.body;
  if (!sessionId) {
    return res.status(400).json({ message: 'Missing sessionId.' });
  }

  const sessionKey = `lazysuite:unlock-session:${sessionId}`;
  const sessionRaw = await redis.get(sessionKey);
  if (!sessionRaw) {
    return res.status(400).json({ message: 'Unlock session expired or invalid. Please try again.' });
  }

  const session = typeof sessionRaw === 'string' ? JSON.parse(sessionRaw) : sessionRaw;
  const elapsed = Date.now() - session.startedAt;
  if (elapsed < MIN_WATCH_MS) {
    return res.status(400).json({ message: 'Ad not finished yet.' });
  }

  const forwarded = req.headers['x-forwarded-for'];
  const rawIp = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : 'anonymous';
  const deviceId = typeof req.headers['x-device-id'] === 'string' ? req.headers['x-device-id'] : 'no-device';
  const dateString = new Date().toISOString().split('T')[0];
  const usageKey = `lazysuite:usage:${rawIp}:${deviceId}:${dateString}`;
  const unlocksKey = `lazysuite:unlocks:${rawIp}:${deviceId}:${dateString}`;

  const unlocksUsed = await redis.incr(unlocksKey);
  if (unlocksUsed === 1) {
    await redis.expire(unlocksKey, 86400);
  }

  if (unlocksUsed > DAILY_UNLOCK_CAP) {
    return res.status(403).json({ message: 'Max daily ad unlocks reached.' });
  }

  await redis.decrby(usageKey, BONUS_RUNS);
  await redis.del(sessionKey);

  const currentCount = (await redis.get<number>(usageKey)) ?? 0;
  const remaining = Math.max(0, DAILY_LIMIT - currentCount);

  return res.status(200).json({ allowed: true, remaining, unlocksUsed });
}