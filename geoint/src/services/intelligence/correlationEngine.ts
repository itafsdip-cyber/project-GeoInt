import type { CorrelationCandidate, Incident, NarrativeCluster, OverlayTrack } from '../../types/intelligence';
import { scoreCorrelation } from './correlationScoring';

function normalize(value: number, max: number) {
  return Math.max(0, Math.min(1, value / Math.max(max, 1)));
}

export function buildCorrelationCandidates({ incidents = [], narratives = [], overlays = [] }: {
  incidents: Incident[];
  narratives: NarrativeCluster[];
  overlays: OverlayTrack[];
}): CorrelationCandidate[] {
  const candidates: CorrelationCandidate[] = [];

  incidents.forEach((incident, index) => {
    const narrative = narratives[index % Math.max(1, narratives.length)];
    if (!narrative) return;
    const overlayMatchCount = overlays.filter((track) => (incident.region || '').toLowerCase().includes(track.label.toLowerCase()) || track.type === 'FIRE').length;
    const factors = {
      timeProximity: normalize(8 - index, 8),
      locationProximity: normalize(overlayMatchCount + 1, 4),
      sharedEntities: normalize((incident.involvedActors || []).length, 4),
      sharedNarratives: normalize(1, 1),
      sourceOverlap: normalize((incident.sourceSet || []).length, 4),
      categorySimilarity: normalize((incident.categories || []).length, 3),
      overlayProximity: normalize(overlayMatchCount, 5),
      repeatedMentions: normalize(narrative.sourceCount, 8),
    };
    const score = scoreCorrelation(factors);
    candidates.push({
      id: `corr-${incident.incidentId}-${narrative.narrativeId}`,
      correlationType: 'INCIDENT_NARRATIVE_OVERLAY',
      score: score.total,
      rationale: [
        'Temporal proximity and source overlap increased candidate score.',
        'Shared actors/narrative references indicate potential relationship.',
      ],
      caveat: 'Candidate correlation only. This is not confirmed causality or attribution.',
      linkedRecordIds: [incident.incidentId, narrative.narrativeId],
      breakdown: score.weighted,
    });
  });

  return candidates.sort((a, b) => b.score - a.score).slice(0, 25);
}
