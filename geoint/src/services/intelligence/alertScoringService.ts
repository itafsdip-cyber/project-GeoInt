import type { Incident, MonitoredRegion, WatchlistAlert } from '../../types/intelligence';
import { confidenceBandFromScore } from './sourceReliabilityService';

export function scoreAlert(alert: WatchlistAlert, context: {
  incident?: Incident;
  relatedRegion?: MonitoredRegion;
  freshnessHours?: number;
  corroboratingSignals?: number;
  sourceDiversity?: number;
}) {
  const freshness = Math.max(0, 1 - ((context.freshnessHours ?? 12) / 72));
  const severityBoost = alert.severity === 'CRITICAL' ? 1 : alert.severity === 'HIGH' ? 0.78 : alert.severity === 'MEDIUM' ? 0.55 : 0.35;
  const regionSensitivity = context.relatedRegion ? 0.7 : 0.45;
  const entityImportance = alert.matchedObjectType === 'entity' ? 0.8 : 0.5;
  const corroboration = Math.min(1, (context.corroboratingSignals ?? 1) / 5);
  const sourceDiversity = Math.min(1, (context.sourceDiversity ?? 1) / 4);
  const incidentConfidence = context.incident?.confidenceScore ?? 0.45;

  const scoreBreakdown = {
    sourceCredibility: incidentConfidence,
    sourceDiversity,
    freshness,
    regionSensitivity,
    entityImportance,
    corroboration,
    narrativeBurstBehavior: alert.matchedObjectType === 'narrative' ? 0.75 : 0.45,
  };

  const priorityScore = Number((
    (scoreBreakdown.sourceCredibility * 0.2)
    + (scoreBreakdown.sourceDiversity * 0.12)
    + (scoreBreakdown.freshness * 0.16)
    + (scoreBreakdown.regionSensitivity * 0.12)
    + (scoreBreakdown.entityImportance * 0.12)
    + (scoreBreakdown.corroboration * 0.16)
    + (scoreBreakdown.narrativeBurstBehavior * 0.12)
  ).toFixed(3));

  return {
    ...alert,
    priorityScore,
    scoreBreakdown,
    escalationHint: priorityScore >= 0.7 ? 'Escalate for analyst triage. Priority score is not proof of truth.' : 'Monitor; await independent corroboration.',
    confidenceScore: priorityScore,
    confidenceBand: confidenceBandFromScore(priorityScore),
    caveatText: 'Alert score supports prioritization only. Repeated narrative propagation is not proof of truth.',
    gapsNote: 'Validate with independent sources and maintain separation of overlays vs incidents.',
    read: alert.read,
  };
}

export function prioritizeAlerts(alerts: WatchlistAlert[], contextResolver: (alert: WatchlistAlert) => Parameters<typeof scoreAlert>[1]) {
  return alerts
    .map((alert) => scoreAlert(alert, contextResolver(alert)))
    .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
}
