import type { Incident, IntelligenceEvent, NarrativeCluster, OverlayTrack } from '../../types/intelligence';
import { refineConfidence } from './confidenceService';

function distanceKm(a: IntelligenceEvent, b: IntelligenceEvent) {
  if (a.latitude == null || a.longitude == null || b.latitude == null || b.longitude == null) return Number.MAX_SAFE_INTEGER;
  const r = 6371;
  const dLat = (b.latitude - a.latitude) * (Math.PI / 180);
  const dLon = (b.longitude - a.longitude) * (Math.PI / 180);
  const lat1 = a.latitude * (Math.PI / 180);
  const lat2 = b.latitude * (Math.PI / 180);
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * r * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function buildFusedIncidents(input: { events: IntelligenceEvent[]; existingIncidents?: Incident[]; narratives?: NarrativeCluster[]; overlays?: OverlayTrack[] }): Incident[] {
  const clusters: IntelligenceEvent[][] = [];
  for (const event of input.events.slice(0, 200)) {
    const existing = clusters.find((cluster) => {
      const head = cluster[0];
      const categoryMatch = (head.category || 'general') === (event.category || 'general');
      const withinWindow = Math.abs(Date.parse(head.timestamp) - Date.parse(event.timestamp)) <= (2 * 60 * 60 * 1000);
      const nearDuplicateGeo = distanceKm(head, event) < 40;
      return categoryMatch && withinWindow && (nearDuplicateGeo || head.region === event.region);
    });
    if (existing) existing.push(event); else clusters.push([event]);
  }

  return clusters.map((cluster, idx) => {
    const ordered = [...cluster].sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
    const first = ordered[0];
    const last = ordered[ordered.length - 1];
    const allRefs = ordered.flatMap((item) => item.references || []);
    const confidence = refineConfidence({
      verificationLevel: first.verificationLevel,
      geolocationPrecision: first.geolocationPrecision,
      references: allRefs,
      corroborationCount: allRefs.length,
      freshnessHours: (Date.now() - Date.parse(last.timestamp)) / 3600000,
    });
    const linkedOverlayIds = (input.overlays || [])
      .filter((overlay) => ordered.some((event) => event.region && overlay.label.toLowerCase().includes(event.region.toLowerCase())))
      .map((item) => item.trackId);

    return {
      incidentId: input.existingIncidents?.[idx]?.incidentId || `incident-${first.id}`,
      title: first.title,
      summary: first.summary || 'Fused incident cluster from near-duplicate event reports.',
      category: first.category || 'GENERAL',
      createdAt: input.existingIncidents?.[idx]?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      firstSeen: first.timestamp,
      lastSeen: last.timestamp,
      lifecycleState: input.existingIncidents?.[idx]?.lifecycleState || 'NEW',
      eventIds: ordered.map((item) => item.id),
      linkedEventIds: ordered.map((item) => item.id),
      linkedEntityIds: ordered.flatMap((item) => (item.actors || []).map((actor) => actor.actorId)),
      linkedNarrativeIds: (input.narratives || []).filter((n) => ordered.some((e) => n.eventIds?.includes(e.id))).map((n) => n.narrativeId),
      linkedOverlayIds,
      analystPriority: 'MEDIUM',
      escalationReason: ordered.length > 3 ? 'Multiple corroborating events in short window' : undefined,
      regionTags: [...new Set(ordered.map((item) => item.region).filter(Boolean) as string[])],
      verificationLevel: first.verificationLevel,
      sourceCount: new Set(allRefs.map((item) => item.sourceId)).size,
      confidenceScore: confidence.confidenceScore,
      confidenceBand: confidence.confidenceBand,
      caveatText: `${confidence.caveatText} Fusion retains provenance from linked event IDs.`,
      reliabilityBreakdown: confidence.reliabilityBreakdown,
      gapsNote: confidence.gapsNote,
      fusionRationale: [
        'Clustered by time proximity, category similarity, and near-duplicate geospatial context.',
        'Original records retained via linkedEventIds; merge does not erase provenance.',
        'Approximate/inferred geographies remain labeled through source event precision.',
      ],
      mergeHistory: ordered.slice(1).map((item) => ({ mergedIncidentId: item.id, mergedAt: new Date().toISOString(), rationale: 'Near-duplicate cluster merge preserving source provenance.' })),
      confidenceNote: confidence.caveatText,
      intelligenceGaps: [confidence.gapsNote],
      region: first.region,
      primaryCategory: first.category,
      sourceSet: [...new Set(allRefs.map((item) => item.sourceName))],
      involvedActors: ordered.flatMap((item) => (item.actors || []).map((actor) => actor.label)),
      categories: [...new Set(ordered.map((item) => item.category).filter(Boolean) as string[])],
    };
  });
}
