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
  region?: string;
}

function toMillis(value?: string) {
  if (!value) return undefined;
  const stamp = Date.parse(value);
  return Number.isNaN(stamp) ? undefined : stamp;
}

function excerpt(value: string, query: string) {
  const lower = value.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx < 0) return value.slice(0, 140);
  const start = Math.max(0, idx - 24);
  const end = Math.min(value.length, idx + query.length + 54);
  return value.slice(start, end).trim();
}

function scoreText(haystack: string, query: string) {
  const q = query.toLowerCase();
  const h = haystack.toLowerCase();
  if (!q) return 0;
  if (h === q) return 20;
  if (h.startsWith(q)) return 12;
  if (h.includes(q)) return 8;
  return 0;
}

function withinDate(timestamp: string, startMs?: number, endMs?: number) {
  const value = Date.parse(timestamp);
  if (Number.isNaN(value)) return false;
  if (startMs && value < startMs) return false;
  if (endMs && value > endMs) return false;
  return true;
}

function pushResult(results: SearchResult[], result: SearchResult, query: string, searchable: string, freshnessTs: string) {
  const freshness = Date.now() - Date.parse(freshnessTs || new Date().toISOString());
  const freshnessBoost = Number.isNaN(freshness) ? 0 : Math.max(0, 2 - freshness / (1000 * 60 * 60 * 24 * 7));
  const baseScore = scoreText(searchable, query) + freshnessBoost;
  results.push({ ...result, score: Number(baseScore.toFixed(2)), matchExcerpt: excerpt(searchable, query) });
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

  const startMs = toMillis(filters.startDate);
  const endMs = toMillis(filters.endDate);
  const sourceFilter = (filters.source || '').trim().toLowerCase();
  const regionFilter = (filters.region || '').trim().toLowerCase();

  const results: SearchResult[] = [];
  data.events.forEach((event) => {
    const searchable = `${event.title} ${event.summary || ''} ${event.region || ''}`;
    const sourceRefs = (event.references || []).map((ref) => ref.sourceName || ref.sourceId);
    if (!scoreText(searchable, query)) return;
    if (sourceFilter && !sourceRefs.join(' ').toLowerCase().includes(sourceFilter)) return;
    if (regionFilter && !(event.region || '').toLowerCase().includes(regionFilter)) return;
    if (!withinDate(event.timestamp, startMs, endMs)) return;
    pushResult(results, { id: event.id, type: 'event', title: event.title, timestamp: event.timestamp, sourceCount: sourceRefs.length || 0, sourceRefs, region: event.region, confidenceHint: event.verificationLevel, caveatHint: 'Observed reporting may include uncertainty.' }, query, searchable, event.timestamp);
  });

  data.incidents.forEach((incident) => {
    const stamp = incident.updatedAt || incident.lastSeen || incident.createdAt || new Date().toISOString();
    const searchable = `${incident.title} ${incident.summary || ''} ${(incident.regionTags || []).join(' ')} ${incident.region || ''}`;
    if (!scoreText(searchable, query)) return;
    if (sourceFilter && !(incident.sourceSet || []).join(' ').toLowerCase().includes(sourceFilter)) return;
    if (regionFilter && !`${incident.region || ''} ${(incident.regionTags || []).join(' ')}`.toLowerCase().includes(regionFilter)) return;
    if (!withinDate(stamp, startMs, endMs)) return;
    pushResult(results, { id: incident.incidentId, type: 'incident', title: incident.title, timestamp: stamp, sourceCount: incident.sourceSet?.length || 0, sourceRefs: incident.sourceSet || [], region: incident.region, confidenceHint: incident.confidenceBand || incident.verificationLevel, caveatHint: incident.caveatText || incident.confidenceNote, linkedIds: [...(incident.linkedEntityIds || []), ...(incident.linkedNarrativeIds || []), ...(incident.eventIds || [])] }, query, searchable, stamp);
  });

  data.entities.forEach((entity) => {
    const searchable = `${entity.label} ${entity.aliases.join(' ')}`;
    if (!scoreText(searchable, query)) return;
    if (!withinDate(entity.lastSeen, startMs, endMs)) return;
    pushResult(results, { id: entity.entityId, type: 'entity', title: entity.label, timestamp: entity.lastSeen, sourceCount: 0, confidenceHint: 'Entity relationship graph linkage', caveatHint: 'Co-occurrence links are non-causal.' }, query, searchable, entity.lastSeen);
  });

  data.narratives.forEach((narrative) => {
    const searchable = `${narrative.title} ${(narrative.keywords || []).join(' ')}`;
    if (!scoreText(searchable, query)) return;
    if (!withinDate(narrative.lastSeen, startMs, endMs)) return;
    pushResult(results, { id: narrative.narrativeId, type: 'narrative', title: narrative.title, timestamp: narrative.lastSeen, sourceCount: narrative.sourceCount, confidenceHint: narrative.status, caveatHint: narrative.caveatNote || 'Narrative repetition does not prove truth.', linkedIds: [...(narrative.relatedIncidentIds || []), ...(narrative.relatedEntityIds || [])] }, query, searchable, narrative.lastSeen);
  });

  data.notes.forEach((note) => {
    const stamp = note.updatedAt || note.createdAt;
    const searchable = `${note.title} ${note.body} ${(note.tags || []).join(' ')}`;
    if (!scoreText(searchable, query)) return;
    if (!withinDate(stamp, startMs, endMs)) return;
    pushResult(results, { id: note.noteId, type: 'note', title: note.title, timestamp: stamp, sourceCount: note.linkedIncidentIds.length, confidenceHint: note.classification, caveatHint: note.confidenceNote, linkedIds: [...note.linkedIncidentIds, ...note.linkedEntityIds, ...note.linkedNarrativeIds] }, query, searchable, stamp);
  });

  data.briefings.forEach((briefing) => {
    const searchable = `${briefing.title} ${briefing.tags.join(' ')}`;
    if (!scoreText(searchable, query)) return;
    if (!withinDate(briefing.updatedAt, startMs, endMs)) return;
    pushResult(results, { id: briefing.briefingId, type: 'briefing', title: briefing.title, timestamp: briefing.updatedAt, sourceCount: briefing.sections.length, confidenceHint: 'Analyst briefing product', linkedIds: briefing.sections.flatMap((section) => section.linkedIds || []) }, query, searchable, briefing.updatedAt);
  });

  data.overlays.forEach((overlay) => {
    const searchable = `${overlay.label} ${overlay.type}`;
    if (!scoreText(searchable, query)) return;
    const src = overlay.sourceReference?.sourceName || overlay.sourceReference?.sourceId || '';
    if (sourceFilter && !src.toLowerCase().includes(sourceFilter)) return;
    if (!withinDate(overlay.observedAt, startMs, endMs)) return;
    pushResult(results, { id: overlay.trackId, type: 'overlay', title: overlay.label, timestamp: overlay.observedAt, sourceCount: overlay.sourceReference ? 1 : 0, sourceRefs: src ? [src] : [], confidenceHint: overlay.verificationLevel, caveatHint: 'Overlay track is separate from incident confirmation.' }, query, searchable, overlay.observedAt);
  });

  const byType = new Set(filters.types || []);
  return results
    .filter((item) => !filters.types?.length || byType.has(item.type))
    .sort((a, b) => (b.score || 0) - (a.score || 0) || Date.parse(b.timestamp) - Date.parse(a.timestamp))
    .slice(0, 60);
}
