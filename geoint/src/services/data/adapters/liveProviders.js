import { buildEmptyLiveFeed } from './demoAdapters';
import { DATA_MODE, enrichFeedWithOsint } from '../normalizedEventModel';

const LIVE_API_BASE = import.meta.env.VITE_GEOINT_LIVE_API_BASE?.trim();

function hasActiveSource(sourceStatuses = {}) {
  return Object.values(sourceStatuses).some((status) => status?.active || status?.state === 'active');
}

function summarizeSources(sourceStatuses = {}) {
  return Object.values(sourceStatuses)
    .filter(Boolean)
    .map((status) => {
      const provider = String(status.provider || 'unknown').toUpperCase();
      const state = String(status.state || 'unknown');
      return `${provider}: ${state}${status.reason ? ` (${status.reason})` : ''}`;
    })
    .join(' · ');
}

export async function fetchLiveFeedOrFallback() {
  if (!LIVE_API_BASE) {
    return {
      mode: DATA_MODE.LIVE_UNAVAILABLE,
      reason: 'Live API is not configured. Set VITE_GEOINT_LIVE_API_BASE in .env.development or .env.local and restart Vite.',
      feed: buildEmptyLiveFeed('Live API not configured'),
    };
  }

  try {
    const response = await fetch(`${LIVE_API_BASE}/events/normalized`, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const payload = await response.json();
    const sourceSummary = summarizeSources(payload.sourceStatuses);
    const enriched = enrichFeedWithOsint(payload);
    if (!hasActiveSource(payload.sourceStatuses)) {
      return {
        mode: DATA_MODE.LIVE_UNAVAILABLE,
        reason: `No active live source. ${sourceSummary || 'Check source health panel.'}`,
        feed: enriched,
      };
    }

    return {
      mode: DATA_MODE.LIVE,
      reason: sourceSummary || 'Connected to live providers',
      feed: enriched,
    };
  } catch (error) {
    return {
      mode: DATA_MODE.LIVE_UNAVAILABLE,
      reason: `Live provider unreachable: ${error.message}`,
      feed: buildEmptyLiveFeed(error.message),
    };
  }
}
