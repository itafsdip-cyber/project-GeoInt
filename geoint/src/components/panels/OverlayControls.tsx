import type { OverlayTrackType } from '../../types/intelligence';

const controls: OverlayTrackType[] = ['MARITIME', 'AIR', 'FIRE', 'HOTSPOT', 'SATELLITE'];

const defaultEnabled: Record<OverlayTrackType, boolean> = {
  MARITIME: true,
  AIR: false,
  FIRE: true,
  HOTSPOT: true,
  SATELLITE: false,
};

export default function OverlayControls({ enabled, toggles, onToggle }: { enabled?: Record<OverlayTrackType, boolean>; toggles?: Record<OverlayTrackType, boolean>; onToggle: (key: OverlayTrackType) => void }) {
  const resolved = enabled ?? toggles ?? defaultEnabled;
  return <section><div style={{ fontSize: 11, color: '#00e5c8' }}>OVERLAYS</div>{controls.map((type) => <button key={type} onClick={() => onToggle(type)}>{resolved[type] ? 'ON' : 'OFF'} {type}</button>)}</section>;
}
