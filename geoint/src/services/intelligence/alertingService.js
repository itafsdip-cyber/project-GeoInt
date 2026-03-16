import { matchEventAgainstWatchlist, matchIncidentAgainstWatchlist } from "./watchlistService";

export const ALERT_TYPES = {
  NEW_INCIDENT: "NEW INCIDENT",
  MULTI_SOURCE: "MULTI-SOURCE",
  HIGH_SEVERITY: "HIGH SEVERITY",
  WATCHLIST_MATCH: "WATCHLIST MATCH",
  CRITICAL: "CRITICAL",
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

const toAlert = ({ id, title, detail, region, timestamp, severity = "medium", tags = [], eventId = null, incidentId = null, watchMatches = [] }) => ({
  id,
  type: "INTEL_ALERT",
  title,
  detail,
  region,
  timestamp,
  severity,
  eventId,
  incidentId,
  tags,
  watchMatches,
});

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
    .map(([region, value]) => toAlert({
      id: `spike-${region.toLowerCase().replace(/\s+/g, "-")}`,
      title: `Activity spike in ${region}`,
      detail: `Recent activity: ${value.recent} vs previous: ${value.previous} in comparable window.`,
      region,
      timestamp: new Date(nowTs).toISOString(),
      severity: "high",
      tags: [ALERT_TYPES.SPIKE, ALERT_TYPES.HIGH_SEVERITY],
    }));
};

export const buildHeuristicAlerts = ({ events = [], feedAlerts = [], incidents = [], watchItems = [], timeRangeHours = 24, now = new Date() }) => {
  const incidentEvents = dedupeEvents([...events, ...feedAlerts]).sort(sortByLatest);
  const nowTs = now.getTime();
  const freshCutoffTs = nowTs - (recentWindowHours(timeRangeHours) * 3600000);

  const alerts = incidentEvents.flatMap((event) => {
    const tags = [];
    const matches = matchEventAgainstWatchlist(event, watchItems);
    const eventTs = parseTs(event.timestamp);

    if (Number.isFinite(eventTs) && eventTs >= freshCutoffTs) tags.push(ALERT_TYPES.NEW_INCIDENT);
    if ((event.osint?.crossSourceCount || 1) > 1) tags.push(ALERT_TYPES.MULTI_SOURCE);
    if ((severityRank[event.severity] || 0) >= severityRank.high) tags.push(ALERT_TYPES.HIGH_SEVERITY);
    if ((severityRank[event.severity] || 0) >= severityRank.critical) tags.push(ALERT_TYPES.CRITICAL);
    if (matches.length > 0) tags.push(ALERT_TYPES.WATCHLIST_MATCH);

    if (tags.length === 0) return [];

    return [toAlert({
      id: `heur-${event.id}`,
      title: event.title,
      detail: event.metadata?.detail || "Heuristic alert signal from normalized event flow.",
      region: event.region,
      timestamp: event.timestamp,
      severity: event.severity,
      eventId: event.id,
      tags,
      watchMatches: matches,
    })];
  });

  const incidentAlerts = incidents.flatMap((incident) => {
    const tags = [];
    const matches = matchIncidentAgainstWatchlist(incident, watchItems);
    if ((incident.sourceCount || 1) > 1) tags.push(ALERT_TYPES.MULTI_SOURCE);
    if (["HIGH", "CRITICAL"].includes(incident.severity)) tags.push(ALERT_TYPES.HIGH_SEVERITY);
    if (incident.severity === "CRITICAL") tags.push(ALERT_TYPES.CRITICAL);
    if (matches.length > 0) tags.push(ALERT_TYPES.WATCHLIST_MATCH);
    tags.push(ALERT_TYPES.NEW_INCIDENT);

    return [toAlert({
      id: `incident-${incident.incidentId}`,
      title: incident.title,
      detail: incident.rationale,
      region: incident.region,
      timestamp: incident.lastUpdated,
      severity: String(incident.severity || "medium").toLowerCase(),
      incidentId: incident.incidentId,
      tags: [...new Set(tags)],
      watchMatches: matches,
    })];
  });

  const spikeAlerts = detectSpikeByRegion(incidentEvents, nowTs, timeRangeHours);
  return [...spikeAlerts, ...incidentAlerts, ...alerts].sort(sortByLatest);
};

export const summarizeHeuristicAlerts = ({ heuristicAlerts = [], watchItems = [] }) => {
  const summary = {
    total: heuristicAlerts.length,
    watchMatches: 0,
    multiSource: 0,
    highSeverity: 0,
    critical: 0,
    spikes: 0,
    watchesActive: watchItems.length,
  };

  heuristicAlerts.forEach((alert) => {
    if (alert.tags?.includes(ALERT_TYPES.WATCHLIST_MATCH)) summary.watchMatches += 1;
    if (alert.tags?.includes(ALERT_TYPES.MULTI_SOURCE)) summary.multiSource += 1;
    if (alert.tags?.includes(ALERT_TYPES.HIGH_SEVERITY)) summary.highSeverity += 1;
    if (alert.tags?.includes(ALERT_TYPES.CRITICAL)) summary.critical += 1;
    if (alert.tags?.includes(ALERT_TYPES.SPIKE)) summary.spikes += 1;
  });

  return summary;
};
