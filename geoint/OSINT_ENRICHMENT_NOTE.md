# OSINT Enrichment Layer (Heuristic v1)

This app now adds a lightweight OSINT enrichment pass over normalized events.

## What is heuristic today

The current enrichment is intentionally heuristic and conservative:

- **Provider category inference** from known connector/provider names (official, news, rss, social, open-source, unknown).
- **Source reliability score** uses a static provider-category baseline.
- **Verification status** only reports `VERIFIED` when the base event is already verified by upstream data.
  - Otherwise, status remains `UNVERIFIED`.
  - For isolated social-only reports, it may be marked `DISPUTED`.
- **Confidence score** is a weighted heuristic based on provider reliability, source count, coordinate presence, and clustering proximity.
- **Location confidence** is estimated from coordinate availability and source category quality.
- **Actor/narrative tags** are extracted using simple keyword/tag matching.

Any non-verified assessment is explicitly displayed as **heuristic** in UI.

## Cross-source confirmation today

Cross-source confirmation is implemented through simple incident clustering:

- Events are grouped when they are close in time (<= 8 hours) and either:
  - title token similarity is sufficiently high, or
  - region text is compatible.
- Each cluster gets a `duplicateClusterId`.
- `crossSourceCount` is the number of distinct sources in the cluster.
- `firstSeenAt` uses the earliest timestamp in cluster.
- `lastUpdatedAt` comes from feed generation time.

This is a pragmatic, low-risk approach designed for tactical awareness.

## What is needed for stronger real-world verification

To move from heuristic OSINT to stronger verification, a production system would need:

- Durable event history storage (not just current in-memory feed) for longitudinal confidence updates.
- Source identity and trust graph management (per-account/per-publication provenance).
- Rich dedupe/correlation beyond keywords (entity extraction, geocoding normalization, media hash correlation).
- Human analyst workflow for adjudication and dispute resolution.
- Explicit confidence calibration and backtesting against known truth datasets.
- External verification integrations (official advisories, trusted wire APIs, geospatial imagery, AIS/ADS-B feeds where lawful).

## Current limitations

- Clustering can under- or over-group in edge cases (similar headlines, sparse metadata).
- No persistent cross-cycle memory; confidence is computed per feed snapshot.
- Narrative/actor tags are keyword-driven and may miss nuance.
- Verification remains bounded by upstream truth signals; no claim-level fact engine is implemented.
