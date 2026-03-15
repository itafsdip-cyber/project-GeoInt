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
const { fetchGdeltEvents } = require('./api/connectors/gdeltConnector.cjs');
const { fetchRedditEvents } = require('./api/connectors/redditConnector.cjs');
const { fetchXEvents } = require('./api/connectors/xConnector.cjs');
const { fetchRssEvents } = require('./api/connectors/rssConnector.cjs');

const PORT = process.env.PORT || 3001;
const API_KEY = process.env.ANTHROPIC_API_KEY;

const registry = sourceRegistryFromEnv();
const state = {
  byProvider: {
    gdelt: { nextPollAt: 0, events: [], status: null },
    reddit: { nextPollAt: 0, events: [], status: null },
    x: { nextPollAt: 0, events: [], status: null },
    rss: { nextPollAt: 0, events: [], status: null },
  },
};

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, anthropic-version');
}

function dedupeById(events) {
  const seen = new Set();
  return events.filter((event) => {
    if (seen.has(event.id)) return false;
    seen.add(event.id);
    return true;
  });
}

function toFeed(events, sourceStatuses) {
  const ordered = [...events].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const alerts = ordered.filter((event) => event.severity === 'high').slice(0, 40);
  const timeline = ordered.slice(0, 120);
  const sourceCards = Object.values(sourceStatuses).map((status) => ({
    id: `source-${status.provider}`,
    type: 'source',
    category: 'source',
    title: status.provider.toUpperCase(),
    source: status.provider,
    timestamp: status.checkedAt,
    latitude: null,
    longitude: null,
    severity: status.state === 'active' ? 'low' : 'medium',
    verificationStatus: status.state === 'active' ? 'verified' : 'pending',
    region: 'Global',
    metadata: {
      name: status.provider.toUpperCase(),
      type: 'Provider',
      bias: 'N/A',
      credibility: status.state === 'active' ? 80 : 45,
      health: status.state,
      reason: status.reason,
      url: '#',
    },
  }));

  return {
    alerts,
    events: ordered,
    timeline,
    trajectories: [],
    sources: sourceCards,
    sourceStatuses,
    generatedAt: new Date().toISOString(),
  };
}

async function refreshProvider(providerKey, fetcher, config) {
  const providerState = state.byProvider[providerKey];
  const now = Date.now();
  if (providerState.nextPollAt > now && providerState.status) return;

  const result = await fetcher(config);
  providerState.events = result.events;
  providerState.status = result.status;
  providerState.nextPollAt = now + config.refreshMs;
}

async function getNormalizedEventsPayload() {
  await Promise.all([
    refreshProvider('gdelt', fetchGdeltEvents, registry.gdelt),
    refreshProvider('reddit', fetchRedditEvents, registry.reddit),
    refreshProvider('x', fetchXEvents, registry.x),
    refreshProvider('rss', fetchRssEvents, registry.rss),
  ]);

  const events = dedupeById([
    ...state.byProvider.gdelt.events,
    ...state.byProvider.reddit.events,
    ...state.byProvider.x.events,
    ...state.byProvider.rss.events,
  ]);

  const sourceStatuses = {
    gdelt: state.byProvider.gdelt.status,
    reddit: state.byProvider.reddit.status,
    x: state.byProvider.x.status,
    rss: state.byProvider.rss.status,
  };

  return toFeed(events, sourceStatuses);
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

  if (req.method === 'POST' && req.url === '/v1/messages') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => proxyAnthropic(req, res, body));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`✅ GEOINT live proxy running on http://localhost:${PORT}`);
});
