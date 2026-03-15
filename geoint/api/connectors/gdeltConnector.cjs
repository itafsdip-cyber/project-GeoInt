const {
  stableId,
  normalizeRegion,
  parseTimestamp,
  classifyCategory,
  severityFromConfidence,
  createStatus,
} = require('./utils.cjs');

async function fetchGdeltEvents(config) {
  if (!config.enabled) {
    return { events: [], status: createStatus({ provider: 'gdelt', state: 'unavailable', reason: 'Disabled by config' }) };
  }

  try {
    const endpoint = new URL('https://api.gdeltproject.org/api/v2/doc/doc');
    endpoint.searchParams.set('query', config.query);
    endpoint.searchParams.set('mode', 'ArtList');
    endpoint.searchParams.set('maxrecords', String(config.limit));
    endpoint.searchParams.set('format', 'json');
    endpoint.searchParams.set('sort', 'DateDesc');

    const response = await fetch(endpoint, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      return {
        events: [],
        status: createStatus({ provider: 'gdelt', state: 'error', reason: `HTTP ${response.status}` }),
      };
    }

    const payload = await response.json();
    const articles = Array.isArray(payload.articles) ? payload.articles : [];
    const events = articles.map((article) => {
      const confidence = article.seendate ? 80 : 65;
      return {
        id: `gdelt-${stableId([article.url, article.title, article.seendate])}`,
        type: 'news',
        category: classifyCategory(`${article.title || ''} ${article.seendate || ''}`),
        title: article.title || 'Untitled GDELT article',
        source: 'gdelt',
        provider: 'GDELT',
        timestamp: parseTimestamp(article.seendate || article.socialimage || Date.now()),
        latitude: article.locations?.[0]?.lat ?? null,
        longitude: article.locations?.[0]?.lng ?? null,
        severity: severityFromConfidence(confidence),
        verificationStatus: confidence >= 75 ? 'verified' : 'pending',
        confidence,
        region: normalizeRegion(article.sourcecountry || article.domain || 'Unknown'),
        metadata: {
          provider: 'gdelt',
          url: article.url,
          domain: article.domain,
          language: article.language,
          tone: article.tone,
          raw: article,
        },
      };
    });

    return {
      events,
      status: createStatus({ provider: 'gdelt', state: 'active', reason: `Fetched ${events.length} items` }),
    };
  } catch (error) {
    return {
      events: [],
      status: createStatus({ provider: 'gdelt', state: 'error', reason: 'Fetch failed', lastError: error.message }),
    };
  }
}

module.exports = { fetchGdeltEvents };
