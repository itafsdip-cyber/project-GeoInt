import { useMemo } from 'react';
import type { Entity, IntelligenceEvent, MonitoredRegion, OverlayTrack } from '../../types/intelligence';
import type { TimelineItem } from '../../services/intelligence/timelineService';
import { incidentLayer } from './layers/incidentLayer';
import { trajectoryLayer } from './layers/trajectoryLayer';
import { overlayTrackLayer } from './layers/overlayTrackLayer';
import { uncertaintyLayer } from './layers/uncertaintyLayer';
import { entityFocusLayer } from './layers/entityFocusLayer';
import { timelineHighlightLayer } from './layers/timelineHighlightLayer';
import { watchAreaLayer } from './layers/watchAreaLayer';
import { heatSignalLayer } from './layers/heatSignalLayer';

export default function MapView({
  events,
  overlays,
  selectedEntity,
  timelineSelection = [],
  highlightedRecordIds = [],
  watchAreas = [],
  heatRegion,
}: {
  events: IntelligenceEvent[];
  overlays: OverlayTrack[];
  selectedEntity?: Entity;
  timelineSelection?: TimelineItem[];
  highlightedRecordIds?: string[];
  watchAreas?: MonitoredRegion[];
  heatRegion?: MonitoredRegion;
}) {
  const incidents = useMemo(() => incidentLayer(events), [events]);
  const trajectories = useMemo(() => trajectoryLayer(events), [events]);
  const tracks = useMemo(() => overlayTrackLayer(overlays), [overlays]);
  const uncertain = useMemo(() => uncertaintyLayer(events), [events]);
  const focused = useMemo(() => entityFocusLayer(events, selectedEntity), [events, selectedEntity]);
  const timelineHighlights = useMemo(
    () => timelineHighlightLayer(timelineSelection, events, overlays),
    [timelineSelection, events, overlays],
  );
  const watchAreasView = useMemo(() => watchAreaLayer(watchAreas), [watchAreas]);
  const heatSignals = useMemo(() => heatSignalLayer({ events, overlays, region: heatRegion }), [events, overlays, heatRegion]);

  return (
    <section style={{ border: '1px solid #1b232f', padding: 8 }}>
      <div style={{ color: '#00e5c8', fontSize: 11 }}>TACTICAL MAP</div>
      <div style={{ fontSize: 11 }}>
        Incidents {incidents.length} · Trajectories {trajectories.length} · Overlay Tracks {tracks.length} · Uncertainty {uncertain.length} · Entity Focus {focused.length} · Timeline Highlights {timelineHighlights.length} · Watch Areas {watchAreasView.length} · Heat Signals {heatSignals.length} · Analysis Highlights {highlightedRecordIds.length}
      </div>
      <div style={{ marginTop: 4, fontSize: 9, color: '#8fa2b6' }}>
        Highlights are visualization only; incidents and overlays remain separate intelligence layers. Heat monitoring is not causality.
      </div>
    </section>
  );
}
