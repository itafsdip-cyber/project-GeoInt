# Trend Analytics Technical Note

## Implemented now
- Added local persistent history store for normalized events + detected incidents.
- Trend windows compare current vs immediately previous equivalent window:
  - 1H vs previous 1H
  - 6H vs previous 6H
  - 24H vs previous 24H
  - 7D vs previous 7D
- Computed trend outputs:
  - event volume delta
  - incident volume delta
  - rising categories
  - rising regions
  - rising actors
  - top active sources/providers
  - watchlist-aware spikes/flags

## Trend indicators
The UI uses compact non-overclaiming labels:
- `UP`
- `DOWN`
- `FLAT`
- `SPIKE`
- `NEW`

These are deterministic heuristics and not inferential statistics.

## Watchlist integration
- Trend dimensions (`region`, `category`, `actor`) are matched against active watchlist terms.
- Upward, spike, and new activity linked to watched entities is surfaced in the trend summary area.

## Persistence behavior
- History is deduplicated by identity/fingerprint.
- History is bounded by retention and max-record caps for browser safety.
- Snapshot timestamps are retained for trend slicing.

## Limitations
- Browser-local only; not cross-device or backend-authoritative.
- No confidence intervals, anomaly baselines, or seasonality models.
- Source trend is count-based and can reflect feed-rate artifacts.

## Future backend evolution
1. Move history to backend time-series/event storage.
2. Add richer aggregations and arbitrary lookback query APIs.
3. Add model-based anomaly scoring with explicit uncertainty reporting.
4. Add per-tenant historical partitions and analyst audit trail.
