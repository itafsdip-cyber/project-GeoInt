const {
  stableId,
  normalizeRegion,
  parseTimestamp,
  classifyCategory,
  severityFromConfidence,
  createStatus,
} = require('./utils.cjs');

function readTag(item, tag) {
  const match = item.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  if (!match) return '';
  return match[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim();
}

function parseItems(xml) {
  return xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
}

async function fetchFeed(url) {
  const response = await fetch(url, { headers: { Accept: 'application/rss+xml,application/xml,text/xml' } });
  if (!response.ok) {
    throw new Error(`feed ${url} failed with ${response.status}`);
  }
  return response.text();
}

async function fetchRssEvents(config) {
  if (!config.enabled) {
    return { events: [], status: createStatus({ provider: 'rss', state: 'unavailable', reason: 'Disabled by config' }) };
  }

  if (!config.feeds.length) {
    return { events: [], status: createStatus({ provider: 'rss', state: 'unavailable', reason: 'No GEOINT_RSS_FEEDS configured' }) };
  }

  try {
    const events = [];
    const failures = [];
    for (const feed of config.feeds) {
      try {
        const xml = await fetchFeed(feed.url);
        const items = parseItems(xml).slice(0, 15);
        for (const item of items) {
          const title = readTag(item, 'title');
          const link = readTag(item, 'link');
          const pubDate = readTag(item, 'pubDate');
          const description = readTag(item, 'description');
          const confidence = 72;
          events.push({
            id: `rss-${stableId([feed.url, title, pubDate])}`,
            type: 'news',
            category: classifyCategory(`${title} ${description}`),
            title: title || 'Untitled RSS item',
            source: 'rss',
            provider: 'RSS',
            timestamp: parseTimestamp(pubDate),
            latitude: null,
            longitude: null,
            severity: severityFromConfidence(confidence),
            verificationStatus: 'pending',
            confidence,
            region: normalizeRegion(feed.label),
            metadata: {
              provider: 'rss',
              feed: feed.url,
              link,
              description,
              raw: item,
            },
          });
        }
      } catch (error) {
        failures.push(`${feed.label}: ${error.message}`);
      }
    }

    if (events.length > 0) {
      return {
        events,
        status: createStatus({
          provider: 'rss',
          state: 'active',
          reason: failures.length > 0
            ? `Fetched ${events.length} feed items (${failures.length} feed errors)`
            : `Fetched ${events.length} feed items`,
          lastError: failures.join(' | ').slice(0, 400),
        }),
      };
    }

    if (failures.length > 0) {
      return {
        events: [],
        status: createStatus({
          provider: 'rss',
          state: 'error',
          reason: 'RSS ingestion failed',
          lastError: failures.join(' | ').slice(0, 400),
        }),
      };
    }

    return { events, status: createStatus({ provider: 'rss', state: 'active', reason: `Fetched ${events.length} feed items` }) };
  } catch (error) {
    return { events: [], status: createStatus({ provider: 'rss', state: 'error', reason: 'RSS ingestion failed', lastError: error.message }) };
  }
}

module.exports = { fetchRssEvents };
