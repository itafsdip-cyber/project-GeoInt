# Maritime and air overlay note

## Architecture
- Overlay controls toggle vessel and aircraft sample feeds.
- Overlay points are merged into the map event stream with explicit `metadata.overlay` tags.

## Credential requirements
- Sample mode requires no credentials.
- Production connectors should use AIS/ADS-B providers and provider-specific API keys.
