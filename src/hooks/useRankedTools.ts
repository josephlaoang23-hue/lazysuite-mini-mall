import { useEffect, useState } from "react";
import { allTools } from "../data/tools";
import type { ToolMeta } from "../data/tools";

export interface RankedTool extends ToolMeta {
  clicks: number;
}

export function useRankedTools() {
  const [rankedTools, setRankedTools] = useState<RankedTool[]>(
    allTools.map((t) => ({ ...t, clicks: 0 }))
  );
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const res = await fetch("/api/tool-rankings");
        const data = await res.json();

        const clickMap: Record<string, number> = {};
        (data.rankings || []).forEach((r: { id: string; clicks: number }) => {
          clickMap[r.id] = r.clicks;
        });

        // Business Tools have their own dedicated section and should never
        // show up in the ranked Daily Tools / Featured lists.
        const eligibleTools = allTools;

        // Only live tools compete for rank — non-live ones are always "Coming Soon"
        // and never displace a real tool from the Featured slots.
        const merged = eligibleTools
          .filter((t) => t.isLive)
          .map((t) => ({ ...t, clicks: clickMap[t.id] ?? 0 }))
          .sort((a, b) => b.clicks - a.clicks);

        const nonLive = eligibleTools
          .filter((t) => !t.isLive)
          .map((t) => ({ ...t, clicks: 0 }));

        setRankedTools([...merged, ...nonLive]);
        setLoaded(true);
      } catch (err) {
        console.error("Failed to fetch tool rankings:", err);
        setLoaded(true);
      }
    };

    fetchRankings();
  }, []);

  return { rankedTools, loaded };
}