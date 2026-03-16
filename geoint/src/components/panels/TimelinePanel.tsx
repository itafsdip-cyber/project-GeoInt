import { useMemo, useState } from 'react';
import type { TimelineItem } from '../../services/intelligence/timelineService';

type TimelineViewMode = 'chronological' | 'feed' | 'day';

interface Props {
  items: TimelineItem[];
  onCenterMap?: (item: TimelineItem) => void;
  onCreateNote?: (item: TimelineItem) => void;
  onAddToBriefing?: (item: TimelineItem) => void;
  onFilterContext?: (item: TimelineItem) => void;
}

const modeLabel: Record<TimelineViewMode, string> = {
  chronological: 'Chronological',
  feed: 'Activity Feed',
  day: 'By Day',
};

export default function TimelinePanel({ items, onCenterMap, onCreateNote, onAddToBriefing, onFilterContext }: Props) {
  const [mode, setMode] = useState<TimelineViewMode>('chronological');
  const [incidentId, setIncidentId] = useState('');
  const [narrativeId, setNarrativeId] = useState('');
  const [entityId, setEntityId] = useState('');
  const [source, setSource] = useState('');
  const [overlayType, setOverlayType] = useState('');

  const filtered = useMemo(() => items.filter((item) => {
    if (incidentId && item.incidentId !== incidentId && !item.linkedIds.includes(incidentId)) return false;
    if (narrativeId && item.narrativeId !== narrativeId && !item.linkedIds.includes(narrativeId)) return false;
    if (entityId && !(item.entityIds || []).includes(entityId) && !item.linkedIds.includes(entityId)) return false;
    if (source && !item.source.toLowerCase().includes(source.toLowerCase())) return false;
    if (overlayType && item.overlayType !== overlayType) return false;
    return true;
  }), [entityId, incidentId, items, narrativeId, overlayType, source]);

  const groupedByDay = useMemo(() => filtered.reduce<Record<string, TimelineItem[]>>((acc, item) => {
    const key = new Date(item.timestamp).toISOString().slice(0, 10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {}), [filtered]);

  return (
    <section>
      <div style={{ fontSize: 11, color: '#00e5c8' }}>INTELLIGENCE TIMELINE</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 4, margin: '6px 0' }}>
        <input placeholder="incident" value={incidentId} onChange={(e) => setIncidentId(e.target.value)} />
        <input placeholder="narrative" value={narrativeId} onChange={(e) => setNarrativeId(e.target.value)} />
        <input placeholder="entity" value={entityId} onChange={(e) => setEntityId(e.target.value)} />
        <input placeholder="source" value={source} onChange={(e) => setSource(e.target.value)} />
      </div>
      <div style={{ marginBottom: 6 }}>
        {(['chronological', 'feed', 'day'] as TimelineViewMode[]).map((view) => (
          <button key={view} style={{ marginRight: 4 }} onClick={() => setMode(view)}>{modeLabel[view]}</button>
        ))}
        <select value={overlayType} onChange={(e) => setOverlayType(e.target.value)}>
          <option value="">all overlays</option>
          <option value="AIR">AIR</option>
          <option value="MARITIME">MARITIME</option>
          <option value="FIRE">FIRE</option>
          <option value="HOTSPOT">HOTSPOT</option>
          <option value="SATELLITE">SATELLITE</option>
        </select>
      </div>
      {mode !== 'day' && (
        <div>
          {filtered.slice(0, mode === 'feed' ? 15 : 40).map((item) => (
            <div key={item.id} style={{ borderBottom: '1px solid #22303f', marginBottom: 4, paddingBottom: 4, fontSize: 10 }}>
              <div>{new Date(item.timestamp).toLocaleString()} · {item.type} · {item.category}</div>
              <div>{item.summary}</div>
              <div style={{ color: '#9cb2c7' }}>{item.source} · {item.confidence}</div>
              <div>
                <button onClick={() => onCenterMap?.(item)}>center map</button>
                <button onClick={() => onCreateNote?.(item)}>to note</button>
                <button onClick={() => onAddToBriefing?.(item)}>to briefing</button>
                <button onClick={() => onFilterContext?.(item)}>filter context</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {mode === 'day' && Object.entries(groupedByDay).map(([day, dayItems]) => (
        <div key={day} style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, color: '#8fa2b6' }}>{day}</div>
          <div style={{ fontSize: 10 }}>{dayItems.length} event(s)</div>
        </div>
      ))}
    </section>
  );
}
