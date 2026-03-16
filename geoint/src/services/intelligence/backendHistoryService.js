const LIVE_API_BASE = import.meta.env.VITE_GEOINT_LIVE_API_BASE?.trim();

export async function fetchBackendHistory() {
  if (!LIVE_API_BASE) return null;
  const response = await fetch(`${LIVE_API_BASE}/history`, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`History HTTP ${response.status}`);
  return response.json();
}

export async function pushBackendHistorySnapshot({ events = [], incidents = [] }) {
  if (!LIVE_API_BASE) return null;
  const response = await fetch(`${LIVE_API_BASE}/history/snapshot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ events, incidents }),
  });
  if (!response.ok) throw new Error(`History snapshot HTTP ${response.status}`);
  return response.json();
}
