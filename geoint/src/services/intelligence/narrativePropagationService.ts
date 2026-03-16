import type { NarrativeCluster, NarrativeSignal } from '../../types/intelligence';

export interface NarrativePropagationView {
  narrativeId: string;
  timeline: Array<{ window: string; signalCount: number }>;
  platformMatrix: Record<string, number>;
  burstDetected: boolean;
  spreadScore: number;
  disputed: boolean;
}

export function buildNarrativeSignals(narratives: NarrativeCluster[]): NarrativeSignal[] {
  return narratives.flatMap((narrative, index) => {
    const sourceCount = Math.max(1, narrative.sourceCount);
    return Array.from({ length: Math.min(6, sourceCount + 1) }).map((_, signalIndex) => ({
      signalId: `signal-${narrative.narrativeId}-${signalIndex}`,
      narrativeId: narrative.narrativeId,
      sourceId: `src-${signalIndex}`,
      observedAt: new Date(Date.parse(narrative.firstSeen) + signalIndex * 4 * 60 * 60 * 1000).toISOString(),
      amplificationScore: Math.max(0.1, (narrative.amplificationScore || 1) + signalIndex * 0.2),
      credibilityDelta: Number((((index + 1) % 2 ? -0.1 : 0.1) * (signalIndex + 1)).toFixed(2)),
      platform: signalIndex % 2 ? 'social' : 'web',
      disputed: narrative.status === 'DISPUTED',
    }));
  });
}

export function buildNarrativePropagationView(narrative: NarrativeCluster, signals: NarrativeSignal[]): NarrativePropagationView {
  const related = signals.filter((signal) => signal.narrativeId === narrative.narrativeId).sort((a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt));
  const timeline = related.map((signal) => ({ window: signal.observedAt, signalCount: 1 }));
  const platformMatrix = related.reduce((acc, signal) => {
    const platform = signal.platform || 'unknown';
    acc[platform] = (acc[platform] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const spreadScore = Number((related.reduce((sum, signal) => sum + signal.amplificationScore, 0) / Math.max(1, related.length)).toFixed(2));
  return {
    narrativeId: narrative.narrativeId,
    timeline,
    platformMatrix,
    spreadScore,
    burstDetected: related.length >= 4,
    disputed: narrative.status === 'DISPUTED' || related.some((signal) => signal.disputed),
  };
}
