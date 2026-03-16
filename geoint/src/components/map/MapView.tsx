import type { Entity, IntelligenceEvent, OverlayTrack } from '../../types/intelligence';
import type { TimelineItem } from '../../services/intelligence/timelineService';
import { incidentLayer } from './layers/incidentLayer';
import { trajectoryLayer } from './layers/trajectoryLayer';
import { overlayTrackLayer } from './layers/overlayTrackLayer';
import { uncertaintyLayer } from './layers/uncertaintyLayer';
import { entityFocusLayer } from './layers/entityFocusLayer';
import { timelineHighlightLayer } from './layers/timelineHighlightLayer';

export default function MapView({
  events,
  overlays,
  selectedEntity,
  timelineSelection = [],
  highlightedRecordIds = [],
}: {
  events: IntelligenceEvent[];
  overlays: OverlayTrack[];
  selectedEntity?: Entity;
  timelineSelection?: TimelineItem[];
  highlightedRecordIds?: string[];
}) {
  const incidents = incidentLayer(events);
  const trajectories = trajectoryLayer(events);
  const tracks = overlayTrackLayer(overlays);
  const uncertain = uncertaintyLayer(events);
  const focused = entityFocusLayer(events, selectedEntity);
  const timelineHighlights = timelineHighlightLayer(timelineSelection, events, overlays);

  return <section style={{ border: '1px solid #1b232f', padding: 8 }}><div style={{ color: '#00e5c8', fontSize: 11 }}>TACTICAL MAP</div><div style={{ fontSize: 11 }}>Incidents {incidents.length} · Trajectories {trajectories.length} · Overlay Tracks {tracks.length} · Uncertainty {uncertain.length} · Entity Focus {focused.length} · Timeline Highlights {timelineHighlights.length} · Analysis Highlights {highlightedRecordIds.length}</div><div style={{ marginTop: 4, fontSize: 9, color: '#8fa2b6' }}>Highlights are visualization only; incidents and overlays remain separate intelligence layers.</div></section>;
}
