import type { GeolocationPrecision, VerificationLevel } from '../../types/intelligence';
import { buildReliabilityBreakdown } from './sourceReliabilityService';

export function buildConfidenceSummary(input: {
  verificationLevel: VerificationLevel;
  sourceCount: number;
  geolocationPrecision: GeolocationPrecision;
  uncertaintyRadiusKm?: number;
  trajectoryConfidence?: number;
  inferred?: boolean;
}) {
  const caveats = [] as string[];
  if (input.verificationLevel !== 'VERIFIED') caveats.push(`${input.verificationLevel.toLowerCase()} data`);
  if (input.sourceCount < 2) caveats.push('single-source reporting');
  if (input.geolocationPrecision !== 'EXACT') caveats.push(`geolocation ${input.geolocationPrecision.toLowerCase()}`);
  if (input.inferred) caveats.push('trajectory is inferred and approximate');
  return {
    label: `${input.verificationLevel} · ${input.sourceCount} sources`,
    caveat: caveats.join(' | ') || 'No major caveats noted',
    uncertaintyRadiusKm: input.uncertaintyRadiusKm ?? null,
    trajectoryConfidence: input.trajectoryConfidence ?? null,
  };
}

export function refineConfidence(input: {
  verificationLevel: VerificationLevel;
  geolocationPrecision: GeolocationPrecision;
  references: Array<{ sourceId: string; sourceName: string; collectedAt: string; health: any }>;
  freshnessHours?: number;
  corroborationCount?: number;
  disputedNarratives?: number;
}) {
  const reliability = buildReliabilityBreakdown({
    sourceReferences: input.references,
    geolocationPrecision: input.geolocationPrecision,
    freshnessHours: input.freshnessHours,
    corroborationCount: input.corroborationCount,
    disputedNarratives: input.disputedNarratives,
  });
  const verificationModifier = input.verificationLevel === 'VERIFIED' ? 0.08 : input.verificationLevel === 'HEURISTIC' ? 0 : -0.08;
  const score = Math.max(0, Math.min(1, reliability.score + verificationModifier));
  return {
    confidenceScore: score,
    confidenceBand: reliability.band,
    caveatText: `${reliability.caveatText} Verification level: ${input.verificationLevel}.`,
    reliabilityBreakdown: reliability.breakdown,
    gapsNote: reliability.gapsNote,
  };
}
