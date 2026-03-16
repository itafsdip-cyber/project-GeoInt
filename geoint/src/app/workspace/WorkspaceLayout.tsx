import type { ReactNode } from 'react';
import RightRail from './RightRail';
import TopBar from './TopBar';
import type { AIProviderSettings } from '../../state/useGeoIntStore';

interface WorkspaceLayoutProps {
  map: ReactNode;
  right: ReactNode;
  aiProvider: AIProviderSettings;
}

export default function WorkspaceLayout({ map, right, aiProvider }: WorkspaceLayoutProps) {
  return (
    <div style={{ background: '#020305', color: '#d6e5f4', minHeight: '100vh' }}>
      <TopBar aiProvider={aiProvider} />
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, padding: 12 }}>
        <div>{map}</div>
        <RightRail>{right}</RightRail>
      </div>
    </div>
  );
}
