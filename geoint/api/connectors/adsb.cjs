async function fetchAdsbOverlay(config = {}) {
  if (!config.apiKey) return { events: [], warnings: ['ADS-B credentials missing'], status: { provider: 'adsb', state: 'AUTH_MISSING', checkedAt: new Date().toISOString() } };
  return { events: [], warnings: ['ADS-B endpoint not configured'], status: { provider: 'adsb', state: 'DEGRADED', checkedAt: new Date().toISOString() } };
}
module.exports = { fetchAdsbOverlay };
