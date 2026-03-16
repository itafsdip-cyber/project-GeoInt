import type { IntelligenceEvent, OverlayTrack } from '../../../types/intelligence';
import type { TimelineItem } from '../../../services/intelligence/timelineService';

export interface TimelineMapHighlight {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  type: TimelineItem['type'];
}

export function timelineHighlightLayer(items: TimelineItem[], events: IntelligenceEvent[], overlays: OverlayTrack[]): TimelineMapHighlight[] {
  return items
    .slice(0, 20)
    .map((item) => {
      if (typeof item.latitude === 'number' && typeof item.longitude === 'number') {
        return { id: item.id, latitude: item.latitude, longitude: item.longitude, label: item.summary, type: item.type };
      }
      const linkedEvent = events.find((event) => item.linkedIds.includes(event.id) && typeof event.latitude === 'number' && typeof event.longitude === 'number');
      if (linkedEvent) {
        return { id: item.id, latitude: linkedEvent.latitude as number, longitude: linkedEvent.longitude as number, label: item.summary, type: item.type };
      }
      const linkedOverlay = overlays.find((track) => item.linkedIds.includes(track.trackId));
      if (linkedOverlay) {
        return { id: item.id, latitude: linkedOverlay.latitude, longitude: linkedOverlay.longitude, label: item.summary, type: item.type };
      }
      return null;
    })
    .filter((item): item is TimelineMapHighlight => Boolean(item));
}
