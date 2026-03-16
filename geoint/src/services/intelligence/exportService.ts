import type { BriefingDocument, InvestigationSession, RegionSummary, SearchResult, WatchlistAlert } from '../../types/intelligence';

export type ExportFormat = 'markdown' | 'json' | 'text' | 'html' | 'csv';

function asMarkdown(title: string, rows: Array<{ label: string; value: string }>) {
  return `# ${title}\n\n${rows.map((row) => `- **${row.label}:** ${row.value}`).join('\n')}`;
}

export function exportPayload(input: {
  format: ExportFormat;
  investigation?: InvestigationSession;
  briefing?: BriefingDocument;
  regionSummary?: RegionSummary;
  alerts?: WatchlistAlert[];
  searchResults?: SearchResult[];
}) {
  const payload = {
    generatedAt: new Date().toISOString(),
    caveat: 'Export contains analytical support artifacts. Scores and correlations are not certainty or causality.',
    ...input,
  };

  if (input.format === 'json') return JSON.stringify(payload, null, 2);
  if (input.format === 'html') return `<html><body><pre>${JSON.stringify(payload, null, 2)}</pre></body></html>`;
  if (input.format === 'csv') {
    const alerts = input.alerts || [];
    return ['id,severity,priorityScore,reason,matchedObjectType,matchedObjectId', ...alerts.map((alert) => `${alert.id},${alert.severity},${alert.priorityScore || ''},"${alert.reason.replaceAll('"', '""')}",${alert.matchedObjectType},${alert.matchedObjectId}`)].join('\n');
  }
  if (input.format === 'text') return `${payload.caveat}\n\n${JSON.stringify(payload, null, 2)}`;

  return asMarkdown('GeoInt Export', [
    { label: 'Generated', value: payload.generatedAt },
    { label: 'Caveat', value: payload.caveat },
    { label: 'Investigation', value: input.investigation?.title || 'N/A' },
    { label: 'Briefing', value: input.briefing?.title || 'N/A' },
    { label: 'Region Summary', value: input.regionSummary?.heuristicSummary || 'N/A' },
    { label: 'Alert Count', value: String((input.alerts || []).length) },
  ]);
}
