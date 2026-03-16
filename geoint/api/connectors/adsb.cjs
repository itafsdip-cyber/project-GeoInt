function nowIso() {
  return new Date().toISOString();
}

async function healthCheck(config = {}) {
  if (!config.apiKey) {
    return { provider: 'adsb', state: 'AUTH_MISSING', checkedAt: nowIso(), reason: 'ADS-B API key missing.' };
  }
  if (!config.endpoint) {
    return { provider: 'adsb', state: 'UNAVAILABLE', checkedAt: nowIso(), reason: 'ADS-B endpoint not configured.' };
  }
  return { provider: 'adsb', state: 'ACTIVE', checkedAt: nowIso() };
}

async function fetchOverlay(config = {}) {
  const status = await healthCheck(config);
  if (status.state !== 'ACTIVE') {
    return { tracks: [], warnings: [status.reason || 'ADS-B feed unavailable'], errors: [], status };
  }

  try {
    const response = await fetch(config.endpoint, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
    });

    if (response.status === 401 || response.status === 403) {
      return { tracks: [], warnings: ['ADS-B authentication failed'], errors: ['Unauthorized'], status: { provider: 'adsb', state: 'AUTH_MISSING', checkedAt: nowIso() } };
    }
    if (response.status === 429) {
      return { tracks: [], warnings: ['ADS-B rate-limited'], errors: ['HTTP 429'], status: { provider: 'adsb', state: 'RATE_LIMITED', checkedAt: nowIso() } };
    }
    if (!response.ok) {
      return { tracks: [], warnings: [`ADS-B unavailable (${response.status})`], errors: [`HTTP ${response.status}`], status: { provider: 'adsb', state: 'UNAVAILABLE', checkedAt: nowIso() } };
    }

    const payload = await response.json();
    return { tracks: Array.isArray(payload?.tracks) ? payload.tracks : [], warnings: [], errors: [], status };
  } catch (error) {
    return { tracks: [], warnings: [error.message || 'ADS-B unavailable'], errors: [error.message || 'ADS-B unavailable'], status: { provider: 'adsb', state: 'UNAVAILABLE', checkedAt: nowIso() } };
  }
}

function normalize(rawTracks = []) {
  const observedAt = nowIso();
  const tracks = rawTracks
    .map((track, index) => {
      const latitude = Number(track.latitude ?? track.lat);
      const longitude = Number(track.longitude ?? track.lon);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
      return {
        id: String(track.id || track.hex || `adsb-${index}`),
        overlayType: 'AIR',
        label: track.callsign || track.flight || 'ADS-B aircraft',
        position: { latitude, longitude },
        heading: Number(track.heading ?? track.track ?? 0),
        speed: Number(track.speed ?? track.gs ?? 0),
        observedAt: track.observedAt || observedAt,
        expiresAt: new Date(Date.parse(track.observedAt || observedAt) + 10 * 60 * 1000).toISOString(),
        sourceRefs: [{ sourceId: 'adsb', sourceName: 'ADS-B', collectedAt: observedAt, health: 'ACTIVE' }],
        verificationLevel: 'HEURISTIC',
        metadata: { transponder: track.hex, source: 'adsb' },
      };
    })
    .filter(Boolean);
  return tracks;
}

async function fetchAdsbOverlay(config = {}) {
  const fetched = await fetchOverlay(config);
  const normalized = normalize(fetched.tracks);
  return {
    events: normalized,
    warnings: fetched.warnings,
    errors: fetched.errors,
    status: fetched.status,
    meta: {
      itemsFetched: fetched.tracks.length,
      itemsNormalized: normalized.length,
      itemsDropped: Math.max(0, fetched.tracks.length - normalized.length),
    },
  };
}

module.exports = { healthCheck, fetch: fetchOverlay, normalize, fetchAdsbOverlay };
