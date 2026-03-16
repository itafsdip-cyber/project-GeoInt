interface SourceRun {
  sourceId: string;
  state: string;
  lastSuccessAt?: string;
  lastError?: string;
  warningCount?: number;
  itemsFetched?: number;
  stale?: boolean;
  authMissing?: boolean;
}

export default function SourceOperationsPanel({ runs = [] as SourceRun[] }) {
  return <section><div style={{ fontSize: 11, color: '#00e5c8' }}>SOURCE OPS</div>{runs.map((run) => <div key={run.sourceId} style={{ fontSize: 10 }}>{run.sourceId} · {run.state} · {run.itemsFetched ?? 0}</div>)}</section>;
}
