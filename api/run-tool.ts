import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (req.method !== 'POST') {
    return res.status(405).json({
      allowed: false,
      message: 'Method not allowed.'
    });
  }

  if (!GEMINI_API_KEY) {
    console.error('Missing GEMINI_API_KEY.');
    return res.status(500).json({
      allowed: false,
      message: 'Server misconfiguration. Missing GEMINI_API_KEY.'
    });
  }

  try {
    const { promptInstructions, userInput } = req.body;
  
    const aiResponse = await fetch(
      
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
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
          ]
        })
      }
    );
    console.log("Gemini Status:", aiResponse.status);
    console.log("Gemini OK:", aiResponse.ok);
    const raw = await aiResponse.text();
    console.log("Status:", aiResponse.status);
    console.log("Headers:", Object.fromEntries(aiResponse.headers.entries()));
    console.log("Raw:", raw);
    if (!raw.trim()) {
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
  
      return res.status(500).send(raw);
    }
  
    return res.status(200).json({
      allowed: true,
      output: aiData.candidates[0].content.parts[0].text.trim()
    });
  
  } catch (error) {
    console.error(error);
  
    return res.status(500).json({
      allowed: false,
      message: "Internal server error."
    });
  }
}