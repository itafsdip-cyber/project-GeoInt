import type { IntelligenceEvent, MonitoredRegion, OverlayTrack } from '../../../types/intelligence';
import { buildHeatSignals } from '../../../services/intelligence/geospatialAggregationService';

export function heatSignalLayer(input: { events: IntelligenceEvent[]; overlays: OverlayTrack[]; region?: MonitoredRegion }) {
  return buildHeatSignals({ ...input, byCategory: true }).map((bin) => ({
    ...bin,
    caveat: 'Heat cells are visualization aids only and do not establish causality.',
  }));
}
