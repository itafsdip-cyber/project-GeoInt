import type {
  AnalystNote,
  BriefingDocument,
  Incident,
  IntelligenceEvent,
  NarrativeCluster,
  OverlayTrack,
  SearchResult,
  EntityNode,
} from '../../types/intelligence';

export interface SearchFilters {
  text: string;
  types: string[];
  source?: string;
  tags?: string[];
  startDate?: string;
  endDate?: string;
}

function includesText(value: string, text: string) {
  return value.toLowerCase().includes(text.toLowerCase());
}

export function runGlobalIntelligenceSearch(data: {
  events: IntelligenceEvent[];
  incidents: Incident[];
  entities: EntityNode[];
  narratives: NarrativeCluster[];
  notes: AnalystNote[];
  briefings: BriefingDocument[];
  overlays: OverlayTrack[];
}, filters: SearchFilters): SearchResult[] {
  const query = filters.text.trim();
  if (!query) return [];

  const results: SearchResult[] = [];
  data.events.forEach((event) => {
    if (includesText(`${event.title} ${event.summary || ''} ${event.region || ''}`, query)) {
      results.push({ id: event.id, type: 'event', title: event.title, timestamp: event.timestamp, sourceCount: event.references?.length || 0, confidenceHint: event.verificationLevel, caveatHint: 'Observed reporting may include uncertainty.' });
    }
  });
  data.incidents.forEach((incident) => {
    if (includesText(`${incident.title} ${incident.region || ''}`, query)) results.push({ id: incident.incidentId, type: 'incident', title: incident.title, timestamp: new Date().toISOString(), sourceCount: incident.sourceSet?.length || 0, confidenceHint: incident.verificationLevel, caveatHint: incident.confidenceNote });
  });
  data.entities.forEach((entity) => {
    if (includesText(`${entity.label} ${entity.aliases.join(' ')}`, query)) results.push({ id: entity.entityId, type: 'entity', title: entity.label, timestamp: entity.lastSeen, sourceCount: 0, confidenceHint: 'Entity relationship graph linkage', caveatHint: 'Co-occurrence links are non-causal.' });
  });
  data.narratives.forEach((narrative) => {
    if (includesText(`${narrative.title} ${(narrative.keywords || []).join(' ')}`, query)) results.push({ id: narrative.narrativeId, type: 'narrative', title: narrative.title, timestamp: narrative.lastSeen, sourceCount: narrative.sourceCount, confidenceHint: narrative.status, caveatHint: 'Narrative repetition does not prove truth.' });
  });
  data.notes.forEach((note) => {
    if (includesText(`${note.title} ${note.body}`, query)) results.push({ id: note.noteId, type: 'note', title: note.title, timestamp: note.updatedAt || note.createdAt, sourceCount: note.linkedIncidentIds.length, confidenceHint: note.classification, caveatHint: note.confidenceNote });
  });
  data.briefings.forEach((briefing) => {
    if (includesText(`${briefing.title} ${briefing.tags.join(' ')}`, query)) results.push({ id: briefing.briefingId, type: 'briefing', title: briefing.title, timestamp: briefing.updatedAt, sourceCount: briefing.sections.length, confidenceHint: 'Analyst briefing product' });
  });
  data.overlays.forEach((overlay) => {
    if (includesText(`${overlay.label} ${overlay.type}`, query)) results.push({ id: overlay.trackId, type: 'overlay', title: overlay.label, timestamp: overlay.observedAt, sourceCount: overlay.sourceReference ? 1 : 0, confidenceHint: overlay.verificationLevel, caveatHint: 'Overlay track is separate from incident confirmation.' });
  });

  const byType = new Set(filters.types || []);
  return results
    .filter((item) => !filters.types?.length || byType.has(item.type))
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
    .slice(0, 60);
}
