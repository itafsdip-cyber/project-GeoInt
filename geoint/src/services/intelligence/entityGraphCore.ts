import type { EntityNode, EntityRelation, IntelligenceEvent, Incident } from '../../types/intelligence';

const EDGE_TYPES = ['CO_OCCURS_WITH', 'MENTIONED_IN_INCIDENT', 'OPERATES_IN_REGION', 'ATTRIBUTED_TO', 'AMPLIFIES_NARRATIVE', 'SOURCE_REPORTS_ON', 'CONNECTED_TO_VESSEL', 'CONNECTED_TO_AIRCRAFT'] as const;

export function buildPersistentEntityGraph(events: IntelligenceEvent[] = [], incidents: Incident[] = []) {
  const entities: EntityNode[] = [];
  const relations: EntityRelation[] = [];
  const now = new Date().toISOString();
  const ensureEntity = (label: string) => {
    const id = `entity:${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    if (!entities.find((e) => e.entityId === id)) entities.push({ entityId: id, label, aliases: [], firstSeen: now, lastSeen: now });
    return id;
  };
  const pushEdge = (fromEntityId: string, toEntityId: string, edgeType: typeof EDGE_TYPES[number], weight = 1) => {
    const existing = relations.find((r) => r.fromEntityId === fromEntityId && r.toEntityId === toEntityId && r.edgeType === edgeType);
    if (existing) {
      existing.weight += weight;
      existing.lastSeen = now;
      return;
    }
    relations.push({ relationId: `rel:${fromEntityId}:${toEntityId}:${edgeType}`, fromEntityId, toEntityId, edgeType, weight, firstSeen: now, lastSeen: now });
  };

  incidents.forEach((incident) => {
    const incidentNode = ensureEntity(incident.title);
    incident.eventIds.forEach((eventId) => {
      const event = events.find((candidate) => candidate.id === eventId);
      if (!event) return;
      const sourceNode = ensureEntity(event.references[0]?.sourceName || 'Unknown Source');
      pushEdge(sourceNode, incidentNode, 'SOURCE_REPORTS_ON', 1);
      if (event.region) {
        const regionNode = ensureEntity(event.region);
        pushEdge(incidentNode, regionNode, 'OPERATES_IN_REGION', 1);
      }
    });
  });

  return { entities, relations, caveat: 'Co-occurrence and mention edges are not proof of command linkage.' };
}
