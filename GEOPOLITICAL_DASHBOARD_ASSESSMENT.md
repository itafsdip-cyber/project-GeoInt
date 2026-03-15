# geopolitical-dashboard.jsx assessment

## Purpose of the file
`geopolitical-dashboard.jsx` is a standalone, root-level React dashboard component (`GEOINTv7`) that implements a full GEOINT UI shell (header/ticker, Leaflet map, AI analysis panel, monitor tabs, and global search) with large in-file datasets and inline styles.

## Overlap with `geoint/`
There is substantial feature overlap with `geoint/src/App.tsx` (`GEOINTv10`): both files define the same high-level building blocks and data domains (sources, alerts, timeline, ticker, map view, AI analysis behavior, monitor panel, and global search).

`geoint/src/main.jsx` imports `./App.jsx`, and there is no runtime import/reference to `geopolitical-dashboard.jsx` in the active app path, so the root file is currently not part of the `geoint/` build.

## Recommended action
Do **not** delete immediately. Treat `geopolitical-dashboard.jsx` as legacy reference code, then:
1. Archive it to a clearly-labeled location (for provenance), or
2. Remove it in a dedicated cleanup PR once owners confirm no remaining external/manual usage.

No migration into `geoint/` is recommended now because equivalent/expanded functionality already exists in `geoint/src/App.tsx`.

## Risks of removal
- Possible loss of historical UI/reference snapshot (`v7`) used for design comparison.
- Potential undocumented local workflows that open this file directly outside the `geoint/` app.
- If removed without archival, future diff/provenance checks between v7 and v10 become harder.
