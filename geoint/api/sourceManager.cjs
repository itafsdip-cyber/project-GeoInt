const STALE_MULTIPLIER = 2.5;

function buildInitialStatus(providerKey, config = {}) {
  return {
    provider: providerKey,
    enabled: Boolean(config.enabled),
    state: config.enabled ? 'idle' : 'disabled',
    active: false,
    authMissing: false,
    rateLimited: false,
    stale: false,
    lastSuccessAt: null,
    lastError: '',
    reason: config.enabled ? 'Awaiting first poll' : 'Disabled by config',
    checkedAt: new Date().toISOString(),
  };
}

function deriveFlags(state) {
  return {
    active: state === 'active',
    authMissing: state === 'auth_missing',
    rateLimited: state === 'rate_limited',
  };
}

function evaluateStale(lastSuccessAt, refreshMs) {
  if (!lastSuccessAt) return false;
  return Date.now() - new Date(lastSuccessAt).getTime() > refreshMs * STALE_MULTIPLIER;
}

function createSourceManager(registry = {}) {
  const statuses = Object.fromEntries(Object.entries(registry).map(([key, cfg]) => [key, buildInitialStatus(key, cfg)]));

  const updateStatus = (providerKey, incoming = {}, config = {}) => {
    const current = statuses[providerKey] || buildInitialStatus(providerKey, config);
    const state = incoming.state || current.state || 'error';
    const nextSuccessAt = state === 'active' ? (incoming.checkedAt || new Date().toISOString()) : current.lastSuccessAt;
    const stale = evaluateStale(nextSuccessAt, Number(config.refreshMs) || 60000);
    const flags = deriveFlags(state);

    statuses[providerKey] = {
      provider: providerKey,
      enabled: Boolean(config.enabled),
      state,
      ...flags,
      stale,
      lastSuccessAt: nextSuccessAt,
      lastError: incoming.lastError || (state === 'error' ? incoming.reason || 'Unknown error' : ''),
      reason: incoming.reason || current.reason || '',
      checkedAt: incoming.checkedAt || new Date().toISOString(),
    };

    if (!config.enabled) {
      statuses[providerKey].state = 'disabled';
      statuses[providerKey].reason = 'Disabled by config';
      statuses[providerKey].active = false;
    }

    return statuses[providerKey];
  };

  const snapshot = () => Object.fromEntries(Object.entries(statuses).map(([key, status]) => [key, {
    ...status,
    stale: evaluateStale(status.lastSuccessAt, Number(registry[key]?.refreshMs) || 60000),
  }]));

  return {
    updateStatus,
    snapshot,
  };
}

module.exports = { createSourceManager };
