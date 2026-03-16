import { useEffect, useMemo, useState } from 'react';
import WorkspaceLayout from './WorkspaceLayout';
import MapView from '../../components/map/MapView';
import OverlayControls from '../../components/panels/OverlayControls';
import SourceOperationsPanel from '../../components/panels/SourceOperationsPanel';
import AnalystNotebookPanel from '../../components/panels/AnalystNotebookPanel';
import BriefingEditorPanel from '../../components/panels/BriefingEditorPanel';
import EntityGraphPanel from '../../components/panels/EntityGraphPanel';
import NarrativePanel from '../../components/panels/NarrativePanel';
import { useGeoIntStore } from '../../state/useGeoIntStore';
import { selectors } from '../../state/selectors';
import { createBriefing } from '../../services/intelligence/briefingService';
import { buildPersistentEntityGraph } from '../../services/intelligence/entityGraphCore';
import { detectNarrativeClusters } from '../../services/intelligence/narrativeCore';
import { normalizeOverlayTracks, pruneStaleOverlayTracks } from '../../services/intelligence/overlayTrackService';
import { notesApi } from '../../services/api/notesApi';
import { briefingsApi } from '../../services/api/briefingsApi';
import { sourcesApi } from '../../services/api/sourcesApi';
import type { IntelligenceEvent } from '../../types/intelligence';

const API_BASE = (import.meta.env.VITE_GEOINT_API_BASE || '').trim();

const seedEvents: IntelligenceEvent[] = [{
  id: 'seed-1', title: 'Regional maritime disruption reported', timestamp: new Date().toISOString(), latitude: 25.2, longitude: 55.3, region: 'Gulf', verificationLevel: 'HEURISTIC', geolocationPrecision: 'APPROXIMATE', uncertaintyRadiusKm: 35, references: [{ sourceId: 'rss', sourceName: 'RSS', collectedAt: new Date().toISOString(), health: 'ACTIVE' }],
}];

export default function IntelligenceWorkspace() {
  const [sourceStatus, setSourceStatus] = useState([]);
  const [connectorMeta, setConnectorMeta] = useState([]);
  const state = useGeoIntStore((s) => s.state);
  const actions = useGeoIntStore((s) => s.actions);

  useEffect(() => {
    actions.bootstrap({ events: seedEvents, briefings: state.briefings.length ? state.briefings : [createBriefing()] });
  }, []);

  useEffect(() => {
    notesApi.list().then((notes) => actions.replace({ notes })).catch(() => {});
    briefingsApi.list().then((briefings) => {
      if (briefings.length) actions.replace({ briefings });
    }).catch(() => {});
  }, [actions]);

  useEffect(() => {
    if (!API_BASE) return;
    fetch(`${API_BASE}/events/normalized`)
      .then((res) => res.json())
      .then((payload) => {
        actions.replace({ events: payload.events || [], overlayTracks: normalizeOverlayTracks(payload.overlays || []) });
      })
      .catch(() => {});

    sourcesApi.status().then((payload) => setSourceStatus(payload.sources || [])).catch(() => setSourceStatus([]));
    sourcesApi.connectors().then((payload) => setConnectorMeta(payload.connectors || [])).catch(() => setConnectorMeta([]));
  }, [actions]);

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
      <SourceOperationsPanel status={sourceStatus} connectors={connectorMeta} />
      <AnalystNotebookPanel
        notes={state.notes}
        incidents={state.incidents}
        entities={state.entities}
        narratives={activeNarratives}
        onCreateNote={async (note) => {
          try {
            const saved = await notesApi.create(note);
            actions.upsertNote(saved);
          } catch {}
        }}
        onDeleteNote={async (noteId) => {
          try {
            await notesApi.remove(noteId);
            actions.removeNote(noteId);
          } catch {}
        }}
      />
      {selectors.briefingSelection(state) && (
        <BriefingEditorPanel
          briefing={selectors.briefingSelection(state)!}
          onSave={async (briefing) => {
            try {
              const saved = await briefingsApi.update(briefing.briefingId, briefing);
              actions.upsertBriefing(saved);
            } catch {}
          }}
          onDelete={async (briefingId) => {
            try {
              await briefingsApi.remove(briefingId);
              actions.removeBriefing(briefingId);
            } catch {}
          }}
        />
      )}
      <EntityGraphPanel entities={state.entities} relations={state.relations} />
      <NarrativePanel narratives={activeNarratives} />
    </>}
  />;
}
