import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const DAILY_LIMIT = 10;
const UNLOCK_CAP = 1;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (req.method !== 'POST') {
    return res.status(405).json({ allowed: false, message: 'Method not allowed.' });
  }

  if (!GEMINI_API_KEY) {
    console.error('Missing GEMINI_API_KEY.');
    return res.status(500).json({ allowed: false, message: 'Server misconfiguration.' });
  }

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.error('Missing Upstash Redis credentials.');
    return res.status(500).json({ allowed: false, message: 'Server misconfiguration.' });
  }

  const forwarded = req.headers['x-forwarded-for'];
  const rawIp = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : 'anonymous';
  const deviceId = typeof req.headers['x-device-id'] === 'string' ? req.headers['x-device-id'] : 'no-device';
  const dateString = new Date().toISOString().split('T')[0];
  const usageKey = `lazysuite:usage:${rawIp}:${deviceId}:${dateString}`;
  
  const currentCount = await redis.incr(usageKey);
  if (currentCount === 1) {
    await redis.expire(usageKey, 86400);
  }
  
  if (currentCount > DAILY_LIMIT) {
    const unlocksKey = `lazysuite:unlocks:${rawIp}:${deviceId}:${dateString}`;
    const unlocksUsed = (await redis.get<number>(unlocksKey)) ?? 0;
  
    res.setHeader('X-RateLimit-Limit', String(DAILY_LIMIT));
    res.setHeader('X-RateLimit-Remaining', '0');
  
    if (unlocksUsed >= UNLOCK_CAP) {
      return res.status(202).json({
        unlimitedMode: true,
        message: "Instant 10-Second Sponsor View Required to process this run."
      });
    }
  
    return res.status(429).json({
      error: 'Daily free limit reached',
      limit: DAILY_LIMIT,
      current: currentCount,
      message: 'You have used your 10 free daily runs. Come back tomorrow or unlock more.'
    });
  }

  try {
    const { promptInstructions, audioBase64, mimeType } = req.body;
    const refundOnFailure = async () => {
      await redis.decr(usageKey);
    };

    if (!audioBase64 || !mimeType) {
      await refundOnFailure();
      return res.status(400).json({ allowed: false, message: 'No audio file received.' });
    }

    const models = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-3-flash"];
    let aiResponse: Response | null = null;

    for (const model of models) {
      aiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI_API_KEY
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: promptInstructions },
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: audioBase64
                    }
                  }
                ]
              }
            ]
          })
        }
      );

      if (aiResponse.ok) break;
      console.log(`Model ${model} failed with ${aiResponse.status}`);
    }

    if (!aiResponse) {
      await refundOnFailure();
      return res.status(500).json({ allowed: false, message: "No model response received." });
    }

    const raw = await aiResponse.text();
    if (!raw.trim()) {
      await refundOnFailure();
      return res.status(500).json({ allowed: false, message: "Gemini returned an empty response." });
    }

    const aiData = JSON.parse(raw);

    if (!aiData.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error("Gemini Error:", aiData);
      await refundOnFailure();
      return res.status(500).send(raw);
    }

    res.setHeader('X-RateLimit-Limit', String(DAILY_LIMIT));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, DAILY_LIMIT - currentCount)));

    return res.status(200).json({
      allowed: true,
      output: aiData.candidates[0].content.parts[0].text.trim()
    });

  } catch (error) {
    console.error(error);
    await redis.decr(usageKey);
    return res.status(500).json({ allowed: false, message: "Internal server error." });
  }
}