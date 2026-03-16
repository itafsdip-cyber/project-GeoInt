import { useMemo, useState } from 'react';
import type { SearchResult } from '../../types/intelligence';

export interface SearchPanelFilters {
  types: string[];
  source?: string;
  startDate?: string;
  endDate?: string;
  region?: string;
}

export default function SearchPanel({ query, onQueryChange, results, filters, onFiltersChange, recentQueries = [], onRecallQuery, onOpenDetail, onCenterMap, onAddToBriefing, onCreateNote, onPinToInvestigation }: {
  query: string;
  onQueryChange: (value: string) => void;
  results: SearchResult[];
  filters: SearchPanelFilters;
  onFiltersChange: (next: SearchPanelFilters) => void;
  recentQueries?: string[];
  onRecallQuery?: (query: string) => void;
  onOpenDetail?: (result: SearchResult) => void;
  onCenterMap?: (result: SearchResult) => void;
  onAddToBriefing?: (result: SearchResult) => void;
  onCreateNote?: (result: SearchResult) => void;
  onPinToInvestigation?: (result: SearchResult) => void;
}) {
  const [typeInput, setTypeInput] = useState(filters.types.join(','));
  const listedTypes = useMemo(() => typeInput.split(',').map((item) => item.trim().toLowerCase()).filter(Boolean), [typeInput]);

  return <section style={{ border: '1px solid #1c2735', padding: 8 }}>
    <div style={{ fontSize: 11, color: '#00e5c8' }}>INTELLIGENCE SEARCH</div>
    <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="search events/incidents/entities/narratives..." style={{ width: '100%', marginTop: 4 }} />
    <div style={{ marginTop: 4, display: 'grid', gap: 4 }}>
      <input value={typeInput} onChange={(e) => setTypeInput(e.target.value)} onBlur={() => onFiltersChange({ ...filters, types: listedTypes })} placeholder='types comma-separated (incident,event,entity...)' />
      <input value={filters.source || ''} onChange={(e) => onFiltersChange({ ...filters, source: e.target.value })} placeholder='source filter' />
      <input value={filters.region || ''} onChange={(e) => onFiltersChange({ ...filters, region: e.target.value })} placeholder='region filter' />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        <input type='date' value={filters.startDate || ''} onChange={(e) => onFiltersChange({ ...filters, startDate: e.target.value })} />
        <input type='date' value={filters.endDate || ''} onChange={(e) => onFiltersChange({ ...filters, endDate: e.target.value })} />
      </div>
    </div>
    {!!recentQueries.length && <div style={{ marginTop: 5, fontSize: 9, color: '#8fa2b6' }}>Recent: {recentQueries.slice(0, 5).map((item) => <button key={item} onClick={() => onRecallQuery?.(item)} style={{ marginRight: 4 }}>{item}</button>)}</div>}
    {results.slice(0, 12).map((result) => <div key={`${result.type}-${result.id}`} style={{ marginTop: 6, fontSize: 10, borderBottom: '1px dashed #243447', paddingBottom: 4 }}>
      <div>{result.type.toUpperCase()} · {result.title} · score {(result.score || 0).toFixed(2)}</div>
      <div style={{ color: '#8fa2b6' }}>{result.timestamp} · src {result.sourceCount}{result.region ? ` · ${result.region}` : ''}</div>
      <div style={{ color: '#9cb9cf' }}>{result.confidenceHint}{result.caveatHint ? ` · ${result.caveatHint}` : ''}</div>
      {result.matchExcerpt && <div style={{ color: '#d3dfeb' }}>“{result.matchExcerpt}”</div>}
      <div><button onClick={() => onCenterMap?.(result)}>open in map</button> <button onClick={() => onOpenDetail?.(result)}>open detail</button> <button onClick={() => onAddToBriefing?.(result)}>add to briefing</button> <button onClick={() => onCreateNote?.(result)}>create note</button> <button onClick={() => onPinToInvestigation?.(result)}>pin to investigation</button></div>
    </div>)}
  </section>;
}
