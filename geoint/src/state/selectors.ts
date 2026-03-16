import type { GeoIntState } from './useGeoIntStore';

export const selectors = {
  selectedIncident: (state: GeoIntState) => state.incidents.find((i) => i.incidentId === state.selectedIncidentId),
  pinnedIncidents: (state: GeoIntState) => state.incidents.filter((i) => state.pinnedIncidentIds.includes(i.incidentId)),
  recentNarratives: (state: GeoIntState) => [...state.narratives].sort((a, b) => +new Date(b.lastSeen) - +new Date(a.lastSeen)).slice(0, 12),
  activeOverlays: (state: GeoIntState, now = Date.now()) => state.overlayTracks.filter((track) => !track.expiresAt || +new Date(track.expiresAt) > now),
};
