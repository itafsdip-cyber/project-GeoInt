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
    selectedOverlayIds: state.overlayTracks.slice(0, 5).map((track) => track.trackId),
    savedQuery: state.searchQuery,
    savedFilters: {
      overlayToggles: state.overlayToggles,
      graphFocusState: state.graphFocusState,
      timelineFilterState: state.timelineFilterState,
      searchQueryState: state.searchQuery,
    },
    linkedNoteIds: state.notes.slice(0, 6).map((note) => note.noteId),
    linkedBriefingIds: state.briefings.slice(0, 4).map((briefing) => briefing.briefingId),
  };
}
