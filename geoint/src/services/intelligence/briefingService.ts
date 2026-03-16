import type { BriefingDocument } from '../../types/intelligence';

const SECTION_ORDER = ['Executive Summary', 'Key Judgments', 'Significant Incidents', 'Region Overview', 'Entity Activity', 'Narrative Environment', 'Watchlist / Alert Highlights', 'Confidence & Gaps'];

export function createBriefing(title = 'GeoInt Briefing'): BriefingDocument {
  const now = new Date().toISOString();
  return {
    briefingId: `brief-${Date.now()}`,
    title,
    createdAt: now,
    updatedAt: now,
    tags: [],
    sections: SECTION_ORDER.map((heading) => ({ id: `${heading.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`, type: 'TEXT', title: heading, content: '', linkedIds: [] })),
  };
}

export function exportBriefing(briefing: BriefingDocument, format: 'markdown' | 'json' | 'text' | 'html') {
  if (format === 'json') return JSON.stringify(briefing, null, 2);
  if (format === 'text') return `${briefing.title}\n\n${briefing.sections.map((section) => `${section.title}\n${section.content || 'N/A'}`).join('\n\n')}`;
  if (format === 'html') return `<html><body><h1>${briefing.title}</h1>${briefing.sections.map((section) => `<h2>${section.title}</h2><p>${section.content || 'N/A'}</p>`).join('')}</body></html>`;
  return `# ${briefing.title}\n\n${briefing.sections.map((section) => `## ${section.title}\n${section.content || 'N/A'}`).join('\n\n')}`;
}
