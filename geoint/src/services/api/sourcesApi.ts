export interface SourceRun {
  id: string;
  sourceId: string;
  state: string;
  startedAt: string;
  finishedAt?: string;
  itemsFetched: number;
  warningsCount: number;
  errorsCount: number;
}

const API_BASE = (import.meta.env.VITE_GEOINT_API_BASE || '').trim();

async function request(path: string) {
  if (!API_BASE) return null;
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json();
}

export const sourcesApi = {
  async status() { return (await request('/sources/status')) || { sources: [] }; },
  async runs(query = '') { return (await request(`/sources/runs${query}`)) || { runs: [] }; },
  async connectors() { return (await request('/sources/connectors')) || { connectors: [] }; },
};
