import type { ReactNode } from 'react';

export default function RightRail({ children }: { children: ReactNode }) {
  return <aside style={{ display: 'grid', gap: 10, maxHeight: 'calc(100vh - 72px)', overflowY: 'auto', padding: 12 }}>{children}</aside>;
}
