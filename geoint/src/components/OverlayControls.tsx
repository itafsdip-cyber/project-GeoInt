export default function OverlayControls({ overlayState, onToggle }) {
  const controls = [
    { key: 'vessels', label: 'Vessels' },
    { key: 'aircraft', label: 'Aircraft' },
    { key: 'fires', label: 'Fires' },
    { key: 'satelliteHotspots', label: 'Hotspots' },
  ];
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {controls.map((control) => (
        <button
          key={control.key}
          onClick={() => onToggle(control.key)}
          style={{
            fontSize: 10,
            padding: '4px 7px',
            borderRadius: 3,
            border: `1px solid ${overlayState[control.key] ? '#00e5c8' : '#1b232f'}`,
            background: overlayState[control.key] ? 'rgba(0,229,200,0.12)' : 'rgba(255,255,255,0.03)',
            color: overlayState[control.key] ? '#00e5c8' : '#60748d',
            cursor: 'pointer',
          }}
        >
          {control.label}
        </button>
      ))}
    </div>
  );
}
