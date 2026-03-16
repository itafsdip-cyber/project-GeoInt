import type { GeoIntState } from '../../state/useGeoIntStore';
import type { InvestigationSession } from '../../types/intelligence';

export function createInvestigationFromState(state: GeoIntState, title: string, summary: string): InvestigationSession {
  const now = new Date().toISOString();
  return {
    id: `inv-${Date.now()}`,
    title,
    summary,
    createdAt: now,
    updatedAt: now,
    selectedEntityIds: state.selectedEntityId ? [state.selectedEntityId] : [],
    selectedIncidentIds: state.selectedIncidentId ? [state.selectedIncidentId] : [],
    selectedNarrativeIds: state.activeNarrativeIds,
    selectedOverlayIds: state.overlayTracks.slice(0, 8).map((track) => track.trackId),
    savedQuery: state.searchQuery,
    savedFilters: {
      overlayToggles: state.overlayToggles,
      graphFocusState: state.graphFocusState,
      timelineFilterState: state.timelineFilterState,
      searchQueryState: state.searchQuery,
    },
    timelineFilters: {
      timelineFilterState: state.timelineFilterState,
    },
    searchFilters: {
      query: state.searchQuery,
    },
    activeWatchAreaIds: state.monitoredRegions.slice(0, 6).map((region) => region.id),
    pinnedAlertIds: state.watchlistAlerts.filter((alert) => !alert.read).slice(0, 10).map((alert) => alert.id),
    pinnedCorrelationIds: [],
    linkedNoteIds: state.notes.slice(0, 10).map((note) => note.noteId),
    linkedBriefingIds: state.briefings.slice(0, 6).map((briefing) => briefing.briefingId),
  };
}

export function duplicateInvestigationSession(existing: InvestigationSession): InvestigationSession {
  const now = new Date().toISOString();
  return {
    ...existing,
    id: `inv-${Date.now()}`,
    title: `${existing.title} (copy)`,
    createdAt: now,
    updatedAt: now,
  };
}
