import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Pull credentials securely from Vercel environment panels
  const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
  const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (req.method !== 'POST') {
    return res.status(405).json({ allowed: false, message: "Method not allowed." });
  }

  // Double check environment variable existence safely
  if (!REDIS_URL || !REDIS_TOKEN || !GEMINI_API_KEY) {
    console.error("Missing Serverless Environment Configurations.");
    return res.status(500).json({ allowed: false, message: "Server misconfiguration. Environment variables missing." });
  }

  // 1. Extract the visitor's real IP address through upstream edge proxies
  const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'anonymous';
  // If multi-IP string is present, split and grab the first element cleanly
  const cleanIp = typeof userIp === 'string' ? userIp.split(',')[0].trim() : 'anonymous';
  const ipKey = `limit:${cleanIp}`;

  try {
    // 2. Query Upstash database to check current usage counts
    const checkRes = await fetch(`${REDIS_URL}/get/${ipKey}`, {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` }
    });
    const checkData = await checkRes.json();
    const currentCount = checkData.result ? parseInt(checkData.result, 10) : 0;

    // 3. Strict Server Enforcement Check
    if (currentCount >= 5) {
      return res.status(429).json({ 
        allowed: false, 
        message: "Daily free limits exhausted on this IP. Resetting in 24 hours." 
      });
    }

    // 4. Increment usage counter and assign a rolling 24-hour expiration window
    await fetch(`${REDIS_URL}/incr/${ipKey}`, {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` }
    });
    if (currentCount === 0) {
      await fetch(`${REDIS_URL}/expire/${ipKey}/86400`, {
        headers: { Authorization: `Bearer ${REDIS_TOKEN}` }
      });
    }

    // 5. Secure Server-Side Gemini Fetch Execution
    const { promptInstructions, userInput } = req.body;
    const aiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${promptInstructions}\n\nInput text:\n${userInput}` }] }]
          })
        }
      );

    const aiData = await aiResponse.json();

    // 6. Deep Validation Check on Nested Array Responses
    if (!aiData.candidates || !aiData.candidates[0] || !aiData.candidates[0].content || !aiData.candidates[0].content.parts || !aiData.candidates[0].content.parts[0]) {
      console.error("Gemini Failure Log:", aiData);
      return res.status(500).json({ allowed: false, message: "AI generation encountered a node error. Please retry." });
    }

    const resultText = aiData.candidates[0].content.parts[0].text;

    return res.status(200).json({ 
      allowed: true, 
      output: resultText.trim(),
      remaining: 4 - currentCount
    });

  } catch (error) {
    console.error("Backend Error:", error);
    return res.status(500).json({ allowed: false, message: "Internal server proxy connection error." });
  }
}
