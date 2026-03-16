import type { AIProviderSettings } from '../../state/useGeoIntStore';

export default function TopBar({ aiProvider }: { aiProvider: AIProviderSettings }) {
  return (
    <header style={{ borderBottom: '1px solid #1b232f', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: 12, color: '#00e5c8' }}>PROJECT-GEOINT</div>
        <div style={{ fontSize: 11, color: '#8fa2b6' }}>Hosted intelligence workspace · AI optional</div>
      </div>
      <div style={{ fontSize: 11, color: aiProvider.reachable ? '#8dffb5' : '#ffb48d' }}>
        AI: {aiProvider.providerType} · {aiProvider.reachable ? 'reachable' : 'unreachable / disabled'}
      </div>
    </header>
  );
}
