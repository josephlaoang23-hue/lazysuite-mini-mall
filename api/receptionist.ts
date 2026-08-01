import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import { trackDailyRun, trackDailyFailure } from './utils/dailyTracking.js';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const DAILY_LIMIT = 20;

interface ToolSummary {
  id: string;
  title: string;
  desc: string;
  category: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed.' });
  }

  const GEMINI_API_KEY = process.env.GEMINI_KEY_PIRATE || process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    console.error('Missing GEMINI_KEY_PIRATE / GEMINI_API_KEY.');
    return res.status(500).json({ message: 'Server misconfiguration.' });
  }

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.error('Missing Upstash Redis credentials.');
    return res.status(500).json({ message: 'Server misconfiguration.' });
  }

  const { message, tools } = req.body as { message?: string; tools?: ToolSummary[] };

  if (!message || !message.trim()) {
    return res.status(400).json({ message: 'Missing message.' });
  }
  if (!Array.isArray(tools) || tools.length === 0) {
    return res.status(400).json({ message: 'Missing tool list.' });
  }

  const forwarded = req.headers['x-forwarded-for'];
  const rawIp = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : 'anonymous';
  const deviceId = typeof req.headers['x-device-id'] === 'string' ? req.headers['x-device-id'] : 'no-device';
  const dateString = new Date().toISOString().split('T')[0];
  const usageKey = `lazysuite:receptionist:${rawIp}:${deviceId}:${dateString}`;

  const currentCount = await redis.incr(usageKey);
  if (currentCount === 1) {
    await redis.expire(usageKey, 86400);
  }

  if (currentCount > DAILY_LIMIT) {
    return res.status(429).json({
      message: "You've asked the receptionist quite a few questions today — please try again tomorrow.",
    });
  }

  const toolListText = tools
    .map((t) => `- id: "${t.id}" | title: "${t.title}" | category: "${t.category}" | description: "${t.desc}"`)
    .join('\n');

    const promptInstructions = `
    You are a friendly front-desk receptionist for an AI tools website called LazySuite Mall.
    
    A visitor has described a problem or task. Your job is to read it and recommend ONE single best-matching tool from the list below — never invent a tool that isn't in this list.
    
    Available tools:
    ${toolListText}
    
    Rules:
    - Return ONLY valid JSON, no markdown fences, no explanation outside the JSON.
    - JSON shape exactly: {"toolId": "<id from the list, or null if nothing truly fits>", "reply": "<a short, warm reply>", "suggestions": ["<id>", "<id>"]}
    - If a tool genuinely matches what they described, set "toolId" to that id, and "reply" should briefly say what it does for them, as if pointing them down the hall. Leave "suggestions" as an empty array in this case.
    - If NOTHING in the list truly matches what they asked for, set "toolId" to null. "reply" MUST clearly and honestly say something like "We don't have a tool for that specifically" — do not soften this into a vague non-answer. Then, in "suggestions", list up to 3 ids of tools that are the closest related fit or might help with part of their problem, even if imperfect — this helps them find something useful anyway, or gives them an idea for a future tool.
    - If truly nothing in the list is even tangentially related, "suggestions" can be an empty array — do not force irrelevant matches.
    - Never include any id in "toolId" or "suggestions" that is not in the list above.
    - Keep "reply" under 45 words.
    `;

  try {
    const models = [
      "gemini-3.6-flash",
      "gemini-3.5-flash",
      "gemini-3.5-flash-lite",
      "gemini-3-flash",
      "gemini-3.1-flash-lite"
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
            contents: [{ parts: [{ text: `${promptInstructions}\n\nVisitor's message:\n${message}` }] }]
          })
        }
      );
      if (aiResponse.ok) break;
    }

    if (!aiResponse) {
      await trackDailyFailure('receptionist');
      return res.status(500).json({ message: "No response received. Please try again." });
    }

    const raw = await aiResponse.text();
    if (!raw.trim()) {
      await trackDailyFailure('receptionist');
      return res.status(500).json({ message: "Empty response received. Please try again." });
    }

    const aiData = JSON.parse(raw);
    const outputText = aiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!outputText) {
      console.error("Gemini Error:", aiData);
      await trackDailyFailure('receptionist');
      return res.status(500).json({ message: "Something went wrong. Please try again." });
    }

    const cleaned = outputText.replace(/```json/gi, "").replace(/```/g, "").trim();

    let parsed: { toolId: string | null; reply: string; suggestions?: string[] };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse receptionist JSON:", cleaned);
      await trackDailyFailure('receptionist');
      return res.status(500).json({ message: "Something went wrong. Please try again." });
    }

    // Safety check: never trust the model's ids blindly — confirm each is actually in the provided list
    const validIds = new Set(tools.map((t) => t.id));
    const safeToolId = parsed.toolId && validIds.has(parsed.toolId) ? parsed.toolId : null;
    const safeSuggestions = Array.isArray(parsed.suggestions)
      ? parsed.suggestions.filter((id) => validIds.has(id)).slice(0, 3)
      : [];

    await trackDailyRun('receptionist');

    return res.status(200).json({ toolId: safeToolId, reply: parsed.reply || "", suggestions: safeSuggestions });
  } catch (error) {
    console.error(error);
    await trackDailyFailure('receptionist');
    return res.status(500).json({ message: "Internal server error." });
  }
}