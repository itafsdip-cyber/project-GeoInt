const {
  stableId,
  normalizeRegion,
  parseTimestamp,
  classifyCategory,
  severityFromConfidence,
  createStatus,
} = require('./utils.cjs');

async function getRedditToken(config) {
  const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
  const response = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': config.userAgent,
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error(`token HTTP ${response.status}`);
  }

  const payload = await response.json();
  return payload.access_token;
}

function redditPostToEvent(post, subreddit) {
  const confidence = post.ups > 100 ? 74 : 62;
  return {
    id: `reddit-${stableId([post.id, post.subreddit, post.created_utc])}`,
    type: 'social',
    category: classifyCategory(`${post.title || ''} ${post.selftext || ''}`),
    title: post.title || 'Untitled Reddit post',
    source: 'reddit',
    provider: 'Reddit',
    timestamp: parseTimestamp((post.created_utc || 0) * 1000),
    latitude: null,
    longitude: null,
    severity: severityFromConfidence(confidence),
    verificationStatus: 'pending',
    confidence,
    region: normalizeRegion(post.link_flair_text || subreddit || 'Global'),
    metadata: {
      provider: 'reddit',
      subreddit,
      author: post.author,
      permalink: `https://reddit.com${post.permalink || ''}`,
      score: post.score,
      comments: post.num_comments,
      raw: post,
    },
  };
}

async function fetchRedditEvents(config) {
  if (!config.enabled) {
    return { events: [], status: createStatus({ provider: 'reddit', state: 'unavailable', reason: 'Disabled by config' }) };
  }

  if (!config.clientId || !config.clientSecret) {
    return { events: [], status: createStatus({ provider: 'reddit', state: 'auth_missing', reason: 'Missing Reddit API credentials' }) };
  }

  try {
    const token = await getRedditToken(config);
    const events = [];

    for (const subreddit of config.subreddits) {
      const endpoint = `https://oauth.reddit.com/r/${encodeURIComponent(subreddit)}/new?limit=15`;
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': config.userAgent,
        },
      });

      if (response.status === 429) {
        return { events, status: createStatus({ provider: 'reddit', state: 'rate_limited', reason: 'Reddit API rate limit hit' }) };
      }

      if (!response.ok) continue;
      const payload = await response.json();
      const children = payload?.data?.children || [];
      for (const child of children) {
        events.push(redditPostToEvent(child.data, subreddit));
      }
    }

    return { events, status: createStatus({ provider: 'reddit', state: 'active', reason: `Fetched ${events.length} posts` }) };
  } catch (error) {
    return { events: [], status: createStatus({ provider: 'reddit', state: 'error', reason: 'Reddit ingestion failed', lastError: error.message }) };
  }
}

module.exports = { fetchRedditEvents };
