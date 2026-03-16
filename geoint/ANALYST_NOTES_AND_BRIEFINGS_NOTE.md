# Analyst notes and briefings

## Architecture
- Incident-level notes are stored as `{noteId, incidentId, timestamp, analyst, text}` in frontend state and backend snapshot payload.
- Pinning is tracked by incident IDs and rendered in a compact pinned panel.
- Briefing Builder exports markdown, JSON, or plain text.

## Heuristics and limitations
- Notes are analyst-authored content and are not auto-verified.
- Exports include watchlist/trend snapshots at export time only.
