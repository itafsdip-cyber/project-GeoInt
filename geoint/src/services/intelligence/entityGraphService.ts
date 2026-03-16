import type { AnalystNote, EntityNode, EntityRelation, Incident, IntelligenceEvent, NarrativeCluster } from '../../types/intelligence';

const actorRegex = /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,2}|IRGC|IDF|NATO|EU|UN|US|UAE)\b/g;

function asIso(value?: string) {
  const parsed = value ? Date.parse(value) : NaN;
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : new Date().toISOString();
}

export function buildEntityGraphModel({ events = [], incidents = [], narratives = [], notes = [] }: {
  events: IntelligenceEvent[];
  incidents: Incident[];
  narratives: NarrativeCluster[];
  notes: AnalystNote[];
}) {
  const nodeMap = new Map<string, EntityNode>();
  const edgeMap = new Map<string, EntityRelation>();

  const ensureNode = (entityId: string, label: string, type: EntityNode['type'], seenAt: string, alias?: string) => {
    const existing = nodeMap.get(entityId);
    if (existing) {
      existing.firstSeen = existing.firstSeen < seenAt ? existing.firstSeen : seenAt;
      existing.lastSeen = existing.lastSeen > seenAt ? existing.lastSeen : seenAt;
      if (alias && !existing.aliases.includes(alias)) existing.aliases.push(alias);
      return existing;
    }
    const node: EntityNode = { entityId, label, aliases: alias ? [alias] : [], firstSeen: seenAt, lastSeen: seenAt, type, linkedIncidentCount: 0, linkedNarrativeCount: 0, linkedNoteCount: 0 };
    nodeMap.set(entityId, node);
    return node;
  };

  const pushEdge = (fromEntityId: string, toEntityId: string, edgeType: EntityRelation['edgeType'], seenAt: string, caveat?: string) => {
    const edgeId = `${fromEntityId}::${toEntityId}::${edgeType}`;
    const existing = edgeMap.get(edgeId);
    if (existing) {
      existing.weight += 1;
      existing.firstSeen = existing.firstSeen < seenAt ? existing.firstSeen : seenAt;
      existing.lastSeen = existing.lastSeen > seenAt ? existing.lastSeen : seenAt;
      return;
    }
    edgeMap.set(edgeId, {
      relationId: `rel-${edgeMap.size + 1}`,
      fromEntityId,
      toEntityId,
      edgeType,
      weight: 1,
      firstSeen: seenAt,
      lastSeen: seenAt,
      caveat,
    });
  };

  events.forEach((event) => {
    const ts = asIso(event.timestamp);
    const eventSource = event.references?.[0]?.sourceName || event.source || 'Unknown Source';
    const sourceNode = ensureNode(`source:${eventSource}`, eventSource, 'source', ts);

    const text = `${event.title || ''} ${event.summary || ''}`;
    const actors = [...new Set((text.match(actorRegex) || []).map((item) => item.trim()).filter((item) => item.length > 2))];
    actors.forEach((actor) => {
      const actorNode = ensureNode(`actor:${actor}`, actor, 'actor', ts);
      pushEdge(sourceNode.entityId, actorNode.entityId, 'SOURCE_REPORTS_ON', ts);
    });

    if (event.region) {
      const regionNode = ensureNode(`region:${event.region}`, event.region, 'region', ts);
      pushEdge(sourceNode.entityId, regionNode.entityId, 'SOURCE_REPORTS_ON', ts);
      actors.forEach((actor) => pushEdge(`actor:${actor}`, regionNode.entityId, 'OPERATES_IN_REGION', ts));
    }

    if (event.metadata?.vessel) {
      const vessel = String(event.metadata.vessel);
      ensureNode(`vessel:${vessel}`, vessel, 'vessel', ts);
      actors.forEach((actor) => pushEdge(`actor:${actor}`, `vessel:${vessel}`, 'CONNECTED_TO_VESSEL', ts, 'Association is mention-based; not proof of operational control.'));
    }

    if (event.metadata?.aircraft) {
      const aircraft = String(event.metadata.aircraft);
      ensureNode(`aircraft:${aircraft}`, aircraft, 'aircraft', ts);
      actors.forEach((actor) => pushEdge(`actor:${actor}`, `aircraft:${aircraft}`, 'CONNECTED_TO_AIRCRAFT', ts, 'Association is mention-based; not proof of operational control.'));
    }

    actors.forEach((a, index) => {
      actors.slice(index + 1).forEach((b) => {
        pushEdge(`actor:${a}`, `actor:${b}`, 'CO_OCCURS_WITH', ts, 'Co-occurrence only; this does not establish command/control or formal affiliation.');
      });
    });
  });

  incidents.forEach((incident) => {
    const ts = asIso(incident.eventIds[0]);
    const incidentNode = ensureNode(`incident:${incident.incidentId}`, incident.title, 'incident', ts);
    incidentNode.linkedIncidentCount = (incidentNode.linkedIncidentCount || 0) + 1;
    (incident.involvedActors || []).forEach((actor) => {
      ensureNode(`actor:${actor}`, actor, 'actor', ts).linkedIncidentCount = (ensureNode(`actor:${actor}`, actor, 'actor', ts).linkedIncidentCount || 0) + 1;
      pushEdge(`actor:${actor}`, incidentNode.entityId, 'MENTIONED_IN_INCIDENT', ts, 'Mention linkage only unless separately sourced as attribution.');
    });
    if (incident.region) {
      ensureNode(`region:${incident.region}`, incident.region, 'region', ts);
      pushEdge(incidentNode.entityId, `region:${incident.region}`, 'OPERATES_IN_REGION', ts);
    }
  });

  narratives.forEach((narrative) => {
    const ts = asIso(narrative.lastSeen);
    const narrativeNode = ensureNode(`narrative:${narrative.narrativeId}`, narrative.title, 'narrative', ts);
    narrativeNode.linkedNarrativeCount = (narrativeNode.linkedNarrativeCount || 0) + 1;
    (narrative.relatedEntityIds || []).forEach((entityId) => pushEdge(entityId, narrativeNode.entityId, 'AMPLIFIES_NARRATIVE', ts, 'Repeated claims do not prove truth.'));
  });

  notes.forEach((note) => {
    const ts = asIso(note.updatedAt || note.createdAt);
    note.linkedEntityIds.forEach((entityId) => {
      const node = nodeMap.get(entityId);
      if (node) node.linkedNoteCount = (node.linkedNoteCount || 0) + 1;
    });
  });

  return { nodes: [...nodeMap.values()], edges: [...edgeMap.values()] };
}
