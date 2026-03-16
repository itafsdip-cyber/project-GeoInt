const STORAGE_KEY = "geoint.intel.monitor.v1";

const safeParse = (raw, fallback) => {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
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
