const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '..', '.geoint-history.json');
const LIMITS = { events: 6000, incidents: 2000, retentionDays: 21 };

function safeReadStore() {
  try {
    if (!fs.existsSync(STORE_PATH)) return { events: [], incidents: [], updatedAt: null };
    return JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
  } catch {
    return { events: [], incidents: [], updatedAt: null };
  }
}

function dedupe(items = [], type = 'event') {
  const seen = new Set();
  return items.filter((item) => {
    const key = type === 'incident'
      ? item.incidentId || item.id || `${item.title}|${item.firstSeen}|${item.region}`
      : item.id || `${item.title}|${item.timestamp}|${item.source}`;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function trim(items = [], limit = 1000) {
  const cutoff = Date.now() - LIMITS.retentionDays * 24 * 3600000;
  return items
    .sort((a, b) => new Date(b.timestamp || b.lastSeen || b.firstSeen).getTime() - new Date(a.timestamp || a.lastSeen || a.firstSeen).getTime())
    .filter((item, idx) => {
      if (idx >= limit) return false;
      const ts = new Date(item.timestamp || item.lastSeen || item.firstSeen).getTime();
      return Number.isFinite(ts) ? ts >= cutoff : idx < Math.min(100, limit);
    });
}

function writeStore(store) {
  const normalized = {
    events: trim(dedupe(store.events || [], 'event'), LIMITS.events),
    incidents: trim(dedupe(store.incidents || [], 'incident'), LIMITS.incidents),
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(STORE_PATH, JSON.stringify(normalized, null, 2));
  return normalized;
}

function appendSnapshot({ events = [], incidents = [] }) {
  const current = safeReadStore();
  return writeStore({
    events: [...events, ...(current.events || [])],
    incidents: [...incidents, ...(current.incidents || [])],
  });
}

module.exports = { safeReadStore, appendSnapshot, STORE_PATH };
