import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// The full list of toolIds currently in use across the app.
// Add new tool IDs here as new tools go live so they show up in the summary.
const KNOWN_TOOL_IDS = [
  'cleaner', 'humanizer', 'renamer', 'logicmap', 'transcript', 'pirate',
  'trashcheatsheet', 'thriftappraisal', 'roadsideestimate', 'dotlogauditor', 'amazoninvoiceauditor',
  'multiagentblueprint', 'promptcompressor'
];

function getYesterdayDateString(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().split('T')[0];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const webhookUrl = process.env.SHEETS_WEBHOOK_URL;
  if (!webhookUrl) {
    return res.status(500).json({ message: 'Missing SHEETS_WEBHOOK_URL.' });
  }

  try {
    const dateString = getYesterdayDateString();

    const rows: any[] = [];

    for (const toolId of KNOWN_TOOL_IDS) {
      const runs = (await redis.get<number>(`lazysuite:daily:${dateString}:runs:${toolId}`)) ?? 0;
      const failures = (await redis.get<number>(`lazysuite:daily:${dateString}:failures:${toolId}`)) ?? 0;

      if (runs > 0 || failures > 0) {
        rows.push({
          date: dateString,
          toolId,
          runs,
          unlocksUsed: 0,       // shared across all tools, added once below
          unlimitedTriggers: 0, // shared across all tools, added once below
          failures
        });
      }
    }

    const totalUnlocks = (await redis.get<number>(`lazysuite:daily:${dateString}:unlocks`)) ?? 0;
    const totalUnlimited = (await redis.get<number>(`lazysuite:daily:${dateString}:unlimited`)) ?? 0;

    // Unlocks/unlimited triggers aren't tracked per-tool, so add one summary row for them
    if (totalUnlocks > 0 || totalUnlimited > 0) {
      rows.push({
        date: dateString,
        toolId: '(site-wide)',
        runs: 0,
        unlocksUsed: totalUnlocks,
        unlimitedTriggers: totalUnlimited,
        failures: 0
      });
    }

    if (rows.length === 0) {
      return res.status(200).json({ message: `No activity to report for ${dateString}.` });
    }

    const webhookRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows })
    });

    if (!webhookRes.ok) {
      console.error('Sheets webhook failed:', await webhookRes.text());
      return res.status(500).json({ message: 'Failed to send data to Sheets.' });
    }

    return res.status(200).json({ message: `Sent ${rows.length} rows for ${dateString}.` });
  } catch (error) {
    console.error('Daily summary error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}