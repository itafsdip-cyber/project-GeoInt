import type { AnalystNote, Incident, NarrativeCluster, EntityNode } from '../../types/intelligence';

interface Props {
  notes: AnalystNote[];
  incidents: Incident[];
  entities: EntityNode[];
  narratives: NarrativeCluster[];
  onCreateNote: (note: Partial<AnalystNote>) => void;
  onDeleteNote: (noteId: string) => void;
}

export default function AnalystNotebookPanel({ notes, incidents, entities, narratives, onCreateNote, onDeleteNote }: Props) {
  const saveDraft = () => {
    const title = window.prompt('Note title')?.trim();
    if (!title) return;
    const body = window.prompt('Analyst note body')?.trim() || '';
    onCreateNote({
      title,
      body,
      analyst: 'Analyst',
      tags: [],
      linkedIncidentIds: incidents.slice(0, 1).map((item) => item.incidentId),
      linkedEntityIds: entities.slice(0, 2).map((item) => item.entityId),
      linkedNarrativeIds: narratives.slice(0, 1).map((item) => item.narrativeId),
      classification: 'UNCLASSIFIED',
      confidenceNote: '',
    });
  };

  return (
    <section>
      <div style={{ fontSize: 11, color: '#00e5c8' }}>ANALYST NOTEBOOK</div>
      <button onClick={saveDraft}>Add note</button>
      <div>
        {notes.slice(0, 6).map((note) => (
          <div key={note.noteId} style={{ fontSize: 11, borderBottom: '1px solid #233', marginBottom: 6 }}>
            <strong>{note.title}</strong>
            <div>{note.body || 'No content.'}</div>
            <button onClick={() => onDeleteNote(note.noteId)}>Delete</button>
          </div>
        ))}
      </div>
    </section>
  );
}
