import type { GeolocationPrecision, VerificationLevel } from '../../types/intelligence';

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
