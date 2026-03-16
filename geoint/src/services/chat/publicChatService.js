const LIVE_API_BASE = (import.meta.env.VITE_GEOINT_LIVE_API_BASE || '').trim();
const CHAT_BASE = LIVE_API_BASE || '';

function toHttpTime(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '—';
  return `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')} UTC`;
}

async function parseJson(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload.error || `Request failed (${response.status})`;
    throw new Error(message);
  }
  return payload;
}

export async function initializeGuest() {
  const response = await fetch(`${CHAT_BASE}/chat/join`, { method: 'POST' });
  return parseJson(response);
}

export async function fetchRecentMessages() {
  const response = await fetch(`${CHAT_BASE}/chat/messages`, { headers: { Accept: 'application/json' } });
  const payload = await parseJson(response);
  return (payload.messages || []).map((item) => ({ ...item, time: toHttpTime(item.time) }));
}

export async function sendPublicMessage({ message, guestName }) {
  const response = await fetch(`${CHAT_BASE}/chat/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, guestName }),
  });
  const payload = await parseJson(response);
  return { ...payload.message, time: toHttpTime(payload.message?.time) };
}

export function subscribeToMessageStream(onMessage, onError) {
  const source = new EventSource(`${CHAT_BASE}/chat/stream`);
  source.addEventListener('message', (event) => {
    try {
      const parsed = JSON.parse(event.data || '{}');
      onMessage({ ...parsed, time: toHttpTime(parsed.time) });
    } catch (error) {
      onError?.(error);
    }
  });
  source.onerror = (error) => {
    onError?.(error);
  };
  return () => source.close();
}
