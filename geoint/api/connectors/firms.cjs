function parseCsvLine(line) {
  const out = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  out.push(current);
  return out;
}

function parseCsv(csvText) {
  const lines = csvText.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((header, idx) => { row[header] = values[idx]; });
    return row;
  });
}

function createObservedAt(row) {
  const date = row.acq_date;
  const time = String(row.acq_time || '').padStart(4, '0');
  if (!date || time.length !== 4) return new Date().toISOString();
  return `${date}T${time.slice(0, 2)}:${time.slice(2)}:00Z`;
}

async function fetchFirmsOverlay(config = {}) {
  const apiKey = config.apiKey || process.env.FIRMS_API_KEY;
  if (!apiKey) {
    return {
      events: [],
      warnings: ['FIRMS credentials missing'],
      status: { provider: 'firms', state: 'AUTH_MISSING', checkedAt: new Date().toISOString() },
      meta: { itemsFetched: 0, itemsNormalized: 0, itemsDropped: 0 },
    };
  }

  const source = process.env.FIRMS_SOURCE || 'VIIRS_SNPP_NRT';
  const area = process.env.FIRMS_AREA || '-180,-90,180,90';
  const dayRange = process.env.FIRMS_DAY_RANGE || '1';
  const endpoint = process.env.FIRMS_ENDPOINT || `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${apiKey}/${source}/${area}/${dayRange}`;

  try {
    const response = await fetch(endpoint, { headers: { Accept: 'text/csv' } });
    if (!response.ok) {
      return {
        events: [],
        warnings: [`FIRMS request failed (${response.status})`],
        errors: [`HTTP ${response.status}`],
        status: { provider: 'firms', state: response.status === 401 ? 'AUTH_MISSING' : 'DEGRADED', checkedAt: new Date().toISOString() },
        meta: { itemsFetched: 0, itemsNormalized: 0, itemsDropped: 0 },
      };
    }

    const text = await response.text();
    const rows = parseCsv(text);
    const observedAt = new Date().toISOString();
    const events = rows
      .map((row, index) => {
        const lat = Number(row.latitude);
        const lon = Number(row.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
        const rowObservedAt = createObservedAt(row);
        const confidence = String(row.confidence || '').toUpperCase();
        return {
          trackId: `firms-${row.latitude}-${row.longitude}-${row.acq_date}-${row.acq_time}-${index}`,
          type: 'HOTSPOT',
          label: `FIRMS hotspot ${row.bright_ti4 || row.brightness || 'n/a'}`,
          latitude: lat,
          longitude: lon,
          observedAt: rowObservedAt,
          collectedAt: observedAt,
          expiresAt: new Date(Date.parse(rowObservedAt) + (6 * 60 * 60 * 1000)).toISOString(),
          verificationLevel: confidence.includes('H') ? 'HEURISTIC' : 'INFERRED',
          locationPrecision: 'APPROXIMATE',
          sourceReference: {
            sourceId: 'firms',
            sourceName: 'NASA FIRMS',
            url: 'https://firms.modaps.eosdis.nasa.gov/',
            collectedAt: observedAt,
            health: 'ACTIVE',
          },
        };
      })
      .filter(Boolean);

    return {
      events,
      warnings: [],
      errors: [],
      status: { provider: 'firms', state: 'ACTIVE', checkedAt: observedAt },
      meta: { itemsFetched: rows.length, itemsNormalized: events.length, itemsDropped: rows.length - events.length },
    };
  } catch (error) {
    return {
      events: [],
      warnings: [error.message || 'FIRMS unavailable'],
      errors: [error.message || 'FIRMS unavailable'],
      status: { provider: 'firms', state: 'UNAVAILABLE', checkedAt: new Date().toISOString(), lastError: error.message },
      meta: { itemsFetched: 0, itemsNormalized: 0, itemsDropped: 0 },
    };
  }
}

module.exports = { fetchFirmsOverlay };
