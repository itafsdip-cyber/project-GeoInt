import { Children, type ReactNode } from 'react';
import RightRail from './RightRail';
import TopBar from './TopBar';
import type { AIProviderSettings } from '../../state/useGeoIntStore';

interface WorkspaceLayoutProps {
  map?: ReactNode;
  right?: ReactNode;
  children?: ReactNode;
  topBarTitle?: string;
  aiProvider?: AIProviderSettings;
  sourceOps?: {
    active: number;
    degraded: number;
    failed: number;
  };
}

const defaultAiProvider: AIProviderSettings = {
  providerType: 'none',
  timeoutMs: 8000,
  reachable: false,
  statusMessage: 'AI disabled. Platform running in non-AI mode.',
};

export default function WorkspaceLayout({ map, right, children, aiProvider, sourceOps }: WorkspaceLayoutProps) {
  const childList = Children.toArray(children);
  const resolvedMap = map ?? childList[0] ?? null;
  const resolvedRight = right ?? childList.slice(1);

  return (
    <div style={{ background: '#020305', color: '#d6e5f4', minHeight: '100vh' }}>
      <TopBar aiProvider={aiProvider ?? defaultAiProvider} sourceOps={sourceOps ?? { active: 0, degraded: 0, failed: 0 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, padding: 12 }}>
        <div>{resolvedMap}</div>
        <RightRail>{resolvedRight}</RightRail>
      </div>
    </div>
  );
}
