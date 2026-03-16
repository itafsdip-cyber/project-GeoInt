import { useMemo, useState } from 'react';
import type { AnalystNote, BriefingDocument, EntityNode, EntityRelation, Incident, IntelligenceEvent, NarrativeCluster, OverlayTrack } from '../types/intelligence';

export interface GeoIntState {
  events: IntelligenceEvent[];
  incidents: Incident[];
  notes: AnalystNote[];
  briefings: BriefingDocument[];
  entities: EntityNode[];
  relations: EntityRelation[];
  narratives: NarrativeCluster[];
  overlayTracks: OverlayTrack[];
  pinnedIncidentIds: string[];
  selectedIncidentId?: string;
}

const initialState: GeoIntState = {
  events: [], incidents: [], notes: [], briefings: [], entities: [], relations: [], narratives: [], overlayTracks: [], pinnedIncidentIds: [], selectedIncidentId: undefined,
};

export function useGeoIntStore(seed?: Partial<GeoIntState>) {
  const [state, setState] = useState<GeoIntState>({ ...initialState, ...seed });
  const actions = useMemo(() => ({
    replace(partial: Partial<GeoIntState>) { setState((prev) => ({ ...prev, ...partial })); },
    upsertNote(note: AnalystNote) {
      setState((prev) => ({ ...prev, notes: [...prev.notes.filter((n) => n.noteId !== note.noteId), note] }));
    },
    pinIncident(incidentId: string) {
      setState((prev) => ({ ...prev, pinnedIncidentIds: prev.pinnedIncidentIds.includes(incidentId) ? prev.pinnedIncidentIds.filter((id) => id !== incidentId) : [...prev.pinnedIncidentIds, incidentId] }));
    },
    selectIncident(incidentId?: string) { setState((prev) => ({ ...prev, selectedIncidentId: incidentId })); },
  }), []);

  return { state, actions };
}
