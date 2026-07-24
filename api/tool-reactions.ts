import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

type ReactionType = 'like' | 'dislike' | 'heart';
const VALID_REACTIONS: ReactionType[] = ['like', 'dislike', 'heart'];

function countsKey(toolId: string, reaction: ReactionType) {
  return `lazysuite:reactions:${toolId}:${reaction}`;
}
function userReactionKey(toolId: string, deviceId: string) {
  return `lazysuite:reaction-user:${toolId}:${deviceId}`;
}

async function getCounts(toolId: string) {
  const [likes, dislikes, hearts] = await Promise.all([
    redis.get<number>(countsKey(toolId, 'like')),
    redis.get<number>(countsKey(toolId, 'dislike')),
    redis.get<number>(countsKey(toolId, 'heart')),
  ]);
  return { likes: likes ?? 0, dislikes: dislikes ?? 0, hearts: hearts ?? 0 };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const deviceId = typeof req.headers['x-device-id'] === 'string' ? req.headers['x-device-id'] : null;

  if (req.method === 'GET') {
    const toolId = typeof req.query.toolId === 'string' ? req.query.toolId : null;
    if (!toolId) {
      return res.status(400).json({ message: 'Missing toolId.' });
    }

    try {
      const counts = await getCounts(toolId);
      const userReaction = deviceId
        ? (await redis.get<ReactionType>(userReactionKey(toolId, deviceId))) ?? null
        : null;

      return res.status(200).json({ ...counts, userReaction });
    } catch (error) {
      console.error('Failed to fetch reactions:', error);
      return res.status(500).json({ message: 'Failed to fetch reactions.' });
    }
  }

  if (req.method === 'POST') {
    if (!deviceId) {
      return res.status(400).json({ message: 'Missing device ID.' });
    }

    const { toolId, reaction } = req.body || {};
    if (!toolId || (reaction !== null && !VALID_REACTIONS.includes(reaction))) {
      return res.status(400).json({ message: 'Invalid toolId or reaction.' });
    }

    try {
      const key = userReactionKey(toolId, deviceId);
      const previousReaction = await redis.get<ReactionType>(key);

      // Remove the old reaction's count if one existed
      if (previousReaction) {
        await redis.decr(countsKey(toolId, previousReaction));
      }

      if (reaction === null) {
        // User is un-reacting (clicked their active reaction again)
        await redis.del(key);
      } else if (reaction !== previousReaction) {
        // Switching to a new reaction (or reacting for the first time)
        await redis.incr(countsKey(toolId, reaction));
        await redis.set(key, reaction);
      } else {
        // Clicked the same reaction that was already removed above — treat as un-react
        await redis.del(key);
      }

      const counts = await getCounts(toolId);
      const userReaction = reaction === previousReaction ? null : reaction;

      return res.status(200).json({ ...counts, userReaction });
    } catch (error) {
      console.error('Failed to update reaction:', error);
      return res.status(500).json({ message: 'Failed to update reaction.' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed.' });
}