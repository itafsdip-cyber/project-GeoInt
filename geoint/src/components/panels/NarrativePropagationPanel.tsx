import type { NarrativeCluster, NarrativeSignal } from '../../types/intelligence';
import { buildNarrativePropagationView } from '../../services/intelligence/narrativePropagationService';

export default function NarrativePropagationPanel({ narrative, signals }: { narrative?: NarrativeCluster; signals: NarrativeSignal[] }) {
  if (!narrative) return <section style={{ border: '1px solid #1c2735', padding: 8, fontSize: 10 }}>Select a narrative to view propagation.</section>;
  const propagation = buildNarrativePropagationView(narrative, signals);
  return <section style={{ border: '1px solid #1c2735', padding: 8 }}><div style={{ fontSize: 11, color: '#00e5c8' }}>PROPAGATION</div><div style={{ fontSize: 10 }}>{narrative.title} · spread {propagation.spreadScore}</div>{propagation.disputed && <div style={{ color: '#ff9d9d', fontSize: 10 }}>Disputed warning badge: amplification may be low-credibility.</div>}<div style={{ fontSize: 10 }}>Timeline windows: {propagation.timeline.length}</div><div style={{ fontSize: 10 }}>Platform matrix: {Object.entries(propagation.platformMatrix).map(([platform, count]) => `${platform}:${count}`).join(' · ') || 'n/a'}</div><div style={{ fontSize: 10 }}>Burst detection: {propagation.burstDetected ? 'yes' : 'no'}</div><div style={{ fontSize: 9, color: '#8fa2b6' }}>{narrative.caveatNote || 'Narrative spread is not factual proof.'}</div></section>;
}
