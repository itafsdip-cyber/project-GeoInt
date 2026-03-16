import { useState } from 'react';
import type { WatchlistAlert, WatchlistEntry } from '../../types/intelligence';

export default function WatchlistPanel({ entries, alerts, onCreateEntry, onToggleEntry, onPromoteAlert }: {
  entries: WatchlistEntry[];
  alerts: WatchlistAlert[];
  onCreateEntry: (entry: Partial<WatchlistEntry>) => void;
  onToggleEntry: (id: string) => void;
  onPromoteAlert?: (alert: WatchlistAlert) => void;
}) {
  const [title, setTitle] = useState('');
  const [criteria, setCriteria] = useState('');
  const unread = alerts.filter((alert) => !alert.read).length;
  return <section style={{ border: '1px solid #1c2735', padding: 8 }}><div style={{ fontSize: 11, color: '#00e5c8' }}>WATCHLISTS & ALERTS · unread {unread}</div><div style={{ display: 'flex', gap: 4, marginTop: 4 }}><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder='title' /><input value={criteria} onChange={(event) => setCriteria(event.target.value)} placeholder='criteria' /><button onClick={() => { onCreateEntry({ title, criteria, type: 'KEYWORD' }); setTitle(''); setCriteria(''); }}>add</button></div>{entries.slice(0, 10).map((entry) => <div key={entry.id} style={{ fontSize: 10, marginTop: 4 }}>{entry.title} · {entry.severity} · {entry.enabled ? 'enabled' : 'disabled'} <button onClick={() => onToggleEntry(entry.id)}>toggle</button></div>)}<div style={{ marginTop: 6, fontSize: 10 }}>Alert feed</div>{alerts.slice(0, 10).map((alert) => <div key={alert.id} style={{ fontSize: 10, marginTop: 4 }}>{alert.severity} · {alert.reason} · {alert.matchedObjectType}:{alert.matchedObjectId} <button onClick={() => onPromoteAlert?.(alert)}>Promote</button></div>)}</section>;
}
