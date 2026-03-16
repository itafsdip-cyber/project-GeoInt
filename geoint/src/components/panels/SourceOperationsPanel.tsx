interface SourceStatus {
  sourceId: string;
  healthState: string;
  lastRunState?: string;
  lastSuccess?: string;
  staleAgeMs?: number;
  durationMs?: number;
  itemsFetched?: number;
  itemsNormalized?: number;
  itemsDropped?: number;
  warningCount?: number;
  errorsCount?: number;
  degradedReason?: string;
  authRequired?: boolean;
  lastError?: string;
}

interface ConnectorMeta {
  sourceId: string;
  configured: boolean;
  degraded: boolean;
  requiresAuth?: boolean;
}

interface SourceRun {
  id: string;
  sourceId: string;
  state: string;
  durationMs?: number;
}

const HEALTH_COLOR: Record<string, string> = {
  ACTIVE: '#5def97',
  DEGRADED: '#ffe37d',
  FAILED: '#ff8484',
  AUTH_MISSING: '#d69dff',
  STALE: '#7f8a99',
};

function msToDuration(ms?: number) {
  if (!ms) return 'n/a';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function SourceOperationsPanel({
  status = [] as SourceStatus[],
  connectors = [] as ConnectorMeta[],
  runs = [] as SourceRun[],
}) {
  return (
    <section>
      <div style={{ fontSize: 11, color: '#00e5c8' }}>SOURCE OPS</div>
      {status.map((item) => {
        const connector = connectors.find((c) => c.sourceId === item.sourceId);
        const staleMinutes = item.staleAgeMs ? Math.round(item.staleAgeMs / 60000) : null;
        const runHistory = runs.filter((run) => run.sourceId === item.sourceId).slice(0, 5);
        const color = HEALTH_COLOR[item.healthState] || '#9ba7b3';

        return (
          <div key={item.sourceId} style={{ fontSize: 10, marginBottom: 6, borderBottom: '1px solid #1d2835', paddingBottom: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{item.sourceId}</strong>
              <span style={{ color }}>● {item.healthState}</span>
            </div>
            <div>run:{item.lastRunState || 'n/a'} · success:{item.lastSuccess ? new Date(item.lastSuccess).toLocaleTimeString() : 'never'}</div>
            <div>stale:{staleMinutes != null ? `${staleMinutes}m` : 'n/a'} · dur:{msToDuration(item.durationMs)}</div>
            <div>fetched:{item.itemsFetched || 0} norm:{item.itemsNormalized || 0} drop:{item.itemsDropped || 0}</div>
            <div>warn:{item.warningCount || 0} err:{item.errorsCount || 0}</div>
            {item.degradedReason ? <div style={{ color: '#ffd89a' }}>degraded: {item.degradedReason}</div> : null}
            {(item.authRequired || connector?.requiresAuth) ? <div style={{ color: '#d69dff' }}>auth-required</div> : null}
            {connector ? <div>{connector.configured ? 'configured' : 'not-configured'}{connector.degraded ? ' · degraded' : ''}</div> : null}
            {item.lastError ? <div style={{ color: '#ff9f9f' }}>{item.lastError}</div> : null}
            {runHistory.length > 0 ? (
              <div style={{ marginTop: 3 }}>
                {runHistory.map((run) => (
                  <div key={run.id} style={{ color: '#8fa2b6' }}>#{run.id.slice(-6)} {run.state} {msToDuration(run.durationMs)}</div>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </section>
  );
}
