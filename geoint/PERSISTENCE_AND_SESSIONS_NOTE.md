# Persistence and saved sessions

## Implemented now
- Local persistence remains browser `localStorage` based.
- Persisted state now includes:
  - watchlists
  - selected timeframe
  - timezone
  - trend window
  - theme
  - UI preferences
  - AI summary mode
  - local LLM endpoint config
  - bounded historical events/incidents store
  - saved sessions
- Saved sessions capture practical analyst context:
  - watchlists
  - timeframe
  - timezone
  - trend window
  - theme
  - UI preferences
  - AI provider mode
  - local LLM config

## History behavior
- History uses deduped append snapshots and retains timestamps.
- Storage is capped by event/incident maximums and retention window.
- Added clear/reset for local history and size counters in Settings.

## Session import/export
- Added simple JSON export/import for saved sessions.
- Import intentionally replaces local saved-session list with the provided payload.

## Heuristic behavior
- Everything in this layer is local-only and trustless to server state.
- History/trend/session persistence supports continuity, not authoritative archival.

## Limitations
- No multi-user separation or backend sync.
- No encrypted storage for endpoint configuration.
- Import schema validation is intentionally lightweight.

## Future production upgrades
- Backend persistence with account scoping and policy controls.
- Signed/validated session bundles for portable workflow handoff.
- Backfill and replay APIs for longitudinal analysis across devices.
