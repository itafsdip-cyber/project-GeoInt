import type { BriefingDocument } from '../../types/intelligence';

export default function BriefingAssistantPanel({ onAssemble, onApplyDraft, hasAIProvider }: {
  onAssemble: (mode: 'manual' | 'heuristic' | 'ai-assisted') => BriefingDocument | null;
  onApplyDraft: (briefing: BriefingDocument) => void;
  hasAIProvider: boolean;
}) {
  return <section style={{ border: '1px solid #1c2735', padding: 8 }}>
    <div style={{ fontSize: 11, color: '#00e5c8' }}>BRIEFING ASSISTANT</div>
    <div style={{ fontSize: 9, color: '#91a8bc' }}>AI remains optional. AI-generated sections are explicitly labeled.</div>
    <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
      <button onClick={() => { const draft = onAssemble('manual'); if (draft) onApplyDraft(draft); }}>manual scaffold</button>
      <button onClick={() => { const draft = onAssemble('heuristic'); if (draft) onApplyDraft(draft); }}>heuristic draft</button>
      <button disabled={!hasAIProvider} onClick={() => { const draft = onAssemble('ai-assisted'); if (draft) onApplyDraft(draft); }}>AI assist</button>
    </div>
  </section>;
}
