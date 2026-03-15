const DEFAULT_REDDIT_SUBREDDITS = ['worldnews', 'geopolitics', 'news'];
const DEFAULT_X_QUERY = '(geopolitics OR conflict OR diplomacy) -is:retweet lang:en';

function parseList(value, fallback = []) {
  if (!value) return fallback;
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseFeeds(value) {
  const feeds = parseList(value);
  return feeds.map((feedUrl, index) => ({
    id: `rss-${index + 1}`,
    url: feedUrl,
    label: new URL(feedUrl).hostname,
  }));
}

function boolFromEnv(value, defaultValue = true) {
  if (value === undefined) return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function sourceRegistryFromEnv(env = process.env) {
  return {
    gdelt: {
      key: 'gdelt',
      label: 'GDELT',
      enabled: boolFromEnv(env.GEOINT_ENABLE_GDELT, true),
      refreshMs: Number(env.GEOINT_GDELT_REFRESH_MS || 120000),
      query: env.GEOINT_GDELT_QUERY || 'conflict OR military OR ceasefire OR sanctions',
      limit: Number(env.GEOINT_GDELT_LIMIT || 50),
    },
    reddit: {
      key: 'reddit',
      label: 'Reddit',
      enabled: boolFromEnv(env.GEOINT_ENABLE_REDDIT, true),
      refreshMs: Number(env.GEOINT_REDDIT_REFRESH_MS || 180000),
      subreddits: parseList(env.GEOINT_REDDIT_SUBREDDITS, DEFAULT_REDDIT_SUBREDDITS),
      keywords: parseList(env.GEOINT_REDDIT_KEYWORDS, []),
      clientId: env.REDDIT_CLIENT_ID || '',
      clientSecret: env.REDDIT_CLIENT_SECRET || '',
      userAgent: env.REDDIT_USER_AGENT || 'geoint-live-monitor/1.0',
    },
    x: {
      key: 'x',
      label: 'X',
      enabled: boolFromEnv(env.GEOINT_ENABLE_X, true),
      refreshMs: Number(env.GEOINT_X_REFRESH_MS || 180000),
      query: env.GEOINT_X_QUERY || DEFAULT_X_QUERY,
      maxResults: Number(env.GEOINT_X_MAX_RESULTS || 25),
      bearerToken: env.X_BEARER_TOKEN || '',
    },
    rss: {
      key: 'rss',
      label: 'RSS',
      enabled: boolFromEnv(env.GEOINT_ENABLE_RSS, true),
      refreshMs: Number(env.GEOINT_RSS_REFRESH_MS || 300000),
      feeds: parseFeeds(env.GEOINT_RSS_FEEDS || ''),
    },
  };
}

module.exports = {
  sourceRegistryFromEnv,
};
