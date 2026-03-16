const http = require('http');
const https = require('https');
const { URL } = require('url');

try { require('dotenv').config(); } catch {}

const { sourceRegistryFromEnv } = require('./api/sourceRegistry.cjs');
const { createSourceManager } = require('./api/sourceManager.cjs');
const { fetchGdeltEvents } = require('./api/connectors/gdeltConnector.cjs');
const { fetchRedditEvents } = require('./api/connectors/redditConnector.cjs');
const { fetchXEvents } = require('./api/connectors/xConnector.cjs');
const { fetchRssEvents } = require('./api/connectors/rssConnector.cjs');
const { fetchAcledEvents } = require('./api/connectors/acledConnector.cjs');
const persistenceStore = require('./api/persistenceStore.cjs');
const { buildTrajectories } = require('./api/trajectory.cjs');
const { createStorage } = require('./api/storage/index.cjs');
const { registerHistoryRoutes } = require('./api/routes/history.cjs');
const { registerProviderRoutes } = require('./api/routes/providers.cjs');
const { registerSourceRoutes } = require('./api/routes/sources.cjs');
const { registerNotesRoutes } = require('./api/routes/notes.cjs');
const { registerBriefingsRoutes } = require('./api/routes/briefings.cjs');
const { registerInvestigationRoutes } = require('./api/routes/investigations.cjs');
const { registerWatchlistRoutes } = require('./api/routes/watchlists.cjs');
const { registerSearchRoutes } = require('./api/routes/search.cjs');
const { registerIncidentRoutes } = require('./api/routes/incidents.cjs');
const { registerRegionRoutes } = require('./api/routes/regions.cjs');
const { registerAlertsRoutes } = require('./api/routes/alerts.cjs');
const { registerBriefingAssistantRoutes } = require('./api/routes/briefing-assistant.cjs');
const { createConnectorRunner } = require('./api/connectors/connectorRunner.cjs');
const { fetchAisOverlay } = require('./api/connectors/ais.cjs');
const { fetchAdsbOverlay } = require('./api/connectors/adsb.cjs');
const { fetchFirmsOverlay } = require('./api/connectors/firms.cjs');

const PORT = Number(process.env.PORT || 3001);
const API_KEY = process.env.ANTHROPIC_API_KEY;
const allowedOrigins = (process.env.GEOINT_ALLOWED_ORIGINS || '*').split(',').map((value) => value.trim()).filter(Boolean);

const registry = sourceRegistryFromEnv();
const sourceManager = createSourceManager(registry);
const storage = createStorage();
const connectorRunner = createConnectorRunner({ storage });
const routes = [];

function addRoute(method, path, handler) {
  const parts = path.split('/').filter(Boolean);
  routes.push({ method, path, parts, handler });
}

function setCors(req, res) {
  const origin = req.headers.origin;
  const allowOrigin = allowedOrigins.includes('*') ? '*' : (allowedOrigins.includes(origin) ? origin : allowedOrigins[0] || '*');
  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, anthropic-version');
}

function makeReqRes(req) {
  return {
    method: req.method,
    url: req.url,
    headers: req.headers,
    params: {},
    async json() {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      if (!chunks.length) return {};
      try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return {}; }
    },
  };
}

