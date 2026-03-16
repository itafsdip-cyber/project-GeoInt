const WINDOWS = {
  "1h": 1,
  "6h": 6,
  "24h": 24,
  "7d": 24 * 7,
};

const TREND = {
  UP: "UP",
  DOWN: "DOWN",
  FLAT: "FLAT",
  SPIKE: "SPIKE",
  NEW: "NEW",
};

const parseTs = (value) => new Date(value).getTime();

const toKey = (value = "unknown") => String(value || "unknown").trim() || "unknown";

const normalizeCategory = (event = {}) => String(event.category || event.type || "unknown").toUpperCase();

const getWindowBounds = ({ now, hours }) => {
  const end = now.getTime();
  const windowMs = hours * 3600000;
  return {
    currentStart: end - windowMs,
    previousStart: end - windowMs * 2,
    previousEnd: end - windowMs,
    end,
  };
};

const inRange = (ts, start, end) => Number.isFinite(ts) && ts >= start && ts < end;

const splitByWindow = (items = [], selector, bounds) => {
  const current = [];
  const previous = [];
  items.forEach((item) => {
    const ts = parseTs(selector(item));
    if (inRange(ts, bounds.currentStart, bounds.end)) current.push(item);
    else if (inRange(ts, bounds.previousStart, bounds.previousEnd)) previous.push(item);
  });
  return { current, previous };
};

const countBy = (items = [], selector) => {
  const counts = new Map();
  items.forEach((item) => {
    const key = toKey(selector(item));
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return counts;
};

const countSources = (events = []) => {
  const counts = new Map();
  events.forEach((event) => {
    const source = toKey(event.source);
    counts.set(source, (counts.get(source) || 0) + 1);
  });
  return counts;
};

const deltaInfo = (currentCount, previousCount) => {
  const delta = currentCount - previousCount;
  const changePct = previousCount <= 0 ? (currentCount > 0 ? 100 : 0) : Math.round((delta / previousCount) * 100);
  let trend = TREND.FLAT;
  if (previousCount === 0 && currentCount > 0) trend = TREND.NEW;
  else if (currentCount >= Math.max(3, previousCount * 2) && currentCount - previousCount >= 3) trend = TREND.SPIKE;
  else if (delta > 0) trend = TREND.UP;
  else if (delta < 0) trend = TREND.DOWN;
  return { currentCount, previousCount, delta, changePct, trend };
};

const compareCounts = (currentMap, previousMap, limit = 5) => {
  const keys = new Set([...currentMap.keys(), ...previousMap.keys()]);
  return [...keys]
    .map((key) => ({ key, ...deltaInfo(currentMap.get(key) || 0, previousMap.get(key) || 0) }))
    .sort((a, b) => {
      const weight = (item) => (item.trend === TREND.SPIKE ? 3 : item.trend === TREND.NEW ? 2 : item.trend === TREND.UP ? 1 : 0);
      return weight(b) - weight(a) || b.delta - a.delta || b.currentCount - a.currentCount || a.key.localeCompare(b.key);
    })
    .slice(0, limit);
};

const watchMatchByType = (watchItem, recordKey) => {
  const term = String(watchItem?.normalizedTerm || watchItem?.term || "").toLowerCase();
  if (!term) return false;
  const normalized = String(recordKey || "").toLowerCase();
  return normalized.includes(term) || term.includes(normalized);
};

export const computeTrendAnalytics = ({
  historyStore,
  windowId = "24h",
  now = new Date(),
  watchItems = [],
}) => {
  const hours = WINDOWS[windowId] || WINDOWS["24h"];
  const bounds = getWindowBounds({ now, hours });
  const events = Array.isArray(historyStore?.events) ? historyStore.events : [];
  const incidents = Array.isArray(historyStore?.incidents) ? historyStore.incidents : [];

  const eventWindows = splitByWindow(events, (event) => event.timestamp, bounds);
  const incidentWindows = splitByWindow(incidents, (incident) => incident.lastUpdated || incident.firstSeen, bounds);

  const eventDelta = deltaInfo(eventWindows.current.length, eventWindows.previous.length);
  const incidentDelta = deltaInfo(incidentWindows.current.length, incidentWindows.previous.length);

  const categoryTrend = compareCounts(
    countBy(eventWindows.current, normalizeCategory),
    countBy(eventWindows.previous, normalizeCategory),
    6,
  );

  const regionTrend = compareCounts(
    countBy(eventWindows.current, (event) => event.region || "Unknown"),
    countBy(eventWindows.previous, (event) => event.region || "Unknown"),
    6,
  );

  const actorTrend = compareCounts(
    countBy(eventWindows.current.flatMap((event) => (event.osint?.actorTags || []).map((actor) => ({ actor }))), (entry) => entry.actor),
    countBy(eventWindows.previous.flatMap((event) => (event.osint?.actorTags || []).map((actor) => ({ actor }))), (entry) => entry.actor),
    6,
  );

  const sourceTrend = compareCounts(
    countSources(eventWindows.current),
    countSources(eventWindows.previous),
    5,
  );

  const watchSpikeMatches = [
    ...regionTrend.map((entry) => ({ dimension: "region", ...entry })),
    ...categoryTrend.map((entry) => ({ dimension: "category", ...entry })),
    ...actorTrend.map((entry) => ({ dimension: "actor", ...entry })),
  ].filter((entry) => {
    if (![TREND.UP, TREND.SPIKE, TREND.NEW].includes(entry.trend)) return false;
    return watchItems.some((watchItem) => watchItem.type === entry.dimension && watchMatchByType(watchItem, entry.key));
  });

  return {
    windowId,
    windowHours: hours,
    eventDelta,
    incidentDelta,
    categoryTrend,
    regionTrend,
    actorTrend,
    sourceTrend,
    watchSpikeMatches,
    trendLabels: TREND,
  };
};

export const TREND_WINDOWS = [
  { id: "1h", label: "1H vs prev" },
  { id: "6h", label: "6H vs prev" },
  { id: "24h", label: "24H vs prev" },
  { id: "7d", label: "7D vs prev" },
];
