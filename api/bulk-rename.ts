import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (req.method !== 'POST') {
    return res.status(405).json({
      allowed: false,
      message: 'Method not allowed.'
    });
  }


  if (!GEMINI_API_KEY) {
    return res.status(500).json({
      allowed: false,
      message: 'Missing GEMINI_API_KEY.'
    });
  }


  try {

    const {
      instructions,
      files
    } = req.body;


    if (!instructions || !files) {
      return res.status(400).json({
        allowed: false,
        message: "Missing instructions or files."
      });
    }


    const prompt = `
You are an expert file organization assistant.

Rename the files according to the user's instructions.

User instructions:

${instructions}


Original filenames:

${JSON.stringify(files, null, 2)}


Rules:

- Keep the original file extension.
- Do not delete important information.
- Return ONLY valid JSON.
- No markdown.
- No explanations.


Required format:

[
  {
    "oldName": "original filename.ext",
    "newName": "new_filename.ext"
  }
]
`;


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
                    text: prompt
                  }
                ]
              }
            ]

          })
        }
      );


      if (aiResponse.ok) {
        break;
      }


      console.log(
        `Model ${model} failed: ${aiResponse.status}`
      );

    }


    const raw = await aiResponse!.text();


    if (!raw.trim()) {
      return res.status(500).json({
        allowed:false,
        message:"Gemini returned empty response."
      });
    }


    const aiData = JSON.parse(raw);


    const output =
      aiData.candidates?.[0]?.content?.parts?.[0]?.text;


    if (!output) {

      return res.status(500).json({
        allowed:false,
        message:"Invalid Gemini response."
      });

    }


    const cleaned =
      output
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();


    const result = JSON.parse(cleaned);


    return res.status(200).json({

      allowed:true,
      result

    });


  } catch(error) {

    console.error(error);


    return res.status(500).json({

      allowed:false,
      message:"Bulk rename failed."

    });

  }

}