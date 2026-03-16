# Narrative tracking note

## Architecture
- `narrativeService` tokenizes event text, groups repeated keywords, and outputs narrative clusters.
- Narrative objects include IDs, keyword sets, source count, first/last seen, and credibility indicators.

## Heuristics and limitations
- Narrative clusters are heuristic and should not be treated as attribution proof.
- "Suspicious amplification" flags represent statistical patterns, not certainty.
