# OSINT Verification Evolution Note

Current implementation adds a tactical OSINT enrichment layer for normalized events using **honest placeholders**:
- Verification labels are derived from existing event verification plus source-type and cross-source count heuristics.
- No claim is marked as independently verified unless that status already exists in incoming data.
- `MULTI-SOURCE` reflects corroboration count, not forensic validation.

## How real verification should evolve

1. **Claim graph + entity resolution**
   - Convert event text into structured claims (who/what/where/when).
   - Resolve entities and geos against canonical registries.

2. **Evidence ledger per claim**
   - Store per-source evidence with timestamp, media hash, and extraction confidence.
   - Preserve provenance chain from connector -> parser -> normalized event.

3. **Weighted source model**
   - Maintain dynamic reliability per source and per topic domain.
   - Downweight known amplification loops and bot-prone channels.

4. **Geo/temporal validation**
   - Verify location with geocoding + reverse checks + optional imagery metadata.
   - Enforce temporal consistency windows across independent reports.

5. **Analyst workflow**
   - Add explicit analyst verdicts (`verified`, `disputed`, `retracted`) with audit trail.
   - Capture rationale, links, and signed reviewer identity.

6. **Score explainability**
   - Expose confidence sub-scores (source, corroboration, location, recency).
   - Show why a label was assigned and what evidence is missing.

## Credibility refinement update
- Added explicit credibility layer fields in OSINT payload: `sourceReliability`, `credibilityTier`, `verificationSignalStrength`, `corroborationLevel`, `timestampQuality`, and `cautionFlags`.
- Scores remain heuristic and should not be interpreted as hard verification.
