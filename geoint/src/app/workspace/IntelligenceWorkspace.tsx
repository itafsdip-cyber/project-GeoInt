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
import SearchPanel, { type SearchPanelFilters } from '../../components/panels/SearchPanel';
import WatchlistPanel from '../../components/panels/WatchlistPanel';
import InvestigationPanel from '../../components/panels/InvestigationPanel';
import IncidentLifecyclePanel from '../../components/panels/IncidentLifecyclePanel';
import RegionMonitoringPanel from '../../components/panels/RegionMonitoringPanel';
import AlertFeedPanel from '../../components/panels/AlertFeedPanel';
import BriefingAssistantPanel from '../../components/panels/BriefingAssistantPanel';
import ConfidencePanel from '../../components/panels/ConfidencePanel';
import ExportPanel from '../../components/panels/ExportPanel';
import DetailPanel from '../../components/panels/DetailPanel';
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
import { toDetailRecord, type DetailRecord } from '../../services/intelligence/detailViewService';
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
const SEARCH_RECENT_KEY = 'geoint-search-recents-v1';

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
  const [sourceStatus, setSourceStatus] = useState<any[]>([]);
  const [connectorMeta, setConnectorMeta] = useState<any[]>([]);
  const [sourceRuns, setSourceRuns] = useState<any[]>([]);
  const [scoreThreshold, setScoreThreshold] = useState(0.2);
  const [searchFilters, setSearchFilters] = useState<SearchPanelFilters>({ types: [] });
  const [recentQueries, setRecentQueries] = useState<string[]>(() => {
    try { return JSON.parse(window.localStorage.getItem(SEARCH_RECENT_KEY) || '[]'); } catch { return []; }
  });
  const [detailRecord, setDetailRecord] = useState<DetailRecord | undefined>();

  const state = useGeoIntStore((s) => s.state);
  const actions = useGeoIntStore((s) => s.actions);

  useEffect(() => {
    actions.bootstrap({ events: seedEvents, briefings: state.briefings.length ? state.briefings : [createBriefing()] });
  }, []);

  useEffect(() => {
    if (!state.searchQuery.trim()) return;
    const updated = [state.searchQuery.trim(), ...recentQueries.filter((item) => item !== state.searchQuery.trim())].slice(0, 10);
    setRecentQueries(updated);
    window.localStorage.setItem(SEARCH_RECENT_KEY, JSON.stringify(updated));
  }, [state.searchQuery]);

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
    fetch(`${API_BASE}/events/normalized`).then((res) => res.json()).then((payload) => { actions.replace({ events: payload.events || [] }); }).catch(() => {});
    sourcesApi.status().then((status) => setSourceStatus(status || [])).catch(() => {});
    sourcesApi.connectors().then((meta) => setConnectorMeta(meta || [])).catch(() => {});
    sourcesApi.runs().then((runs) => setSourceRuns(runs || [])).catch(() => {});
  }, [actions]);

  const overlays = useMemo(() => pruneStaleOverlayTracks(normalizeOverlayTracks(state.overlayTracks)), [state.overlayTracks]);
  const incidents = useMemo(() => buildFusedIncidents({ events: state.events, existingIncidents: state.incidents }), [state.events, state.incidents]);
  const graph = useMemo(() => { const model = buildEntityGraphModel({ events: state.events, incidents, narratives: [], notes: state.notes }); return { entities: model.nodes, relations: model.edges }; }, [state.events, state.notes, incidents]);
  const narratives = useMemo(() => buildNarrativeClusters(state.events), [state.events]);
  const activeNarratives = useMemo(() => narratives.filter((item) => !state.activeNarrativeIds.length || state.activeNarrativeIds.includes(item.narrativeId)), [narratives, state.activeNarrativeIds]);
  const selectedNarrative = activeNarratives[0];
  const narrativeSignals = useMemo(() => selectedNarrative ? buildNarrativeSignals(selectedNarrative, state.events) : [], [selectedNarrative, state.events]);

  const searchResults = useMemo(() => runGlobalIntelligenceSearch({ events: state.events, incidents, entities: graph.entities, narratives, notes: state.notes, briefings: state.briefings, overlays }, { text: state.searchQuery, ...searchFilters }), [state.searchQuery, searchFilters, state.events, incidents, graph.entities, narratives, state.notes, state.briefings, overlays]);
  const watchAlerts = useMemo(() => evaluateWatchlistAlerts({ watchlists: state.watchlists, incidents, narratives, entities: graph.entities, overlays }), [state.watchlists, incidents, narratives, graph.entities, overlays]);
  const alerts = useMemo(() => state.watchlistAlerts.length ? state.watchlistAlerts : watchAlerts, [watchAlerts, state.watchlistAlerts]);
  const correlations = useMemo(() => buildCorrelationCandidates({ incidents, overlays, narratives, entities: graph.entities, threshold: scoreThreshold }), [incidents, overlays, narratives, graph.entities, scoreThreshold]);
  const timelineItems = useMemo(() => sortTimeline([...buildIncidentTimeline(state.events, incidents), ...buildNarrativeTimeline(narratives), ...buildOverlayTimeline(overlays), ...buildSourceActivityTimeline(state.notes, state.briefings)]), [state.events, incidents, narratives, overlays, state.notes, state.briefings]);

  const promoteToBriefing = async (section: any) => {
    const current = selectors.briefingSelection(state) || createBriefing();
    const next: BriefingDocument = { ...current, updatedAt: new Date().toISOString(), sections: [...current.sections, section] };
    try {
      const saved = current.briefingId ? await briefingsApi.update(current.briefingId, next) : await briefingsApi.create(next);
      actions.upsertBriefing(saved);
      actions.selectBriefing(saved.briefingId);
    } catch {}
  };

  const createNoteFromDetail = async (record: DetailRecord) => {
    const saved = await notesApi.create({ title: `Detail: ${record.title}`, body: `${record.summary || ''}\n${record.caveat || ''}`.trim(), linkedIncidentIds: record.type === 'incident' ? [record.id] : [], linkedEntityIds: record.type === 'entity' ? [record.id] : [], linkedNarrativeIds: record.type === 'narrative' ? [record.id] : [] });
    actions.upsertNote(saved);
  };

  return <WorkspaceLayout topBarTitle='GeoInt Intelligence Workspace'>
    <MapView events={state.events} overlays={overlays} selectedEntity={graph.entities.find((entity) => entity.entityId === state.selectedEntityId)} highlightedRecordIds={state.mapHighlightIds} watchAreas={state.monitoredRegions} />
    <OverlayControls toggles={state.overlayToggles} onToggle={actions.toggleOverlay} />
    <DetailPanel record={detailRecord} onCenterMap={(record) => actions.setMapHighlights(record.linkedIds.length ? record.linkedIds : [record.id])} onAddToNote={createNoteFromDetail} onAddToBriefing={(record) => promoteToBriefing({ id: `detail-${record.type}-${record.id}`, type: `DETAIL_${record.type.toUpperCase()}`, title: record.title, content: `${record.summary || ''}\n${record.caveat || ''}`.trim(), linkedIds: record.linkedIds })} onPinInvestigation={(record) => actions.upsertInvestigation(createInvestigationFromState({ ...state, incidents }, `Pinned ${record.type}`, `Pinned from detail panel: ${record.title}`))} onClear={() => setDetailRecord(undefined)} />
    <IncidentLifecyclePanel incidents={incidents} onUpdateLifecycle={(incidentId, nextState) => actions.replace({ incidents: incidents.map((item) => item.incidentId === incidentId ? updateIncidentLifecycle(item, nextState) : item) })} onUpdatePriority={(incidentId, priority) => actions.replace({ incidents: incidents.map((item) => item.incidentId === incidentId ? { ...item, analystPriority: priority, updatedAt: new Date().toISOString() } : item) })} onCenterMap={(incident) => { actions.setMapHighlights([incident.incidentId, ...(incident.eventIds || [])]); setDetailRecord(toDetailRecord({ incident })); }} />
    <RegionMonitoringPanel regions={state.monitoredRegions} summaries={state.regionSummaries} onSaveViewportRegion={(name) => { const region = createMonitoredRegion({ name, geometryType: 'VIEWPORT' }); actions.upsertMonitoredRegion(region); actions.setRegionSummaries([...state.regionSummaries.filter((item) => item.regionId !== region.id), summarizeRegion({ region, incidents, events: state.events, overlays, narratives, alerts })]); }} onJumpToRegion={(regionId) => { actions.setMapHighlights([regionId]); const region = state.monitoredRegions.find((item) => item.id === regionId); if (region) setDetailRecord(toDetailRecord({ region, regionSummary: state.regionSummaries.find((item) => item.regionId === regionId) })); }} />
    <AlertFeedPanel alerts={alerts} onMarkRead={(id, read) => actions.setWatchlistAlerts(alerts.map((item) => item.id === id ? { ...item, read } : item))} onPin={(id) => actions.upsertInvestigation(createInvestigationFromState({ ...state, incidents }, `Pinned alert ${id}`, 'Alert pinned from prioritized feed'))} onPromoteToNote={async (alert) => { const saved = await notesApi.create({ title: `Alert ${alert.severity}`, body: `${alert.reason}\n${alert.caveatText || ''}`, linkedIncidentIds: alert.relatedIncidentIds || [], linkedEntityIds: [], linkedNarrativeIds: [] }); actions.upsertNote(saved); }} onPromoteToBriefing={(alert) => promoteToBriefing(alertToSection(alert))} onSelectAlert={(alert) => { actions.setMapHighlights([alert.matchedObjectId, ...(alert.relatedIncidentIds || [])]); setDetailRecord(toDetailRecord({ alert })); }} />
    <BriefingAssistantPanel hasAIProvider={state.aiProvider.providerType !== 'none'} onAssemble={(mode) => ({ ...(selectors.briefingSelection(state) || createBriefing()), ...assembleBriefingDraft({ mode, incidents, narratives: activeNarratives, alerts, regions: state.monitoredRegions, notes: state.notes }), updatedAt: new Date().toISOString() })} onApplyDraft={async (briefing) => { try { const saved = await briefingsApi.update(briefing.briefingId, briefing); actions.upsertBriefing(saved); } catch {} }} />
    <ConfidencePanel incidents={incidents} alerts={alerts} regionSummaries={state.regionSummaries} />
    <ExportPanel onExport={(format) => exportPayload({ format, investigation: state.investigations.find((item) => item.id === state.selectedInvestigationId), briefing: selectors.briefingSelection(state), regionSummary: state.regionSummaries[0], alerts, searchResults })} />
    <SearchPanel query={state.searchQuery} onQueryChange={actions.setSearchQuery} filters={searchFilters} onFiltersChange={setSearchFilters} recentQueries={recentQueries} onRecallQuery={actions.setSearchQuery} results={searchResults} onCenterMap={(result) => actions.setMapHighlights([result.id, ...(result.linkedIds || [])])} onOpenDetail={(result) => setDetailRecord(toDetailRecord({ searchResult: result }))} onAddToBriefing={(result) => promoteToBriefing(searchResultToSection(result))} onCreateNote={async (result) => { const saved = await notesApi.create({ title: `From search: ${result.title}`, body: `${result.type}:${result.id}\n${result.matchExcerpt || ''}`, linkedIncidentIds: result.type === 'incident' ? [result.id] : [], linkedEntityIds: result.type === 'entity' ? [result.id] : [], linkedNarrativeIds: result.type === 'narrative' ? [result.id] : [] }); actions.upsertNote(saved); }} onPinToInvestigation={(result) => actions.upsertInvestigation(createInvestigationFromState({ ...state, incidents }, `Pinned search ${result.type}`, `Pinned result ${result.title}`))} />
    <SourceOperationsPanel status={sourceStatus} connectors={connectorMeta} runs={sourceRuns} />
    <TimelinePanel items={timelineItems} onCenterMap={(item) => actions.setMapHighlights(item.linkedIds)} onCreateNote={async (item) => { const saved = await notesApi.create({ title: `Timeline ${item.type}`, body: item.summary, linkedIncidentIds: item.incidentId ? [item.incidentId] : [], linkedEntityIds: item.entityIds || [], linkedNarrativeIds: item.narrativeId ? [item.narrativeId] : [] }); actions.upsertNote(saved); }} onAddToBriefing={(item) => promoteToBriefing({ id: item.id, type: 'TIMELINE', title: item.type, content: `${item.summary} · ${item.confidence}`, linkedIds: item.linkedIds })} onFilterContext={(item) => { actions.setTimelineFilterState(item.type); actions.setMapHighlights(item.linkedIds); if (item.narrativeId) actions.setActiveNarratives([item.narrativeId]); if (item.incidentId) actions.selectIncident(item.incidentId); }} />
    <CorrelationPanel candidates={correlations} scoreThreshold={scoreThreshold} onScoreThreshold={setScoreThreshold} onPinCandidate={(id) => actions.setMapHighlights([id])} onPromoteCandidate={(candidate: CorrelationCandidate) => promoteToBriefing({ id: candidate.id, type: 'CORRELATION', title: candidate.correlationType, content: `${candidate.score} · ${candidate.caveat}`, linkedIds: candidate.linkedRecordIds })} />
    <WatchlistPanel entries={state.watchlists} alerts={alerts} onCreateEntry={(partial) => actions.upsertWatchlist(createWatchlistEntry(partial))} onToggleEntry={(id) => { const entry = state.watchlists.find((item) => item.id === id); if (!entry) return; actions.upsertWatchlist({ ...entry, enabled: !entry.enabled, updatedAt: new Date().toISOString() }); }} onPromoteAlert={(alert) => promoteToBriefing(alertToSection(alert))} />
    <InvestigationPanel investigations={state.investigations} selectedId={state.selectedInvestigationId} onSaveCurrent={() => actions.upsertInvestigation(createInvestigationFromState({ ...state, incidents }, `Investigation ${state.investigations.length + 1}`, 'Saved workspace context'))} onLoad={(id) => { const target = state.investigations.find((item) => item.id === id); if (!target) return; actions.selectInvestigation(id); actions.selectEntity(target.selectedEntityIds[0]); actions.selectIncident(target.selectedIncidentIds[0]); actions.setActiveNarratives(target.selectedNarrativeIds); actions.setSearchQuery(target.savedQuery || ''); actions.setMapHighlights([...target.selectedEntityIds, ...target.selectedIncidentIds, ...target.selectedOverlayIds, ...(target.activeWatchAreaIds || []), ...(target.pinnedAlertIds || [])]); }} onDelete={(id) => actions.removeInvestigation(id)} onPromote={(id) => { const target = state.investigations.find((item) => item.id === id); if (!target) return; promoteToBriefing({ id: `inv-${target.id}`, type: 'INVESTIGATION', title: target.title, content: target.summary, linkedIds: [...target.selectedEntityIds, ...target.selectedIncidentIds, ...target.selectedNarrativeIds] }); }} />
    <AnalystNotebookPanel notes={state.notes} incidents={incidents} entities={graph.entities} narratives={activeNarratives} onCreateNote={async (note) => { try { const saved = await notesApi.create(note); actions.upsertNote(saved); } catch {} }} onDeleteNote={async (noteId) => { try { await notesApi.remove(noteId); actions.removeNote(noteId); } catch {} }} onPromoteNote={async (note) => promoteToBriefing(promoteNoteToSection(note))} />
    {selectors.briefingSelection(state) && <BriefingEditorPanel briefing={selectors.briefingSelection(state)!} onSave={async (briefing) => { try { const saved = await briefingsApi.update(briefing.briefingId, briefing); actions.upsertBriefing(saved); actions.selectBriefing(saved.briefingId); } catch {} }} onDelete={async (briefingId) => { try { await briefingsApi.remove(briefingId); actions.removeBriefing(briefingId); } catch {} }} />}
    <EntityGraphPanel entities={graph.entities} relations={graph.relations} onFocusEntity={(entityId) => { actions.selectEntity(entityId); actions.setGraphFocusState(entityId); actions.setMapHighlights([entityId]); const entity = graph.entities.find((item) => item.entityId === entityId); if (entity) setDetailRecord(toDetailRecord({ entity })); }} onCreateNoteFromNode={async (node) => { const note = await notesApi.create({ title: `Entity note: ${node.label}`, body: `Graph-selected ${node.entityId}`, linkedEntityIds: [node.entityId] }); actions.upsertNote(note); }} />
    <NarrativePanel narratives={activeNarratives} onPinNarrative={(id) => { actions.setActiveNarratives([id, ...state.activeNarrativeIds.filter((item) => item !== id)]); actions.setMapHighlights([id]); const narrative = narratives.find((item) => item.narrativeId === id); if (narrative) setDetailRecord(toDetailRecord({ narrative })); }} />
    <NarrativePropagationPanel narrative={selectedNarrative} signals={narrativeSignals} />
  </WorkspaceLayout>;
}
