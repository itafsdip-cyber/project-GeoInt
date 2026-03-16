import type { ConfidenceBand, ConfidenceBreakdown, GeolocationPrecision, SourceReference, SourceHealthState } from '../../types/intelligence';

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

function healthScore(health: SourceHealthState) {
  if (health === 'ACTIVE') return 1;
  if (health === 'DEGRADED' || health === 'STALE') return 0.55;
  if (health === 'RATE_LIMITED') return 0.45;
  if (health === 'AUTH_MISSING' || health === 'UNAVAILABLE') return 0.25;
  return 0.4;
}

function precisionScore(precision: GeolocationPrecision) {
  if (precision === 'EXACT') return 1;
  if (precision === 'APPROXIMATE') return 0.65;
  if (precision === 'REGION') return 0.45;
  return 0.3;
}

export function confidenceBandFromScore(score: number): ConfidenceBand {
  if (score >= 0.72) return 'HIGH';
  if (score >= 0.45) return 'MEDIUM';
  return 'LOW';
}

export function buildReliabilityBreakdown(input: {
  sourceReferences: SourceReference[];
  sourceCredibilityBaseline?: number;
  corroborationCount?: number;
  disputedNarratives?: number;
  freshnessHours?: number;
  geolocationPrecision: GeolocationPrecision;
}) {
  const sourceIds = new Set(input.sourceReferences.map((item) => item.sourceId));
  const diversity = sourceIds.size;
  const avgHealth = input.sourceReferences.length
    ? input.sourceReferences.reduce((acc, item) => acc + healthScore(item.health), 0) / input.sourceReferences.length
    : 0.35;

  const freshness = clamp(1 - (input.freshnessHours ?? 24) / 120);
  const sourceType = clamp(0.5 + Math.min(0.35, diversity * 0.08));
  const corroboration = clamp((input.corroborationCount ?? input.sourceReferences.length) / 5);
  const sourceDiversity = clamp(diversity / 4);
  const sourceHealth = clamp(avgHealth);
  const credibilityBaseline = clamp(input.sourceCredibilityBaseline ?? 0.55);
  const narrativeDispute = clamp(1 - Math.min(1, (input.disputedNarratives || 0) / 5));
  const geolocationPrecision = precisionScore(input.geolocationPrecision);

  const breakdown: ConfidenceBreakdown = {
    freshness,
    sourceType,
    corroboration,
    sourceDiversity,
    sourceHealth,
    credibilityBaseline,
    narrativeDispute,
    geolocationPrecision,
  };

  const score = clamp(
    (freshness * 0.13)
    + (sourceType * 0.1)
    + (corroboration * 0.18)
    + (sourceDiversity * 0.12)
    + (sourceHealth * 0.14)
    + (credibilityBaseline * 0.12)
    + (narrativeDispute * 0.1)
    + (geolocationPrecision * 0.11),
  );

  return {
    score,
    band: confidenceBandFromScore(score),
    breakdown,
    caveatText: 'Reliability score supports triage, not certainty. Co-occurrence and narrative repetition are not proof of truth.',
    gapsNote: diversity < 2 ? 'Limited source diversity; corroboration gap remains.' : 'Validate against independent collection for operational actioning.',
  };
}
