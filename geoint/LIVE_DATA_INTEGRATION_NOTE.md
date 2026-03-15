# GEOINT Data Reality & Live-Feed Readiness Note

## Current data mode
The dashboard currently operates on **demo/mock scenario datasets** embedded in `src/App.tsx` (alerts, events, trajectories, ticker, and live chat simulation). No external verified live event feed is wired for map/projectile telemetry at this time.

## What was prepared in this pass
- Added a small adapter boundary in UI logic:
  - `withDemoTimestamps(...)` enriches scenario rows with stable `occurredAt` and `dataMode` metadata.
  - `filterByTimeRange(...)` applies shared timeframe filtering (1H/6H/12H/24H/7D).
- Wired the new timeframe controls into map trajectories and event/monitor panels so one control path can later be reused by a real ingestion service.
- Added explicit UI disclosure (`DATA MODE: DEMO SNAPSHOT · LIVE-READY ADAPTER`) to avoid implying fake data is real-time.

## Backend/data work still required for true live operation
1. Add server-side ingestion pipeline(s) for trusted sources (official alerts, AIS/maritime, aviation NOTAM, etc.).
2. Normalize to canonical event schema (id, occurredAt, region, type, confidence, source provenance).
3. Expose API endpoints / streaming channel consumed by the frontend.
4. Add source-level confidence scoring and dedup logic.
5. Add replay/testing fixtures to validate timeline correctness.

## Integration target
The frontend can replace current in-memory arrays with API responses while keeping the same time-range filtering contract (`occurredAt` + event type fields).
