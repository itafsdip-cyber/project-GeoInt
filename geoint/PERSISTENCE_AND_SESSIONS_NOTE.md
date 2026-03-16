# Persistence and saved sessions

## Implemented now
- Added lightweight local persistence service based on `localStorage`.
- Persisted state includes watchlists, selected timeframe, selected timezone, recent events/incidents history snapshots, and saved analyst sessions.
- Added compact saved sessions UI to save, load, and delete analyst snapshots.

## Heuristic behavior
- Persistence is frontend-only and trustless to server state.
- History snapshots are capped and intended for quick continuity, not long-term archive.

## Limitations
- No multi-user separation/auth-scoped storage.
- No remote sync across devices.
- Session metadata is minimal.

## Future production upgrades
- Move snapshots/history to authenticated backend storage.
- Add encryption-at-rest and retention controls.
- Add richer panel layout and map focus restoration semantics.
