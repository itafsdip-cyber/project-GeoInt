const {
  stableId,
  normalizeRegion,
  parseTimestamp,
  classifyCategory,
  severityFromConfidence,
  createStatus,
} = require('./utils.cjs');

async function fetchAcledEvents(config) {
  if (!config.enabled) {
    return { events: [], status: createStatus({ provider: 'acled', state: 'disabled', reason: 'Disabled by config' }) };
  }
  if (!config.apiKey || !config.email) {
    return { events: [], status: createStatus({ provider: 'acled', state: 'auth_missing', reason: 'Missing ACLED_API_KEY or ACLED_EMAIL' }) };
  }

  try {
    const endpoint = new URL('https://api.acleddata.com/acled/read');
    endpoint.searchParams.set('key', config.apiKey);
    endpoint.searchParams.set('email', config.email);
    endpoint.searchParams.set('terms', config.query);
    endpoint.searchParams.set('limit', String(config.limit));

    const response = await fetch(endpoint);
    if (response.status === 429) return { events: [], status: createStatus({ provider: 'acled', state: 'rate_limited', reason: 'ACLED rate limit hit' }) };
    if (!response.ok) return { events: [], status: createStatus({ provider: 'acled', state: 'error', reason: `HTTP ${response.status}` }) };
    const payload = await response.json();
    const rows = Array.isArray(payload?.data) ? payload.data : [];
    const events = rows.map((row) => {
      const confidence = 82;
      return {
        id: `acled-${stableId([row.event_id_cnty, row.event_date, row.country, row.admin1])}`,
        type: 'news',
        category: classifyCategory(`${row.event_type || ''} ${row.sub_event_type || ''}`),
        title: row.notes || `${row.event_type} - ${row.sub_event_type}`,
        source: 'acled',
        provider: 'ACLED',
        timestamp: parseTimestamp(row.event_date),
        latitude: Number.isFinite(Number(row.latitude)) ? Number(row.latitude) : null,
        longitude: Number.isFinite(Number(row.longitude)) ? Number(row.longitude) : null,
        severity: severityFromConfidence(confidence),
        verificationStatus: 'verified',
        confidence,
        region: normalizeRegion(`${row.country || ''} ${row.admin1 || ''}`),
        metadata: {
          provider: 'acled',
          eventType: row.event_type,
          subEventType: row.sub_event_type,
          sourceScale: row.source_scale,
          actor1: row.actor1,
          actor2: row.actor2,
          launch: null,
          impact: null,
          raw: row,
        },
      };
    });

    return { events, status: createStatus({ provider: 'acled', state: 'active', reason: `Fetched ${events.length} ACLED records` }) };
  } catch (error) {
    return { events: [], status: createStatus({ provider: 'acled', state: 'error', reason: 'ACLED ingestion failed', lastError: error.message }) };
  }
}

module.exports = { fetchAcledEvents };
