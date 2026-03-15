export const SOURCE_STATES = {
  active: 'ACTIVE',
  unavailable: 'UNAVAILABLE',
  rate_limited: 'RATE LIMITED',
  auth_missing: 'AUTH MISSING',
  error: 'ERROR',
};

export const PROVIDERS = {
  gdelt: { key: 'gdelt', name: 'GDELT', priority: 1 },
  reddit: { key: 'reddit', name: 'Reddit', priority: 2 },
  x: { key: 'x', name: 'X', priority: 3 },
  rss: { key: 'rss', name: 'RSS', priority: 4 },
};

export function orderedProviderStatus(sourceStatuses = {}) {
  return Object.values(PROVIDERS)
    .map((provider) => {
      const status = sourceStatuses[provider.key] || {
        provider: provider.key,
        state: 'unavailable',
        reason: 'No status reported',
      };
      return {
        ...provider,
        state: status.state,
        reason: status.reason,
        checkedAt: status.checkedAt,
      };
    })
    .sort((a, b) => a.priority - b.priority);
}
