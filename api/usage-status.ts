import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const DAILY_LIMIT = 5;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed.' });
  }

  const forwarded = req.headers['x-forwarded-for'];
  const rawIp = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : 'anonymous';
  const deviceId = typeof req.headers['x-device-id'] === 'string' ? req.headers['x-device-id'] : 'no-device';
  const dateString = new Date().toISOString().split('T')[0];
  const usageKey = `lazysuite:usage:${rawIp}:${deviceId}:${dateString}`;
  const unlocksKey = `lazysuite:unlocks:${rawIp}:${deviceId}:${dateString}`;

  const currentCount = (await redis.get<number>(usageKey)) ?? 0;
  const unlocksUsed = (await redis.get<number>(unlocksKey)) ?? 0;
  const remaining = Math.max(0, DAILY_LIMIT - currentCount);

  return res.status(200).json({ remaining, unlocksUsed });
}