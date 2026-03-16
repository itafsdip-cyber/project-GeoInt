import type { NarrativeCluster } from '../../types/intelligence';

export default function NarrativePanel({ narratives }: { narratives: NarrativeCluster[] }) {
  return <section><div style={{ fontSize: 11, color: '#00e5c8' }}>NARRATIVES</div>{narratives.slice(0, 8).map((narrative) => <div key={narrative.narrativeId} style={{ fontSize: 10 }}>{narrative.title} · {narrative.status} · src {narrative.sourceCount}</div>)}</section>;
}
