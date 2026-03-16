import { useState } from 'react';

export default function ExportPanel({ onExport }: { onExport: (format: 'markdown' | 'json' | 'text' | 'html' | 'csv') => string }) {
  const [format, setFormat] = useState<'markdown' | 'json' | 'text' | 'html' | 'csv'>('markdown');
  const [preview, setPreview] = useState('');
  return <section style={{ border: '1px solid #1c2735', padding: 8 }}>
    <div style={{ fontSize: 11, color: '#00e5c8' }}>EXPORT</div>
    <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
      <select value={format} onChange={(event) => setFormat(event.target.value as any)}>
        <option value='markdown'>markdown</option>
        <option value='json'>json</option>
        <option value='text'>text</option>
        <option value='html'>printable html</option>
        <option value='csv'>csv</option>
      </select>
      <button onClick={() => setPreview(onExport(format))}>generate</button>
    </div>
    <textarea value={preview} readOnly rows={6} style={{ width: '100%', marginTop: 4 }} />
  </section>;
}
