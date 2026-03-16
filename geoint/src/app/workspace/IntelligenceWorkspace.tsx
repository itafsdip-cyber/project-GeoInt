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
import NarrativePropagationPanel from '../../components/panels/NarrativePropagationPanel';
import CorrelationPanel from '../../components/panels/CorrelationPanel';
import SearchPanel from '../../components/panels/SearchPanel';
import WatchlistPanel from '../../components/panels/WatchlistPanel';
import InvestigationPanel from '../../components/panels/InvestigationPanel';
import IncidentLifecyclePanel from '../../components/panels/IncidentLifecyclePanel';
import RegionMonitoringPanel from '../../components/panels/RegionMonitoringPanel';
import AlertFeedPanel from '../../components/panels/AlertFeedPanel';
import BriefingAssistantPanel from '../../components/panels/BriefingAssistantPanel';
import ConfidencePanel from '../../components/panels/ConfidencePanel';
import ExportPanel from '../../components/panels/ExportPanel';
import { useGeoIntStore } from '../../state/useGeoIntStore';
import { selectors } from '../../state/selectors';
import { createBriefing } from '../../services/intelligence/briefingService';
import { buildEntityGraphModel } from '../../services/intelligence/entityGraphService';
import { buildNarrativeClusters } from '../../services/intelligence/narrativeService';
import { buildNarrativeSignals } from '../../services/intelligence/narrativePropagationService';
import { normalizeOverlayTracks, pruneStaleOverlayTracks } from '../../services/intelligence/overlayTrackService';
import { buildCorrelationCandidates } from '../../services/intelligence/correlationEngine';
import { runGlobalIntelligenceSearch } from '../../services/intelligence/searchService';
import { createWatchlistEntry, evaluateWatchlistAlerts } from '../../services/intelligence/watchlistService';
import { createInvestigationFromState } from '../../services/intelligence/investigationService';
import { buildFusedIncidents } from '../../services/intelligence/incidentFusionService';
import { updateIncidentLifecycle } from '../../services/intelligence/incidentLifecycleService';
import { createMonitoredRegion, summarizeRegion } from '../../services/intelligence/regionMonitoringService';
import { assembleBriefingDraft } from '../../services/intelligence/briefingAssemblyService';
import { exportPayload } from '../../services/intelligence/exportService';
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
import type { AnalystNote, BriefingDocument, CorrelationCandidate, IntelligenceEvent, SearchResult, WatchlistAlert } from '../../types/intelligence';

const API_BASE = (import.meta.env.VITE_GEOINT_API_BASE || '').trim();

const seedEvents: IntelligenceEvent[] = [{
  id: 'seed-1', title: 'Regional maritime disruption reported', timestamp: new Date().toISOString(), latitude: 25.2, longitude: 55.3, region: 'Gulf', verificationLevel: 'HEURISTIC', geolocationPrecision: 'APPROXIMATE', uncertaintyRadiusKm: 35, references: [{ sourceId: 'rss', sourceName: 'RSS', collectedAt: new Date().toISOString(), health: 'ACTIVE' }],
}];

function promoteNoteToSection(note: AnalystNote) {
  return { id: `promoted-${note.noteId}`, type: 'ANALYST_NOTE', title: note.title, content: note.body, linkedIds: [note.noteId, ...note.linkedIncidentIds, ...note.linkedEntityIds, ...note.linkedNarrativeIds] };
}
function searchResultToSection(result: SearchResult) {
  return { id: `search-${result.type}-${result.id}`, type: 'SEARCH_RESULT', title: `${result.type.toUpperCase()}: ${result.title}`, content: `${result.timestamp} · ${result.confidenceHint}${result.caveatHint ? ` · ${result.caveatHint}` : ''}`, linkedIds: [result.id, ...(result.linkedIds || [])] };
}
function alertToSection(alert: WatchlistAlert) {
  return { id: `alert-${alert.id}`, type: 'WATCH_ALERT', title: `Alert ${alert.severity}`, content: `${alert.reason} · ${alert.matchedObjectType}:${alert.matchedObjectId}`, linkedIds: [alert.id, alert.matchedObjectId] };
}

