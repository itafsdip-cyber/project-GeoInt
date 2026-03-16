import type { AnalystNote } from '../../types/intelligence';

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

export const notesApi = {
  async list(): Promise<AnalystNote[]> {
    if (!API_BASE) return [];
    const payload = await request('/notes');
    return payload.notes || [];
  },
  async create(note: Partial<AnalystNote>): Promise<AnalystNote> {
    const payload = await request('/notes', { method: 'POST', body: JSON.stringify(note) });
    return payload.note;
  },
  async update(noteId: string, patch: Partial<AnalystNote>): Promise<AnalystNote> {
    const payload = await request(`/notes/${encodeURIComponent(noteId)}`, { method: 'PATCH', body: JSON.stringify(patch) });
    return payload.note;
  },
  async remove(noteId: string): Promise<void> {
    await request(`/notes/${encodeURIComponent(noteId)}`, { method: 'DELETE' });
  },
};
