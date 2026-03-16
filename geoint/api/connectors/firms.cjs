async function fetchFirmsOverlay(config = {}) {
  if (!config.apiKey) return { events: [], warnings: ['FIRMS credentials missing'], status: { provider: 'firms', state: 'AUTH_MISSING', checkedAt: new Date().toISOString() } };
  return { events: [], warnings: [], status: { provider: 'firms', state: 'ACTIVE', checkedAt: new Date().toISOString() } };
}
module.exports = { fetchFirmsOverlay };
