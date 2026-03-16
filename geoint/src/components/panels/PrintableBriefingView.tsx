import type { BriefingDocument } from '../../types/intelligence';

const REQUIRED_SECTIONS = [
  'Executive Summary',
  'Key Judgments',
  'Incident Timeline',
  'Entity Activity',
  'Narrative Assessment',
  'Geospatial Overview',
  'Confidence and Gaps',
];

export default function PrintableBriefingView({ briefing }: { briefing: BriefingDocument }) {
  return (
    <article style={{ background: '#fff', color: '#111', padding: 12, marginTop: 8 }}>
      <h2>{briefing.title}</h2>
      <div>Updated: {new Date(briefing.updatedAt).toLocaleString()}</div>
      {REQUIRED_SECTIONS.map((sectionTitle) => {
        const section = briefing.sections.find((item) => item.title === sectionTitle);
        return (
          <section key={sectionTitle} style={{ marginTop: 10 }}>
            <h3>{sectionTitle}</h3>
            <p>{section?.content || 'No analyst content provided.'}</p>
          </section>
        );
      })}
    </article>
  );
}
