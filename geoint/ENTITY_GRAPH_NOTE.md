# Entity graph note

## Architecture
- `entityGraphService` extracts actor candidates from event text and builds nodes/edges for actor→incident, actor→region, actor→actor, actor→category, source→incident.
- Co-involvement strength is computed from shared incident links.

## Heuristics and limitations
- Actor extraction is keyword/token based; false positives are possible.
- Edge weights reflect co-occurrence, not confirmed command relationships.
