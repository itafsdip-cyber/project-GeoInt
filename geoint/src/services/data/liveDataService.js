import { useEffect, useMemo, useState } from "react";
import { DATA_MODE } from "./normalizedEventModel";
import { fetchLiveFeedOrFallback } from "./adapters/liveProviders";

export const filterEventsByTimeRange = (items, rangeHours, now = new Date()) => {
  const cutoff = now.getTime() - rangeHours * 3600000;
  return items.filter((item) => new Date(item.timestamp).getTime() >= cutoff);
};

export function useGeoFeed({ refreshMs = 30000 }) {
  const [mode, setMode] = useState(DATA_MODE.LIVE_UNAVAILABLE);
  const [statusNote, setStatusNote] = useState("Initializing live source checks...");
  const [feed, setFeed] = useState(() => ({ alerts: [], events: [], timeline: [], trajectories: [], sources: [], sourceStatuses: {}, generatedAt: null }));

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const result = await fetchLiveFeedOrFallback();
      if (!mounted) return;
      setMode(result.mode);
      setStatusNote(result.reason);
      setFeed(result.feed);
    };

    load();
    const interval = setInterval(load, refreshMs);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [refreshMs]);

  return { mode, statusNote, feed };
}

export function useFilteredGeoFeed({ feed, timeRangeHours }) {
  return useMemo(
    () => ({
      alerts: filterEventsByTimeRange(feed.alerts || [], timeRangeHours),
      events: filterEventsByTimeRange(feed.events || [], timeRangeHours),
      timeline: filterEventsByTimeRange(feed.timeline || [], timeRangeHours),
      trajectories: filterEventsByTimeRange(feed.trajectories || [], timeRangeHours),
      sources: feed.sources || [],
      sourceStatuses: feed.sourceStatuses || {},
      generatedAt: feed.generatedAt || null,
    }),
    [feed, timeRangeHours],
  );
}
