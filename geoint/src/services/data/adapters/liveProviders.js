import { buildDemoFeed } from "./demoAdapters";
import { DATA_MODE } from "../normalizedEventModel";

const LIVE_API_BASE = import.meta.env.VITE_GEOINT_LIVE_API_BASE;

export async function fetchLiveFeedOrFallback(demoInput) {
  if (!LIVE_API_BASE) {
    return {
      mode: DATA_MODE.LIVE_UNAVAILABLE,
      reason: "VITE_GEOINT_LIVE_API_BASE is not configured",
      feed: buildDemoFeed(demoInput),
    };
  }

  try {
    const response = await fetch(`${LIVE_API_BASE}/events/normalized`, { headers: { Accept: "application/json" } });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const payload = await response.json();
    return {
      mode: DATA_MODE.LIVE,
      reason: "Connected to configured live provider",
      feed: payload,
    };
  } catch (error) {
    return {
      mode: DATA_MODE.LIVE_UNAVAILABLE,
      reason: `Live provider unreachable: ${error.message}`,
      feed: buildDemoFeed(demoInput),
    };
  }
}
