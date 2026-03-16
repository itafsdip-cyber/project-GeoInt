function registerBriefingsRoutes({ addRoute, storage }) {
  addRoute('GET', '/briefings', async (_req, res) => {
    res.json({ briefings: storage.getBriefings() });
  });

  addRoute('POST', '/briefings', async (req, res) => {
    const body = await req.json();
    const now = new Date().toISOString();
    const briefing = {
      briefingId: body.briefingId || `brief-${Date.now()}`,
      title: body.title || 'GeoInt Briefing',
      createdAt: body.createdAt || now,
      updatedAt: now,
      tags: Array.isArray(body.tags) ? body.tags : [],
      sections: Array.isArray(body.sections) ? body.sections : [],
    };
    res.json({ briefing: storage.saveBriefing(briefing) }, 201);
  });

  addRoute('PATCH', '/briefings/:id', async (req, res) => {
    const body = await req.json();
    const updated = storage.updateBriefing(req.params.id, { ...body, updatedAt: new Date().toISOString() });
    if (!updated) return res.json({ error: 'Briefing not found' }, 404);
    return res.json({ briefing: updated });
  });

  addRoute('DELETE', '/briefings/:id', async (req, res) => {
    const deleted = storage.deleteBriefing(req.params.id);
    if (!deleted) return res.json({ error: 'Briefing not found' }, 404);
    return res.json({ deleted: true });
  });
}

module.exports = { registerBriefingsRoutes };
