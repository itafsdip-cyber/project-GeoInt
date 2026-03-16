import type { CorrelationCandidate } from '../../types/intelligence';

export default function CorrelationPanel({ candidates, scoreThreshold, onScoreThreshold, onPinCandidate, onPromoteCandidate }: {
  candidates: CorrelationCandidate[];
  scoreThreshold: number;
  onScoreThreshold: (value: number) => void;
  onPinCandidate?: (id: string) => void;
  onPromoteCandidate?: (candidate: CorrelationCandidate) => void;
}) {
  return <section style={{ border: '1px solid #1c2735', padding: 8 }}><div style={{ fontSize: 11, color: '#00e5c8' }}>CANDIDATE CORRELATIONS</div><label style={{ fontSize: 10 }}>score threshold <input type="number" step="0.05" min={0} max={1} value={scoreThreshold} onChange={(event) => onScoreThreshold(Number(event.target.value || 0))} style={{ width: 64 }} /></label>{candidates.filter((candidate) => candidate.score >= scoreThreshold).slice(0, 10).map((candidate) => <div key={candidate.id} style={{ marginTop: 5, fontSize: 10 }}><div>{candidate.correlationType} · {candidate.score.toFixed(2)}</div><div style={{ color: '#8ea6bd' }}>{candidate.rationale[0]}</div><div style={{ color: '#8fa2b6' }}>{candidate.caveat}</div><button onClick={() => onPinCandidate?.(candidate.id)}>Pin</button> <button onClick={() => onPromoteCandidate?.(candidate)}>Promote to briefing</button></div>)}</section>;
}
