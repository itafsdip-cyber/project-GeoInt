import type {
  AnalystNote,
  BriefingDocument,
  Entity,
  Incident,
  IntelligenceEvent,
  InvestigationSession,
  MonitoredRegion,
  NarrativeCluster,
  OverlayTrack,
  RegionSummary,
  SearchResult,
  WatchlistAlert,
  WatchlistEntry,
} from '../../types/intelligence';

export type DetailObjectType =
  | 'incident'
  | 'event'
  | 'entity'
  | 'narrative'
  | 'alert'
  | 'watchlist'
  | 'region'
  | 'overlay'
  | 'investigation'
  | 'note'
  | 'briefing'
  | 'search-result';

export interface DetailRecord {
  id: string;
  type: DetailObjectType;
  title: string;
  timestamp?: string;
  confidence?: string;
  caveat?: string;
  provenance?: string;
  references?: string[];
  linkedIds: string[];
  summary?: string;
}

export function toDetailRecord(input: {
  incident?: Incident;
  event?: IntelligenceEvent;
  entity?: Entity;
  narrative?: NarrativeCluster;
  alert?: WatchlistAlert;
  watchlist?: WatchlistEntry;
  region?: MonitoredRegion;
  regionSummary?: RegionSummary;
  overlay?: OverlayTrack;
  investigation?: InvestigationSession;
  note?: AnalystNote;
  briefing?: BriefingDocument;
  searchResult?: SearchResult;
}): DetailRecord | undefined {
  if (input.incident) {
    const incident = input.incident;
    return {
      id: incident.incidentId,
      type: 'incident',
      title: incident.title,
      timestamp: incident.updatedAt || incident.lastSeen,
      confidence: incident.confidenceBand || incident.verificationLevel,
      caveat: incident.caveatText || incident.confidenceNote,
      provenance: 'Incident fusion preserves linked evidence; inferred links remain analytical support.',
      references: incident.sourceSet || [],
      linkedIds: [incident.incidentId, ...(incident.eventIds || []), ...(incident.linkedEntityIds || []), ...(incident.linkedNarrativeIds || [])],
      summary: incident.summary || (incident.fusionRationale || []).join(' '),
    };
  }
  if (input.event) {
    const event = input.event;
    return {
      id: event.id,
      type: 'event',
      title: event.title,
      timestamp: event.timestamp,
      confidence: event.verificationLevel,
      caveat: event.trajectory?.caveat,
      provenance: 'Observed source reporting.',
      references: (event.references || []).map((ref) => ref.sourceName || ref.sourceId),
      linkedIds: [event.id, ...(event.actors || []).map((actor) => actor.actorId)],
      summary: event.summary,
    };
  }
  if (input.entity) {
    const entity = input.entity;
    return {
      id: entity.entityId,
      type: 'entity',
      title: entity.label,
      timestamp: entity.lastSeen,
      confidence: 'Graph linkage',
      caveat: 'Co-occurrence is not proof of command structure.',
      provenance: 'Derived from linked incidents, narratives, and source mentions.',
      linkedIds: [entity.entityId],
      summary: `Aliases: ${entity.aliases.join(', ') || 'none'}`,
    };
  }
  if (input.narrative) {
    const narrative = input.narrative;
    return {
      id: narrative.narrativeId,
      type: 'narrative',
      title: narrative.title,
      timestamp: narrative.lastSeen,
      confidence: narrative.status,
      caveat: narrative.caveatNote || narrative.confidenceWarning || 'Narrative propagation is not proof of truth.',
      provenance: 'Narrative aggregation and propagation analysis.',
      linkedIds: [narrative.narrativeId, ...(narrative.relatedIncidentIds || []), ...(narrative.relatedEntityIds || [])],
      summary: `Keywords: ${(narrative.keywords || []).join(', ')}`,
    };
  }
  if (input.alert) {
    const alert = input.alert;
    return {
      id: alert.id,
      type: 'alert',
      title: `${alert.severity} alert · ${alert.reason}`,
      timestamp: alert.createdAt,
      confidence: alert.confidenceBand || (alert.confidenceScore ? `${Math.round(alert.confidenceScore * 100)}% support` : undefined),
      caveat: alert.caveatText,
      provenance: `Watchlist ${alert.watchlistId} match on ${alert.matchedObjectType}:${alert.matchedObjectId}.`,
      linkedIds: [alert.id, alert.watchlistId, alert.matchedObjectId, ...(alert.relatedIncidentIds || []), ...(alert.relatedRegionIds || [])],
      summary: alert.escalationHint,
    };
  }
  if (input.watchlist) {
    const watch = input.watchlist;
    return {
      id: watch.id,
      type: 'watchlist',
      title: watch.title,
      timestamp: watch.updatedAt,
      confidence: watch.severity,
      caveat: 'Watchlist match candidates require analyst validation.',
      provenance: `${watch.type} criteria: ${watch.criteria}`,
      linkedIds: [watch.id],
      summary: `Owner ${watch.analystOwner}`,
    };
  }
  if (input.region) {
    const region = input.region;
    return {
      id: region.id,
      type: 'region',
      title: region.name,
      timestamp: region.updatedAt,
      confidence: input.regionSummary?.confidenceBand,
      caveat: input.regionSummary?.caveatText || 'Region summary is monitoring, not prediction.',
      provenance: `Geometry ${region.geometryType}`,
      linkedIds: [region.id],
      summary: input.regionSummary?.heuristicSummary,
    };
  }
  if (input.overlay) {
    const overlay = input.overlay;
    return {
      id: overlay.trackId,
      type: 'overlay',
      title: `${overlay.type} · ${overlay.label}`,
      timestamp: overlay.observedAt,
      confidence: overlay.verificationLevel,
      caveat: 'Overlay track is separate from incident confirmation.',
      provenance: overlay.sourceReference?.sourceName || overlay.sourceReference?.sourceId,
      linkedIds: [overlay.trackId],
      summary: `Lat ${overlay.latitude.toFixed(2)} Lng ${overlay.longitude.toFixed(2)}`,
    };
  }
  if (input.investigation) {
    const investigation = input.investigation;
    return {
      id: investigation.id,
      type: 'investigation',
      title: investigation.title,
      timestamp: investigation.updatedAt,
      confidence: 'Analyst workspace',
      caveat: 'Pinned context supports analysis but is not proof.',
      provenance: 'Saved workspace state',
      linkedIds: [investigation.id, ...investigation.selectedIncidentIds, ...investigation.selectedEntityIds, ...investigation.selectedNarrativeIds, ...(investigation.pinnedAlertIds || [])],
      summary: investigation.summary,
    };
  }
  if (input.note) {
    const note = input.note;
    return {
      id: note.noteId,
      type: 'note',
      title: note.title,
      timestamp: note.updatedAt || note.createdAt,
      confidence: note.classification,
      caveat: note.confidenceNote,
      provenance: `Analyst ${note.analyst}`,
      linkedIds: [note.noteId, ...note.linkedIncidentIds, ...note.linkedEntityIds, ...note.linkedNarrativeIds],
      summary: note.body,
    };
  }
  if (input.briefing) {
    const briefing = input.briefing;
    return {
      id: briefing.briefingId,
      type: 'briefing',
      title: briefing.title,
      timestamp: briefing.updatedAt,
      confidence: 'Analyst briefing',
      caveat: 'Includes monitoring assessments; not predictive certainty.',
      provenance: 'Briefing editor assembly',
      linkedIds: [briefing.briefingId, ...briefing.sections.flatMap((section) => section.linkedIds || [])],
      summary: `${briefing.sections.length} sections`,
    };
  }
  if (input.searchResult) {
    const result = input.searchResult;
    return {
      id: result.id,
      type: 'search-result',
      title: `${result.type}: ${result.title}`,
      timestamp: result.timestamp,
      confidence: result.confidenceHint,
      caveat: result.caveatHint,
      provenance: `Search score ${result.score ?? 'n/a'}`,
      linkedIds: [result.id, ...(result.linkedIds || [])],
      summary: result.matchExcerpt,
    };
  }
  return undefined;
}
