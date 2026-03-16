# Watchlists and alert subscriptions

## Implemented now
- Added expanded watchlist item model (`region`, `country`, `actor`, `category`, `keyword`, `source`, `provider`).
- Watchlist matching now runs against both normalized events and detected incidents.
- Alert stream now surfaces compact tags for `WATCHLIST MATCH`, `NEW INCIDENT`, `MULTI-SOURCE`, `HIGH SEVERITY`, and `CRITICAL`.
- Alert summaries and watchlist counters are derived from timeframe-filtered data (1H/6H/12H/24H/7D).
- Alert pills can route to incident map focus via existing incident focus flow.

## Heuristic behavior
- Watchlist matching is text-driven and substring based.
- New incident alerting is heuristic and based on event freshness and detected incident recency.

## Limitations
- No backend subscription delivery channel (email/SMS/webhook) yet.
- Matching is lexical, not semantic/NLP-expanded.
- Event-level alert click-through currently prioritizes incident linkage.

## Future production upgrades
- Add backend watchlist storage and per-user alert subscription endpoints.
- Add server push notification channels and delivery preferences.
- Add semantic entity resolution for actor/region aliases.
