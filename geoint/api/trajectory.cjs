const { stableId } = require('./connectors/utils.cjs');

const REGION_COORDS = {
  'red sea': { lat: 20.4, lng: 38.2 },
  hormuz: { lat: 26.5, lng: 56.4 },
  yemen: { lat: 15.5, lng: 47.8 },
  israel: { lat: 31.1, lng: 34.8 },
  iran: { lat: 32.2, lng: 53.7 },
  'abu dhabi': { lat: 24.45, lng: 54.38 },
  dubai: { lat: 25.2, lng: 55.27 },
  uae: { lat: 24.2, lng: 54.3 },
};

function inferCoords(text = '') {
  const raw = String(text || '').toLowerCase();
  return Object.entries(REGION_COORDS).find(([key]) => raw.includes(key))?.[1] || null;
}

function isTrajectoryCandidate(event) {
  const text = `${event.title || ''} ${event.category || ''}`.toLowerCase();
  return /(missile|drone|rocket|projectile|intercept|strike)/.test(text);
}

function deriveTrajectory(event) {
  if (!isTrajectoryCandidate(event)) return null;
  const launch = event.metadata?.launch || inferCoords(event.metadata?.description || event.title || event.region);
  const impact = event.metadata?.impact || (event.latitude != null && event.longitude != null ? { lat: event.latitude, lng: event.longitude } : inferCoords(event.region));
  if (!launch || !impact) return null;

  const precise = Boolean(event.metadata?.launch && event.latitude != null && event.longitude != null);
  const precision = precise ? 'exact' : 'approximate';
  return {
    id: `traj-${stableId([event.id, launch.lat, launch.lng, impact.lat, impact.lng])}`,
    type: (event.title || '').toLowerCase().includes('drone') ? 'DRONE' : 'BALLISTIC',
    from: [launch.lat, launch.lng],
    to: [impact.lat, impact.lng],
    color: precise ? '#ff3b55' : '#ff8c00',
    speed: precise ? 0.0075 : 0.004,
    intercepted: /(intercept|shot down|air defense)/i.test(event.title || ''),
    interceptAt: 0.8,
    timestamp: event.timestamp,
    metadata: {
      sourceEventId: event.id,
      trajectoryPrecision: precision,
      trajectoryConfidence: precise ? 82 : 46,
      uncertaintyKm: precise ? 10 : 120,
      note: precise
        ? 'Launch + impact coordinates source-backed.'
        : 'Approximate trajectory derived from geospatial context and should be treated as directional only.',
    },
  };
}

function buildTrajectories(events = []) {
  return events.map(deriveTrajectory).filter(Boolean);
}

module.exports = { buildTrajectories };
