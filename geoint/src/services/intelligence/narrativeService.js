const STOPWORDS = new Set(['the', 'and', 'for', 'with', 'this', 'that', 'from', 'into', 'after', 'over', 'under', 'across', 'about']);

function normalizeTokens(text = '') {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 3 && !STOPWORDS.has(token));
}

export function extractNarratives(events = []) {
  const keywordBuckets = new Map();
  events.forEach((event) => {
    const tokens = normalizeTokens(`${event.title || ''} ${event.summary || ''}`).slice(0, 12);
    const unique = [...new Set(tokens)];
    unique.forEach((token) => {
      if (!keywordBuckets.has(token)) keywordBuckets.set(token, []);
      keywordBuckets.get(token).push(event);
    });
  });

  const narratives = [...keywordBuckets.entries()]
    .filter(([, clusterEvents]) => clusterEvents.length >= 3)
    .map(([keyword, clusterEvents], index) => {
      const sources = new Set(clusterEvents.map((event) => event.source).filter(Boolean));
      const firstSeenTs = Math.min(...clusterEvents.map((event) => new Date(event.timestamp).getTime()).filter(Number.isFinite));
      const lastSeenTs = Math.max(...clusterEvents.map((event) => new Date(event.timestamp).getTime()).filter(Number.isFinite));
      const socialCount = clusterEvents.filter((event) => ['reddit', 'x'].includes((event.providerCategory || '').toLowerCase())).length;
      const credibilityAvg = Math.round(clusterEvents.reduce((acc, e) => acc + (e.reliability ?? 50), 0) / clusterEvents.length);
      const disputed = clusterEvents.some((event) => String(event.verificationStatus || '').toLowerCase() === 'disputed');

      const labels = [];
      if (clusterEvents.length >= 8) labels.push('trending');
      else labels.push('emerging');
      if (sources.size >= 3) labels.push('multi-source');
      if (disputed || credibilityAvg < 50) labels.push('disputed');
      if (socialCount >= clusterEvents.length * 0.7 && sources.size <= 2) labels.push('suspicious-amplification');

      return {
        narrativeId: `narr-${keyword}-${index}`,
        keywords: [keyword],
        sourceCount: sources.size,
        firstSeen: Number.isFinite(firstSeenTs) ? new Date(firstSeenTs).toISOString() : new Date().toISOString(),
        lastSeen: Number.isFinite(lastSeenTs) ? new Date(lastSeenTs).toISOString() : new Date().toISOString(),
        eventIds: clusterEvents.map((event) => event.id),
        credibilityIndicators: {
          averageReliability: credibilityAvg,
          disputedSignals: disputed,
          socialAmplificationRatio: Number((socialCount / Math.max(1, clusterEvents.length)).toFixed(2)),
        },
        labels,
      };
    })
    .sort((a, b) => b.sourceCount - a.sourceCount)
    .slice(0, 18);

  return narratives;
}
