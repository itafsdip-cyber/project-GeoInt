import { useEffect, useMemo, useState } from 'react';
import MapView from '../../components/map/MapView';
import AnalystNotebookPanel from '../../components/panels/AnalystNotebookPanel';
import BriefingEditorPanel from '../../components/panels/BriefingEditorPanel';
import EntityGraphPanel from '../../components/panels/EntityGraphPanel';
import NarrativePanel from '../../components/panels/NarrativePanel';
import OverlayControls from '../../components/panels/OverlayControls';
import SourceOperationsPanel from '../../components/panels/SourceOperationsPanel';
import WorkspaceLayout from './WorkspaceLayout';
import { useGeoIntStore } from '../../state/useGeoIntStore';
import { selectors } from '../../state/selectors';
import { createBriefing } from '../../services/intelligence/briefingService';
import { buildPersistentEntityGraph } from '../../services/intelligence/entityGraphCore';
import { detectNarrativeClusters } from '../../services/intelligence/narrativeCore';
import { pruneStaleOverlayTracks } from '../../services/intelligence/overlayTrackService';
import type { IntelligenceEvent } from '../../types/intelligence';

const API_BASE = (import.meta.env.VITE_GEOINT_API_BASE || '').trim();

const seedEvents: IntelligenceEvent[] = [{
  id: 'seed-1', title: 'Regional maritime disruption reported', timestamp: new Date().toISOString(), latitude: 25.2, longitude: 55.3, region: 'Gulf', verificationLevel: 'HEURISTIC', geolocationPrecision: 'APPROXIMATE', uncertaintyRadiusKm: 35, references: [{ sourceId: 'rss', sourceName: 'RSS', collectedAt: new Date().toISOString(), health: 'ACTIVE' }],
}];

export default function IntelligenceWorkspace() {
  const [sourceRuns, setSourceRuns] = useState([]);
  const state = useGeoIntStore((s) => s.state);
  const actions = useGeoIntStore((s) => s.actions);

  useEffect(() => {
    actions.bootstrap({ events: seedEvents, briefings: [createBriefing()] });
  }, [actions]);

  useEffect(() => {
    if (!API_BASE) return;
    fetch(`${API_BASE}/sources/operations`)
      .then((res) => res.json())
      .then((payload) => setSourceRuns(payload.runs || []))
      .catch(() => setSourceRuns([]));
  }, []);

  const graph = useMemo(() => buildPersistentEntityGraph(state.events, state.incidents), [state.events, state.incidents]);
  const narratives = useMemo(() => detectNarrativeClusters(state.events), [state.events]);
  const overlays = useMemo(() => pruneStaleOverlayTracks(state.overlayTracks), [state.overlayTracks]);

  useEffect(() => {
    actions.replace({ entities: graph.entities, relations: graph.relations, narratives, overlayTracks: overlays });
    actions.setActiveNarratives(narratives.slice(0, 8).map((item) => item.narrativeId));
  }, [graph.entities, graph.relations, narratives, overlays, actions]);

  const activeNarratives = selectors.activeNarratives(state).length ? selectors.activeNarratives(state) : selectors.recentNarratives(state);

  return <WorkspaceLayout
    aiProvider={state.aiProvider}
    map={<MapView events={state.events} overlays={state.overlayTracks.filter((track) => state.overlayToggles[track.type])} selectedEntity={selectors.selectedEntity(state)} />}
    right={<>
      <OverlayControls enabled={state.overlayToggles} onToggle={actions.toggleOverlay} />
      <SourceOperationsPanel runs={sourceRuns} />
      <AnalystNotebookPanel notes={state.notes} incidents={state.incidents} entities={state.entities} narratives={activeNarratives} onSaveNote={actions.upsertNote} />
      {selectors.briefingSelection(state) && <BriefingEditorPanel briefing={selectors.briefingSelection(state)!} />}
      <EntityGraphPanel entities={state.entities} relations={state.relations} />
      <NarrativePanel narratives={activeNarratives} />
    </>}
  />;
}
