import type { AnalystNote, Incident, NarrativeCluster, EntityNode } from '../../types/intelligence';

interface Props {
  notes: AnalystNote[];
  incidents: Incident[];
  entities: EntityNode[];
  narratives: NarrativeCluster[];
  onSaveNote: (note: AnalystNote) => void;
}

export default function AnalystNotebookPanel({ notes, incidents, entities, narratives, onSaveNote }: Props) {
  const saveDraft = () => {
    const text = window.prompt('Analyst note')?.trim();
    if (!text) return;
    onSaveNote({
      noteId: `note-${Date.now()}`,
      createdAt: new Date().toISOString(),
      analyst: 'Analyst',
      text,
      linkedIncidentIds: incidents.slice(0, 1).map((item) => item.incidentId),
      linkedEntityIds: entities.slice(0, 2).map((item) => item.entityId),
      linkedNarrativeIds: narratives.slice(0, 1).map((item) => item.narrativeId),
    });
  };

  return <section><div style={{ fontSize: 11, color: '#00e5c8' }}>ANALYST NOTEBOOK</div><button onClick={saveDraft}>Add note</button><div>{notes.slice(0, 6).map((note) => <div key={note.noteId} style={{ fontSize: 11 }}>{note.text}</div>)}</div></section>;
}
