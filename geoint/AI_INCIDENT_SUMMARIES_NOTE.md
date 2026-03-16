# AI incident summaries

## Implemented now
- Added incident summary service with graceful fallback.
- Summary generation attempts backend AI via existing proxy endpoint.
- If AI is unavailable or invalid, system returns a labeled heuristic summary.
- UI labels include `AI SUMMARY` or `HEURISTIC SUMMARY` and `GENERATED WITH AVAILABLE DATA` caveat.

## Heuristic behavior
- Heuristic summaries derive from incident metadata (actors/categories/source count).
- Corroboration notes are operational hints, not verification claims.

## Limitations
- No server-side summary caching or audit trail yet.
- AI output schema validation is basic.
- Summaries are concise by design and may omit nuanced context.

## Future production upgrades
- Add server-side cache/versioning of generated summaries.
- Add analyst feedback loop and quality scoring.
- Add structured prompt templates per incident archetype.
