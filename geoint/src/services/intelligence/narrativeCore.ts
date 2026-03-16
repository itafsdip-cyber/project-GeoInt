import type { IntelligenceEvent, NarrativeCluster, NarrativeStatus } from '../../types/intelligence';

const statusFromSignals = (count: number, disputed: boolean): NarrativeStatus => {
  if (disputed) return 'DISPUTED';
  if (count >= 8) return 'TRENDING';
  if (count >= 5) return 'STABLE';
  if (count >= 3) return 'EMERGING';
  return 'DECLINING';
};

export function detectNarrativeClusters(events: IntelligenceEvent[]): NarrativeCluster[] {
  const buckets = new Map<string, IntelligenceEvent[]>();
  events.forEach((event) => {
    const token = event.title.split(' ').slice(0, 2).join(' ').toLowerCase();
    if (!buckets.has(token)) buckets.set(token, []);
    buckets.get(token)?.push(event);
  });

  return [...buckets.entries()]
    .filter(([, cluster]) => cluster.length > 2)
    .map(([token, cluster], index) => {
      const firstSeen = new Date(Math.min(...cluster.map((event) => +new Date(event.timestamp)))).toISOString();
      const lastSeen = new Date(Math.max(...cluster.map((event) => +new Date(event.timestamp)))).toISOString();
      const sourceSet = new Set(cluster.flatMap((event) => event.references.map((reference) => reference.sourceName)));
      const platformSet = new Set(cluster.map((event) => event.references[0]?.sourceId));
      const disputed = cluster.some((event) => event.verificationLevel === 'INFERRED' || event.verificationLevel === 'UNKNOWN');
      return {
        narrativeId: `narrative:${token}:${index}`,
        title: token,
        status: statusFromSignals(cluster.length, disputed),
        firstSeen,
        lastSeen,
        sourceCount: sourceSet.size,
        platformCount: platformSet.size,
        confidenceWarning: disputed ? 'Contains disputed/low-confidence signals.' : undefined,
      };
    });
}
