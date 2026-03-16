export default function EntityGraphPanel({ graph, selectedEntityId, onSelectEntity }) {
  const actors = (graph.nodes || []).filter((node) => node.type === 'actor').slice(0, 8);
  const topEdges = (graph.edges || []).sort((a, b) => b.weight - a.weight).slice(0, 8);
  return (
    <div style={{ border: '1px solid #1b232f', borderRadius: 4, padding: 8, background: '#0a0d12' }}>
      <div style={{ fontSize: 10, color: '#00e5c8', marginBottom: 6 }}>ENTITY GRAPH</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {actors.map((actor) => (
          <button key={actor.id} onClick={() => onSelectEntity(actor.id)} style={{ fontSize: 8, border: '1px solid #1b232f', background: selectedEntityId === actor.id ? 'rgba(0,229,200,0.12)' : 'none', color: selectedEntityId === actor.id ? '#00e5c8' : '#60748d' }}>{actor.label}</button>
        ))}
      </div>
      <div style={{ marginTop: 6 }}>
        {topEdges.map((edge) => <div key={`${edge.from}-${edge.to}-${edge.type}`} style={{ fontSize: 8, color: '#60748d' }}>{edge.type}: {edge.from.split(':')[1]} → {edge.to.split(':')[1]} ({edge.weight})</div>)}
      </div>
    </div>
  );
}
