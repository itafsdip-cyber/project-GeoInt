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

const SESSION_KEY = 'geoint-session-v3';
const SESSION_VERSION = 3;

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
    removeNote: (noteId: string) => void;
    upsertBriefing: (briefing: BriefingDocument) => void;
    removeBriefing: (briefingId: string) => void;
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
  overlayToggles: { MARITIME: true, AIR: false, FIRE: true, HOTSPOT: true, SATELLITE: false },
  aiProvider: { providerType: 'none', timeoutMs: 8000, reachable: false, statusMessage: 'AI disabled. Platform running in non-AI mode.' },
  session: { startedAt: now(), lastUpdatedAt: now() },
};

function sanitizePersisted(raw: any) {
  if (!raw || typeof raw !== 'object') return {};
  if (Number(raw.sessionVersion) !== SESSION_VERSION) return {};

  const overlayToggles = typeof raw.overlayToggles === 'object' && raw.overlayToggles
    ? { ...initialState.overlayToggles, ...raw.overlayToggles }
    : initialState.overlayToggles;

  return {
    selectedIncidentId: typeof raw.selectedIncidentId === 'string' ? raw.selectedIncidentId : undefined,
    pinnedIncidentIds: Array.isArray(raw.pinnedIncidentIds) ? raw.pinnedIncidentIds.filter((x: unknown) => typeof x === 'string') : [],
    briefingSelectionId: typeof raw.briefingSelectionId === 'string' ? raw.briefingSelectionId : undefined,
    selectedEntityId: typeof raw.selectedEntityId === 'string' ? raw.selectedEntityId : undefined,
    activeNarrativeIds: Array.isArray(raw.activeNarrativeIds) ? raw.activeNarrativeIds.filter((x: unknown) => typeof x === 'string') : [],
    overlayToggles,
    aiProvider: typeof raw.aiProvider === 'object' && raw.aiProvider
      ? {
        providerType: raw.aiProvider.providerType || initialState.aiProvider.providerType,
        endpoint: raw.aiProvider.endpoint,
        model: raw.aiProvider.model,
        timeoutMs: Number(raw.aiProvider.timeoutMs || initialState.aiProvider.timeoutMs),
        reachable: Boolean(raw.aiProvider.reachable),
        statusMessage: raw.aiProvider.statusMessage,
      }
      : initialState.aiProvider,
    session: typeof raw.session === 'object' && raw.session ? { ...initialState.session, ...raw.session } : initialState.session,
  };
}

function persistState(state: GeoIntState) {
  if (typeof window === 'undefined') return;
  const safe = {
    sessionVersion: SESSION_VERSION,
    selectedIncidentId: state.selectedIncidentId,
    pinnedIncidentIds: state.pinnedIncidentIds,
    briefingSelectionId: state.briefingSelectionId,
    selectedEntityId: state.selectedEntityId,
    activeNarrativeIds: state.activeNarrativeIds,
    overlayToggles: state.overlayToggles,
    aiProvider: {
      providerType: state.aiProvider.providerType,
      endpoint: state.aiProvider.endpoint,
      model: state.aiProvider.model,
      timeoutMs: state.aiProvider.timeoutMs,
      reachable: state.aiProvider.reachable,
      statusMessage: state.aiProvider.statusMessage,
    },
    session: state.session,
  };
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(safe));
}

function loadPersisted() {
  if (typeof window === 'undefined') return {};
  try {
    return sanitizePersisted(JSON.parse(window.localStorage.getItem(SESSION_KEY) || '{}'));
  } catch {
    return {};
  }
}

let currentState: GeoIntState = { ...initialState, ...loadPersisted() };
const listeners = new Set<() => void>();

const setState = (updater: (state: GeoIntState) => GeoIntState) => {
  currentState = updater(currentState);
  persistState(currentState);
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
    setState((state) => ({ ...state, notes: [...state.notes.filter((n) => n.noteId !== note.noteId), note], session: { ...state.session, lastUpdatedAt: now() } }));
  },
  removeNote(noteId) {
    setState((state) => ({ ...state, notes: state.notes.filter((note) => note.noteId !== noteId), session: { ...state.session, lastUpdatedAt: now() } }));
  },
  upsertBriefing(briefing) {
    setState((state) => ({ ...state, briefings: [...state.briefings.filter((item) => item.briefingId !== briefing.briefingId), briefing], session: { ...state.session, lastUpdatedAt: now() } }));
  },
  removeBriefing(briefingId) {
    setState((state) => ({ ...state, briefings: state.briefings.filter((item) => item.briefingId !== briefingId), session: { ...state.session, lastUpdatedAt: now() } }));
  },
  selectIncident(incidentId) {
    setState((state) => ({ ...state, selectedIncidentId: incidentId, session: { ...state.session, lastUpdatedAt: now() } }));
  },
  togglePinnedIncident(incidentId) {
    setState((state) => ({
      ...state,
      pinnedIncidentIds: state.pinnedIncidentIds.includes(incidentId) ? state.pinnedIncidentIds.filter((id) => id !== incidentId) : [...state.pinnedIncidentIds, incidentId],
      session: { ...state.session, lastUpdatedAt: now() },
    }));
  },
  selectBriefing(briefingId) { setState((state) => ({ ...state, briefingSelectionId: briefingId, session: { ...state.session, lastUpdatedAt: now() } })); },
  selectEntity(entityId) { setState((state) => ({ ...state, selectedEntityId: entityId, session: { ...state.session, lastUpdatedAt: now() } })); },
  toggleOverlay(overlayType) {
    setState((state) => ({ ...state, overlayToggles: { ...state.overlayToggles, [overlayType]: !state.overlayToggles[overlayType] }, session: { ...state.session, lastUpdatedAt: now() } }));
  },
  setActiveNarratives(narrativeIds) { setState((state) => ({ ...state, activeNarrativeIds: narrativeIds, session: { ...state.session, lastUpdatedAt: now() } })); },
  setAIProvider(partial) { setState((state) => ({ ...state, aiProvider: { ...state.aiProvider, ...partial }, session: { ...state.session, lastUpdatedAt: now() } })); },
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
