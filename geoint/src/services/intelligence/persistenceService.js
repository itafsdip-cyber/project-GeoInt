const STORAGE_KEY = "geoint.intel.monitor.v1";

const HISTORY_LIMITS = {
  maxEvents: 4000,
  maxIncidents: 1200,
  retentionDays: 14,
};

const safeParse = (raw, fallback) => {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const parseTs = (value) => new Date(value).getTime();

const stableString = (value = "") => String(value || "").toLowerCase().trim();

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

const sanitizeHistoryStore = (history = {}) => {
  const events = trimByRetention(dedupeByIdentity(history.events || [], "event"), HISTORY_LIMITS.maxEvents);
  const incidents = trimByRetention(dedupeByIdentity(history.incidents || [], "incident"), HISTORY_LIMITS.maxIncidents);
  return {
    events,
    incidents,
    lastUpdated: new Date().toISOString(),
  };
};

export const loadPersistedState = () => {
  if (typeof window === "undefined") return null;
  return safeParse(window.localStorage.getItem(STORAGE_KEY), null);
};

export const savePersistedState = (state) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
    ...state,
    savedAt: new Date().toISOString(),
  }));
};

export const loadSavedSessions = () => {
  const state = loadPersistedState();
  return Array.isArray(state?.savedSessions) ? state.savedSessions : [];
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

export const saveSessionSnapshot = ({ name, snapshot }) => {
  const state = loadPersistedState() || {};
  const existing = Array.isArray(state.savedSessions) ? state.savedSessions : [];
  const sanitized = String(name || "Session").trim().slice(0, 48);
  const next = [
    {
      id: `sess-${Date.now()}`,
      name: sanitized || "Session",
      snapshot,
      createdAt: new Date().toISOString(),
    },
    ...existing,
  ].slice(0, 12);
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
