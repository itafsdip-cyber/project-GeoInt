import type { Incident, MonitoredRegion, NarrativeCluster, RegionSummary, WatchlistAlert } from '../../types/intelligence';
import type { IntelligenceEvent, OverlayTrack } from '../../types/intelligence';
import { buildReliabilityBreakdown } from './sourceReliabilityService';
import { filterRecordsByRegion } from './geospatialAggregationService';

export function createMonitoredRegion(partial: Partial<MonitoredRegion>): MonitoredRegion {
  const now = new Date().toISOString();
  return {
    id: partial.id || `region-${Date.now()}`,
    name: partial.name || 'Untitled monitored area',
    geometryType: partial.geometryType || 'VIEWPORT',
    bbox: partial.bbox,
    circle: partial.circle,
    polygon: partial.polygon,
    viewport: partial.viewport,
    createdAt: partial.createdAt || now,
    updatedAt: now,
    tags: partial.tags || [],
  };
}

export function summarizeRegion(input: {
  region: MonitoredRegion;
  incidents: Incident[];
  events: IntelligenceEvent[];
  overlays: OverlayTrack[];
  narratives: NarrativeCluster[];
  alerts: WatchlistAlert[];
}): RegionSummary {
  const scopedEvents = filterRecordsByRegion(input.events, input.region);
  const incidentCount = input.incidents.filter((incident) => incident.eventIds.some((id) => scopedEvents.some((evt) => evt.id === id))).length;
  const scopedOverlays = filterRecordsByRegion(input.overlays, input.region);
  const sourceRefs = scopedEvents.flatMap((item) => item.references || []);
  const confidence = buildReliabilityBreakdown({
    sourceReferences: sourceRefs,
    geolocationPrecision: scopedEvents[0]?.geolocationPrecision || 'UNKNOWN',
    corroborationCount: sourceRefs.length,
    freshnessHours: scopedEvents[0] ? ((Date.now() - Date.parse(scopedEvents[0].timestamp)) / 3600000) : 36,
  });

  return {
    regionId: input.region.id,
    incidentCount,
    overlayCount: scopedOverlays.length,
    narrativeActivityCount: input.narratives.filter((narrative) => narrative.eventIds?.some((id) => scopedEvents.some((event) => event.id === id))).length,
    watchlistMatches: input.alerts.filter((alert) => !alert.read).length,
    activeAlerts: input.alerts.filter((alert) => !alert.read && ['HIGH', 'CRITICAL'].includes(alert.severity)).length,
    recentSourceDiversity: new Set(sourceRefs.map((item) => item.sourceId)).size,
    confidenceMix: {
      low: input.incidents.filter((incident) => incident.confidenceBand === 'LOW').length,
      medium: input.incidents.filter((incident) => incident.confidenceBand === 'MEDIUM').length,
      high: input.incidents.filter((incident) => incident.confidenceBand === 'HIGH').length,
    },
    caveatText: 'Region summary is heuristic aggregation only, not prediction. Overlay presence does not equal incident causality.',
    heuristicSummary: `${incidentCount} incidents and ${scopedOverlays.length} overlays observed within monitored area.`,
    lastUpdated: new Date().toISOString(),
    confidenceScore: confidence.score,
    confidenceBand: confidence.band,
    reliabilityBreakdown: confidence.breakdown,
    gapsNote: confidence.gapsNote,
  };
}
