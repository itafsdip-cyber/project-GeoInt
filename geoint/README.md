# GEOINT (React + Vite)

## Local development with live ingestion

1. Copy env defaults:
   ```bash
   cp .env.example .env.local
   ```
2. Confirm frontend live API base is configured:
   ```bash
   VITE_GEOINT_LIVE_API_BASE=http://localhost:3001
   ```
3. Run backend in terminal 1:
   ```bash
   npm run live:server
   ```
4. Run frontend in terminal 2:
   ```bash
   npm run dev
   ```

Open the Vite URL and confirm the status line no longer says that `VITE_GEOINT_LIVE_API_BASE` is missing.

> Important: restart Vite whenever `.env*` values that start with `VITE_` change.

## Scripts
- `npm run dev` — start frontend dev server
- `npm run live:server` — start backend ingestion/proxy server
- `npm run lint` — run ESLint
- `npm run build` — production build

## Provider setup defaults
Use **GDELT + RSS** first for easiest local setup.
- Enabled by default in `.env.example`: GDELT, RSS
- Disabled by default in `.env.example`: Reddit, X (enable only after adding credentials)

See `LIVE_DATA_SETUP.md` for the full variable reference.
