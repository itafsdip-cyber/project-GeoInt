# GEOINT (React + Vite)

## Local development with hosted API/proxy

1. Copy env defaults:
   ```bash
   cp .env.example .env.local
   ```
2. Set frontend API base URL (used by the app runtime):
   ```bash
   VITE_GEOINT_API_BASE=http://localhost:3001
   ```
3. Run backend in terminal 1:
   ```bash
   npm run live:server
   ```
4. Run frontend in terminal 2:
   ```bash
   npm run dev
   ```

Open the Vite URL and confirm the workspace loads source status and events from the backend.

> Important: restart Vite whenever `.env*` values that start with `VITE_` change.

## Scripts
- `npm run dev` — start frontend dev server
- `npm run live:server` — start backend ingestion/proxy server
- `npm run lint` — run ESLint
- `npm run build` — production build

## Runtime and deployment expectations

- The backend server listens on `PORT` (default `3001`) and binds to `0.0.0.0`.
- CORS is controlled by `GEOINT_ALLOWED_ORIGINS` (comma-separated, `*` by default).
- Storage uses the configured adapter with fallback behavior in `api/storage` (SQLite/file-store parity is handled by the storage factory).
- AI enrichment is optional; when provider settings or keys are unavailable, the platform must remain operational in non-AI mode.
- Connector outputs can be degraded/unavailable based on credentials, rate limits, or provider health; degraded states are expected and should be surfaced, not hidden.

## Provider setup defaults
Use **GDELT + RSS** first for easiest local setup.
- Enabled by default in `.env.example`: GDELT, RSS
- Disabled by default in `.env.example`: Reddit, X (enable only after adding credentials)

See `LIVE_DATA_SETUP.md` for the full variable reference.
