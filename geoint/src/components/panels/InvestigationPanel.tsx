import type { InvestigationSession } from '../../types/intelligence';

export default function InvestigationPanel({ investigations, selectedId, onSaveCurrent, onLoad, onDelete, onPromote }: {
  investigations: InvestigationSession[];
  selectedId?: string;
  onSaveCurrent: () => void;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
  onPromote: (id: string) => void;
}) {
  return <section style={{ border: '1px solid #1c2735', padding: 8 }}><div style={{ fontSize: 11, color: '#00e5c8' }}>INVESTIGATIONS</div><button onClick={onSaveCurrent}>Save current workspace</button>{investigations.slice(0, 10).map((item) => <div key={item.id} style={{ marginTop: 5, fontSize: 10, color: selectedId === item.id ? '#fff' : '#b5c6d8' }}>{item.title} · {item.updatedAt}<div><button onClick={() => onLoad(item.id)}>load</button> <button onClick={() => onDelete(item.id)}>delete</button> <button onClick={() => onPromote(item.id)}>promote to briefing skeleton</button></div></div>)}</section>;
}
