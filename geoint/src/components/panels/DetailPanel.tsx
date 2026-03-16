import type { DetailRecord } from '../../services/intelligence/detailViewService';

export default function DetailPanel({ record, onCenterMap, onAddToNote, onAddToBriefing, onPinInvestigation, onClear }: {
  record?: DetailRecord;
  onCenterMap?: (record: DetailRecord) => void;
  onAddToNote?: (record: DetailRecord) => void;
  onAddToBriefing?: (record: DetailRecord) => void;
  onPinInvestigation?: (record: DetailRecord) => void;
  onClear?: () => void;
}) {
  return <section style={{ border: '1px solid #1c2735', padding: 8 }}>
    <div style={{ fontSize: 11, color: '#00e5c8' }}>TACTICAL DETAIL</div>
    {!record && <div style={{ fontSize: 10, color: '#8fa2b6', marginTop: 4 }}>Select an object from search, timeline, alerts, incidents, region, or graph.</div>}
    {record && <>
      <div style={{ marginTop: 4, fontSize: 11 }}>{record.title}</div>
      <div style={{ fontSize: 10, color: '#9db5c9' }}>{record.type.toUpperCase()} {record.timestamp ? `· ${new Date(record.timestamp).toLocaleString()}` : ''}</div>
      <div style={{ fontSize: 10, color: '#9db5c9' }}>Confidence: {record.confidence || 'N/A'}</div>
      <div style={{ fontSize: 10, color: '#9db5c9' }}>Caveat: {record.caveat || 'No caveat provided.'}</div>
      <div style={{ fontSize: 10, color: '#9db5c9' }}>Provenance: {record.provenance || 'N/A'}</div>
      {record.summary && <div style={{ marginTop: 3, fontSize: 10 }}>{record.summary}</div>}
      <div style={{ fontSize: 9, color: '#8fa2b6', marginTop: 3 }}>Linked: {record.linkedIds.slice(0, 8).join(', ') || 'none'}</div>
      {!!record.references?.length && <div style={{ fontSize: 9, color: '#8fa2b6' }}>Sources: {record.references.join(', ')}</div>}
      <div style={{ marginTop: 5 }}>
        <button onClick={() => onCenterMap?.(record)}>map</button>
        <button onClick={() => onAddToNote?.(record)}>to note</button>
        <button onClick={() => onAddToBriefing?.(record)}>to briefing</button>
        <button onClick={() => onPinInvestigation?.(record)}>pin investigation</button>
        <button onClick={onClear}>clear</button>
      </div>
    </>}
  </section>;
}
