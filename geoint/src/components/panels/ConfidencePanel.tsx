import type { Incident, RegionSummary, WatchlistAlert } from '../../types/intelligence';

export default function ConfidencePanel({ incidents, alerts, regionSummaries }: { incidents: Incident[]; alerts: WatchlistAlert[]; regionSummaries: RegionSummary[] }) {
  return <section style={{ border: '1px solid #1c2735', padding: 8 }}>
    <div style={{ fontSize: 11, color: '#00e5c8' }}>CONFIDENCE & RELIABILITY</div>
    <div style={{ color: '#91a8bc', fontSize: 9 }}>Scores are analytical support, not certainty.</div>
    <div style={{ fontSize: 10, marginTop: 4 }}>Incidents high confidence: {incidents.filter((incident) => incident.confidenceBand === 'HIGH').length}/{incidents.length}</div>
    <div style={{ fontSize: 10 }}>Alerts high confidence: {alerts.filter((alert) => alert.confidenceBand === 'HIGH').length}/{alerts.length}</div>
    <div style={{ fontSize: 10 }}>Region summaries: {regionSummaries.length}</div>
  </section>;
}
