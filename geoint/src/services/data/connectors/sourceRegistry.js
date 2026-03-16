export const SOURCE_STATES = {
  active: 'ACTIVE',
  disabled: 'DISABLED',
  idle: 'IDLE',
  stale: 'STALE',
  rate_limited: 'RATE LIMITED',
  auth_missing: 'AUTH MISSING',
  unavailable: 'UNAVAILABLE',
  error: 'ERROR',
};

export const PROVIDERS = {
  gdelt: { key: 'gdelt', name: 'GDELT', priority: 1 },
  rss: { key: 'rss', name: 'RSS', priority: 2 },
  acled: { key: 'acled', name: 'ACLED', priority: 3 },
  reddit: { key: 'reddit', name: 'Reddit', priority: 4 },
  x: { key: 'x', name: 'X', priority: 5 },
};

export function orderedProviderStatus(sourceStatuses = {}) {
  return Object.values(PROVIDERS)
    .map((provider) => {
      const status = sourceStatuses[provider.key] || {
        provider: provider.key,
        state: 'unavailable',
        reason: 'No status reported',
        enabled: false,
      };
      return {
        ...provider,
        state: status.stale ? 'stale' : status.state,
        reason: status.reason,
        checkedAt: status.checkedAt,
        enabled: status.enabled,
        active: status.active,
        stale: status.stale,
        authMissing: status.authMissing,
        rateLimited: status.rateLimited,
        lastSuccessAt: status.lastSuccessAt,
        lastError: status.lastError,
      };
    })
    .sort((a, b) => a.priority - b.priority);
}
