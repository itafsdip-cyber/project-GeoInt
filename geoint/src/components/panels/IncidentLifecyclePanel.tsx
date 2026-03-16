import type { Incident, IncidentLifecycleState } from '../../types/intelligence';

const states: IncidentLifecycleState[] = ['NEW', 'ACTIVE', 'MONITORING', 'ESCALATED', 'STABLE', 'RESOLVED', 'ARCHIVED'];

export default function IncidentLifecyclePanel({ incidents, onUpdateLifecycle, onUpdatePriority, onCenterMap }: {
  incidents: Incident[];
  onUpdateLifecycle: (incidentId: string, state: IncidentLifecycleState) => void;
  onUpdatePriority: (incidentId: string, priority: Incident['analystPriority']) => void;
  onCenterMap?: (incident: Incident) => void;
}) {
  return <section style={{ border: '1px solid #1c2735', padding: 8 }}>
    <div style={{ fontSize: 11, color: '#00e5c8' }}>INCIDENT LIFECYCLE & FUSION</div>
    <div style={{ marginTop: 4, fontSize: 9, color: '#93a6bb' }}>Merging preserves provenance. Co-occurrence is not command structure.</div>
    {incidents.slice(0, 12).map((incident) => <div key={incident.incidentId} style={{ marginTop: 6, fontSize: 10, borderTop: '1px solid #223040', paddingTop: 4 }}>
      <div>{incident.title} · {incident.lifecycleState || 'NEW'} · {incident.confidenceBand || 'N/A'}</div>
      <div style={{ color: '#8aa0b8' }}>Fusion rationale: {(incident.fusionRationale || ['No rationale available']).join(' ')}</div>
      <div style={{ color: '#8aa0b8' }}>Escalation: {incident.escalationReason || 'None'} · Linked events {(incident.linkedEventIds || incident.eventIds || []).length}</div>
      <select value={incident.lifecycleState || 'NEW'} onChange={(event) => onUpdateLifecycle(incident.incidentId, event.target.value as IncidentLifecycleState)}>
        {states.map((state) => <option key={state} value={state}>{state}</option>)}
      </select>
      <select value={incident.analystPriority || 'MEDIUM'} onChange={(event) => onUpdatePriority(incident.incidentId, event.target.value as Incident['analystPriority'])}>
        {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((priority) => <option key={priority} value={priority}>{priority}</option>)}
      </select>
      <button onClick={() => onCenterMap?.(incident)}>center map</button>
    </div>)}
  </section>;
}
