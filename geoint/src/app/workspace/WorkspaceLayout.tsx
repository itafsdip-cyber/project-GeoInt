import type { ReactNode } from 'react';

export default function WorkspaceLayout({ map, right }: { map: ReactNode; right: ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, padding: 12, background: '#020305', color: '#d6e5f4', minHeight: '100vh' }}><div>{map}</div><aside style={{ display: 'grid', gap: 10 }}>{right}</aside></div>;
}
