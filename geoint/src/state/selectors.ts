import type { GeoIntState } from './useGeoIntStore';

export const selectors = {
  selectedIncident: (state: GeoIntState) => state.incidents.find((incident) => incident.incidentId === state.selectedIncidentId),
  pinnedIncidents: (state: GeoIntState) => state.incidents.filter((incident) => state.pinnedIncidentIds.includes(incident.incidentId)),
  selectedEntity: (state: GeoIntState) => state.entities.find((entity) => entity.entityId === state.selectedEntityId),
  briefingSelection: (state: GeoIntState) => state.briefings.find((briefing) => briefing.briefingId === state.briefingSelectionId) || state.briefings[0],
  activeNarratives: (state: GeoIntState) => state.narratives.filter((narrative) => state.activeNarrativeIds.includes(narrative.narrativeId)),
  recentNarratives: (state: GeoIntState) => [...state.narratives].sort((a, b) => +new Date(b.lastSeen) - +new Date(a.lastSeen)).slice(0, 12),
  activeOverlays: (state: GeoIntState, now = Date.now()) => state.overlayTracks.filter((track) => !track.expiresAt || +new Date(track.expiresAt) > now),
};
