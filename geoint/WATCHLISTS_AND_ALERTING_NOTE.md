# Watchlists and Heuristic Alerting (Current State)

## Implemented heuristic logic

The current upgrade adds a frontend-safe watchlist model and heuristic alerting layer that sits on top of the existing normalized event + OSINT enrichment flow.

### Watchlist matching

Watchlist items currently support:
- `region`
- `actor`
- `topic`
- `source`

Matching is intentionally simple and deterministic:
- Region watch: compares against event `region` and `title`.
- Source watch: compares against normalized event `source`.
- Actor watch: searches event title/detail/region plus OSINT actor and narrative tags.
- Topic watch: compares against event `type`, `category`, and textual fields.

All matching is case-insensitive substring logic. There is no ML classification and no confidence score inflation.

### Alert determination

Heuristic alert tags are derived per event:
- `NEW`: event timestamp within a short recent window (fraction of selected timeframe).
- `MULTI-SOURCE`: OSINT cross-source count > 1.
- `HIGH SEVERITY`: normalized severity is `high` or `critical`.
- `WATCHLIST MATCH`: event matches one or more active watchlist items.

Additionally, `SPIKE` alerts are region-level signals where recent half-window event volume is materially higher than the preceding half-window.

## Limitations

- Watchlists are currently in-memory UI state only (not persisted).
- Matching is substring-based and can produce false positives/negatives.
- Spike logic is a simple windowed count heuristic, not a statistically robust anomaly detector.
- Alert tags indicate heuristic signals only; they are not verification claims.

## Path to persistent user profiles / notifications

To support durable watchlists and notifications later, the app would need:

1. **User identity/profile layer**
   - Authentication and per-user watchlist ownership.

2. **Persistence store**
   - API + database tables for watchlists, alert preferences, mute/snooze state, and delivery channels.

3. **Alert state lifecycle**
   - Server-side deduplication, acknowledgment/read state, and escalation windows.

4. **Notification delivery**
   - Email/SMS/push/webhooks with rate limits, quiet hours, and regional/legal constraints.

5. **Evaluation/quality loop**
   - Precision/recall tracking for heuristic alerts and tunable threshold management.
