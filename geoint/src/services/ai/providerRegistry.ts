export type ProviderMode = 'none' | 'hosted-openai-compatible' | 'user-openai-compatible' | 'user-ollama-compatible';

export interface ProviderConfig {
  mode: ProviderMode;
  baseUrl?: string;
  model?: string;
  apiKey?: string;
  timeoutMs: number;
}

export const defaultProviderConfig: ProviderConfig = {
  mode: 'none',
  timeoutMs: 8000,
};

export function providerStatusLabel(mode: ProviderMode) {
  if (mode === 'none') return 'AI disabled (heuristic mode)';
  if (mode === 'user-ollama-compatible') return 'User-supplied Ollama-compatible endpoint';
  if (mode === 'user-openai-compatible') return 'User-supplied OpenAI-compatible endpoint';
  return 'Hosted OpenAI-compatible endpoint';
}

export async function checkProviderHealth(config: ProviderConfig) {
  if (config.mode === 'none' || !config.baseUrl) return { ok: true, state: 'NO_PROVIDER' };
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
    const response = await fetch(config.baseUrl, { method: 'GET', signal: controller.signal });
    clearTimeout(timeout);
    return { ok: response.ok, state: response.ok ? 'ACTIVE' : `HTTP_${response.status}` };
  } catch {
    return { ok: false, state: 'UNREACHABLE' };
  }
}
