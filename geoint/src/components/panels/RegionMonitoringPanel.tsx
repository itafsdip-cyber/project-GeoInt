import { useState } from 'react';
import type { MonitoredRegion, RegionSummary } from '../../types/intelligence';

export default function RegionMonitoringPanel({ regions, summaries, onSaveViewportRegion, onJumpToRegion }: {
  regions: MonitoredRegion[];
  summaries: RegionSummary[];
  onSaveViewportRegion: (name: string) => void;
  onJumpToRegion?: (regionId: string) => void;
}) {
  const [name, setName] = useState('');
  return <section style={{ border: '1px solid #1c2735', padding: 8 }}>
    <div style={{ fontSize: 11, color: '#00e5c8' }}>REGION MONITORING</div>
    <div style={{ fontSize: 9, color: '#91a7bb' }}>Heuristic summary only. Not predictive.</div>
    <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
      <input value={name} onChange={(event) => setName(event.target.value)} placeholder='save current map view as region' />
      <button onClick={() => { onSaveViewportRegion(name || 'Monitored viewport'); setName(''); }}>save region</button>
    </div>
    {regions.slice(0, 8).map((region) => {
      const summary = summaries.find((item) => item.regionId === region.id);
      return <div key={region.id} style={{ marginTop: 6, fontSize: 10 }}>
        <div>{region.name} · {region.geometryType} · last {summary?.lastUpdated || 'n/a'}</div>
        <div style={{ color: '#8aa0b8' }}>{summary?.heuristicSummary || 'No summary yet'}</div>
        <div style={{ color: '#8aa0b8' }}>24h/7d/30d/custom filters available in timeline/search.</div>
        <button onClick={() => onJumpToRegion?.(region.id)}>jump map</button>
      </div>;
    })}
  </section>;
}
