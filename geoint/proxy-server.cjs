const http = require('http');
const https = require('https');

try {
  require('dotenv').config();
} catch (error) {
  if (error && error.code === 'MODULE_NOT_FOUND') {
    console.warn('⚠️ dotenv is not installed. Run `npm install` to load .env files automatically.');
  } else {
    throw error;
  }
}

const { sourceRegistryFromEnv } = require('./api/sourceRegistry.cjs');
const { createSourceManager } = require('./api/sourceManager.cjs');
const { fetchGdeltEvents } = require('./api/connectors/gdeltConnector.cjs');
const { fetchRedditEvents } = require('./api/connectors/redditConnector.cjs');
const { fetchXEvents } = require('./api/connectors/xConnector.cjs');
const { fetchRssEvents } = require('./api/connectors/rssConnector.cjs');
const { fetchAcledEvents } = require('./api/connectors/acledConnector.cjs');
const { buildTrajectories } = require('./api/trajectory.cjs');
const { appendSnapshot, safeReadStore } = require('./api/persistenceStore.cjs');

const PORT = process.env.PORT || 3001;
const API_KEY = process.env.ANTHROPIC_API_KEY;

const registry = sourceRegistryFromEnv();
const sourceManager = createSourceManager(registry);
const state = {
  byProvider: Object.fromEntries(Object.keys(registry).map((key) => [key, { nextPollAt: 0, events: [], status: null }])),
};

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, anthropic-version');
}

function dedupeById(events) {
  const seen = new Set();
  return events.filter((event) => {
    if (!event?.id || seen.has(event.id)) return false;
    seen.add(event.id);
    return true;
  });
}

function toFeed(events, sourceStatuses) {
  const ordered = [...events].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const alerts = ordered.filter((event) => event.severity === 'high' || event.severity === 'critical').slice(0, 40);
  const timeline = ordered.slice(0, 120);
  const trajectories = buildTrajectories(ordered).slice(0, 80);

  const sourceCards = Object.values(sourceStatuses).filter(Boolean).map((status) => ({
    id: `source-${status.provider}`,
    type: 'source',
    category: 'source',
    title: String(status.provider || 'source').toUpperCase(),
    source: status.provider,
    timestamp: status.checkedAt,
    latitude: null,
    longitude: null,
    severity: status.active ? 'low' : 'medium',
    verificationStatus: status.active ? 'verified' : 'pending',
    region: 'Global',
    metadata: {
      name: String(status.provider || 'source').toUpperCase(),
      type: 'Provider',
      bias: 'N/A',
      credibility: status.active ? 80 : 45,
      health: status.state,
      reason: status.reason,
      url: '#',
    },
  }));

  return {
    alerts,
    events: ordered,
    timeline,
    trajectories,
    sources: sourceCards,
    sourceStatuses,
    generatedAt: new Date().toISOString(),
  };
}

async function refreshProvider(providerKey, fetcher, config) {
  const providerState = state.byProvider[providerKey];
  const now = Date.now();
  if (providerState.nextPollAt > now && providerState.status) return;

  try {
    const result = await fetcher(config);
    providerState.events = Array.isArray(result.events) ? result.events : [];
    providerState.status = sourceManager.updateStatus(providerKey, result.status || {
      provider: providerKey,
      state: 'error',
      reason: 'No status returned',
      checkedAt: new Date().toISOString(),
    }, config);
  } catch (error) {
    providerState.events = [];
    providerState.status = sourceManager.updateStatus(providerKey, {
      provider: providerKey,
      state: 'error',
      reason: 'Connector failed',
      lastError: error.message,
      checkedAt: new Date().toISOString(),
    }, config);
  }
  providerState.nextPollAt = now + config.refreshMs;
}

async function getNormalizedEventsPayload() {
  await Promise.all([
    refreshProvider('gdelt', fetchGdeltEvents, registry.gdelt),
    refreshProvider('rss', fetchRssEvents, registry.rss),
    refreshProvider('acled', fetchAcledEvents, registry.acled),
    refreshProvider('reddit', fetchRedditEvents, registry.reddit),
    refreshProvider('x', fetchXEvents, registry.x),
  ]);

  const events = dedupeById(Object.values(state.byProvider).flatMap((entry) => entry.events || []));
  const sourceStatuses = sourceManager.snapshot();
  const feed = toFeed(events, sourceStatuses);
  appendSnapshot({ events: feed.events, incidents: [], trajectories: feed.trajectories || [] });
  return feed;
}

function proxyAnthropic(req, res, body) {
  if (!API_KEY) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY missing' }));
    return;
  }

  const options = {
    hostname: 'api.anthropic.com',
    port: 443,
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Length': Buffer.byteLength(body),
    },
  };

  const proxyReq = https.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 500, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  });

  proxyReq.write(body);
  proxyReq.end();
}

async function parseRequestBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return {};
  }
}

const server = http.createServer(async (req, res) => {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/events/normalized') {
    try {
      const payload = await getNormalizedEventsPayload();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(payload));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  if (req.method === 'GET' && req.url === '/history') {
    const store = safeReadStore();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(store));
    return;
  }


  if (req.method === 'GET' && req.url === '/history/events') {
    const store = safeReadStore();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ events: store.events || [], updatedAt: store.updatedAt }));
    return;
  }

  if (req.method === 'GET' && req.url === '/history/incidents') {
    const store = safeReadStore();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ incidents: store.incidents || [], analystNotes: store.analystNotes || [], updatedAt: store.updatedAt }));
    return;
  }

  if (req.method === 'GET' && req.url === '/history/entities') {
    const store = safeReadStore();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ entities: store.entityNodes || [], updatedAt: store.updatedAt }));
    return;
  }

  if (req.method === 'GET' && req.url === '/history/narratives') {
    const store = safeReadStore();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ narratives: store.narratives || [], updatedAt: store.updatedAt }));
    return;
  }

  if (req.method === 'POST' && req.url === '/history/snapshot') {
    const body = await parseRequestBody(req);
    const merged = appendSnapshot({ events: body.events || [], incidents: body.incidents || [], trajectories: body.trajectories || [], analystNotes: body.analystNotes || [], entityNodes: body.entityNodes || [], narratives: body.narratives || [], watchlists: body.watchlists || [] });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(merged));
    return;
  }

  if (req.method === 'POST' && req.url === '/v1/messages') {
    let body = '';
    req.on('data', (chunk) => { body += chunk.toString(); });
    req.on('end', () => proxyAnthropic(req, res, body));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`✅ GEOINT live proxy running on http://localhost:${PORT}`);
});
