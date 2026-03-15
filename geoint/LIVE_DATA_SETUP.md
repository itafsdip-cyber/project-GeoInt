# LIVE_DATA_SETUP

## Local development quick start

1. Copy env template and keep secrets server-side:
   ```bash
   cp .env.example .env.local
   ```
2. Ensure frontend live base URL is set:
   ```bash
   VITE_GEOINT_LIVE_API_BASE=http://localhost:3001
   ```
3. Start backend live ingestion server (terminal 1):
   ```bash
   npm run live:server
   ```
4. Start frontend Vite app (terminal 2):
   ```bash
   npm run dev
   ```

> After changing any `VITE_*` variable, restart Vite. It only reads env vars at startup.

## Recommended local provider defaults
For easiest local bring-up, use **GDELT + RSS** first.

- `GEOINT_ENABLE_GDELT=true`
- `GEOINT_ENABLE_RSS=true`
- `GEOINT_ENABLE_REDDIT=false` (enable only when Reddit credentials are configured)
- `GEOINT_ENABLE_X=false` (enable only when X credentials are configured)

## Environment variables

### Frontend (safe to expose)
- `VITE_GEOINT_LIVE_API_BASE` – base URL used by the frontend to request `/events/normalized`.

### Backend providers (server-side only)
- `GEOINT_ENABLE_GDELT`, `GEOINT_GDELT_QUERY`, `GEOINT_GDELT_LIMIT`, `GEOINT_GDELT_REFRESH_MS`
- `GEOINT_ENABLE_REDDIT`, `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_USER_AGENT`, `GEOINT_REDDIT_SUBREDDITS`, `GEOINT_REDDIT_KEYWORDS`, `GEOINT_REDDIT_REFRESH_MS`
- `GEOINT_ENABLE_X`, `X_BEARER_TOKEN`, `GEOINT_X_QUERY`, `GEOINT_X_MAX_RESULTS`, `GEOINT_X_REFRESH_MS`
- `GEOINT_ENABLE_RSS`, `GEOINT_RSS_FEEDS`, `GEOINT_RSS_REFRESH_MS`

### Other backend credentials (server-side only)
- `ANTHROPIC_API_KEY`

## Notes
- `proxy-server.cjs` loads `.env*` values with `dotenv`.
- Do not commit real credentials. Keep placeholders in tracked files only.
- If `VITE_GEOINT_LIVE_API_BASE` is missing, UI intentionally falls back to demo feed with a concise startup note.
