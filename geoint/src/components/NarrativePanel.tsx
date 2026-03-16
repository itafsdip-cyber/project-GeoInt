export default function NarrativePanel({ narratives = [] }) {
  const top = narratives.slice(0, 8);
  return <div style={{ border: '1px solid #1b232f', borderRadius: 4, padding: 8, background: '#0a0d12' }}>
    <div style={{ fontSize: 10, color: '#00e5c8', marginBottom: 6 }}>NARRATIVES</div>
    <div style={{ display: 'grid', gap: 5 }}>
      {top.map((n) => <div key={n.narrativeId} style={{ border: '1px solid #1b232f', padding: '4px 6px' }}>
        <div style={{ fontSize: 9, color: '#d6e5f4' }}>{n.keywords.join(', ')}</div>
        <div style={{ fontSize: 8, color: '#60748d' }}>{n.labels.join(' · ')} · sources {n.sourceCount}</div>
      </div>)}
    </div>
  </div>;
}
