function registerNotesRoutes({ addRoute, storage }) {
  addRoute('GET', '/notes', async (_req, res) => {
    res.json({ notes: storage.getAnalystNotes() });
  });

  addRoute('POST', '/notes', async (req, res) => {
    const body = await req.json();
    const now = new Date().toISOString();
    const note = {
      noteId: body.noteId || `note-${Date.now()}`,
      title: body.title || 'Untitled note',
      body: body.body || '',
      createdAt: body.createdAt || now,
      updatedAt: now,
      analyst: body.analyst || 'Analyst',
      tags: Array.isArray(body.tags) ? body.tags : [],
      linkedIncidentIds: Array.isArray(body.linkedIncidentIds) ? body.linkedIncidentIds : [],
      linkedEntityIds: Array.isArray(body.linkedEntityIds) ? body.linkedEntityIds : [],
      linkedNarrativeIds: Array.isArray(body.linkedNarrativeIds) ? body.linkedNarrativeIds : [],
      classification: body.classification || 'UNCLASSIFIED',
      confidenceNote: body.confidenceNote || '',
    };
    res.json({ note: storage.saveAnalystNote(note) }, 201);
  });

  addRoute('PATCH', '/notes/:id', async (req, res) => {
    const body = await req.json();
    const updated = storage.updateAnalystNote(req.params.id, body || {});
    if (!updated) return res.json({ error: 'Note not found' }, 404);
    return res.json({ note: updated });
  });

  addRoute('DELETE', '/notes/:id', async (req, res) => {
    const deleted = storage.deleteAnalystNote(req.params.id);
    if (!deleted) return res.json({ error: 'Note not found' }, 404);
    return res.json({ deleted: true });
  });
}

module.exports = { registerNotesRoutes };
