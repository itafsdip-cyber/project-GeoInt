// proxy-server.cjs
// Run this with: node proxy-server.cjs
// It starts on port 3001 and forwards requests to Anthropic API
// Your React app calls http://localhost:3001/v1/messages instead

const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 3001;
require('dotenv').config();
const API_KEY = process.env.ANTHROPIC_API_KEY;

if (!API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY is missing from environment variables.');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  // Allow all CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, anthropic-version');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  let body = '';
  req.on('data', chunk => { body += chunk.toString(); });
  req.on('end', () => {
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
      res.writeHead(proxyRes.statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error('Proxy error:', err.message);
      res.writeHead(500);
      res.end(JSON.stringify({ error: err.message }));
    });

    proxyReq.write(body);
    proxyReq.end();
    console.log(`[${new Date().toUTCString()}] Forwarded request to Anthropic`);
  });
});

server.listen(PORT, () => {
  console.log(`\n✅ GEOINT Proxy running on http://localhost:${PORT}`);
  console.log(`   API key: ${API_KEY.slice(0, 12)}...`);
  console.log(`   Keep this window open while using the dashboard\n`);
});
