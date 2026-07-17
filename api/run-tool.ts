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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
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

    const aiData = await aiResponse.json();

    if (
      !aiData.candidates ||
      !aiData.candidates[0]?.content?.parts?.[0]?.text
    ) {
      console.error('Gemini Error:', aiData);

      return res.status(500).json({
        allowed: false,
        message: 'AI generation failed.'
      });
    }

    return res.status(200).json({
      allowed: true,
      output: aiData.candidates[0].content.parts[0].text.trim()
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      allowed: false,
      message: 'Internal server error.'
    });
  }
}