function json(res, payload, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function matchRoute(method, reqUrl) {
  const pathname = new URL(reqUrl, 'http://localhost').pathname;
  const reqParts = pathname.split('/').filter(Boolean);
  for (const route of routes) {
    if (route.method !== method || route.parts.length !== reqParts.length) continue;
    const params = {};
    let matched = true;
    for (let i = 0; i < route.parts.length; i += 1) {
      const routePart = route.parts[i];
      const reqPart = reqParts[i];
      if (routePart.startsWith(':')) params[routePart.slice(1)] = reqPart;
      else if (routePart !== reqPart) {
        matched = false;
        break;
      }
    }
    if (matched) return { route, params };
  }
  return null;
}

async function getNormalizedEventsPayload() {
  const providers = [
    ['gdelt', fetchGdeltEvents, registry.gdelt, 'event'],
    ['rss', fetchRssEvents, registry.rss, 'event'],
    ['acled', fetchAcledEvents, registry.acled, 'event'],
    ['reddit', fetchRedditEvents, registry.reddit, 'event'],
    ['x', fetchXEvents, registry.x, 'event'],
  ];

  const results = await Promise.all(providers.map(([id, fetcher, config, sourceType]) => connectorRunner.runConnector(id, fetcher, config, sourceType)));
  const events = results.flatMap((result) => result.events || []);
  const sourceStatuses = sourceManager.snapshot();
  const ordered = [...events].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const trajectories = buildTrajectories(ordered).slice(0, 80);

  const overlays = await Promise.all([
    connectorRunner.runConnector('ais', fetchAisOverlay, { apiKey: process.env.AIS_API_KEY, endpoint: process.env.AIS_ENDPOINT }, 'overlay'),
    connectorRunner.runConnector('adsb', fetchAdsbOverlay, { apiKey: process.env.ADSB_API_KEY, endpoint: process.env.ADSB_ENDPOINT }, 'overlay'),
    connectorRunner.runConnector('firms', fetchFirmsOverlay, { apiKey: process.env.FIRMS_API_KEY }, 'overlay'),
  ]);

  const normalizedOverlays = overlays.flatMap((result) => result.events || []);
  storage.saveEvents(ordered);
  storage.saveOverlayTracks(normalizedOverlays);
  persistenceStore.appendSnapshot({ events: ordered, incidents: [], trajectories });

  return {
    events: ordered,
    timeline: ordered.slice(0, 120),
    alerts: ordered.filter((event) => ['high', 'critical'].includes(String(event.severity || '').toLowerCase())).slice(0, 40),
    sourceStatuses,
    overlays: normalizedOverlays,
    generatedAt: new Date().toISOString(),
  };
}

addRoute('GET', '/events/normalized', async (_req, res) => json(res, await getNormalizedEventsPayload()));
addRoute('POST', '/v1/messages', async (req, res) => {
  if (!API_KEY) return json(res, { error: 'ANTHROPIC_API_KEY missing' }, 500);
  const body = JSON.stringify(await req.json());
  const options = { hostname: 'api.anthropic.com', port: 443, path: '/v1/messages', method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY, 'anthropic-version': '2023-06-01', 'Content-Length': Buffer.byteLength(body) } };
  const proxyReq = https.request(options, (proxyRes) => { res.writeHead(proxyRes.statusCode || 500, { 'Content-Type': 'application/json' }); proxyRes.pipe(res); });
  proxyReq.on('error', (error) => json(res, { error: error.message }, 500));
  proxyReq.write(body); proxyReq.end();
});

registerHistoryRoutes({ addRoute, persistenceStore });
registerProviderRoutes({ addRoute });
registerSourceRoutes({ addRoute, storage });
registerNotesRoutes({ addRoute, storage });
registerBriefingsRoutes({ addRoute, storage });
registerSearchRoutes({ addRoute, storage });
registerWatchlistRoutes({ addRoute, storage });
registerInvestigationRoutes({ addRoute, storage });
registerIncidentRoutes({ addRoute, storage });
registerRegionRoutes({ addRoute, storage });
registerAlertsRoutes({ addRoute, storage });
registerBriefingAssistantRoutes({ addRoute, storage });

const server = http.createServer(async (rawReq, rawRes) => {
  setCors(rawReq, rawRes);
  if (rawReq.method === 'OPTIONS') { rawRes.writeHead(200); rawRes.end(); return; }

  const matched = matchRoute(rawReq.method, rawReq.url);
  if (!matched) return json(rawRes, { error: 'Not found' }, 404);

  try {
    const req = makeReqRes(rawReq);
    req.params = matched.params;
    await matched.route.handler(req, { json: (payload, status = 200) => json(rawRes, payload, status) });
  } catch (error) {
    json(rawRes, { error: error.message }, 500);
  }
});

server.listen(PORT, () => console.log(`✅ GEOINT live proxy running on http://0.0.0.0:${PORT}`));
