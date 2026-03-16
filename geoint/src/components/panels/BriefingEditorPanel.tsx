import { useEffect, useMemo, useState } from 'react';
import type { BriefingDocument } from '../../types/intelligence';
import { exportBriefing } from '../../services/intelligence/briefingService';
import PrintableBriefingView from './PrintableBriefingView';

interface Props {
  briefing: BriefingDocument;
  onSave: (briefing: BriefingDocument) => void;
  onDelete: (briefingId: string) => void;
}

export default function BriefingEditorPanel({ briefing, onSave, onDelete }: Props) {
  const [draft, setDraft] = useState(briefing);
  const [printView, setPrintView] = useState(false);

  useEffect(() => {
    setDraft(briefing);
  }, [briefing]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (JSON.stringify(draft) !== JSON.stringify(briefing)) {
        onSave({ ...draft, updatedAt: new Date().toISOString() });
      }
    }, 1200);
    return () => window.clearTimeout(id);
  }, [briefing, draft, onSave]);

  const activeSection = useMemo(() => draft.sections[0], [draft.sections]);

  const doExport = (format: 'markdown' | 'json' | 'text' | 'html') => {
    const content = exportBriefing(draft, format);
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `briefing.${format === 'markdown' ? 'md' : format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const editTitle = () => {
    const nextTitle = window.prompt('Briefing title', draft.title)?.trim();
    if (!nextTitle) return;
    setDraft((current) => ({ ...current, title: nextTitle, updatedAt: new Date().toISOString() }));
  };

  return (
    <section>
      <div style={{ fontSize: 11, color: '#00e5c8' }}>BRIEFING</div>
      <div style={{ fontSize: 11 }}>{draft.title}</div>
      <button onClick={editTitle}>Rename</button>
      <button onClick={() => onDelete(draft.briefingId)}>Delete</button>
      <button onClick={() => setPrintView((v) => !v)}>{printView ? 'Hide printable' : 'Show printable'}</button>
      <div>{['markdown', 'json', 'text', 'html'].map((f) => <button key={f} onClick={() => doExport(f as 'markdown' | 'json' | 'text' | 'html')}>{f}</button>)}</div>
      {activeSection ? (
        <div>
          <div style={{ fontSize: 10, color: '#8fa2b6' }}>Editing section: {activeSection.title}</div>
          <textarea
            style={{ width: '100%', minHeight: 90 }}
            value={activeSection.content}
            onChange={(event) => setDraft((current) => ({
              ...current,
              sections: current.sections.map((section, index) => (index === 0 ? { ...section, content: event.target.value } : section)),
            }))}
          />
        </div>
      ) : null}
      {printView ? <PrintableBriefingView briefing={draft} /> : null}
    </section>
  );
}
