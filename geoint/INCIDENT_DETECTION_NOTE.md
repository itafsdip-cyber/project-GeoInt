# Incident Detection and Alert Engine

## Overview
The dashboard now includes an automated incident detection layer that evaluates normalized events and generates compact incident cards for analysts.

The detector is implemented in:
- `src/services/intelligence/incidentDetectionService.js`

The UI integration is in:
- `src/App.tsx` (incident panel + map focus behavior)

## Detection heuristics
The detector scans recent normalized events and combines multiple heuristic families:

1. **Regional burst detection**
   - Groups events by region.
   - Looks for at least 3 events in a 2-hour window.
   - Requires at least 2 distinct sources.

2. **Category spike detection**
   - Tracks per-category event velocity (e.g., missile, drone, naval, cyber categories).
   - Compares recent 90-minute volume to the prior 90-minute baseline.
   - Flags spikes where recent activity clearly exceeds baseline.

3. **Escalation pattern detection**
   - Evaluates 6-hour windows.
   - Looks for multi-actor, multi-event chains with higher-severity signals.
   - Targets actor-linked escalatory behavior in the same region.

## Incident model
Each detected incident contains:

- `incidentId`
- `title`
- `region`
- `involvedActors`
- `eventCount`
- `sourceCount`
- `severity`
- `severityScore`
- `firstSeen`
- `lastUpdated`
- `eventIds`
- `categories`
- `rationale`
- `mapClusterId`

## Severity logic
Severity score is a bounded 0–100 score that blends:

- event volume pressure
- source count pressure
- actor breadth
- source reliability (`osint.sourceReliability`)
- confidence (`osint.confidenceScore`)
- multi-source confirmation (`osint.crossSourceCount`)
- verified signal boost (`osint.verificationStatus === "verified"`)
- event-type weighting (missile/drone/naval/cyber/ballistic/etc.)
- escalation/spike rationale boosts

Mapped levels:
- `LOW`
- `MEDIUM`
- `HIGH`
- `CRITICAL`

## OSINT integration
The detector consumes existing enrichment fields directly and does not invent verification:

- `crossSourceCount`
- `verificationStatus`
- `confidenceScore`
- `sourceReliability`
- `actorTags`
- `duplicateClusterId`

## UI behavior
1. **Incident panel**
   - Compact cards with tactical badges.
   - Displays title, region, severity, source count, event count, score, and time window.

2. **Quick map jump**
   - Clicking an incident card focuses the map on related event coordinates.
   - Related events are highlighted with red rings.

## Limitations
- Heuristics are deterministic and threshold-based; they can miss weak-signal incidents.
- Category spike logic is sensitive to sparse datasets.
- Escalation detection currently uses lightweight actor-tag correlations.
- No persistent incident lifecycle storage yet (resolved/acknowledged state is not tracked).

## Future improvements
- Add temporal smoothing and adaptive baselines by region/category.
- Add incident lifecycle states (new, active, cooling, resolved).
- Add analyst feedback loops to tune false-positive rates.
- Introduce correlation across timeline + trajectories + alerts for richer incident context.
- Add server-side incident computation for shared team state and audit trail.
