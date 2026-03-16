import type { Incident, IncidentLifecycleState } from '../../types/intelligence';

const progression: IncidentLifecycleState[] = ['NEW', 'ACTIVE', 'MONITORING', 'ESCALATED', 'STABLE', 'RESOLVED', 'ARCHIVED'];

export function updateIncidentLifecycle(incident: Incident, nextState: IncidentLifecycleState, reason?: string): Incident {
  return {
    ...incident,
    lifecycleState: nextState,
    escalationReason: reason || incident.escalationReason,
    updatedAt: new Date().toISOString(),
  };
}

export function recommendLifecycleState(incident: Incident): IncidentLifecycleState {
  if ((incident.confidenceScore || 0) < 0.35) return 'MONITORING';
  if ((incident.analystPriority === 'CRITICAL' || incident.analystPriority === 'HIGH') && (incident.sourceCount || 0) >= 3) return 'ESCALATED';
  if ((incident.sourceCount || 0) >= 4) return 'ACTIVE';
  if ((incident.lifecycleState === 'RESOLVED' || incident.lifecycleState === 'ARCHIVED')) return incident.lifecycleState;
  return 'NEW';
}

export function getLifecycleTransitionOptions(current: IncidentLifecycleState = 'NEW') {
  const idx = progression.indexOf(current);
  return progression.slice(Math.max(0, idx - 1), Math.min(progression.length, idx + 3));
}
