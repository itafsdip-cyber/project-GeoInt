# GEOINT Live-Data Readiness Status

## Current runtime truth
- The app now has a **real live-data service boundary** (`src/services/data/liveDataService.js`) that attempts to load normalized live data from `VITE_GEOINT_LIVE_API_BASE/events/normalized`.
- If no live provider is configured (or unreachable), the UI transparently falls back to demo adapters and reports `LIVE UNAVAILABLE` with reason text in the command bar.
- No fake “live” records are fabricated and presented as real.

## What is live-ready now
- Canonical normalized event model with required fields is defined in `src/services/data/normalizedEventModel.js`.
- Demo-to-normalized adapters for alerts, events, timeline, trajectories, and sources are in `src/services/data/adapters/demoAdapters.js`.
- Live provider boundary and fallback logic are in `src/services/data/adapters/liveProviders.js`.
- Polling refresh architecture and time-window filtering are centralized in `src/services/data/liveDataService.js`.

## What is still demo
- The repository currently ships scenario/demo datasets used by the fallback adapters.
- Metrics counters and simulated chat/ticker updates are still UI-side demo behavior.

## Backend/provider work still required for true live operation
1. Stand up a backend endpoint returning normalized payloads by feed type:
   - `alerts`, `events`, `timeline`, `trajectories`, `sources`
2. Implement ingestion/normalization for trusted real providers (official defense/civil alerts, verified incident feeds, source metadata).
3. Add deduplication, provenance scoring, and confidence updates server-side.
4. Configure `VITE_GEOINT_LIVE_API_BASE` in deployment environments.
5. Add auth/rate-limit controls for production providers.
