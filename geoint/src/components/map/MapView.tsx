import type { Entity, IntelligenceEvent, OverlayTrack } from '../../types/intelligence';
import { incidentLayer } from './layers/incidentLayer';
import { trajectoryLayer } from './layers/trajectoryLayer';
import { overlayTrackLayer } from './layers/overlayTrackLayer';
import { uncertaintyLayer } from './layers/uncertaintyLayer';
import { entityFocusLayer } from './layers/entityFocusLayer';

export default function MapView({ events, overlays, selectedEntity }: { events: IntelligenceEvent[]; overlays: OverlayTrack[]; selectedEntity?: Entity }) {
  const incidents = incidentLayer(events);
  const trajectories = trajectoryLayer(events);
  const tracks = overlayTrackLayer(overlays);
  const uncertain = uncertaintyLayer(events);
  const focused = entityFocusLayer(events, selectedEntity);

  return <section style={{ border: '1px solid #1b232f', padding: 8 }}><div style={{ color: '#00e5c8', fontSize: 11 }}>TACTICAL MAP</div><div style={{ fontSize: 11 }}>Incidents {incidents.length} · Trajectories {trajectories.length} · Overlay Tracks {tracks.length} · Uncertainty {uncertain.length} · Entity Focus {focused.length}</div></section>;
}
