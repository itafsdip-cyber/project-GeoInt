import type { AIProviderSettings } from '../../state/useGeoIntStore';

interface SourceOpsSummary {
  active: number;
  degraded: number;
  failed: number;
}

export default function TopBar({ aiProvider, sourceOps }: { aiProvider: AIProviderSettings; sourceOps: SourceOpsSummary }) {
  const aiStatus = aiProvider.providerType === 'none'
    ? 'AI DISABLED'
    : aiProvider.reachable
      ? 'AI CONNECTED'
      : 'AI UNAVAILABLE';

  return (
    <header style={{ borderBottom: '1px solid #1b232f', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: 12, color: '#00e5c8' }}>PROJECT-GEOINT</div>
        <div style={{ fontSize: 11, color: '#8fa2b6' }}>Hosted intelligence workspace · AI optional</div>
      </div>
      <div style={{ textAlign: 'right', fontSize: 11 }}>
        <div style={{ color: aiProvider.reachable ? '#8dffb5' : '#ffb48d' }}>{aiStatus}</div>
        <div style={{ color: '#9ab1c7' }}>Sources active {sourceOps.active} · degraded {sourceOps.degraded} · failed {sourceOps.failed}</div>
      </div>
    </header>
  );
}
