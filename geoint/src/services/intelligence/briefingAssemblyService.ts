import type { AnalystNote, BriefingDocument, BriefingSection, Incident, MonitoredRegion, NarrativeCluster, WatchlistAlert } from '../../types/intelligence';

const SECTION_TITLES = [
  'Executive Summary',
  'Key Judgments',
  'Significant Incidents',
  'Region Overview',
  'Entity Activity',
  'Narrative Environment',
  'Watchlist / Alert Highlights',
  'Confidence & Gaps',
];

export function assembleBriefingDraft(input: {
  mode: 'manual' | 'heuristic' | 'ai-assisted';
  incidents: Incident[];
  narratives: NarrativeCluster[];
  alerts: WatchlistAlert[];
  regions: MonitoredRegion[];
  notes: AnalystNote[];
  title?: string;
}): Pick<BriefingDocument, 'title' | 'sections'> {
  const sections: BriefingSection[] = SECTION_TITLES.map((title, idx) => ({
    id: `assist-${idx}-${Date.now()}`,
    type: input.mode === 'ai-assisted' ? 'AI_ASSISTED_DRAFT' : 'HEURISTIC_DRAFT',
    title,
    content: '',
    linkedIds: [],
  }));

  if (input.mode === 'manual') {
    sections[0].content = 'Manual-only mode selected. Fill in analyst-authored observations and judgments.';
  } else {
    sections[0].content = `Heuristic summary: ${input.incidents.length} incidents, ${input.alerts.length} alerts, ${input.regions.length} monitored regions.`;
    sections[1].content = 'Judgments are analyst-owned. Candidate correlations and narrative bursts are not causality.';
    sections[2].content = input.incidents.slice(0, 6).map((incident) => `- ${incident.title} (${incident.lifecycleState || 'NEW'}) · ${incident.caveatText || 'caveats present'}`).join('\n') || 'No incidents selected.';
    sections[3].content = input.regions.slice(0, 6).map((region) => `- ${region.name} (${region.geometryType})`).join('\n') || 'No regions selected.';
    sections[4].content = 'Entity activity should be validated against graph links and source provenance before escalation.';
    sections[5].content = input.narratives.slice(0, 5).map((narrative) => `- ${narrative.title} · ${narrative.status} · disputes ${narrative.disputedIndicators || 0}`).join('\n') || 'No narrative slice selected.';
    sections[6].content = input.alerts.slice(0, 8).map((alert) => `- ${alert.severity} ${alert.reason} (score ${alert.priorityScore?.toFixed(2) ?? 'n/a'})`).join('\n') || 'No alerts selected.';
    sections[7].content = `Caveats: inferred trajectories are approximate, overlays remain separate from incidents, and scoring supports triage only.\nGaps: ${(input.notes[0]?.confidenceNote || 'Document source and corroboration gaps before publishing.')}`;
  }

  if (input.mode === 'ai-assisted') {
    sections.forEach((section) => {
      section.content = `[AI-generated draft scaffold] ${section.content}`;
    });
  }

  sections.forEach((section) => {
    section.linkedIds = [
      ...input.incidents.slice(0, 4).map((item) => item.incidentId),
      ...input.narratives.slice(0, 3).map((item) => item.narrativeId),
      ...input.alerts.slice(0, 4).map((item) => item.id),
    ];
  });

  return {
    title: input.title || `Operational Briefing ${new Date().toISOString().slice(0, 10)}`,
    sections,
  };
}
