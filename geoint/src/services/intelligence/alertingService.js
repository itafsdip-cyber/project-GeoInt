import { matchEventAgainstWatchlist } from "./watchlistService";

export const ALERT_TYPES = {
  NEW: "NEW",
  MULTI_SOURCE: "MULTI-SOURCE",
  HIGH_SEVERITY: "HIGH SEVERITY",
  WATCHLIST_MATCH: "WATCHLIST MATCH",
  SPIKE: "SPIKE",
};

const severityRank = { low: 1, medium: 2, high: 3, critical: 4 };

const parseTs = (timestamp) => new Date(timestamp).getTime();

const sortByLatest = (a, b) => parseTs(b.timestamp) - parseTs(a.timestamp);

const dedupeEvents = (events = []) => {
  const seen = new Set();
  return events.filter((event) => {
    const key = event.id || `${event.title}-${event.timestamp}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const recentWindowHours = (timeRangeHours = 24) => Math.max(0.5, Math.min(6, timeRangeHours * 0.25));

const detectSpikeByRegion = (events = [], nowTs, timeRangeHours) => {
  if (events.length < 6) return [];
  const halfWindowMs = (timeRangeHours * 3600000) / 2;
  const recentStart = nowTs - halfWindowMs;
  const previousStart = nowTs - halfWindowMs * 2;

  const counts = new Map();
  events.forEach((event) => {
    const regionKey = String(event.region || "Unknown");
    const ts = parseTs(event.timestamp);
    if (!Number.isFinite(ts)) return;

    const state = counts.get(regionKey) || { recent: 0, previous: 0 };
    if (ts >= recentStart) state.recent += 1;
    else if (ts >= previousStart && ts < recentStart) state.previous += 1;
    counts.set(regionKey, state);
  });

  return [...counts.entries()]
    .filter(([, value]) => value.recent >= 3 && value.recent >= Math.max(2, Math.ceil(value.previous * 1.8)))
    .map(([region, value]) => ({
      id: `spike-${region.toLowerCase().replace(/\s+/g, "-")}`,
      type: ALERT_TYPES.SPIKE,
      title: `Activity spike in ${region}`,
      detail: `Recent activity: ${value.recent} vs previous: ${value.previous} in comparable window.`,
      region,
      timestamp: new Date(nowTs).toISOString(),
      severity: "high",
      eventId: null,
      tags: [ALERT_TYPES.SPIKE],
    }));
};

export const buildHeuristicAlerts = ({ events = [], feedAlerts = [], watchItems = [], timeRangeHours = 24, now = new Date() }) => {
  const incidentEvents = dedupeEvents([...events, ...feedAlerts]).sort(sortByLatest);
  const nowTs = now.getTime();
  const freshCutoffTs = nowTs - (recentWindowHours(timeRangeHours) * 3600000);

  const alerts = incidentEvents.flatMap((event) => {
    const tags = [];
    const matches = matchEventAgainstWatchlist(event, watchItems);
    const eventTs = parseTs(event.timestamp);

    if (Number.isFinite(eventTs) && eventTs >= freshCutoffTs) tags.push(ALERT_TYPES.NEW);
    if ((event.osint?.crossSourceCount || 1) > 1) tags.push(ALERT_TYPES.MULTI_SOURCE);
    if ((severityRank[event.severity] || 0) >= severityRank.high) tags.push(ALERT_TYPES.HIGH_SEVERITY);
    if (matches.length > 0) tags.push(ALERT_TYPES.WATCHLIST_MATCH);

    if (tags.length === 0) return [];

    return [{
      id: `heur-${event.id}`,
      type: "EVENT_ALERT",
      title: event.title,
      detail: event.metadata?.detail || "Heuristic alert signal from normalized event flow.",
      region: event.region,
      source: event.source,
      timestamp: event.timestamp,
      severity: event.severity,
      eventId: event.id,
      tags,
      watchMatches: matches,
    }];
  });

  const spikeAlerts = detectSpikeByRegion(incidentEvents, nowTs, timeRangeHours);

  return [...spikeAlerts, ...alerts].sort(sortByLatest);
};

export const summarizeHeuristicAlerts = ({ heuristicAlerts = [], watchItems = [] }) => {
  const summary = {
    total: heuristicAlerts.length,
    watchMatches: 0,
    multiSource: 0,
    highSeverity: 0,
    spikes: 0,
    watchesActive: watchItems.length,
  };

  heuristicAlerts.forEach((alert) => {
    if (alert.tags?.includes(ALERT_TYPES.WATCHLIST_MATCH)) summary.watchMatches += 1;
    if (alert.tags?.includes(ALERT_TYPES.MULTI_SOURCE)) summary.multiSource += 1;
    if (alert.tags?.includes(ALERT_TYPES.HIGH_SEVERITY)) summary.highSeverity += 1;
    if (alert.tags?.includes(ALERT_TYPES.SPIKE) || alert.type === ALERT_TYPES.SPIKE) summary.spikes += 1;
  });

  return summary;
};
