function exportPayload({ format, selectedIncidents, pinnedIncidents, watchlistSummary, trendSummary, notes }) {
  const payload = {
    exportedAt: new Date().toISOString(),
    selectedIncidents,
    pinnedIncidents,
    watchlistSummary,
    trendSummary,
    analystNotes: notes,
  };
  if (format === 'json') return JSON.stringify(payload, null, 2);
  if (format === 'text') {
    return [
      `Briefing ${payload.exportedAt}`,
      `Incidents: ${selectedIncidents.map((item) => item.title).join(', ') || 'None'}`,
      `Pinned: ${pinnedIncidents.map((item) => item.title).join(', ') || 'None'}`,
      `Watchlist: ${watchlistSummary?.headline || 'N/A'}`,
      `Trend: ${trendSummary || 'N/A'}`,
      `Notes: ${notes.map((note) => `${note.analyst}: ${note.text}`).join(' | ') || 'None'}`,
    ].join('\n');
  }
  return [
    `# GEOINT Briefing (${payload.exportedAt})`,
    '## Selected incidents',
    ...selectedIncidents.map((item) => `- ${item.title}`),
    '## Pinned intelligence',
    ...pinnedIncidents.map((item) => `- ${item.title}`),
    '## Watchlist',
    `- ${watchlistSummary?.headline || 'N/A'}`,
    '## Trend',
    `- ${trendSummary || 'N/A'}`,
    '## Analyst notes',
    ...notes.map((note) => `- ${note.analyst} (${note.timestamp}): ${note.text}`),
  ].join('\n');
}

export default function BriefingPanel(props) {
  const { incidents, selectedIncidentIds, setSelectedIncidentIds, pinnedIncidentIds, watchlistSummary, trendSummary, notesByIncident } = props;

  const selectedIncidents = incidents.filter((incident) => selectedIncidentIds.includes(incident.incidentId));
  const pinnedIncidents = incidents.filter((incident) => pinnedIncidentIds.includes(incident.incidentId));
  const selectedNotes = selectedIncidents.flatMap((incident) => notesByIncident[incident.incidentId] || []);

  const runExport = (format) => {
    const content = exportPayload({ format, selectedIncidents, pinnedIncidents, watchlistSummary, trendSummary, notes: selectedNotes });
    const type = format === 'json' ? 'application/json' : 'text/plain';
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `geoint-briefing.${format === 'markdown' ? 'md' : format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return <div style={{ border: '1px solid #1b232f', borderRadius: 4, padding: 8, background: '#0a0d12' }}>
    <div style={{ fontSize: 10, color: '#00e5c8', marginBottom: 6 }}>BRIEFING BUILDER</div>
    <div style={{ maxHeight: 120, overflow: 'auto', display: 'grid', gap: 4 }}>
      {incidents.slice(0, 10).map((incident) => (
        <label key={incident.incidentId} style={{ fontSize: 9, color: '#d6e5f4' }}>
          <input type="checkbox" checked={selectedIncidentIds.includes(incident.incidentId)} onChange={(event) => setSelectedIncidentIds((prev) => event.target.checked ? [...new Set([...prev, incident.incidentId])] : prev.filter((id) => id !== incident.incidentId))} /> {incident.title}
        </label>
      ))}
    </div>
    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
      <button onClick={() => runExport('markdown')}>MD</button>
      <button onClick={() => runExport('json')}>JSON</button>
      <button onClick={() => runExport('text')}>TEXT</button>
    </div>
  </div>;
}
