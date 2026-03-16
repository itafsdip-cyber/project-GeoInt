const { URL } = require('url');

function parseQuery(req) {
  const parsed = new URL(req.url, 'http://localhost');
  return parsed.searchParams;
}

function summarizeRuns(runs) {
  const bySource = new Map();
  for (const run of runs) {
    const existing = bySource.get(run.sourceId) || {
      sourceId: run.sourceId,
      enabled: true,
      healthState: 'UNKNOWN',
      lastSuccess: undefined,
      lastError: undefined,
      lastRunState: undefined,
      staleAgeMs: undefined,
      warningCount: 0,
      errorsCount: 0,
      durationMs: undefined,
      itemsFetched: 0,
      itemsNormalized: 0,
      itemsDropped: 0,
      degradedReason: undefined,
      authRequired: false,
    };

    if (!existing.lastRunState || new Date(run.startedAt) > new Date(existing.lastStartedAt || 0)) {
      existing.lastRunState = run.state;
      existing.healthState = run.healthStateAfterRun || existing.healthState;
      existing.warningCount = run.warningsCount || 0;
      existing.errorsCount = run.errorsCount || 0;
      existing.durationMs = run.durationMs;
      existing.itemsFetched = run.itemsFetched || 0;
      existing.itemsNormalized = run.itemsNormalized || 0;
      existing.itemsDropped = run.itemsDropped || 0;
      existing.lastStartedAt = run.startedAt;
      if (run.errorMessages?.length) {
        existing.lastError = run.errorMessages[0];
        existing.degradedReason = run.errorMessages[0];
      }
      const hasAuthError = (run.errorMessages || []).some((message) => String(message).toLowerCase().includes('auth'));
      existing.authRequired = hasAuthError || existing.healthState === 'AUTH_MISSING';
      if (['SUCCESS', 'PARTIAL_SUCCESS'].includes(run.state)) existing.lastSuccess = run.finishedAt || run.startedAt;
      if (run.finishedAt) existing.staleAgeMs = Date.now() - Date.parse(run.finishedAt);
    }
    bySource.set(run.sourceId, existing);
  }

  return [...bySource.values()].map(({ lastStartedAt, ...item }) => {
    if (item.healthState === 'UNAVAILABLE' && item.lastRunState === 'FAILED') item.healthState = 'FAILED';
    if (item.staleAgeMs && item.staleAgeMs > 60 * 60 * 1000 && item.healthState === 'ACTIVE') item.healthState = 'STALE';
    return item;
  });
}

function connectorMetadata() {
  const firmsConfigured = Boolean(process.env.FIRMS_API_KEY);
  return [
    {
      sourceId: 'firms',
      sourceType: 'overlay',
      requiresAuth: true,
      configured: firmsConfigured,
      degraded: !firmsConfigured,
      capabilities: ['FIRE', 'HOTSPOT'],
      requirementNotes: 'Requires FIRMS API key and endpoint access.',
    },
    {
      sourceId: 'adsb',
      sourceType: 'overlay',
      requiresAuth: true,
      configured: Boolean(process.env.ADSB_API_KEY),
      degraded: true,
      capabilities: ['AIR'],
      requirementNotes: 'Requires ADS-B API endpoint and credentials.',
    },
    {
      sourceId: 'ais',
      sourceType: 'overlay',
      requiresAuth: true,
      configured: Boolean(process.env.AIS_API_KEY),
      degraded: true,
      capabilities: ['MARITIME'],
      requirementNotes: 'Requires AIS API endpoint and credentials.',
    },
  ];
}

function registerSourceRoutes({ addRoute, storage }) {
  addRoute('GET', '/sources/operations', async (_req, res) => {
    res.json({ runs: storage.getIngestionRuns({ limit: 200 }) });
  });

  addRoute('GET', '/sources/status', async (_req, res) => {
    const runs = storage.getIngestionRuns({ limit: 400 });
    res.json({ generatedAt: new Date().toISOString(), sources: summarizeRuns(runs) });
  });

  addRoute('GET', '/sources/runs', async (req, res) => {
    const query = parseQuery(req);
    const sourceId = query.get('sourceId') || undefined;
    const state = query.get('state') || undefined;
    const limit = query.get('limit') ? Number(query.get('limit')) : 100;
    res.json({ runs: storage.getIngestionRuns({ sourceId, state, limit }) });
  });

  addRoute('GET', '/sources/connectors', async (_req, res) => {
    res.json({ connectors: connectorMetadata() });
  });
}

module.exports = { registerSourceRoutes };
