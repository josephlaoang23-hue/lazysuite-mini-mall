import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const RANKING_KEY = 'lazysuite:tool-clicks';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed.' });
  }

  try {
    // Highest scores first, member+score pairs flattened into one array
    const raw = await redis.zrange<(string | number)[]>(RANKING_KEY, 0, -1, {
      rev: true,
      withScores: true,
    });

    const rankings: { id: string; clicks: number }[] = [];
    for (let i = 0; i < raw.length; i += 2) {
      rankings.push({ id: String(raw[i]), clicks: Number(raw[i + 1]) });
    }

    return res.status(200).json({ rankings });
  } catch (error) {
    console.error('Failed to fetch tool rankings:', error);
    return res.status(500).json({ rankings: [] });
  }
}