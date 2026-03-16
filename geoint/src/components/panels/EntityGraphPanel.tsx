import { useMemo, useState } from 'react';
import type { EntityNode, EntityRelation } from '../../types/intelligence';
import { buildGraphView } from '../../services/intelligence/entityGraphViewService';

export default function EntityGraphPanel({ entities, relations, onFocusEntity, onCreateNoteFromNode }: {
  entities: EntityNode[];
  relations: EntityRelation[];
  onFocusEntity?: (entityId: string) => void;
  onCreateNoteFromNode?: (entity: EntityNode) => void;
}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string>();
  const [minimumWeight, setMinimumWeight] = useState(1);
  const [depth, setDepth] = useState(1);
  const [recentOnlyDays, setRecentOnlyDays] = useState<number | undefined>();
  const [edgeTypes, setEdgeTypes] = useState<string[]>([]);

  const view = useMemo(() => buildGraphView(entities, relations, { search, edgeTypes, minimumWeight, depth, recentOnlyDays, focusedEntityId: selected }), [entities, relations, search, edgeTypes, minimumWeight, depth, recentOnlyDays, selected]);
  const selectedNode = view.nodes.find((node) => node.entityId === selected) || view.nodes[0];

  return <section style={{ border: '1px solid #1c2735', padding: 8 }}>
    <div style={{ fontSize: 11, color: '#00e5c8' }}>ENTITY GRAPH</div>
    <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="graph search" style={{ width: '100%', marginTop: 4, background: '#0b121a', color: '#dce8f4', border: '1px solid #263446' }} />
    <div style={{ display: 'flex', gap: 6, marginTop: 6, fontSize: 10 }}>
      <label>min weight <input type="number" min={1} value={minimumWeight} onChange={(event) => setMinimumWeight(Number(event.target.value || 1))} style={{ width: 42 }} /></label>
      <label>depth <input type="number" min={1} max={4} value={depth} onChange={(event) => setDepth(Number(event.target.value || 1))} style={{ width: 42 }} /></label>
      <label>recent <select value={recentOnlyDays || ''} onChange={(event) => setRecentOnlyDays(event.target.value ? Number(event.target.value) : undefined)}><option value="">all</option><option value="3">3d</option><option value="7">7d</option><option value="30">30d</option></select></label>
    </div>
    <div style={{ marginTop: 6, fontSize: 10 }}>edge filters {view.edgeTypes.map((edgeType) => <button key={edgeType} onClick={() => setEdgeTypes((current) => current.includes(edgeType) ? current.filter((item) => item !== edgeType) : [...current, edgeType])} style={{ marginLeft: 4, background: edgeTypes.includes(edgeType) ? '#12405f' : '#182634', color: '#9fc2dc', border: '1px solid #234' }}>{edgeType}</button>)}</div>
    <div style={{ maxHeight: 140, overflowY: 'auto', marginTop: 6 }}>{view.nodes.slice(0, 25).map((node) => <div key={node.entityId} style={{ fontSize: 10, display: 'flex', justifyContent: 'space-between', cursor: 'pointer', color: selected === node.entityId ? '#fff' : '#b8c8d9' }} onClick={() => { setSelected(node.entityId); onFocusEntity?.(node.entityId); }}>{node.label}<span>{node.type}</span></div>)}</div>
    {selectedNode && <div style={{ marginTop: 6, borderTop: '1px solid #1e2c3a', paddingTop: 6, fontSize: 10 }}>
      <div style={{ color: '#8fb5cf' }}>Selected {selectedNode.label}</div>
      <div>Aliases: {selectedNode.aliases.join(', ') || '—'}</div>
      <div>Counts: incidents {selectedNode.linkedIncidentCount || 0} · notes {selectedNode.linkedNoteCount || 0} · narratives {selectedNode.linkedNarrativeCount || 0}</div>
      <div>Seen: {selectedNode.firstSeen} → {selectedNode.lastSeen}</div>
      <button onClick={() => onCreateNoteFromNode?.(selectedNode)} style={{ marginTop: 4 }}>Create note</button>
    </div>}
    <div style={{ fontSize: 9, color: '#8fa2b6', marginTop: 6 }}>Co-occurrence edges indicate only co-occurrence and never imply command/control affiliation.</div>
  </section>;
}