export default function IntelligenceWorkspace() {
  const [sourceStatus, setSourceStatus] = useState([]);
  const [connectorMeta, setConnectorMeta] = useState([]);
  const [sourceRuns, setSourceRuns] = useState([]);
  const [scoreThreshold, setScoreThreshold] = useState(0.2);
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
    fetch(`${API_BASE}/events/normalized`).then((res) => res.json()).then((payload) => {
      actions.replace({ events: payload.events || [], overlayTracks: normalizeOverlayTracks(payload.overlays || []) });
    }).catch(() => {});
    sourcesApi.status().then((payload) => setSourceStatus(payload.sources || [])).catch(() => setSourceStatus([]));
    sourcesApi.connectors().then((payload) => setConnectorMeta(payload.connectors || [])).catch(() => setConnectorMeta([]));
    sourcesApi.runs('?limit=120').then((payload) => setSourceRuns(payload.runs || [])).catch(() => setSourceRuns([]));
  }, [actions]);

  const narratives = useMemo(() => buildNarrativeClusters(state.events), [state.events]);
  const overlays = useMemo(() => pruneStaleOverlayTracks(state.overlayTracks), [state.overlayTracks]);
  const incidents = useMemo(() => buildFusedIncidents({ events: state.events, existingIncidents: state.incidents, narratives, overlays }), [state.events, state.incidents, narratives, overlays]);
  const graph = useMemo(() => buildEntityGraphModel({ events: state.events, incidents, narratives, notes: state.notes }), [state.events, incidents, narratives, state.notes]);
  const narrativeSignals = useMemo(() => buildNarrativeSignals(narratives), [narratives]);
  const activeNarratives = useMemo(() => narratives.filter((item) => state.activeNarrativeIds.length === 0 || state.activeNarrativeIds.includes(item.narrativeId)), [narratives, state.activeNarrativeIds]);
  const correlations = useMemo(() => buildCorrelationCandidates({ events: state.events, narratives, entities: graph.nodes }).slice(0, 60), [state.events, narratives, graph.nodes]);
  const timelineItems = useMemo(() => sortTimeline([
    ...buildIncidentTimeline(incidents, state.events),
    ...buildNarrativeTimeline(activeNarratives),
    ...buildOverlayTimeline(overlays),
    ...buildSourceActivityTimeline(state.events),
  ]), [incidents, state.events, activeNarratives, overlays]);
  const searchResults = useMemo(() => runGlobalIntelligenceSearch({
    events: state.events,
    incidents,
    entities: graph.nodes,
    narratives,
    notes: state.notes,
    briefings: state.briefings,
    overlays,
  }, { text: state.searchQuery, types: [] }), [state.events, incidents, graph.nodes, narratives, state.notes, state.briefings, overlays, state.searchQuery]);

  useEffect(() => { actions.replace({ incidents, entities: graph.nodes, relations: graph.edges, narratives }); }, [incidents, graph.nodes, graph.edges, narratives]);

  useEffect(() => {
    actions.setWatchlistAlerts(evaluateWatchlistAlerts({ watchlists: state.watchlists, events: state.events, narratives, overlays, incidents }));
  }, [state.watchlists, state.events, narratives, overlays, incidents]);

  useEffect(() => {
    actions.setRegionSummaries(state.monitoredRegions.map((region) => summarizeRegion({
      region,
      incidents,
      events: state.events,
      overlays,
      narratives,
      alerts: state.watchlistAlerts,
    })));
  }, [state.monitoredRegions, incidents, state.events, overlays, narratives, state.watchlistAlerts]);

  const selectedNarrative = narratives.find((item) => item.narrativeId === state.activeNarrativeIds[0]);
  const sourceOpsSummary = { status: sourceStatus, connectors: connectorMeta, runs: sourceRuns };

  const promoteToBriefing = async (section: { id: string; type: string; title: string; content: string; linkedIds: string[] }) => {
    const selected = selectors.briefingSelection(state) || state.briefings[0];
    if (!selected) return;
    const updated = { ...selected, sections: [...selected.sections, section], updatedAt: new Date().toISOString() };
    try { const saved = await briefingsApi.update(updated.briefingId, updated); actions.upsertBriefing(saved); actions.selectBriefing(saved.briefingId); } catch {}
  };

  const assembleAndApplyBriefing = (mode: 'manual' | 'heuristic' | 'ai-assisted'): BriefingDocument | null => {
    const selected = selectors.briefingSelection(state) || state.briefings[0];
    if (!selected) return null;
    const draft = assembleBriefingDraft({ mode, incidents, narratives: activeNarratives, alerts: state.watchlistAlerts.slice(0, 10), regions: state.monitoredRegions, notes: state.notes, title: selected.title });
    return { ...selected, sections: draft.sections, updatedAt: new Date().toISOString() };
  };

  return <WorkspaceLayout
    aiProvider={state.aiProvider}
    sourceOps={sourceOpsSummary}
    map={<MapView events={state.events} overlays={state.overlayTracks.filter((track) => state.overlayToggles[track.type])} selectedEntity={selectors.selectedEntity(state)} timelineSelection={timelineItems.slice(0, 12)} highlightedRecordIds={state.mapHighlightIds} watchAreas={state.monitoredRegions} heatRegion={state.monitoredRegions[0]} />}
    right={<>
      <OverlayControls enabled={state.overlayToggles} onToggle={actions.toggleOverlay} />
      <IncidentLifecyclePanel incidents={incidents} onUpdateLifecycle={(incidentId, lifecycleState) => actions.replace({ incidents: incidents.map((item) => item.incidentId === incidentId ? updateIncidentLifecycle(item, lifecycleState) : item) })} onUpdatePriority={(incidentId, priority) => actions.replace({ incidents: incidents.map((item) => item.incidentId === incidentId ? { ...item, analystPriority: priority, updatedAt: new Date().toISOString() } : item) })} onCenterMap={(incident) => actions.setMapHighlights([incident.incidentId, ...(incident.linkedEventIds || [])])} />
      <RegionMonitoringPanel regions={state.monitoredRegions} summaries={state.regionSummaries} onSaveViewportRegion={(name) => actions.upsertMonitoredRegion(createMonitoredRegion({ name, geometryType: 'VIEWPORT', viewport: { center: { latitude: 25.2, longitude: 55.3 }, zoom: 5 } }))} onJumpToRegion={(regionId) => actions.setMapHighlights([regionId])} />
      <AlertFeedPanel alerts={state.watchlistAlerts} onMarkRead={(id, read) => actions.setWatchlistAlerts(state.watchlistAlerts.map((item) => item.id === id ? { ...item, read } : item))} onPin={(id) => actions.upsertInvestigation(createInvestigationFromState({ ...state, incidents }, `Pinned alert ${id}`, 'Alert pinned from prioritized feed'))} onPromoteToNote={async (alert) => { const saved = await notesApi.create({ title: `Alert ${alert.severity}`, body: `${alert.reason}\n${alert.caveatText || ''}`, linkedIncidentIds: alert.relatedIncidentIds || [], linkedEntityIds: [], linkedNarrativeIds: [] }); actions.upsertNote(saved); }} onPromoteToBriefing={(alert) => promoteToBriefing(alertToSection(alert))} onSelectAlert={(alert) => actions.setMapHighlights([alert.matchedObjectId, ...(alert.relatedIncidentIds || [])])} />
      <BriefingAssistantPanel hasAIProvider={state.aiProvider.providerType !== 'none'} onAssemble={assembleAndApplyBriefing} onApplyDraft={async (briefing) => { try { const saved = await briefingsApi.update(briefing.briefingId, briefing); actions.upsertBriefing(saved); } catch {} }} />
      <ConfidencePanel incidents={incidents} alerts={state.watchlistAlerts} regionSummaries={state.regionSummaries} />
      <ExportPanel onExport={(format) => exportPayload({ format, investigation: state.investigations.find((item) => item.id === state.selectedInvestigationId), briefing: selectors.briefingSelection(state), regionSummary: state.regionSummaries[0], alerts: state.watchlistAlerts, searchResults })} />
      <SearchPanel query={state.searchQuery} onQueryChange={actions.setSearchQuery} results={searchResults} onCenterMap={(result) => actions.setMapHighlights([result.id])} onAddToBriefing={(result) => promoteToBriefing(searchResultToSection(result))} onCreateNote={async (result) => { const saved = await notesApi.create({ title: `From search: ${result.title}`, body: `${result.type}:${result.id}`, linkedIncidentIds: result.type === 'incident' ? [result.id] : [], linkedEntityIds: result.type === 'entity' ? [result.id] : [], linkedNarrativeIds: result.type === 'narrative' ? [result.id] : [] }); actions.upsertNote(saved); }} />
      <SourceOperationsPanel status={sourceStatus} connectors={connectorMeta} runs={sourceRuns} />
      <TimelinePanel items={timelineItems} />
      <CorrelationPanel candidates={correlations} scoreThreshold={scoreThreshold} onScoreThreshold={setScoreThreshold} onPinCandidate={(id) => actions.setMapHighlights([id])} onPromoteCandidate={(candidate: CorrelationCandidate) => promoteToBriefing({ id: candidate.id, type: 'CORRELATION', title: candidate.correlationType, content: `${candidate.score} · ${candidate.caveat}`, linkedIds: candidate.linkedRecordIds })} />
      <WatchlistPanel entries={state.watchlists} alerts={state.watchlistAlerts} onCreateEntry={(partial) => actions.upsertWatchlist(createWatchlistEntry(partial))} onToggleEntry={(id) => { const entry = state.watchlists.find((item) => item.id === id); if (!entry) return; actions.upsertWatchlist({ ...entry, enabled: !entry.enabled, updatedAt: new Date().toISOString() }); }} onPromoteAlert={(alert) => promoteToBriefing(alertToSection(alert))} />
      <InvestigationPanel investigations={state.investigations} selectedId={state.selectedInvestigationId} onSaveCurrent={() => actions.upsertInvestigation(createInvestigationFromState({ ...state, incidents }, `Investigation ${state.investigations.length + 1}`, 'Saved workspace context'))} onLoad={(id) => { const target = state.investigations.find((item) => item.id === id); if (!target) return; actions.selectInvestigation(id); actions.selectEntity(target.selectedEntityIds[0]); actions.selectIncident(target.selectedIncidentIds[0]); actions.setActiveNarratives(target.selectedNarrativeIds); actions.setSearchQuery(target.savedQuery || ''); actions.setMapHighlights([...target.selectedEntityIds, ...target.selectedIncidentIds, ...target.selectedOverlayIds, ...(target.activeWatchAreaIds || [])]); }} onDelete={(id) => actions.removeInvestigation(id)} onPromote={(id) => { const target = state.investigations.find((item) => item.id === id); if (!target) return; promoteToBriefing({ id: `inv-${target.id}`, type: 'INVESTIGATION', title: target.title, content: target.summary, linkedIds: [...target.selectedEntityIds, ...target.selectedIncidentIds, ...target.selectedNarrativeIds] }); }} />
      <AnalystNotebookPanel notes={state.notes} incidents={incidents} entities={state.entities} narratives={activeNarratives} onCreateNote={async (note) => { try { const saved = await notesApi.create(note); actions.upsertNote(saved); } catch {} }} onDeleteNote={async (noteId) => { try { await notesApi.remove(noteId); actions.removeNote(noteId); } catch {} }} onPromoteNote={async (note) => promoteToBriefing(promoteNoteToSection(note))} />
      {selectors.briefingSelection(state) && <BriefingEditorPanel briefing={selectors.briefingSelection(state)!} onSave={async (briefing) => { try { const saved = await briefingsApi.update(briefing.briefingId, briefing); actions.upsertBriefing(saved); actions.selectBriefing(saved.briefingId); } catch {} }} onDelete={async (briefingId) => { try { await briefingsApi.remove(briefingId); actions.removeBriefing(briefingId); } catch {} }} />}
      <EntityGraphPanel entities={state.entities} relations={state.relations} onFocusEntity={(entityId) => { actions.selectEntity(entityId); actions.setGraphFocusState(entityId); actions.setMapHighlights([entityId]); }} onCreateNoteFromNode={async (node) => { const note = await notesApi.create({ title: `Entity note: ${node.label}`, body: `Graph-selected ${node.entityId}`, linkedEntityIds: [node.entityId] }); actions.upsertNote(note); }} />
      <NarrativePanel narratives={activeNarratives} onPinNarrative={(id) => actions.setActiveNarratives([id, ...state.activeNarrativeIds.filter((item) => item !== id)])} />
      <NarrativePropagationPanel narrative={selectedNarrative} signals={narrativeSignals} />
    </>}
  />;
}
