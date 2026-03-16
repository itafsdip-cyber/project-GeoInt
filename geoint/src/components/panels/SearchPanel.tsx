import type { SearchResult } from '../../types/intelligence';

export default function SearchPanel({ query, onQueryChange, results, onOpenDetail, onCenterMap, onAddToBriefing, onCreateNote }: {
  query: string;
  onQueryChange: (value: string) => void;
  results: SearchResult[];
  onOpenDetail?: (result: SearchResult) => void;
  onCenterMap?: (result: SearchResult) => void;
  onAddToBriefing?: (result: SearchResult) => void;
  onCreateNote?: (result: SearchResult) => void;
}) {
  return <section style={{ border: '1px solid #1c2735', padding: 8 }}><div style={{ fontSize: 11, color: '#00e5c8' }}>INTELLIGENCE SEARCH</div><input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="search events/incidents/entities/narratives..." style={{ width: '100%', marginTop: 4 }} />{results.slice(0, 12).map((result) => <div key={`${result.type}-${result.id}`} style={{ marginTop: 6, fontSize: 10, borderBottom: '1px dashed #243447', paddingBottom: 4 }}><div>{result.type.toUpperCase()} · {result.title}</div><div style={{ color: '#8fa2b6' }}>{result.timestamp} · src {result.sourceCount}</div><div style={{ color: '#9cb9cf' }}>{result.confidenceHint}{result.caveatHint ? ` · ${result.caveatHint}` : ''}</div><div><button onClick={() => onCenterMap?.(result)}>open in map</button> <button onClick={() => onOpenDetail?.(result)}>open detail</button> <button onClick={() => onAddToBriefing?.(result)}>add to briefing</button> <button onClick={() => onCreateNote?.(result)}>create note</button></div></div>)}</section>;
}
