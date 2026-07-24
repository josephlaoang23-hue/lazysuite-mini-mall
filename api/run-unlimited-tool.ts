import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import { trackDailyUnlimited, trackDailyRun } from './utils/dailyTracking.js';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const MIN_WATCH_MS = 10000;
const MAX_UNLIMITED_PER_DAY = 50; // hard ceiling to cap worst-case abuse cost

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed.' });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ message: 'Server misconfiguration.' });
  }

  const { sessionId, promptInstructions, userInput } = req.body;
  if (!sessionId) {
    return res.status(400).json({ message: 'Missing sessionId.' });
  }

  const sessionKey = `lazysuite:unlock-session:${sessionId}`;
  const sessionRaw = await redis.get(sessionKey);
  if (!sessionRaw) {
    return res.status(403).json({ message: 'Session expired or invalid.' });
  }

  const session = typeof sessionRaw === 'string' ? JSON.parse(sessionRaw) : sessionRaw;
  const elapsed = (Date.now() - session.startedAt) / 1000;

  if (elapsed < 10) {
    return res.status(403).json({ message: 'Sponsor view not completed. Bypass attempt blocked.' });
  }

  await redis.del(sessionKey);

  const forwarded = req.headers['x-forwarded-for'];
  const rawIp = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : 'anonymous';
  const deviceId = typeof req.headers['x-device-id'] === 'string' ? req.headers['x-device-id'] : 'no-device';
  const dateString = new Date().toISOString().split('T')[0];
  const unlimitedKey = `lazysuite:unlimited-count:${rawIp}:${deviceId}:${dateString}`;

  const unlimitedCount = await redis.incr(unlimitedKey);
  if (unlimitedCount === 1) {
    await redis.expire(unlimitedKey, 86400);
  }

  if (unlimitedCount > MAX_UNLIMITED_PER_DAY) {
    return res.status(429).json({ message: 'Daily unlimited-mode cap reached. Please try again tomorrow.' });
  }

  const models = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-3-flash"];
  let aiResponse: Response | null = null;

  for (const model of models) {
    aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${promptInstructions}\n\nInput text:\n${userInput}` }] }]
        })
      }
    );
    if (aiResponse.ok) break;
  }

  if (!aiResponse) {
    return res.status(500).json({ message: "No model response received." });
  }

  const raw = await aiResponse.text();
  if (!raw.trim()) {
    return res.status(500).json({ message: "Gemini returned an empty response." });
  }

  const aiData = JSON.parse(raw);
  if (!aiData.candidates?.[0]?.content?.parts?.[0]?.text) {
    console.error("Gemini Error:", aiData);
    return res.status(500).send(raw);
  }

  await trackDailyUnlimited();

  return res.status(200).json({
    allowed: true,
    output: aiData.candidates[0].content.parts[0].text.trim()
  });
}
