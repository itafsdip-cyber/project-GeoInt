function registerInvestigationRoutes({ addRoute, storage }) {
  addRoute('GET', '/investigations', async (_req, res) => {
    res.json({ investigations: storage.getInvestigations?.() || [] });
  });

  addRoute('POST', '/investigations', async (req, res) => {
    const body = await req.json();
    const now = new Date().toISOString();
    const investigation = {
      id: body.id || `inv-${Date.now()}`,
      title: body.title || 'Untitled investigation',
      summary: body.summary || '',
      createdAt: body.createdAt || now,
      updatedAt: now,
      selectedEntityIds: Array.isArray(body.selectedEntityIds) ? body.selectedEntityIds : [],
      selectedIncidentIds: Array.isArray(body.selectedIncidentIds) ? body.selectedIncidentIds : [],
      selectedNarrativeIds: Array.isArray(body.selectedNarrativeIds) ? body.selectedNarrativeIds : [],
      selectedOverlayIds: Array.isArray(body.selectedOverlayIds) ? body.selectedOverlayIds : [],
      savedQuery: body.savedQuery || '',
      savedFilters: body.savedFilters || {},
      linkedNoteIds: Array.isArray(body.linkedNoteIds) ? body.linkedNoteIds : [],
      linkedBriefingIds: Array.isArray(body.linkedBriefingIds) ? body.linkedBriefingIds : [],
    };
    storage.saveInvestigation?.(investigation);
    res.json({ investigation }, 201);
  });

  addRoute('PATCH', '/investigations/:id', async (req, res) => {
    const body = await req.json();
    const existing = (storage.getInvestigations?.() || []).find((item) => item.id === req.params.id);
    if (!existing) return res.json({ error: 'Investigation not found' }, 404);
    const updated = { ...existing, ...body, id: req.params.id, updatedAt: new Date().toISOString() };
    storage.saveInvestigation?.(updated);
    return res.json({ investigation: updated });
  });

  addRoute('DELETE', '/investigations/:id', async (req, res) => {
    const deleted = storage.deleteInvestigation?.(req.params.id);
    if (!deleted) return res.json({ error: 'Investigation not found' }, 404);
    return res.json({ deleted: true });
  });
}

module.exports = { registerInvestigationRoutes };
