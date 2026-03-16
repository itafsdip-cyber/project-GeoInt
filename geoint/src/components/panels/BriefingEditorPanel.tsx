import type { BriefingDocument } from '../../types/intelligence';
import { exportBriefing } from '../../services/intelligence/briefingService';

export default function BriefingEditorPanel({ briefing }: { briefing: BriefingDocument }) {
  const doExport = (format: 'markdown' | 'json' | 'text' | 'html') => {
    const content = exportBriefing(briefing, format);
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `briefing.${format === 'markdown' ? 'md' : format}`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return <section><div style={{ fontSize: 11, color: '#00e5c8' }}>BRIEFING</div><div style={{ fontSize: 11 }}>{briefing.title}</div><div>{['markdown','json','text','html'].map((f) => <button key={f} onClick={() => doExport(f as 'markdown' | 'json' | 'text' | 'html')}>{f}</button>)}</div></section>;
}
