import type { AnalystNote, BriefingDocument, Incident, IntelligenceEvent, NarrativeCluster, OverlayTrack } from '../../types/intelligence';

export type TimelineEventType =
  | 'EVENT_OBSERVED'
  | 'INCIDENT_CLUSTERED'
  | 'OVERLAY_DETECTED'
  | 'NARRATIVE_SIGNAL'
  | 'NOTE_CREATED'
  | 'BRIEFING_UPDATED';

export type TimelineEventCategory = 'OBSERVED_SIGNAL' | 'ANALYST_ARTIFACT' | 'AI_ENRICHMENT';

export interface TimelineItem {
  id: string;
  timestamp: string;
  type: TimelineEventType;
  category: TimelineEventCategory;
  source: string;
  summary: string;
  confidence: string;
  linkedIds: string[];
  latitude?: number;
  longitude?: number;
  incidentId?: string;
  narrativeId?: string;
  entityIds?: string[];
  overlayType?: OverlayTrack['type'];
}

function toIso(value?: string) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

export function buildIncidentTimeline(events: IntelligenceEvent[], incidents: Incident[]): TimelineItem[] {
  const baseEvents = events.map((event) => ({
    id: `event-${event.id}`,
    timestamp: toIso(event.timestamp),
    type: 'EVENT_OBSERVED' as const,
    category: 'OBSERVED_SIGNAL' as const,
    source: event.references[0]?.sourceName || event.references[0]?.sourceId || 'unknown-source',
    summary: event.title || event.summary || 'Observed event',
    confidence: event.verificationLevel,
    linkedIds: [event.id],
    latitude: event.latitude ?? undefined,
    longitude: event.longitude ?? undefined,
  }));

  const clustered = incidents.map((incident) => ({
    id: `incident-${incident.incidentId}`,
    timestamp: toIso(
      events.find((event) => incident.eventIds.includes(event.id))?.timestamp,
    ),
    type: 'INCIDENT_CLUSTERED' as const,
    category: 'AI_ENRICHMENT' as const,
    source: 'incident-clustering',
    summary: `${incident.title} clustered from ${incident.eventIds.length} event(s)`,
    confidence: incident.verificationLevel,
    linkedIds: [incident.incidentId, ...incident.eventIds],
    incidentId: incident.incidentId,
  }));

  return [...baseEvents, ...clustered];
}

export function buildNarrativeTimeline(narratives: NarrativeCluster[]): TimelineItem[] {
  return narratives.map((narrative) => ({
    id: `narrative-${narrative.narrativeId}`,
    timestamp: toIso(narrative.lastSeen),
    type: 'NARRATIVE_SIGNAL',
    category: 'AI_ENRICHMENT',
    source: 'narrative-analysis',
    summary: `${narrative.title} (${narrative.status})`,
    confidence: narrative.confidenceWarning ? 'DISPUTED' : 'HEURISTIC',
    linkedIds: [narrative.narrativeId],
    narrativeId: narrative.narrativeId,
  }));
}

export function buildOverlayTimeline(overlays: OverlayTrack[]): TimelineItem[] {
  return overlays.map((track) => ({
    id: `overlay-${track.trackId}`,
    timestamp: toIso(track.observedAt),
    type: 'OVERLAY_DETECTED',
    category: 'OBSERVED_SIGNAL',
    source: track.sourceReference?.sourceName || track.sourceReference?.sourceId || 'overlay-source',
    summary: `${track.type} track: ${track.label}`,
    confidence: track.verificationLevel,
    linkedIds: [track.trackId],
    latitude: track.latitude,
    longitude: track.longitude,
    overlayType: track.type,
  }));
}

export function buildSourceActivityTimeline(notes: AnalystNote[], briefings: BriefingDocument[]): TimelineItem[] {
  const noteItems = notes.map((note) => ({
    id: `note-${note.noteId}`,
    timestamp: toIso(note.updatedAt || note.createdAt),
    type: 'NOTE_CREATED' as const,
    category: 'ANALYST_ARTIFACT' as const,
    source: note.analyst || 'analyst',
    summary: note.title,
    confidence: note.confidenceNote || 'ANALYST_NOTE',
    linkedIds: [note.noteId, ...note.linkedIncidentIds, ...note.linkedNarrativeIds, ...note.linkedEntityIds],
    incidentId: note.linkedIncidentIds[0],
    narrativeId: note.linkedNarrativeIds[0],
    entityIds: note.linkedEntityIds,
  }));

  const briefingItems = briefings.map((briefing) => ({
    id: `briefing-${briefing.briefingId}`,
    timestamp: toIso(briefing.updatedAt),
    type: 'BRIEFING_UPDATED' as const,
    category: 'ANALYST_ARTIFACT' as const,
    source: 'briefing-workflow',
    summary: `${briefing.title} updated`,
    confidence: 'ANALYST_CURATED',
    linkedIds: [briefing.briefingId, ...briefing.sections.flatMap((section) => section.linkedIds || [])],
  }));

  return [...noteItems, ...briefingItems];
}

export function sortTimeline(items: TimelineItem[]) {
  return [...items].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
