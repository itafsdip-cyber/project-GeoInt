function registerRegionRoutes({ addRoute, storage }) {
  addRoute('GET', '/regions', async (_req, res) => {
    res.json({ regions: storage.getMonitoredRegions?.() || [] });
  });

  addRoute('POST', '/regions', async (req, res) => {
    const body = await req.json();
    const now = new Date().toISOString();
    const region = {
      id: body.id || `region-${Date.now()}`,
      name: body.name || 'Untitled region',
      geometryType: body.geometryType || 'VIEWPORT',
      bbox: body.bbox,
      circle: body.circle,
      polygon: body.polygon,
      viewport: body.viewport,
      createdAt: body.createdAt || now,
      updatedAt: now,
      tags: Array.isArray(body.tags) ? body.tags : [],
    };
    storage.saveMonitoredRegions?.([region]);
    res.json({ region }, 201);
  });
}

module.exports = { registerRegionRoutes };
