import type { BriefingDocument } from '../../types/intelligence';

const SECTION_ORDER = ['Executive Summary', 'Key Judgments', 'Incident Timeline', 'Entity Activity', 'Narrative Assessment', 'Geospatial Overview', 'Confidence and Gaps'];

export function createBriefing(title = 'GeoInt Briefing'): BriefingDocument {
  const now = new Date().toISOString();
  return {
    briefingId: `brief-${Date.now()}`,
    title,
    createdAt: now,
    updatedAt: now,
    sections: SECTION_ORDER.map((heading) => ({ id: `${heading.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`, heading, body: '' })),
  };
}

export function exportBriefing(briefing: BriefingDocument, format: 'markdown' | 'json' | 'text' | 'html') {
  if (format === 'json') return JSON.stringify(briefing, null, 2);
  if (format === 'text') return `${briefing.title}\n\n${briefing.sections.map((section) => `${section.heading}\n${section.body || 'N/A'}`).join('\n\n')}`;
  if (format === 'html') return `<html><body><h1>${briefing.title}</h1>${briefing.sections.map((section) => `<h2>${section.heading}</h2><p>${section.body || 'N/A'}</p>`).join('')}</body></html>`;
  return `# ${briefing.title}\n\n${briefing.sections.map((section) => `## ${section.heading}\n${section.body || 'N/A'}`).join('\n\n')}`;
}
