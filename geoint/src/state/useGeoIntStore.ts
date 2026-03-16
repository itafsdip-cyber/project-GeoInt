import { useSyncExternalStore } from 'react';
import type {
  AnalystNote,
  BriefingDocument,
  Entity,
  EntityRelation,
  Incident,
  IntelligenceEvent,
  NarrativeCluster,
  OverlayTrack,
  OverlayTrackType,
} from '../types/intelligence';

export interface AIProviderSettings {
  providerType: 'none' | 'hosted-openai-compatible' | 'user-openai-compatible' | 'user-ollama-compatible';
  endpoint?: string;
  model?: string;
  timeoutMs: number;
  reachable: boolean;
  statusMessage?: string;
}

export interface GeoIntSessionState {
  startedAt: string;
  lastUpdatedAt: string;
}

export interface GeoIntState {
  events: IntelligenceEvent[];
  incidents: Incident[];
  notes: AnalystNote[];
  briefings: BriefingDocument[];
  entities: Entity[];
  relations: EntityRelation[];
  narratives: NarrativeCluster[];
  overlayTracks: OverlayTrack[];
  selectedIncidentId?: string;
  pinnedIncidentIds: string[];
  briefingSelectionId?: string;
  selectedEntityId?: string;
  activeNarrativeIds: string[];
  overlayToggles: Record<OverlayTrackType, boolean>;
  aiProvider: AIProviderSettings;
  session: GeoIntSessionState;
}

export interface GeoIntStore {
  state: GeoIntState;
  actions: {
    bootstrap: (payload: Partial<GeoIntState>) => void;
    replace: (partial: Partial<GeoIntState>) => void;
    upsertNote: (note: AnalystNote) => void;
    selectIncident: (incidentId?: string) => void;
    togglePinnedIncident: (incidentId: string) => void;
    selectBriefing: (briefingId?: string) => void;
    selectEntity: (entityId?: string) => void;
    toggleOverlay: (overlayType: OverlayTrackType) => void;
    setActiveNarratives: (narrativeIds: string[]) => void;
    setAIProvider: (partial: Partial<AIProviderSettings>) => void;
  };
}

const now = () => new Date().toISOString();

const initialState: GeoIntState = {
  events: [],
  incidents: [],
  notes: [],
  briefings: [],
  entities: [],
  relations: [],
  narratives: [],
  overlayTracks: [],
  selectedIncidentId: undefined,
  pinnedIncidentIds: [],
  briefingSelectionId: undefined,
  selectedEntityId: undefined,
  activeNarrativeIds: [],
  overlayToggles: {
    MARITIME: true,
    AIR: false,
    FIRE: true,
    HOTSPOT: false,
    SATELLITE: false,
  },
  aiProvider: {
    providerType: 'none',
    timeoutMs: 8000,
    reachable: false,
    statusMessage: 'AI disabled. Platform running in non-AI mode.',
  },
  session: { startedAt: now(), lastUpdatedAt: now() },
};

let currentState: GeoIntState = initialState;
const listeners = new Set<() => void>();

const setState = (updater: (state: GeoIntState) => GeoIntState) => {
  currentState = updater(currentState);
  listeners.forEach((listener) => listener());
};

const actions: GeoIntStore['actions'] = {
  bootstrap(payload) {
    setState((state) => ({ ...state, ...payload, session: { ...state.session, lastUpdatedAt: now() } }));
  },
  replace(partial) {
    setState((state) => ({ ...state, ...partial, session: { ...state.session, lastUpdatedAt: now() } }));
  },
  upsertNote(note) {
    setState((state) => ({
      ...state,
      notes: [...state.notes.filter((n) => n.noteId !== note.noteId), note],
      session: { ...state.session, lastUpdatedAt: now() },
    }));
  },
  selectIncident(incidentId) {
    setState((state) => ({ ...state, selectedIncidentId: incidentId, session: { ...state.session, lastUpdatedAt: now() } }));
  },
  togglePinnedIncident(incidentId) {
    setState((state) => ({
      ...state,
      pinnedIncidentIds: state.pinnedIncidentIds.includes(incidentId)
        ? state.pinnedIncidentIds.filter((id) => id !== incidentId)
        : [...state.pinnedIncidentIds, incidentId],
      session: { ...state.session, lastUpdatedAt: now() },
    }));
  },
  selectBriefing(briefingId) {
    setState((state) => ({ ...state, briefingSelectionId: briefingId, session: { ...state.session, lastUpdatedAt: now() } }));
  },
  selectEntity(entityId) {
    setState((state) => ({ ...state, selectedEntityId: entityId, session: { ...state.session, lastUpdatedAt: now() } }));
  },
  toggleOverlay(overlayType) {
    setState((state) => ({
      ...state,
      overlayToggles: { ...state.overlayToggles, [overlayType]: !state.overlayToggles[overlayType] },
      session: { ...state.session, lastUpdatedAt: now() },
    }));
  },
  setActiveNarratives(narrativeIds) {
    setState((state) => ({ ...state, activeNarrativeIds: narrativeIds, session: { ...state.session, lastUpdatedAt: now() } }));
  },
  setAIProvider(partial) {
    setState((state) => ({
      ...state,
      aiProvider: { ...state.aiProvider, ...partial },
      session: { ...state.session, lastUpdatedAt: now() },
    }));
  },
};

export function useGeoIntStore<T>(selector: (store: GeoIntStore) => T) {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => selector({ state: currentState, actions }),
    () => selector({ state: currentState, actions }),
  );
}
