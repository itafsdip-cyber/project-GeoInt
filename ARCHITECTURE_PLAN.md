# GEOINT Architecture Plan

## 1) Current `geoint/` Architecture (as-is)

The app currently works, but most logic is centralized in a single large UI file:

- `geoint/src/App.tsx` is a monolithic file containing map rendering, live ticker, AI panel, chat room, right-side monitor, search UI, static seed data, and helper utilities.
- `geoint/src/main.jsx` bootstraps React and mounts `App`.
- AI/proxy access exists in two patterns:
  - local Node proxy: `geoint/proxy-server.cjs`
  - serverless handler style: `geoint/api/anthropic.js`
- `geoint/vite.config.js` also includes a dev proxy rule for Anthropic.

Implication: concerns are mixed (UI + domain data + analysis prompts + transport details), which makes ingestion pipelines and AI analysis hard to evolve safely.

---

## 2) Where External Data Ingestion and AI Analysis Should Live

### Data ingestion
Place ingestion in a backend/server-side layer, **not** in React components.

- Recommended home: `geoint/server/ingestion/`
- Ingestion responsibilities:
  - connector clients (RSS/news APIs/event feeds)
  - polling/scheduling and retries
  - normalization into shared geopolitics event models
  - deduplication, source scoring, and persistence handoff

### AI analysis
Place AI analysis in a dedicated backend domain module that consumes normalized events.

- Recommended home: `geoint/server/ai/`
- Analysis responsibilities:
  - prompt templates and model routing
  - context assembly from normalized data
  - output validation/guardrails
  - generating structured outputs for UI (alerts, risk scores, summaries)

React should only call internal API endpoints and render typed view models.

---

## 3) Proposed Clean Module Structure Inside `geoint/`

```text
geoint/
  src/
    app/
      AppShell.tsx
      routes/
    features/
      dashboard/
        components/
        hooks/
        services/          # front-end API clients only
      map/
        components/
        layers/
        hooks/
      analysis/
        components/
        hooks/
    entities/
      geopolitics/
        model.ts           # shared TS interfaces for events, actors, incidents
        mappers.ts         # UI mapping helpers
    shared/
      ui/
      lib/
      config/

  server/
    index.ts               # server bootstrap (or api entrypoint wiring)
    api/
      routes/
        ingest.routes.ts
        analysis.routes.ts
        map.routes.ts
      controllers/
    ingestion/
      connectors/
        news/
        feeds/
        events/
      pipelines/
        normalize.ts
        dedupe.ts
        enrich.ts
      scheduler/
      repository/
    ai/
      providers/
        anthropic.client.ts
        openai.client.ts   # optional future provider
      prompts/
      chains/
      validators/
      analysis.service.ts
    domain/
      geopolitics/
        models.ts          # canonical server-side domain models
        enums.ts
        scoring.ts
    map/
      tiles/
      geojson/
      map.service.ts
    shared/
      logging/
      http/
      cache/
      observability/

  api/
    anthropic.js           # transitional compatibility (can be deprecated later)

  proxy-server.cjs         # transitional local proxy (replace with server/index.ts over time)
```

---

## 4) Responsibilities by Module

- **`server/ingestion`**: pull external sources, normalize raw records, dedupe repeated reports, compute initial source metadata.
- **`server/domain/geopolitics`**: canonical schema for countries, actors, incidents, maritime events, escalation indices, confidence scores.
- **`server/ai`**: consume domain entities and generate structured analytic outputs (briefs, risk deltas, scenario probabilities, recommended watch items).
- **`server/map`**: transform domain events into map-friendly payloads (GeoJSON features, trajectory segments, heat layers).
- **`src/features/map`**: presentational/interaction logic only (layers, filters, legends, selection state).
- **`src/features/analysis`**: render analysis cards and chat/briefing UIs from backend responses.

---

## 5) Proxy Server Integration with AI APIs

Use the proxy as a strict backend gateway, not a pass-through from browser to external LLM APIs.

### Recommended integration pattern
1. Browser calls internal endpoint (e.g., `/api/analysis/run`).
2. Route handler invokes `server/ai/analysis.service.ts`.
3. Service selects provider client (`anthropic.client.ts`) and injects API key from env.
4. Provider response is validated and transformed into a typed analysis DTO.
5. DTO is returned to UI; raw provider payload is not exposed directly.

### Required controls
- keep API keys server-side only
- enforce request schema validation and output shape validation
- add request IDs, rate limiting, timeout/retry policy, and audit logs
- centralize model/version config in `server/shared/config`
- disable direct browser access headers in production

### Migration note
- Keep `proxy-server.cjs`/`api/anthropic.js` as compatibility layer temporarily.
- Incrementally move logic into `server/ai` + internal routes, then retire duplicate proxy paths.

---

## 6) Implementation Sequencing (recommended)

1. Extract domain models (`server/domain/geopolitics` and `src/entities/geopolitics`).
2. Move AI calls from UI/proxy fragments into `server/ai` service.
3. Add ingestion connectors + normalization pipeline.
4. Refactor `App.tsx` into feature modules (`map`, `analysis`, `dashboard`).
5. Add map data endpoint backed by normalized/domain data.
6. Remove legacy direct proxy patterns after parity checks.

This sequence reduces risk while preserving the current working dashboard behavior.
