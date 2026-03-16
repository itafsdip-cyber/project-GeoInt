const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '..', '.geoint-history.json');

const DEFAULT_LIMITS = {
  events: 12000,
  incidents: 4000,
  trajectories: 5000,
  analystNotes: 6000,
  entityNodes: 6000,
  narratives: 4000,
  watchlists: 1200,
  retentionDays: Number(process.env.GEOINT_RETENTION_DAYS || 90),
};

const EMPTY_STORE = {
  events: [],
  incidents: [],
  trajectories: [],
  analystNotes: [],
  entityNodes: [],
  narratives: [],
  watchlists: [],
  updatedAt: null,
};

function safeReadStore() {
  try {
    if (!fs.existsSync(STORE_PATH)) return { ...EMPTY_STORE };
    const parsed = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
    return { ...EMPTY_STORE, ...(parsed || {}) };
  } catch {
    return { ...EMPTY_STORE };
  }
}

function keyForItem(item = {}, type = 'events') {
  if (type === 'analystNotes') return item.noteId || item.id || `${item.incidentId}|${item.timestamp}|${item.analyst}`;
  if (type === 'incidents') return item.incidentId || item.id || `${item.title}|${item.firstSeen}|${item.region}`;
  if (type === 'entityNodes') return item.id || `${item.type}|${item.label}`;
  if (type === 'narratives') return item.narrativeId || item.id || `${(item.keywords || []).join('|')}|${item.firstSeen}`;
  if (type === 'watchlists') return item.id || `${item.type}|${item.term}`;
  if (type === 'trajectories') return item.id || `${item.type}|${item.source}|${item.timestamp}`;
  return item.id || `${item.title}|${item.timestamp}|${item.source}`;
}

function dedupe(items = [], type = 'events') {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyForItem(item, type);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseTs(item = {}) {
  const value = item.timestamp || item.lastSeen || item.firstSeen || item.updatedAt || item.createdAt;
  return new Date(value).getTime();
}

function trim(items = [], limit = 1000, retentionDays = DEFAULT_LIMITS.retentionDays) {
  const cutoff = Date.now() - retentionDays * 24 * 3600000;
  return [...items]
    .sort((a, b) => parseTs(b) - parseTs(a))
    .filter((item, idx) => {
      if (idx >= limit) return false;
      const ts = parseTs(item);
      return Number.isFinite(ts) ? ts >= cutoff : idx < Math.min(100, limit);
    });
}

function normalizeStore(store = {}) {
  const limits = DEFAULT_LIMITS;
  const normalized = { ...EMPTY_STORE, ...(store || {}) };
  return {
    events: trim(dedupe(normalized.events, 'events'), limits.events, limits.retentionDays),
    incidents: trim(dedupe(normalized.incidents, 'incidents'), limits.incidents, limits.retentionDays),
    trajectories: trim(dedupe(normalized.trajectories, 'trajectories'), limits.trajectories, limits.retentionDays),
    analystNotes: trim(dedupe(normalized.analystNotes, 'analystNotes'), limits.analystNotes, limits.retentionDays),
    entityNodes: trim(dedupe(normalized.entityNodes, 'entityNodes'), limits.entityNodes, limits.retentionDays),
    narratives: trim(dedupe(normalized.narratives, 'narratives'), limits.narratives, limits.retentionDays),
    watchlists: trim(dedupe(normalized.watchlists, 'watchlists'), limits.watchlists, limits.retentionDays),
    updatedAt: new Date().toISOString(),
  };
}

function writeStore(store) {
  const normalized = normalizeStore(store);
  fs.writeFileSync(STORE_PATH, JSON.stringify(normalized, null, 2));
  return normalized;
}

function appendSnapshot(snapshot = {}) {
  const current = safeReadStore();
  return writeStore({
    events: [...(snapshot.events || []), ...(current.events || [])],
    incidents: [...(snapshot.incidents || []), ...(current.incidents || [])],
    trajectories: [...(snapshot.trajectories || []), ...(current.trajectories || [])],
    analystNotes: [...(snapshot.analystNotes || []), ...(current.analystNotes || [])],
    entityNodes: [...(snapshot.entityNodes || []), ...(current.entityNodes || [])],
    narratives: [...(snapshot.narratives || []), ...(current.narratives || [])],
    watchlists: [...(snapshot.watchlists || []), ...(current.watchlists || [])],
  });
}

module.exports = { safeReadStore, appendSnapshot, STORE_PATH, DEFAULT_LIMITS };
