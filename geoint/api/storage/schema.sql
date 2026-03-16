CREATE TABLE IF NOT EXISTS events (
  event_id TEXT PRIMARY KEY,
  source_id TEXT,
  observed_at TEXT,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_observed_at ON events(observed_at);
CREATE INDEX IF NOT EXISTS idx_events_source_id ON events(source_id);

CREATE TABLE IF NOT EXISTS incidents (
  incident_id TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_incidents_updated_at ON incidents(updated_at);

CREATE TABLE IF NOT EXISTS entities (
  entity_id TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_entities_updated_at ON entities(updated_at);

CREATE TABLE IF NOT EXISTS entity_relations (
  relation_id TEXT PRIMARY KEY,
  from_entity_id TEXT,
  to_entity_id TEXT,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_entity_relations_from ON entity_relations(from_entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_relations_to ON entity_relations(to_entity_id);

CREATE TABLE IF NOT EXISTS narratives (
  narrative_id TEXT PRIMARY KEY,
  health_state TEXT,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_narratives_health_state ON narratives(health_state);

CREATE TABLE IF NOT EXISTS narrative_signals (
  signal_id TEXT PRIMARY KEY,
  narrative_id TEXT,
  source_id TEXT,
  observed_at TEXT,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_narrative_signals_narrative_id ON narrative_signals(narrative_id);
CREATE INDEX IF NOT EXISTS idx_narrative_signals_source_id ON narrative_signals(source_id);

CREATE TABLE IF NOT EXISTS analyst_notes (
  note_id TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_analyst_notes_updated_at ON analyst_notes(updated_at);

CREATE TABLE IF NOT EXISTS briefings (
  briefing_id TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_briefings_updated_at ON briefings(updated_at);

CREATE TABLE IF NOT EXISTS briefing_sections (
  section_id TEXT PRIMARY KEY,
  briefing_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_briefing_sections_briefing ON briefing_sections(briefing_id);

CREATE TABLE IF NOT EXISTS overlay_tracks (
  track_id TEXT PRIMARY KEY,
  overlay_type TEXT,
  source_id TEXT,
  observed_at TEXT,
  expires_at TEXT,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_overlay_tracks_type ON overlay_tracks(overlay_type);
CREATE INDEX IF NOT EXISTS idx_overlay_tracks_observed_at ON overlay_tracks(observed_at);
CREATE INDEX IF NOT EXISTS idx_overlay_tracks_source_id ON overlay_tracks(source_id);

CREATE TABLE IF NOT EXISTS sources (
  source_id TEXT PRIMARY KEY,
  health_state TEXT,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sources_health_state ON sources(health_state);

CREATE TABLE IF NOT EXISTS ingestion_runs (
  run_id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  source_type TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  duration_ms INTEGER,
  items_fetched INTEGER DEFAULT 0,
  items_normalized INTEGER DEFAULT 0,
  items_dropped INTEGER DEFAULT 0,
  warnings_count INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  state TEXT NOT NULL,
  warning_messages TEXT,
  error_messages TEXT,
  health_state_after_run TEXT
);
CREATE INDEX IF NOT EXISTS idx_ingestion_runs_source_id ON ingestion_runs(source_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_runs_started_at ON ingestion_runs(started_at);
CREATE INDEX IF NOT EXISTS idx_ingestion_runs_state ON ingestion_runs(state);

CREATE TABLE IF NOT EXISTS watchlists (
  watchlist_id TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS watchlist_alerts (
  alert_id TEXT PRIMARY KEY,
  watchlist_id TEXT,
  payload TEXT NOT NULL,
  created_at TEXT,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_watchlist_alerts_watchlist_id ON watchlist_alerts(watchlist_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_alerts_created_at ON watchlist_alerts(created_at);

CREATE TABLE IF NOT EXISTS investigations (
  investigation_id TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_investigations_updated_at ON investigations(updated_at);

CREATE TABLE IF NOT EXISTS monitored_regions (
  region_id TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_monitored_regions_updated_at ON monitored_regions(updated_at);

CREATE TABLE IF NOT EXISTS briefing_assistant_runs (
  run_id TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_briefing_assistant_runs_updated_at ON briefing_assistant_runs(updated_at);

CREATE TABLE IF NOT EXISTS export_metadata (
  export_id TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_export_metadata_updated_at ON export_metadata(updated_at);
