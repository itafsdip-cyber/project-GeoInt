async function fetchAisOverlay(config = {}) {
  if (!config.apiKey) {
    return { events: [], warnings: ['AIS credentials missing'], status: { provider: 'ais', state: 'AUTH_MISSING', checkedAt: new Date().toISOString() } };
  }
  return { events: [], warnings: ['AIS connector configured but no live endpoint bound'], status: { provider: 'ais', state: 'DEGRADED', checkedAt: new Date().toISOString() } };
}
module.exports = { fetchAisOverlay };
