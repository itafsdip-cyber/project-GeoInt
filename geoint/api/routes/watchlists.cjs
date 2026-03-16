function registerWatchlistRoutes({ addRoute, storage }) {
  const parseJsonBody = async (req, res) => {
    try {
      const body = await req.json();
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        res.json({ error: 'Invalid JSON body' }, 400);
        return null;
      }
      return body;
    } catch {
      res.json({ error: 'Invalid JSON body' }, 400);
      return null;
    }
  };

  addRoute('GET', '/watchlists', async (_req, res) => {
    res.json({ watchlists: storage.getWatchlists?.() || [], alerts: storage.getWatchlistAlerts?.() || [] });
  });

  addRoute('POST', '/watchlists', async (req, res) => {
    const body = await parseJsonBody(req, res);
    if (!body) return;
    const now = new Date().toISOString();
    if (typeof body.title !== 'string' || !body.title.trim()) {
      return res.json({ error: 'Watchlist title is required' }, 400);
    }

    const watchlists = storage.getWatchlists?.() || [];
    if (watchlists.some((item) => item.title.toLowerCase() === body.title.trim().toLowerCase())) {
      return res.json({ error: 'Watchlist title already exists' }, 409);
    }

    const watchlist = {
      id: body.id || `watch-${Date.now()}`,
      title: body.title.trim(),
      type: body.type || 'KEYWORD',
      criteria: body.criteria || '',
      createdAt: body.createdAt || now,
      updatedAt: now,
      enabled: body.enabled !== false,
      severity: body.severity || 'MEDIUM',
      analystOwner: body.analystOwner || 'Analyst',
      tags: Array.isArray(body.tags) ? body.tags : [],
    };
    const saved = [...watchlists, watchlist];
    storage.saveWatchlists?.(saved);
    res.json({ watchlist }, 201);
  });

  addRoute('PATCH', '/watchlists/:id', async (req, res) => {
    const body = await parseJsonBody(req, res);
    if (!body) return;
    const current = storage.getWatchlists?.() || [];
    const existing = current.find((item) => item.id === req.params.id);
    if (!existing) return res.json({ error: 'Watchlist not found' }, 404);
    if (body.title !== undefined && (typeof body.title !== 'string' || !body.title.trim())) {
      return res.json({ error: 'Watchlist title must be a non-empty string' }, 400);
    }
    const updated = {
      ...existing,
      ...body,
      title: typeof body.title === 'string' ? body.title.trim() : existing.title,
      id: req.params.id,
      updatedAt: new Date().toISOString(),
    };
    storage.saveWatchlists?.([...current.filter((item) => item.id !== req.params.id), updated]);
    return res.json({ watchlist: updated });
  });

  addRoute('GET', '/watchlists/alerts', async (_req, res) => {
    res.json({ alerts: storage.getWatchlistAlerts?.() || [] });
  });

  addRoute('POST', '/watchlists/alerts', async (req, res) => {
    const body = await parseJsonBody(req, res);
    if (!body) return;
    if (typeof body.watchlistId !== 'string' || !body.watchlistId) {
      return res.json({ error: 'watchlistId is required' }, 400);
    }
    if (typeof body.matchedObjectType !== 'string' || !body.matchedObjectType) {
      return res.json({ error: 'matchedObjectType is required' }, 400);
    }
    if (typeof body.matchedObjectId !== 'string' || !body.matchedObjectId) {
      return res.json({ error: 'matchedObjectId is required' }, 400);
    }
    const alert = {
      id: body.id || `alert-${Date.now()}`,
      watchlistId: body.watchlistId,
      matchedObjectType: body.matchedObjectType,
      matchedObjectId: body.matchedObjectId,
      reason: body.reason || 'Watchlist criteria matched',
      createdAt: body.createdAt || new Date().toISOString(),
      severity: body.severity || 'MEDIUM',
      read: Boolean(body.read),
      priorityScore: Number(body.priorityScore || 0),
      scoreBreakdown: body.scoreBreakdown || {},
      escalationHint: body.escalationHint,
      relatedRegionIds: Array.isArray(body.relatedRegionIds) ? body.relatedRegionIds : [],
      relatedIncidentIds: Array.isArray(body.relatedIncidentIds) ? body.relatedIncidentIds : [],
      caveatText: body.caveatText,
    };
    const saved = [...(storage.getWatchlistAlerts?.() || []), alert];
    storage.saveWatchlistAlerts?.(saved);
    res.json({ alert }, 201);
  });
}

module.exports = { registerWatchlistRoutes };
