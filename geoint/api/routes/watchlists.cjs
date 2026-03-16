function registerWatchlistRoutes({ addRoute, storage }) {
  addRoute('GET', '/watchlists', async (_req, res) => {
    res.json({ watchlists: storage.getWatchlists?.() || [], alerts: storage.getWatchlistAlerts?.() || [] });
  });

  addRoute('POST', '/watchlists', async (req, res) => {
    const body = await req.json();
    const now = new Date().toISOString();
    const watchlist = {
      id: body.id || `watch-${Date.now()}`,
      title: body.title || 'Untitled watchlist',
      type: body.type || 'KEYWORD',
      criteria: body.criteria || '',
      createdAt: body.createdAt || now,
      updatedAt: now,
      enabled: body.enabled !== false,
      severity: body.severity || 'MEDIUM',
      analystOwner: body.analystOwner || 'Analyst',
      tags: Array.isArray(body.tags) ? body.tags : [],
    };
    const saved = [...(storage.getWatchlists?.() || []), watchlist];
    storage.saveWatchlists?.(saved);
    res.json({ watchlist }, 201);
  });

  addRoute('PATCH', '/watchlists/:id', async (req, res) => {
    const body = await req.json();
    const current = storage.getWatchlists?.() || [];
    const existing = current.find((item) => item.id === req.params.id);
    if (!existing) return res.json({ error: 'Watchlist not found' }, 404);
    const updated = { ...existing, ...body, id: req.params.id, updatedAt: new Date().toISOString() };
    storage.saveWatchlists?.([...current.filter((item) => item.id !== req.params.id), updated]);
    return res.json({ watchlist: updated });
  });

  addRoute('GET', '/watchlists/alerts', async (_req, res) => {
    res.json({ alerts: storage.getWatchlistAlerts?.() || [] });
  });

  addRoute('POST', '/watchlists/alerts', async (req, res) => {
    const body = await req.json();
    const alert = {
      id: body.id || `alert-${Date.now()}`,
      watchlistId: body.watchlistId,
      matchedObjectType: body.matchedObjectType,
      matchedObjectId: body.matchedObjectId,
      reason: body.reason || 'Watchlist criteria matched',
      createdAt: body.createdAt || new Date().toISOString(),
      severity: body.severity || 'MEDIUM',
      read: Boolean(body.read),
    };
    const saved = [...(storage.getWatchlistAlerts?.() || []), alert];
    storage.saveWatchlistAlerts?.(saved);
    res.json({ alert }, 201);
  });
}

module.exports = { registerWatchlistRoutes };
