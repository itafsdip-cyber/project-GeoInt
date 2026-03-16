# Persistence note

## Architecture
- Backend persistence store now keeps events, incidents, trajectories, analyst notes, entity nodes, narratives, and watchlists.
- Retention defaults to 90 days and is configurable via `GEOINT_RETENTION_DAYS`.
- Endpoints: `/history/events`, `/history/incidents`, `/history/entities`, `/history/narratives`.

## Limitations
- Current implementation remains file-backed JSON store for lightweight deployment.
- SQLite can be added later without changing payload contracts.
