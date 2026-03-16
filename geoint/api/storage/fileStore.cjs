const fs = require('fs');
const path = require('path');
const { applyRunRetention, pruneExpiredOverlayTracks, pruneByAge, toMillis } = require('./retention.cjs');

const STORE_PATH = path.join(__dirname, '..', '.geoint-storage.json');

function nowIso() {
  return new Date().toISOString();
}

function createInitialStore() {
  return {
    updatedAt: nowIso(),
    events: [],
    incidents: [],
    entities: [],
    entity_relations: [],
    narratives: [],
    narrative_signals: [],
    analyst_notes: [],
    briefings: [],
    briefing_sections: [],
    overlay_tracks: [],
    sources: [],
    ingestion_runs: [],
    watchlists: [],
  };
}

function readStore() {
  try {
    const parsed = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
    return { ...createInitialStore(), ...parsed };
  } catch {
    return createInitialStore();
  }
}

function writeStore(next) {
  fs.writeFileSync(STORE_PATH, JSON.stringify({ ...next, updatedAt: nowIso() }, null, 2));
}

function upsertById(items, idField, nextItems) {
  const byId = new Map(items.map((item) => [item[idField], item]));
  for (const item of nextItems) byId.set(item[idField], item);
  return [...byId.values()];
}

function createFileStore() {
  function getCollection(key) {
    return readStore()[key] || [];
  }

  function saveCollection(key, idField, values) {
    const current = readStore();
    current[key] = upsertById(current[key] || [], idField, values);
    writeStore(current);
    return current[key];
  }

  return {
    adapter: 'file',
    getEvents: () => getCollection('events'),
    saveEvents: (events = []) => saveCollection('events', 'id', events),
    getIncidents: () => getCollection('incidents'),
    saveIncidents: (incidents = []) => saveCollection('incidents', 'incidentId', incidents),
    getEntities: () => getCollection('entities'),
    saveEntities: (entities = []) => saveCollection('entities', 'entityId', entities),
    getNarratives: () => getCollection('narratives'),
    saveNarratives: (narratives = []) => saveCollection('narratives', 'narrativeId', narratives),
    getOverlayTracks: () => pruneExpiredOverlayTracks(getCollection('overlay_tracks')),
    saveOverlayTracks: (tracks = []) => saveCollection('overlay_tracks', 'trackId', tracks),
    getAnalystNotes: () => [...getCollection('analyst_notes')].sort((a, b) => toMillis(b.updatedAt || b.createdAt) - toMillis(a.updatedAt || a.createdAt)),
    saveAnalystNote(note) {
      if (!note?.noteId) return null;
      const [saved] = saveCollection('analyst_notes', 'noteId', [{ ...note, updatedAt: note.updatedAt || nowIso() }]).filter((item) => item.noteId === note.noteId);
      return saved;
    },
    updateAnalystNote(noteId, patch = {}) {
      const current = readStore();
      const existing = (current.analyst_notes || []).find((n) => n.noteId === noteId);
      if (!existing) return null;
      const next = { ...existing, ...patch, noteId, updatedAt: nowIso() };
      current.analyst_notes = upsertById(current.analyst_notes || [], 'noteId', [next]);
      writeStore(current);
      return next;
    },
    deleteAnalystNote(noteId) {
      const current = readStore();
      const before = current.analyst_notes.length;
      current.analyst_notes = current.analyst_notes.filter((n) => n.noteId !== noteId);
      writeStore(current);
      return before !== current.analyst_notes.length;
    },
    getBriefings() {
      const briefings = getCollection('briefings');
      const sections = getCollection('briefing_sections');
      return briefings.map((briefing) => ({
        ...briefing,
        sections: sections.filter((section) => section.briefingId === briefing.briefingId).sort((a, b) => (a.position || 0) - (b.position || 0)),
      }));
    },
    saveBriefing(briefing) {
      if (!briefing?.briefingId) return null;
      const current = readStore();
      const savedBriefing = { ...briefing, updatedAt: briefing.updatedAt || nowIso() };
      current.briefings = upsertById(current.briefings || [], 'briefingId', [{ ...savedBriefing, sections: undefined }]);
      if (Array.isArray(briefing.sections)) {
        current.briefing_sections = (current.briefing_sections || []).filter((s) => s.briefingId !== briefing.briefingId);
        current.briefing_sections.push(...briefing.sections.map((section, index) => ({ ...section, briefingId: briefing.briefingId, position: index })));
      }
      writeStore(current);
      return { ...savedBriefing, sections: briefing.sections || [] };
    },
    updateBriefing(briefingId, patch = {}) {
      const existing = this.getBriefings().find((b) => b.briefingId === briefingId);
      if (!existing) return null;
      return this.saveBriefing({ ...existing, ...patch, briefingId, updatedAt: nowIso() });
    },
    deleteBriefing(briefingId) {
      const current = readStore();
      const before = current.briefings.length;
      current.briefings = current.briefings.filter((b) => b.briefingId !== briefingId);
      current.briefing_sections = current.briefing_sections.filter((section) => section.briefingId !== briefingId);
      writeStore(current);
      return before !== current.briefings.length;
    },
    recordIngestionRun(run) {
      const current = readStore();
      current.ingestion_runs = applyRunRetention([...(current.ingestion_runs || []), run]);
      writeStore(current);
      return run;
    },
    getIngestionRuns(filters = {}) {
      let runs = getCollection('ingestion_runs');
      if (filters.sourceId) runs = runs.filter((run) => run.sourceId === filters.sourceId);
      if (filters.state) runs = runs.filter((run) => run.state === filters.state);
      const limit = Number(filters.limit || 100);
      return runs.sort((a, b) => toMillis(b.startedAt) - toMillis(a.startedAt)).slice(0, Number.isFinite(limit) ? limit : 100);
    },
    pruneExpiredData(options = {}) {
      const current = readStore();
      const eventTtlMs = Number(options.eventTtlMs || process.env.GEOINT_EVENT_TTL_MS || 0);
      const runTtlMs = Number(options.runTtlMs || process.env.GEOINT_RUN_TTL_MS || 0);
      current.events = pruneByAge(current.events, 'timestamp', eventTtlMs);
      current.overlay_tracks = pruneExpiredOverlayTracks(current.overlay_tracks);
      current.ingestion_runs = applyRunRetention(pruneByAge(current.ingestion_runs, 'startedAt', runTtlMs));
      writeStore(current);
      return { events: current.events.length, overlayTracks: current.overlay_tracks.length, ingestionRuns: current.ingestion_runs.length };
    },
  };
}

module.exports = createFileStore();
module.exports.createFileStore = createFileStore;
