export default function IncidentPanel({ incidents, pinnedIncidentIds, onPin }) {
  return (
    <div style={{ border: '1px solid #1b232f', borderRadius: 4, padding: 8, background: '#0a0d12' }}>
      <div style={{ fontSize: 10, color: '#00e5c8', marginBottom: 6 }}>PINNED INTELLIGENCE</div>
      <div style={{ display: 'grid', gap: 5 }}>
        {incidents.slice(0, 5).map((incident) => {
          const pinned = pinnedIncidentIds.includes(incident.incidentId);
          return (
            <div key={incident.incidentId} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, border: '1px solid #1b232f', padding: '4px 6px' }}>
              <span style={{ fontSize: 9, color: '#d6e5f4' }}>{incident.title}</span>
              <button onClick={() => onPin(incident.incidentId)} style={{ fontSize: 8, border: '1px solid #1b232f', background: 'none', color: pinned ? '#00e676' : '#60748d' }}>{pinned ? 'PINNED' : 'PIN'}</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
