import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import { trackDailyRun, trackDailyFailure } from './utils/dailyTracking.js';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const DAILY_LIMIT = 10;
const UNLOCK_CAP = 1;
const TOOL_KEY_MAP: Record<string, string | undefined> = {
  cleaner: process.env.GEMINI_KEY_CLEANER,
  humanizer: process.env.GEMINI_KEY_HUMANIZER,
  renamer: process.env.GEMINI_KEY_RENAMER,
  logicmap: process.env.GEMINI_KEY_LOGICMAP,
  transcript: process.env.GEMINI_KEY_TRANSCRIPT,
  conflictauditor: process.env.GEMINI_KEY_CONFLICTAUDITOR,
  transcriptevidence: process.env.GEMINI_KEY_TRANSCRIPTEVIDENCE,
  multiagentblueprint: process.env.GEMINI_KEY_MULTIAGENT,
  promptcompressor: process.env.GEMINI_KEY_PROMPTCOMPRESSOR,
  pdfdashboard: process.env.GEMINI_KEY_PDFCONVERTER,
  repoarch: process.env.GEMINI_KEY_ARCHDIAGRAMMER,
  chatoptout: process.env.GEMINI_KEY_CHATOPTOUT,
  chargebackwriter: process.env.GEMINI_KEY_CHARGEBACK,
  legacycodemodernizer: process.env.GEMINI_KEY_LEGACYCODE,
  abstractsynthesizer: process.env.GEMINI_KEY_ABSTRACTSYNTH,
  phishingdissector: process.env.GEMINI_KEY_PHISHING,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      allowed: false,
      message: 'Method not allowed.'
    });
  }

  const { toolId } = req.body || {};
  const GEMINI_API_KEY = (toolId && TOOL_KEY_MAP[toolId]) || process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    console.error(`Missing Gemini API key for toolId: ${toolId || 'unknown'}.`);
    return res.status(500).json({
      allowed: false,
      message: 'Server misconfiguration. Missing Gemini API key.'
    });
  }

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.error('Missing Upstash Redis credentials.');
    return res.status(500).json({
      allowed: false,
      message: 'Server misconfiguration. Missing Redis credentials.'
    });
  }

  // Identify user by IP, hash it, key by UTC date
  const forwarded = req.headers['x-forwarded-for'];
  const rawIp = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : 'anonymous';
  const deviceId = typeof req.headers['x-device-id'] === 'string' ? req.headers['x-device-id'] : 'no-device';
  const dateString = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const usageKey = `lazysuite:usage:${rawIp}:${deviceId}:${dateString}`;

  let currentCount: number;
  try {
    currentCount = await redis.incr(usageKey);
    if (currentCount === 1) {
      await redis.expire(usageKey, 86400);
    }
  } catch (rateLimitError) {
    console.error('Rate limit check failed:', rateLimitError);
    return res.status(500).json({
      allowed: false,
      message: 'Server error while checking usage limits. Please try again.'
    });
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
      message: 'You have used your 5 free daily runs. LazySuite free tier limits apply. Come back tomorrow or complete a rewarded task to unlock more.'
    });
  }

  try {
    const { promptInstructions, userInput, toolId, temperature } = req.body;
    const refundOnFailure = async () => {
      await redis.decr(usageKey);
    };

    const models = [
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite",
      "gemini-3-flash"
    ];

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
                  {
                    text: `${promptInstructions}\n\nInput text:\n${userInput}`
                  }
                ]
              }
            ],
            ...(typeof temperature === "number"
              ? { generationConfig: { temperature } }
              : {})
          })
        }
      );

      if (aiResponse.ok) {
        break;
      }

      console.log(`Model ${model} failed with ${aiResponse.status}`);
    }

    if (!aiResponse) {
      await refundOnFailure();
      await trackDailyFailure(toolId);
      return res.status(500).json({
        allowed: false,
        message: "No model response received."
      });
    }

    console.log("Gemini Status:", aiResponse.status);
    console.log("Gemini OK:", aiResponse.ok);
    const raw = await aiResponse.text();
    console.log("Status:", aiResponse.status);
    console.log("Headers:", Object.fromEntries(aiResponse.headers.entries()));
    console.log("Raw:", raw);
    if (!raw.trim()) {
      await refundOnFailure();
      await trackDailyFailure(toolId);
      return res.status(500).json({
        allowed: false,
        message: "Gemini returned an empty response."
      });
    }

    console.log("Raw Gemini Response:", raw);

    const aiData = JSON.parse(raw);

    console.log("Gemini Response:", JSON.stringify(aiData, null, 2));

    if (
      !aiData.candidates ||
      !aiData.candidates[0]?.content?.parts?.[0]?.text
    ) {
      console.error("Gemini Error:", aiData);
      await refundOnFailure();
      await trackDailyFailure(toolId);
      return res.status(500).send(raw);
    }

    res.setHeader('X-RateLimit-Limit', String(DAILY_LIMIT));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, DAILY_LIMIT - currentCount)));

    await trackDailyRun(toolId);

    return res.status(200).json({
      allowed: true,
      output: aiData.candidates[0].content.parts[0].text.trim()
    });

  } catch (error) {
    console.error(error);
    await redis.decr(usageKey);
    await trackDailyFailure(req.body?.toolId);

    return res.status(500).json({
      allowed: false,
      message: "Internal server error."
    });
  }
}