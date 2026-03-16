interface SourceStatus {
  sourceId: string;
  healthState: string;
  lastRunState?: string;
  warningCount?: number;
  staleAgeMs?: number;
  lastError?: string;
}

interface ConnectorMeta {
  sourceId: string;
  configured: boolean;
  degraded: boolean;
}

export default function SourceOperationsPanel({ status = [] as SourceStatus[], connectors = [] as ConnectorMeta[] }) {
  return (
    <section>
      <div style={{ fontSize: 11, color: '#00e5c8' }}>SOURCE OPS</div>
      {status.map((item) => {
        const connector = connectors.find((c) => c.sourceId === item.sourceId);
        const staleMinutes = item.staleAgeMs ? Math.round(item.staleAgeMs / 60000) : null;
        return (
          <div key={item.sourceId} style={{ fontSize: 10, marginBottom: 4 }}>
            {item.sourceId} · {item.healthState} · run:{item.lastRunState || 'n/a'} · warn:{item.warningCount || 0}
            {staleMinutes != null ? ` · stale:${staleMinutes}m` : ''}
            {connector ? ` · ${connector.configured ? 'configured' : 'not-configured'}${connector.degraded ? '/degraded' : ''}` : ''}
            {item.lastError ? <div style={{ color: '#ff8' }}>{item.lastError}</div> : null}
          </div>
        );
      })}
    </section>
  );
}
