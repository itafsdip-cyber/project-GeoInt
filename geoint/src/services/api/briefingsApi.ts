import type { BriefingDocument } from '../../types/intelligence';

const API_BASE = (import.meta.env.VITE_GEOINT_API_BASE || '').trim();

async function request(path: string, init?: RequestInit) {
  if (!API_BASE) throw new Error('API base missing');
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json();
}

export const briefingsApi = {
  async list(): Promise<BriefingDocument[]> {
    if (!API_BASE) return [];
    const payload = await request('/briefings');
    return payload.briefings || [];
  },
  async create(briefing: Partial<BriefingDocument>): Promise<BriefingDocument> {
    const payload = await request('/briefings', { method: 'POST', body: JSON.stringify(briefing) });
    return payload.briefing;
  },
  async update(briefingId: string, patch: Partial<BriefingDocument>): Promise<BriefingDocument> {
    const payload = await request(`/briefings/${encodeURIComponent(briefingId)}`, { method: 'PATCH', body: JSON.stringify(patch) });
    return payload.briefing;
  },
  async remove(briefingId: string): Promise<void> {
    await request(`/briefings/${encodeURIComponent(briefingId)}`, { method: 'DELETE' });
  },
};
