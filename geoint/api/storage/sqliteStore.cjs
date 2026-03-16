const fs = require('fs');
const path = require('path');
const { applyRunRetention } = require('./retention.cjs');

function createSqliteStore() {
  const dbPath = process.env.GEOINT_SQLITE_PATH || path.join(__dirname, '..', '.geoint-storage.sqlite');
  console.log(`[storage] adapter=sqlite dbPath=${dbPath}`);
  let Database = null;
  try {
    Database = require('better-sqlite3');
  } catch {
    console.warn('[storage] SQLite unavailable (better-sqlite3 missing). Falling back to in-memory adapter.');
    return null;
  }

  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  const db = new Database(dbPath);

  const requiredTables = ['events', 'incidents', 'entities', 'narratives', 'analyst_notes', 'briefings', 'briefing_sections', 'overlay_tracks', 'ingestion_runs', 'watchlists', 'watchlist_alerts', 'investigations', 'monitored_regions', 'briefing_assistant_runs', 'export_metadata'];
  const requiredIndexes = ['idx_events_observed_at', 'idx_ingestion_runs_source_id', 'idx_overlay_tracks_type'];

  function validateSchema() {
    const tableRows = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    const existingTables = new Set(tableRows.map((row) => row.name));
    const missingTables = requiredTables.filter((name) => !existingTables.has(name));
    if (missingTables.length > 0) {
      db.exec(schemaSql);
    }

    const indexRows = db.prepare("SELECT name FROM sqlite_master WHERE type='index'").all();
    const existingIndexes = new Set(indexRows.map((row) => row.name));
    const missingIndexes = requiredIndexes.filter((name) => !existingIndexes.has(name));
    if (missingIndexes.length > 0) {
      db.exec(schemaSql);
    }

    const schemaVersion = db.pragma('user_version', { simple: true });
    console.log(`[storage] schemaVersion=${schemaVersion} missingTables=${missingTables.length}`);
  }

  validateSchema();

  function upsertSimple(table, idField, idColumn, payload) {
    const stmt = db.prepare(`INSERT INTO ${table} (${idColumn}, payload, updated_at) VALUES (@id, @payload, @updatedAt)
      ON CONFLICT(${idColumn}) DO UPDATE SET payload=excluded.payload, updated_at=excluded.updated_at`);
    const tx = db.transaction((items) => {
      for (const item of items) {
        stmt.run({ id: item[idField], payload: JSON.stringify(item), updatedAt: new Date().toISOString() });
      }
    });
    tx(payload);
    return payload;
  }

  function getSimple(table) {
    return db.prepare(`SELECT payload FROM ${table}`).all().map((row) => JSON.parse(row.payload));
  }

  function getBriefings() {
    const briefings = getSimple('briefings');
    const sections = db.prepare('SELECT payload, briefing_id, position FROM briefing_sections ORDER BY position ASC').all().map((row) => JSON.parse(row.payload));
    return briefings.map((briefing) => ({
      ...briefing,
      sections: sections.filter((section) => section.briefingId === briefing.briefingId),
    }));
  }

  return {
    adapter: 'sqlite',
    getEvents: () => getSimple('events'),
    saveEvents: (events = []) => upsertSimple('events', 'id', 'event_id', events),
    getIncidents: () => getSimple('incidents'),
    saveIncidents: (incidents = []) => upsertSimple('incidents', 'incidentId', 'incident_id', incidents),
    getEntities: () => getSimple('entities'),
    saveEntities: (entities = []) => upsertSimple('entities', 'entityId', 'entity_id', entities),
    getNarratives: () => getSimple('narratives'),
    saveNarratives: (narratives = []) => upsertSimple('narratives', 'narrativeId', 'narrative_id', narratives),
    getOverlayTracks: () => getSimple('overlay_tracks').filter((track) => !track.expiresAt || Date.parse(track.expiresAt) > Date.now()),
    saveOverlayTracks: (tracks = []) => upsertSimple('overlay_tracks', 'trackId', 'track_id', tracks),
    getAnalystNotes: () => db.prepare('SELECT payload FROM analyst_notes ORDER BY updated_at DESC').all().map((row) => JSON.parse(row.payload)),
    saveAnalystNote(note) {
      if (!note?.noteId) return null;
      upsertSimple('analyst_notes', 'noteId', 'note_id', [{ ...note, updatedAt: note.updatedAt || new Date().toISOString() }]);
      return note;
    },
    updateAnalystNote(noteId, patch = {}) {
      const existingRow = db.prepare('SELECT payload FROM analyst_notes WHERE note_id = ?').get(noteId);
      if (!existingRow) return null;
      const next = { ...JSON.parse(existingRow.payload), ...patch, noteId, updatedAt: new Date().toISOString() };
      upsertSimple('analyst_notes', 'noteId', 'note_id', [next]);
      return next;
    },
    deleteAnalystNote(noteId) {
      return db.prepare('DELETE FROM analyst_notes WHERE note_id = ?').run(noteId).changes > 0;
    },
    getBriefings,
    saveBriefing(briefing) {
      if (!briefing?.briefingId) return null;
      const tx = db.transaction(() => {
        upsertSimple('briefings', 'briefingId', 'briefing_id', [{ ...briefing, sections: undefined }]);
        db.prepare('DELETE FROM briefing_sections WHERE briefing_id = ?').run(briefing.briefingId);
        const sectionStmt = db.prepare(`INSERT INTO briefing_sections (section_id, briefing_id, position, payload, updated_at)
          VALUES (@sectionId, @briefingId, @position, @payload, @updatedAt)
          ON CONFLICT(section_id) DO UPDATE SET payload=excluded.payload, position=excluded.position, updated_at=excluded.updated_at`);
        (briefing.sections || []).forEach((section, index) => {
          sectionStmt.run({ sectionId: section.id, briefingId: briefing.briefingId, position: index, payload: JSON.stringify({ ...section, briefingId: briefing.briefingId }), updatedAt: new Date().toISOString() });
        });
      });
      tx();
      return { ...briefing };
    },
    updateBriefing(briefingId, patch = {}) {
      const existing = getBriefings().find((briefing) => briefing.briefingId === briefingId);
      if (!existing) return null;
      return this.saveBriefing({ ...existing, ...patch, briefingId, updatedAt: new Date().toISOString() });
    },
    deleteBriefing(briefingId) {
      const tx = db.transaction(() => {
        db.prepare('DELETE FROM briefing_sections WHERE briefing_id = ?').run(briefingId);
        return db.prepare('DELETE FROM briefings WHERE briefing_id = ?').run(briefingId).changes > 0;
      });
      return tx();
    },


    getMonitoredRegions: () => getSimple('monitored_regions'),
    saveMonitoredRegions: (regions = []) => upsertSimple('monitored_regions', 'id', 'region_id', regions),
    getBriefingAssistantRuns: () => getSimple('briefing_assistant_runs').sort((a, b) => Date.parse(b.updatedAt || '') - Date.parse(a.updatedAt || '')),
    saveBriefingAssistantRun(run) {
      if (!run?.id) return null;
      upsertSimple('briefing_assistant_runs', 'id', 'run_id', [{ ...run, updatedAt: run.updatedAt || new Date().toISOString() }]);
      return run;
    },
    getExportMetadata: () => getSimple('export_metadata').sort((a, b) => Date.parse(b.updatedAt || '') - Date.parse(a.updatedAt || '')),
    saveExportMetadata(meta) {
      if (!meta?.id) return null;
      upsertSimple('export_metadata', 'id', 'export_id', [{ ...meta, updatedAt: meta.updatedAt || new Date().toISOString() }]);
      return meta;
    },

    getWatchlists: () => getSimple('watchlists'),
    saveWatchlists: (watchlists = []) => upsertSimple('watchlists', 'id', 'watchlist_id', watchlists),
    getWatchlistAlerts: () => getSimple('watchlist_alerts').sort((a, b) => Date.parse(b.createdAt || '') - Date.parse(a.createdAt || '')),
    saveWatchlistAlerts: (alerts = []) => upsertSimple('watchlist_alerts', 'id', 'alert_id', alerts),
    getInvestigations: () => getSimple('investigations').sort((a, b) => Date.parse(b.updatedAt || '') - Date.parse(a.updatedAt || '')),
    saveInvestigation(investigation) {
      if (!investigation?.id) return null;
      upsertSimple('investigations', 'id', 'investigation_id', [{ ...investigation, updatedAt: investigation.updatedAt || new Date().toISOString() }]);
      return investigation;
    },
    deleteInvestigation(id) {
      return db.prepare('DELETE FROM investigations WHERE investigation_id = ?').run(id).changes > 0;
    },

    recordIngestionRun(run) {
      const stmt = db.prepare(`INSERT INTO ingestion_runs
      (run_id, source_id, source_type, started_at, finished_at, duration_ms, items_fetched, items_normalized, items_dropped, warnings_count, errors_count, state, warning_messages, error_messages, health_state_after_run)
      VALUES (@id, @sourceId, @sourceType, @startedAt, @finishedAt, @durationMs, @itemsFetched, @itemsNormalized, @itemsDropped, @warningsCount, @errorsCount, @state, @warningMessages, @errorMessages, @healthStateAfterRun)
      ON CONFLICT(run_id) DO UPDATE SET
      finished_at=excluded.finished_at, duration_ms=excluded.duration_ms, items_fetched=excluded.items_fetched, items_normalized=excluded.items_normalized,
      items_dropped=excluded.items_dropped, warnings_count=excluded.warnings_count, errors_count=excluded.errors_count, state=excluded.state,
      warning_messages=excluded.warning_messages, error_messages=excluded.error_messages, health_state_after_run=excluded.health_state_after_run`);
      stmt.run({
        id: run.id,
        sourceId: run.sourceId,
        sourceType: run.sourceType || 'event',
        startedAt: run.startedAt,
        finishedAt: run.finishedAt || null,
        durationMs: run.durationMs || null,
        itemsFetched: run.itemsFetched || 0,
        itemsNormalized: run.itemsNormalized || 0,
        itemsDropped: run.itemsDropped || 0,
        warningsCount: run.warningsCount || 0,
        errorsCount: run.errorsCount || 0,
        state: run.state,
        warningMessages: JSON.stringify(run.warningMessages || []),
        errorMessages: JSON.stringify(run.errorMessages || []),
        healthStateAfterRun: run.healthStateAfterRun || 'UNKNOWN',
      });
      const maxRuns = Number(process.env.GEOINT_MAX_RUNS || 500);
      const rows = db.prepare('SELECT run_id, started_at FROM ingestion_runs ORDER BY started_at DESC').all();
      const expired = applyRunRetention(rows.map((row) => ({ id: row.run_id, startedAt: row.started_at })), maxRuns);
      const keep = new Set(expired.map((row) => row.id));
      const tx = db.transaction(() => {
        for (const row of rows) {
          if (!keep.has(row.run_id)) db.prepare('DELETE FROM ingestion_runs WHERE run_id = ?').run(row.run_id);
        }
      });
      tx();
      return run;
    },
    getIngestionRuns(filters = {}) {
      let sql = 'SELECT * FROM ingestion_runs WHERE 1=1';
      const args = [];
      if (filters.sourceId) { sql += ' AND source_id = ?'; args.push(filters.sourceId); }
      if (filters.state) { sql += ' AND state = ?'; args.push(filters.state); }
      sql += ' ORDER BY started_at DESC LIMIT ?';
      args.push(Number(filters.limit || 100));
      return db.prepare(sql).all(...args).map((row) => ({
        id: row.run_id,
        sourceId: row.source_id,
        sourceType: row.source_type,
        startedAt: row.started_at,
        finishedAt: row.finished_at,
        durationMs: row.duration_ms,
        itemsFetched: row.items_fetched,
        itemsNormalized: row.items_normalized,
        itemsDropped: row.items_dropped,
        warningsCount: row.warnings_count,
        errorsCount: row.errors_count,
        state: row.state,
        warningMessages: JSON.parse(row.warning_messages || '[]'),
        errorMessages: JSON.parse(row.error_messages || '[]'),
        healthStateAfterRun: row.health_state_after_run,
      }));
    },
    pruneExpiredData() {
      db.prepare('DELETE FROM overlay_tracks WHERE expires_at IS NOT NULL AND expires_at < ?').run(new Date().toISOString());
      return { ok: true };
    },
  };
}

module.exports = { createSqliteStore };
