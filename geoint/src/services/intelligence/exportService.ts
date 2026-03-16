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
    const searchResults = input.searchResults || [];
    if (alerts.length) {
      return ['id,severity,priorityScore,reason,matchedObjectType,matchedObjectId,caveat', ...alerts.map((alert) => `${alert.id},${alert.severity},${alert.priorityScore || ''},"${alert.reason.replaceAll('"', '""')}",${alert.matchedObjectType},${alert.matchedObjectId},"${(alert.caveatText || '').replaceAll('"', '""')}"`)].join('\n');
    }
    return ['id,type,title,timestamp,score,confidence,caveat', ...searchResults.map((result) => `${result.id},${result.type},"${result.title.replaceAll('"', '""')}",${result.timestamp},${result.score || ''},"${result.confidenceHint.replaceAll('"', '""')}","${(result.caveatHint || '').replaceAll('"', '""')}"`)].join('\n');
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
