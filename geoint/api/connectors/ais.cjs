function nowIso() {
  return new Date().toISOString();
}

async function healthCheck(config = {}) {
  if (!config.apiKey) {
    return { provider: 'ais', state: 'AUTH_MISSING', checkedAt: nowIso(), reason: 'AIS API key missing.' };
  }
  if (!config.endpoint) {
    return { provider: 'ais', state: 'UNAVAILABLE', checkedAt: nowIso(), reason: 'AIS endpoint not configured.' };
  }
  return { provider: 'ais', state: 'ACTIVE', checkedAt: nowIso() };
}

async function fetchOverlay(config = {}) {
  const status = await healthCheck(config);
  if (status.state !== 'ACTIVE') {
    return { tracks: [], warnings: [status.reason || 'AIS feed unavailable'], errors: [], status };
  }

  try {
    const response = await fetch(config.endpoint, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
    });

    if (response.status === 401 || response.status === 403) {
      return { tracks: [], warnings: ['AIS authentication failed'], errors: ['Unauthorized'], status: { provider: 'ais', state: 'AUTH_MISSING', checkedAt: nowIso() } };
    }
    if (response.status === 429) {
      return { tracks: [], warnings: ['AIS rate-limited'], errors: ['HTTP 429'], status: { provider: 'ais', state: 'RATE_LIMITED', checkedAt: nowIso() } };
    }
    if (!response.ok) {
      return { tracks: [], warnings: [`AIS unavailable (${response.status})`], errors: [`HTTP ${response.status}`], status: { provider: 'ais', state: 'UNAVAILABLE', checkedAt: nowIso() } };
    }

    const payload = await response.json();
    return { tracks: Array.isArray(payload?.tracks) ? payload.tracks : [], warnings: [], errors: [], status };
  } catch (error) {
    return { tracks: [], warnings: [error.message || 'AIS unavailable'], errors: [error.message || 'AIS unavailable'], status: { provider: 'ais', state: 'UNAVAILABLE', checkedAt: nowIso() } };
  }
}

function normalize(rawTracks = []) {
  const observedAt = nowIso();
  return rawTracks
    .map((track, index) => {
      const latitude = Number(track.latitude ?? track.lat);
      const longitude = Number(track.longitude ?? track.lon);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
      return {
        id: String(track.id || track.mmsi || `ais-${index}`),
        overlayType: 'MARITIME',
        label: track.name || `Vessel ${track.mmsi || index}`,
        position: { latitude, longitude },
        heading: Number(track.heading ?? track.cog ?? 0),
        speed: Number(track.speed ?? track.sog ?? 0),
        observedAt: track.observedAt || observedAt,
        expiresAt: new Date(Date.parse(track.observedAt || observedAt) + 30 * 60 * 1000).toISOString(),
        sourceRefs: [{ sourceId: 'ais', sourceName: 'AIS', collectedAt: observedAt, health: 'ACTIVE' }],
        verificationLevel: 'HEURISTIC',
        metadata: { mmsi: track.mmsi, source: 'ais' },
      };
    })
    .filter(Boolean);
}

async function fetchAisOverlay(config = {}) {
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

module.exports = { healthCheck, fetch: fetchOverlay, normalize, fetchAisOverlay };
