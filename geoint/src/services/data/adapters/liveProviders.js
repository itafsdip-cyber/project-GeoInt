import { buildDemoFeed } from './demoAdapters';
import { DATA_MODE } from '../normalizedEventModel';

const LIVE_API_BASE = import.meta.env.VITE_GEOINT_LIVE_API_BASE?.trim();

function hasActiveSource(sourceStatuses = {}) {
  return Object.values(sourceStatuses).some((status) => status?.state === 'active');
}

function summarizeSources(sourceStatuses = {}) {
  return Object.values(sourceStatuses)
    .map((status) => `${status.provider.toUpperCase()}: ${status.state}${status.reason ? ` (${status.reason})` : ''}`)
    .join(' · ');
}

export async function fetchLiveFeedOrFallback(demoInput) {
  if (!LIVE_API_BASE) {
    return {
      mode: DATA_MODE.LIVE_UNAVAILABLE,
      reason: 'Live API is not configured. Set VITE_GEOINT_LIVE_API_BASE in .env.development or .env.local and restart Vite.',
      feed: buildDemoFeed(demoInput),
    };
  }

  try {
    const response = await fetch(`${LIVE_API_BASE}/events/normalized`, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    const sourceSummary = summarizeSources(payload.sourceStatuses);
    if (!hasActiveSource(payload.sourceStatuses)) {
      return {
        mode: DATA_MODE.LIVE_UNAVAILABLE,
        reason: `No live sources active. ${sourceSummary}`,
        feed: buildDemoFeed(demoInput),
      };
    }

    return {
      mode: DATA_MODE.LIVE,
      reason: sourceSummary || 'Connected to live providers',
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
