# Geolocation and clustering note

## Exact vs inferred location handling

The normalized event pipeline now applies a dedicated geolocation enrichment pass (`src/services/data/geolocation.js`) before OSINT scoring.

- **Exact/direct coordinates**
  - If a provider supplies valid numeric latitude/longitude, they are preserved.
  - Precision defaults to `exact` unless metadata marks it as coarse (`city`, `region`, `country`).
  - Source is marked `provider_coordinates`.
- **Inferred coarse location**
  - If no direct coordinates are present, the app infers coarse location from title/region/detail text using a constrained lookup table focused on known theaters.
  - Inferred points are tagged with:
    - `geolocationSource: text_inference`
    - `geolocationPrecision: city | region | country`
    - lower `locationConfidence`
- **Unknown location**
  - If neither coordinates nor a safe lookup match exist, coordinates remain `null` and precision is `unknown`.
  - No synthetic precise point is invented.

## Current clustering behavior

Map event clustering (`src/services/data/mapClustering.js`) is zoom-aware and grid based:

- Bucketing radius decreases as zoom increases.
- Each bucket forms one map item:
  - `count > 1` renders as a **cluster marker** with count.
  - `count = 1` renders as an individual event marker.
- Cluster summary tracks:
  - count
  - centroid
  - unique sources
  - average location confidence

This is recalculated when filtered events change (timeframe/live refresh) and on map zoom changes.

## Visualization confidence rules

- High-confidence event points render smaller/stronger.
- Approximate points render softer.
- Approximate points may include a subtle uncertainty ring based on precision:
  - city: ~18 km
  - region: ~55 km
  - country: ~110 km

## Limitations

- Inference is intentionally conservative and lookup-based; it does not perform full geocoding.
- Grid clustering is tactical and lightweight but not geodesic-distance optimal.
- Provider coordinate precision quality still depends on upstream metadata quality.

## What is needed for stronger geocoding later

- Add a vetted geocoding service (e.g., Pelias/Nominatim/Mapbox) with confidence and provenance retention.
- Persist disambiguation metadata (matched phrase, admin level, alt candidates).
- Add region polygons or gazetteer-backed area centroids for non-point incidents.
- Include per-source geolocation reliability calibration over time.


## Trajectory derivation (missile/drone/projectile)
- Trajectories are generated only when enough geospatial signal exists (`api/trajectory.cjs`).
- **Exact trajectory:** requires source-backed launch + impact coordinates.
- **Approximate trajectory:** derived from region/theater geospatial hints; rendered with explicit low precision + uncertainty metadata.
- Precision/confidence labels are shown in map details (`exact` vs `approximate`, confidence %, uncertainty km).
- The system never fabricates exact launch/impact data when unavailable.
