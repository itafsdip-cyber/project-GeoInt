const STORAGE_KEY = "geoint.intel.monitor.v1";

const HISTORY_LIMITS = {
  maxEvents: 4000,
  maxIncidents: 1200,
  retentionDays: 14,
};

const SESSION_LIMIT = 12;
const WATCH_ITEM_LIMIT = 24;

const safeParse = (raw, fallback) => {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const parseTs = (value) => new Date(value).getTime();

const stableString = (value = "") => String(value || "").toLowerCase().trim();

const sanitizeWatchItems = (watchItems = []) => {
  if (!Array.isArray(watchItems)) return [];
  return watchItems
    .filter((item) => item && typeof item === "object")
    .map((item, index) => {
      const term = String(item.term || item.normalizedTerm || "").trim();
      if (!term) return null;
      const type = stableString(item.type) || "keyword";
      const normalizedTerm = stableString(term);
      return {
        id: String(item.id || `watch-${type}-${normalizedTerm}-${index}`),
        type,
        term,
        normalizedTerm,
        createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString(),
      };
    })
    .filter(Boolean)
    .slice(0, WATCH_ITEM_LIMIT);
};

const dedupeByIdentity = (items = [], type) => {
  const seen = new Set();
  return items.filter((item) => {
    const fallbackKey = [
      stableString(item.region),
      stableString(item.title),
      stableString(item.category),
      stableString(item.timestamp),
      stableString(item.source),
    ].join("|");

    const id = type === "incident"
      ? item.incidentId || item.id || fallbackKey
      : item.id || fallbackKey;

    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

const trimByRetention = (items = [], maxItems = 500) => {
  const cutoff = Date.now() - HISTORY_LIMITS.retentionDays * 24 * 3600000;
  const sorted = [...items].sort((a, b) => parseTs(b.timestamp || b.lastUpdated || b.firstSeen) - parseTs(a.timestamp || a.lastUpdated || a.firstSeen));
  return sorted.filter((item, index) => {
    if (index >= maxItems) return false;
    const ts = parseTs(item.timestamp || item.lastUpdated || item.firstSeen);
    if (!Number.isFinite(ts)) return index < Math.min(100, maxItems);
    return ts >= cutoff;
  });
};


const sanitizeSessionSnapshot = (snapshot = {}) => ({
  watchItems: Array.isArray(snapshot.watchItems) ? sanitizeWatchItems(snapshot.watchItems) : undefined,
  timeRangeId: typeof snapshot.timeRangeId === "string" ? snapshot.timeRangeId : undefined,
  timezoneId: typeof snapshot.timezoneId === "string" ? snapshot.timezoneId : undefined,
  trendWindowId: typeof snapshot.trendWindowId === "string" ? snapshot.trendWindowId : undefined,
  themeId: typeof snapshot.themeId === "string" ? snapshot.themeId : undefined,
  aiSummaryMode: typeof snapshot.aiSummaryMode === "string" ? snapshot.aiSummaryMode : undefined,
  localLlm: snapshot.localLlm && typeof snapshot.localLlm === "object" ? snapshot.localLlm : undefined,
  uiPrefs: snapshot.uiPrefs && typeof snapshot.uiPrefs === "object" ? snapshot.uiPrefs : undefined,
});

const sanitizeSessions = (sessions = []) => sessions
  .filter((session) => session && typeof session === "object")
  .map((session, index) => ({
    id: String(session.id || `sess-import-${Date.now()}-${index}`),
    name: String(session.name || "Session").trim().slice(0, 48) || "Session",
    snapshot: sanitizeSessionSnapshot(session.snapshot || {}),
    createdAt: session.createdAt || new Date().toISOString(),
  }))
  .slice(0, SESSION_LIMIT);

const sanitizeHistoryStore = (history = {}) => {
  const events = trimByRetention(dedupeByIdentity(history.events || [], "event"), HISTORY_LIMITS.maxEvents);
  const incidents = trimByRetention(dedupeByIdentity(history.incidents || [], "incident"), HISTORY_LIMITS.maxIncidents);
  return {
    events,
    incidents,
    lastUpdated: new Date().toISOString(),
  };
};

const sanitizePersistedState = (state) => {
  if (!state || typeof state !== "object" || Array.isArray(state)) return null;
  return {
    ...state,
    watchItems: sanitizeWatchItems(state.watchItems),
    savedSessions: sanitizeSessions(Array.isArray(state.savedSessions) ? state.savedSessions : []),
    historyStore: sanitizeHistoryStore(state.historyStore || {}),
  };
};

export const loadPersistedState = () => {
  if (typeof window === "undefined") return null;
  return sanitizePersistedState(safeParse(window.localStorage.getItem(STORAGE_KEY), null));
};

export const savePersistedState = (state) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...state,
      savedAt: new Date().toISOString(),
    }));
  } catch {
    // Ignore quota/private-mode storage errors so runtime remains functional.
  }
};

export const loadSavedSessions = () => {
  const state = loadPersistedState();
  return sanitizeSessions(Array.isArray(state?.savedSessions) ? state.savedSessions : []);
};

export const loadHistoryStore = () => {
  const state = loadPersistedState() || {};
  return sanitizeHistoryStore(state.historyStore || {});
};

export const appendHistorySnapshot = ({ events = [], incidents = [] }) => {
  const state = loadPersistedState() || {};
  const existing = sanitizeHistoryStore(state.historyStore || {});
  const merged = sanitizeHistoryStore({
    events: [...events, ...(existing.events || [])],
    incidents: [...incidents, ...(existing.incidents || [])],
  });
  savePersistedState({ ...state, historyStore: merged });
  return merged;
};

export const clearHistoryStore = () => {
  const state = loadPersistedState() || {};
  const cleared = sanitizeHistoryStore({ events: [], incidents: [] });
  savePersistedState({ ...state, historyStore: cleared });
  return cleared;
};

export const historyStoreUsage = (historyStore = {}) => ({
  eventCount: Array.isArray(historyStore.events) ? historyStore.events.length : 0,
  incidentCount: Array.isArray(historyStore.incidents) ? historyStore.incidents.length : 0,
  approxBytes: new Blob([JSON.stringify(historyStore || {})]).size,
});

export const saveSessionSnapshot = ({ name, snapshot }) => {
  const state = loadPersistedState() || {};
  const existing = Array.isArray(state.savedSessions) ? state.savedSessions : [];
  const sanitized = String(name || "Session").trim().slice(0, 48);
  const next = sanitizeSessions([
    {
      id: `sess-${Date.now()}`,
      name: sanitized || "Session",
      snapshot,
      createdAt: new Date().toISOString(),
    },
    ...existing,
  ]);
  savePersistedState({ ...state, savedSessions: next });
  return next;
};

export const deleteSessionSnapshot = (sessionId) => {
  const state = loadPersistedState() || {};
  const existing = Array.isArray(state.savedSessions) ? state.savedSessions : [];
  const next = existing.filter((item) => item.id !== sessionId);
  savePersistedState({ ...state, savedSessions: next });
  return next;
};

export const historyLimits = HISTORY_LIMITS;

export { sanitizeWatchItems };

export const importSessionSnapshots = (sessions = []) => {
  const state = loadPersistedState() || {};
  const next = sanitizeSessions(sessions);
  savePersistedState({ ...state, savedSessions: next });
  return next;
};
