const MAX_MESSAGES = 200;
const MAX_MESSAGE_LENGTH = 400;
const RATE_LIMIT_WINDOW_MS = 8000;
const MAX_MESSAGES_PER_WINDOW = 3;
const GUEST_PREFIXES = ['GulfWatcher', 'OpenSourceFox', 'DesertSignal', 'MaritimeLens', 'SignalHarbor', 'DuneRelay'];

function randomGuestName() {
  const prefix = GUEST_PREFIXES[Math.floor(Math.random() * GUEST_PREFIXES.length)];
  const number = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${number}`;
}

function registerChatRoutes({ addRoute }) {
  const messages = [];
  const clients = new Set();
  const rateWindow = new Map();
  let sequence = 1;

  const pushMessage = (message) => {
    messages.push(message);
    if (messages.length > MAX_MESSAGES) messages.shift();
    const payload = `event: message\ndata: ${JSON.stringify(message)}\n\n`;
    for (const client of clients) {
      client.write(payload);
    }
  };

  addRoute('POST', '/chat/join', async (_req, res) => {
    res.json({ guestName: randomGuestName(), serverTime: new Date().toISOString() });
  });

  addRoute('GET', '/chat/messages', async (_req, res) => {
    res.json({ messages: messages.slice(-60) });
  });

  addRoute('POST', '/chat/messages', async (req, res) => {
    const body = await req.json();
    const message = String(body.message || '').trim();
    const guestName = String(body.guestName || '').trim();
    const sender = guestName || randomGuestName();
    const ip = String(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();

    if (!message) return res.json({ error: 'Message cannot be empty.' }, 400);
    if (message.length > MAX_MESSAGE_LENGTH) return res.json({ error: `Message too long (max ${MAX_MESSAGE_LENGTH} chars).` }, 400);

    const now = Date.now();
    const recent = (rateWindow.get(ip) || []).filter((stamp) => now - stamp < RATE_LIMIT_WINDOW_MS);
    if (recent.length >= MAX_MESSAGES_PER_WINDOW) {
      return res.json({ error: 'Rate limit exceeded. Please wait a few seconds.' }, 429);
    }
    recent.push(now);
    rateWindow.set(ip, recent);

    const item = {
      id: `chat-${sequence++}`,
      user: sender.slice(0, 32),
      role: 'public',
      msg: message,
      time: new Date().toISOString(),
      verified: false,
    };

    pushMessage(item);
    return res.json({ message: item }, 201);
  });

  addRoute('GET', '/chat/stream', async (req, res) => {
    const raw = res.raw;
    if (!raw) return res.json({ error: 'Streaming not supported' }, 500);

    raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    raw.write(': connected\n\n');
    clients.add(raw);

    const heartbeat = setInterval(() => {
      raw.write(': ping\n\n');
    }, 25000);

    req.raw.on('close', () => {
      clearInterval(heartbeat);
      clients.delete(raw);
      raw.end();
    });
  });
}

module.exports = { registerChatRoutes };
