import type { IntelligenceEvent, NarrativeCluster } from '../../types/intelligence';

const stopwords = new Set(['the', 'and', 'for', 'with', 'this', 'that', 'from', 'into', 'after', 'over', 'under', 'across', 'about']);

function tokenize(value = '') {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter((token) => token.length > 3 && !stopwords.has(token));
}

export function buildNarrativeClusters(events: IntelligenceEvent[]): NarrativeCluster[] {
  const buckets = new Map<string, IntelligenceEvent[]>();
  events.forEach((event) => {
    const unique = [...new Set(tokenize(`${event.title || ''} ${event.summary || ''}`).slice(0, 10))];
    unique.forEach((keyword) => {
      if (!buckets.has(keyword)) buckets.set(keyword, []);
      buckets.get(keyword)!.push(event);
    });
  });

  return [...buckets.entries()].filter(([, bucket]) => bucket.length >= 3).map(([keyword, bucket], idx) => {
    const ts = bucket.map((item) => Date.parse(item.timestamp)).filter(Number.isFinite);
    const sources = new Set(bucket.map((item) => item.references?.[0]?.sourceName || item.source || 'unknown'));
    const platforms = new Set(bucket.map((item) => item.providerCategory || 'web'));
    const lowCred = bucket.filter((item) => (item.reliability ?? 50) < 45).length;
    const disputed = bucket.filter((item) => String(item.verificationStatus || '').toLowerCase() === 'disputed').length;
    const amplification = Number(((bucket.length * Math.max(platforms.size, 1)) / Math.max(sources.size, 1)).toFixed(2));
    const status = disputed > 1 ? 'DISPUTED' : bucket.length > 8 ? 'TRENDING' : bucket.length <= 4 ? 'EMERGING' : 'STABLE';
    return {
      narrativeId: `narrative-${keyword}-${idx}`,
      title: keyword,
      status,
      firstSeen: new Date(Math.min(...ts)).toISOString(),
      lastSeen: new Date(Math.max(...ts)).toISOString(),
      sourceCount: sources.size,
      platformCount: platforms.size,
      keywords: [keyword],
      eventIds: bucket.map((item) => item.id),
      confidenceWarning: disputed ? 'Disputed signals observed. Repetition does not confirm truth.' : undefined,
      disputedIndicators: disputed,
      sourceCredibilityMix: { high: bucket.length - lowCred, medium: Math.max(0, lowCred - 1), low: Math.min(lowCred, bucket.length) },
      amplificationScore: amplification,
      caveatNote: 'Narrative spread indicates propagation velocity, not factual confirmation.',
    } as NarrativeCluster;
  }).sort((a, b) => (b.amplificationScore || 0) - (a.amplificationScore || 0)).slice(0, 20);
}
