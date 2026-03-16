function registerSearchRoutes({ addRoute, storage }) {
  addRoute('GET', '/search', async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const q = (url.searchParams.get('q') || '').toLowerCase().trim();
    if (!q) return res.json({ results: [] });

    const events = storage.getEvents?.() || [];
    const incidents = storage.getIncidents?.() || [];
    const entities = storage.getEntities?.() || [];
    const narratives = storage.getNarratives?.() || [];
    const notes = storage.getAnalystNotes?.() || [];
    const briefings = storage.getBriefings?.() || [];
    const overlays = storage.getOverlayTracks?.() || [];

    const results = [];
    const includes = (value) => String(value || '').toLowerCase().includes(q);
    events.forEach((item) => includes(`${item.title} ${item.summary || ''}`) && results.push({ id: item.id, type: 'event', title: item.title, timestamp: item.timestamp, sourceCount: item.references?.length || 0 }));
    incidents.forEach((item) => includes(`${item.title} ${item.region || ''}`) && results.push({ id: item.incidentId, type: 'incident', title: item.title, timestamp: item.updatedAt || new Date().toISOString(), sourceCount: item.sourceSet?.length || 0 }));
    entities.forEach((item) => includes(`${item.label} ${(item.aliases || []).join(' ')}`) && results.push({ id: item.entityId, type: 'entity', title: item.label, timestamp: item.lastSeen || new Date().toISOString(), sourceCount: 0 }));
    narratives.forEach((item) => includes(`${item.title} ${(item.keywords || []).join(' ')}`) && results.push({ id: item.narrativeId, type: 'narrative', title: item.title, timestamp: item.lastSeen, sourceCount: item.sourceCount || 0 }));
    notes.forEach((item) => includes(`${item.title} ${item.body}`) && results.push({ id: item.noteId, type: 'note', title: item.title, timestamp: item.updatedAt || item.createdAt, sourceCount: item.linkedIncidentIds?.length || 0 }));
    briefings.forEach((item) => includes(`${item.title} ${(item.tags || []).join(' ')}`) && results.push({ id: item.briefingId, type: 'briefing', title: item.title, timestamp: item.updatedAt, sourceCount: item.sections?.length || 0 }));
    overlays.forEach((item) => includes(`${item.label} ${item.type}`) && results.push({ id: item.trackId, type: 'overlay', title: item.label, timestamp: item.observedAt, sourceCount: item.sourceReference ? 1 : 0 }));

    res.json({ results: results.slice(0, 80) });
  });
}

module.exports = { registerSearchRoutes };
