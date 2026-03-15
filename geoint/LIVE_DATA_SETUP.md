# LIVE_DATA_SETUP

## Overview
The GEOINT app now supports a production-minded multi-source ingestion pipeline via the Node proxy (`proxy-server.cjs`) with provider connectors for:
- **GDELT** (primary global event/news stream)
- **Reddit API**
- **X API v2 (recent search)**
- **RSS feeds**

The frontend never receives provider secrets directly. Credentials are read from server environment variables.

## Run
1. Start app UI:
   ```bash
   npm run dev
   ```
2. Start live proxy server (separate shell):
   ```bash
   node proxy-server.cjs
   ```
3. Set frontend base URL:
   ```bash
   VITE_GEOINT_LIVE_API_BASE=http://localhost:3001
   ```

## Required / optional environment variables

### Core
- `VITE_GEOINT_LIVE_API_BASE` (frontend) – base URL for `/events/normalized`.

### GDELT
- `GEOINT_ENABLE_GDELT=true|false`
- `GEOINT_GDELT_QUERY` (default: geopolitical conflict query)
- `GEOINT_GDELT_LIMIT` (default 50)
- `GEOINT_GDELT_REFRESH_MS` (default 120000)

### Reddit
- `GEOINT_ENABLE_REDDIT=true|false`
- `REDDIT_CLIENT_ID`
- `REDDIT_CLIENT_SECRET`
- `REDDIT_USER_AGENT`
- `GEOINT_REDDIT_SUBREDDITS` (comma separated)
- `GEOINT_REDDIT_KEYWORDS` (comma separated; reserved for additional filtering)
- `GEOINT_REDDIT_REFRESH_MS` (default 180000)

### X
- `GEOINT_ENABLE_X=true|false`
- `X_BEARER_TOKEN`
- `GEOINT_X_QUERY`
- `GEOINT_X_MAX_RESULTS`
- `GEOINT_X_REFRESH_MS`

### RSS
- `GEOINT_ENABLE_RSS=true|false`
- `GEOINT_RSS_FEEDS` (comma separated URLs)
- `GEOINT_RSS_REFRESH_MS`

### Anthropic proxy (existing)
- `ANTHROPIC_API_KEY`

## Source health states shown in UI
- `ACTIVE`
- `UNAVAILABLE`
- `RATE LIMITED`
- `AUTH MISSING`
- `ERROR`

The right panel now includes a **LIVE SOURCES** status strip driven by backend `sourceStatuses`.

## Paid/commercial considerations
- **X API** generally requires elevated/paid access for meaningful production throughput.
- **Reddit API** may require approved app configuration and policy compliance.
- **GDELT** is open but has query and operational constraints.
- Some premium news APIs are not implemented in this pass.

## Known limitations
- RSS parser is intentionally lightweight (XML tag extraction); malformed feeds may fail.
- X integration currently uses recent search endpoint (streaming upgrade path is prepared by modular connector architecture).
- Regional extraction quality depends on provider metadata (not all posts/articles include geodata).

## What still needs backend/provider approval
- Production hardening for secrets management (vault/secret manager)
- Provider quota management and retry backoff tuning
- Optional persistence layer for long-term event history
- Enterprise X/Reddit app review and elevated access where needed
