const {
  stableId,
  normalizeRegion,
  parseTimestamp,
  classifyCategory,
  severityFromConfidence,
  createStatus,
} = require('./utils.cjs');

function tweetToEvent(tweet, userLookup) {
  const confidence = tweet.public_metrics?.retweet_count > 100 ? 70 : 58;
  return {
    id: `x-${stableId([tweet.id, tweet.created_at])}`,
    type: 'social',
    category: classifyCategory(tweet.text || ''),
    title: (tweet.text || '').slice(0, 220) || 'Untitled X post',
    source: 'x',
    provider: 'X',
    timestamp: parseTimestamp(tweet.created_at),
    latitude: null,
    longitude: null,
    severity: severityFromConfidence(confidence),
    verificationStatus: 'pending',
    confidence,
    region: normalizeRegion(tweet.geo?.place_id || 'Global'),
    metadata: {
      provider: 'x',
      authorId: tweet.author_id,
      authorName: userLookup.get(tweet.author_id)?.username,
      metrics: tweet.public_metrics,
      conversationId: tweet.conversation_id,
      raw: tweet,
    },
  };
}

async function fetchXEvents(config) {
  if (!config.enabled) {
    return { events: [], status: createStatus({ provider: 'x', state: 'unavailable', reason: 'Disabled by config' }) };
  }

  if (!config.bearerToken) {
    return { events: [], status: createStatus({ provider: 'x', state: 'auth_missing', reason: 'Missing X_BEARER_TOKEN' }) };
  }

  try {
    const endpoint = new URL('https://api.x.com/2/tweets/search/recent');
    endpoint.searchParams.set('query', config.query);
    endpoint.searchParams.set('max_results', String(Math.min(config.maxResults, 100)));
    endpoint.searchParams.set('tweet.fields', 'created_at,public_metrics,geo,conversation_id,author_id,lang');
    endpoint.searchParams.set('expansions', 'author_id');
    endpoint.searchParams.set('user.fields', 'username,name');

    const response = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${config.bearerToken}` },
    });

    if (response.status === 429) {
      return { events: [], status: createStatus({ provider: 'x', state: 'rate_limited', reason: 'X API rate limit hit' }) };
    }
    if (response.status === 401 || response.status === 403) {
      return { events: [], status: createStatus({ provider: 'x', state: 'auth_missing', reason: `X auth rejected (${response.status})` }) };
    }
    if (!response.ok) {
      return { events: [], status: createStatus({ provider: 'x', state: 'error', reason: `HTTP ${response.status}` }) };
    }

    const payload = await response.json();
    const users = payload?.includes?.users || [];
    const userLookup = new Map(users.map((user) => [user.id, user]));
    const data = payload?.data || [];
    const events = data.map((tweet) => tweetToEvent(tweet, userLookup));

    return { events, status: createStatus({ provider: 'x', state: 'active', reason: `Fetched ${events.length} posts` }) };
  } catch (error) {
    return { events: [], status: createStatus({ provider: 'x', state: 'error', reason: 'X ingestion failed', lastError: error.message }) };
  }
}

module.exports = { fetchXEvents };
