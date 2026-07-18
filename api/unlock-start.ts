import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import { randomUUID } from 'crypto';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const SESSION_TTL_SECONDS = 60; // generous window to complete the gate

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed.' });
  }

  const sessionId = randomUUID();
  const sessionKey = `lazysuite:unlock-session:${sessionId}`;

  await redis.set(sessionKey, JSON.stringify({ startedAt: Date.now() }), {
    ex: SESSION_TTL_SECONDS,
  });

  return res.status(200).json({ sessionId });
}