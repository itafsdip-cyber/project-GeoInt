import type { OverlayTrackType } from '../../types/intelligence';

const controls: OverlayTrackType[] = ['MARITIME', 'AIR', 'FIRE', 'HOTSPOT', 'SATELLITE'];

export default function OverlayControls({ enabled, onToggle }: { enabled: Record<OverlayTrackType, boolean>; onToggle: (key: OverlayTrackType) => void }) {
  return <section><div style={{ fontSize: 11, color: '#00e5c8' }}>OVERLAYS</div>{controls.map((type) => <button key={type} onClick={() => onToggle(type)}>{enabled[type] ? 'ON' : 'OFF'} {type}</button>)}</section>;
}
