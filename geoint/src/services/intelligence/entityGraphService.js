const tokenizeActors = (events = []) => {
  const actorRe = /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,2}|IRGC|IDF|US|UAE|NATO|EU|UN)\b/g;
  const actorMap = new Map();
  events.forEach((event) => {
    const text = `${event.title || ''} ${event.summary || ''}`;
    const matches = text.match(actorRe) || [];
    matches.forEach((m) => {
      const key = m.trim();
      if (key.length < 3) return;
      actorMap.set(key, (actorMap.get(key) || 0) + 1);
    });
  });
  return [...actorMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([label, count]) => ({ label, count }));
};

export function buildEntityGraph({ events = [], incidents = [] }) {
  const nodes = [];
  const edges = [];
  const pushNode = (id, type, label, metadata = {}) => {
    if (!nodes.some((node) => node.id === id)) nodes.push({ id, type, label, metadata });
  };
  const pushEdge = (from, to, type, weight = 1) => {
    const existing = edges.find((edge) => edge.from === from && edge.to === to && edge.type === type);
    if (existing) existing.weight += weight;
    else edges.push({ from, to, type, weight });
  };

  const actors = tokenizeActors(events);
  actors.forEach((actor) => pushNode(`actor:${actor.label}`, 'actor', actor.label, { count: actor.count }));

  incidents.forEach((incident) => {
    const incId = `incident:${incident.incidentId}`;
    pushNode(incId, 'incident', incident.title || incident.incidentId, { region: incident.region, category: incident.primaryCategory });
    const category = incident.primaryCategory || 'uncategorized';
    pushNode(`category:${category}`, 'category', category);
    pushEdge(incId, `category:${category}`, 'incident-category', 1);

    if (incident.region) {
      pushNode(`region:${incident.region}`, 'region', incident.region);
      pushEdge(incId, `region:${incident.region}`, 'incident-region', 1);
    }

    (incident.eventIds || []).forEach((eventId) => {
      const event = events.find((item) => item.id === eventId);
      if (!event) return;
      pushNode(`source:${event.source}`, 'source', event.source);
      pushEdge(`source:${event.source}`, incId, 'source-incident', 1);

      actors.forEach((actor) => {
        if ((event.title || '').includes(actor.label)) {
          const actorId = `actor:${actor.label}`;
          pushEdge(actorId, incId, 'actor-incident', 1);
          if (incident.region) pushEdge(actorId, `region:${incident.region}`, 'actor-region', 1);
          pushEdge(actorId, `category:${category}`, 'actor-category', 1);
        }
      });
    });
  });

  const actorNodes = nodes.filter((node) => node.type === 'actor');
  actorNodes.forEach((actorA, index) => {
    actorNodes.slice(index + 1).forEach((actorB) => {
      const linksA = edges.filter((edge) => edge.from === actorA.id && edge.type === 'actor-incident').map((e) => e.to);
      const linksB = edges.filter((edge) => edge.from === actorB.id && edge.type === 'actor-incident').map((e) => e.to);
      const overlap = linksA.filter((value) => linksB.includes(value)).length;
      if (overlap > 0) pushEdge(actorA.id, actorB.id, 'actor-actor', overlap);
    });
  });

  return { nodes, edges, generatedAt: new Date().toISOString() };
}

export function graphSummary(graph = {}) {
  const nodeByType = (type) => (graph.nodes || []).filter((node) => node.type === type).length;
  const topEdges = [...(graph.edges || [])].sort((a, b) => b.weight - a.weight).slice(0, 8);
  return {
    actors: nodeByType('actor'),
    incidents: nodeByType('incident'),
    regions: nodeByType('region'),
    sources: nodeByType('source'),
    topEdges,
  };
}
