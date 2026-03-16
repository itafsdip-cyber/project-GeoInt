import { useMemo, useState } from 'react';
import type { WatchlistAlert } from '../../types/intelligence';

export default function AlertFeedPanel({ alerts, onMarkRead, onPin, onPromoteToNote, onPromoteToBriefing, onSelectAlert }: {
  alerts: WatchlistAlert[];
  onMarkRead: (id: string, read: boolean) => void;
  onPin?: (id: string) => void;
  onPromoteToNote?: (alert: WatchlistAlert) => void;
  onPromoteToBriefing?: (alert: WatchlistAlert) => void;
  onSelectAlert?: (alert: WatchlistAlert) => void;
}) {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [severity, setSeverity] = useState('ALL');
  const [threshold, setThreshold] = useState(0);
  const filtered = useMemo(() => alerts.filter((alert) => (!unreadOnly || !alert.read)
    && (severity === 'ALL' || alert.severity === severity)
    && (alert.priorityScore || 0) >= threshold), [alerts, unreadOnly, severity, threshold]);

  return <section style={{ border: '1px solid #1c2735', padding: 8 }}>
    <div style={{ fontSize: 11, color: '#00e5c8' }}>PRIORITIZED ALERT FEED</div>
    <div style={{ marginTop: 4, display: 'flex', gap: 4, fontSize: 10 }}>
      <label><input type='checkbox' checked={unreadOnly} onChange={(event) => setUnreadOnly(event.target.checked)} /> unread</label>
      <select value={severity} onChange={(event) => setSeverity(event.target.value)}><option value='ALL'>all severity</option><option value='LOW'>LOW</option><option value='MEDIUM'>MEDIUM</option><option value='HIGH'>HIGH</option><option value='CRITICAL'>CRITICAL</option></select>
      <label>score ≥ <input type='number' min={0} max={1} step={0.1} value={threshold} onChange={(event) => setThreshold(Number(event.target.value) || 0)} style={{ width: 50 }} /></label>
    </div>
    <div style={{ color: '#91a8bc', fontSize: 9, marginTop: 3 }}>Score supports prioritization only, not proof of truth.</div>
    {filtered.slice(0, 16).map((alert) => <div key={alert.id} style={{ marginTop: 6, fontSize: 10 }}>
      {alert.severity} · {(alert.priorityScore || 0).toFixed(2)} · {alert.reason}
      <div style={{ color: '#88a0b6' }}>{alert.escalationHint || 'No escalation hint'}</div>
      <button onClick={() => onMarkRead(alert.id, !alert.read)}>{alert.read ? 'mark unread' : 'mark read'}</button>
      <button onClick={() => onPin?.(alert.id)}>pin inv</button>
      <button onClick={() => onPromoteToNote?.(alert)}>to note</button>
      <button onClick={() => onPromoteToBriefing?.(alert)}>to briefing</button>
      <button onClick={() => onSelectAlert?.(alert)}>highlight map</button>
    </div>)}
  </section>;
}
