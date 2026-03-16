import { useEffect, useMemo, useState } from 'react';
import WorkspaceLayout from './WorkspaceLayout';
import MapView from '../../components/map/MapView';
import OverlayControls from '../../components/panels/OverlayControls';
import SourceOperationsPanel from '../../components/panels/SourceOperationsPanel';
import AnalystNotebookPanel from '../../components/panels/AnalystNotebookPanel';
import BriefingEditorPanel from '../../components/panels/BriefingEditorPanel';
import EntityGraphPanel from '../../components/panels/EntityGraphPanel';
import NarrativePanel from '../../components/panels/NarrativePanel';
import TimelinePanel from '../../components/panels/TimelinePanel';
import { useGeoIntStore } from '../../state/useGeoIntStore';
import { selectors } from '../../state/selectors';
import { createBriefing } from '../../services/intelligence/briefingService';
import { buildPersistentEntityGraph } from '../../services/intelligence/entityGraphCore';
import { detectNarrativeClusters } from '../../services/intelligence/narrativeCore';
import { normalizeOverlayTracks, pruneStaleOverlayTracks } from '../../services/intelligence/overlayTrackService';
import {
  buildIncidentTimeline,
  buildNarrativeTimeline,
  buildOverlayTimeline,
  buildSourceActivityTimeline,
  sortTimeline,
} from '../../services/intelligence/timelineService';
import { notesApi } from '../../services/api/notesApi';
import { briefingsApi } from '../../services/api/briefingsApi';
import { sourcesApi } from '../../services/api/sourcesApi';
import type { AnalystNote, IntelligenceEvent } from '../../types/intelligence';

const API_BASE = (import.meta.env.VITE_GEOINT_API_BASE || '').trim();

const seedEvents: IntelligenceEvent[] = [{
  id: 'seed-1', title: 'Regional maritime disruption reported', timestamp: new Date().toISOString(), latitude: 25.2, longitude: 55.3, region: 'Gulf', verificationLevel: 'HEURISTIC', geolocationPrecision: 'APPROXIMATE', uncertaintyRadiusKm: 35, references: [{ sourceId: 'rss', sourceName: 'RSS', collectedAt: new Date().toISOString(), health: 'ACTIVE' }],
}];

function promoteNoteToSection(note: AnalystNote) {
  return {
    id: `promoted-${note.noteId}`,
    type: 'ANALYST_NOTE',
    title: note.title,
    content: note.body,
    linkedIds: [note.noteId, ...note.linkedIncidentIds, ...note.linkedEntityIds, ...note.linkedNarrativeIds],
  };
}

export default function IntelligenceWorkspace() {
  const [sourceStatus, setSourceStatus] = useState([]);
  const [connectorMeta, setConnectorMeta] = useState([]);
  const [sourceRuns, setSourceRuns] = useState([]);
  const state = useGeoIntStore((s) => s.state);
  const actions = useGeoIntStore((s) => s.actions);

  useEffect(() => {
    actions.bootstrap({ events: seedEvents, briefings: state.briefings.length ? state.briefings : [createBriefing()] });
  }, []);

  useEffect(() => {
    notesApi.list().then((notes) => actions.replace({ notes })).catch(() => {});
    briefingsApi.list().then((briefings) => {
      if (briefings.length) {
        actions.replace({ briefings });
        if (!state.briefingSelectionId) actions.selectBriefing(briefings[0].briefingId);
      }
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
    sourcesApi.runs('?limit=120').then((payload) => setSourceRuns(payload.runs || [])).catch(() => setSourceRuns([]));
  }, [actions]);

  const graph = useMemo(() => buildPersistentEntityGraph(state.events, state.incidents), [state.events, state.incidents]);
  const narratives = useMemo(() => detectNarrativeClusters(state.events), [state.events]);
  const overlays = useMemo(() => pruneStaleOverlayTracks(state.overlayTracks), [state.overlayTracks]);

  useEffect(() => {
    actions.replace({ entities: graph.entities, relations: graph.relations, narratives, overlayTracks: overlays });
    actions.setActiveNarratives(narratives.slice(0, 8).map((item) => item.narrativeId));
  }, [graph.entities, graph.relations, narratives, overlays, actions]);

  const activeNarratives = selectors.activeNarratives(state).length ? selectors.activeNarratives(state) : selectors.recentNarratives(state);
  const timelineItems = useMemo(
    () => sortTimeline([
      ...buildIncidentTimeline(state.events, state.incidents),
      ...buildNarrativeTimeline(activeNarratives),
      ...buildOverlayTimeline(overlays),
      ...buildSourceActivityTimeline(state.notes, state.briefings),
    ]),
    [activeNarratives, overlays, state.briefings, state.events, state.incidents, state.notes],
  );

  const sourceOpsSummary = useMemo(() => ({
    active: sourceStatus.filter((item: any) => item.healthState === 'ACTIVE').length,
    degraded: sourceStatus.filter((item: any) => ['DEGRADED', 'STALE', 'AUTH_MISSING'].includes(item.healthState)).length,
    failed: sourceStatus.filter((item: any) => ['FAILED', 'UNAVAILABLE'].includes(item.healthState)).length,
  }), [sourceStatus]);

  return <WorkspaceLayout
    aiProvider={state.aiProvider}
    sourceOps={sourceOpsSummary}
    map={<MapView events={state.events} overlays={state.overlayTracks.filter((track) => state.overlayToggles[track.type])} selectedEntity={selectors.selectedEntity(state)} timelineSelection={timelineItems.slice(0, 12)} />}
    right={<>
      <OverlayControls enabled={state.overlayToggles} onToggle={actions.toggleOverlay} />
      <SourceOperationsPanel status={sourceStatus} connectors={connectorMeta} runs={sourceRuns} />
      <TimelinePanel items={timelineItems} />
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
        onPromoteNote={async (note) => {
          const selected = selectors.briefingSelection(state) || state.briefings[0];
          if (!selected) return;
          const updated = { ...selected, sections: [...selected.sections, promoteNoteToSection(note)], updatedAt: new Date().toISOString() };
          try {
            const saved = await briefingsApi.update(updated.briefingId, updated);
            actions.upsertBriefing(saved);
            actions.selectBriefing(saved.briefingId);
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
              actions.selectBriefing(saved.briefingId);
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
