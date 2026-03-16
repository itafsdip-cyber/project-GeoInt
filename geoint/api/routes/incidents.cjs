function registerIncidentRoutes({ addRoute, storage }) {
  addRoute('GET', '/incidents', async (_req, res) => {
    res.json({ incidents: storage.getIncidents?.() || [] });
  });

  addRoute('PATCH', '/incidents/:id', async (req, res) => {
    const body = await req.json();
    const incidents = storage.getIncidents?.() || [];
    const target = incidents.find((incident) => incident.incidentId === req.params.id);
    if (!target) return res.json({ error: 'Incident not found' }, 404);
    const updated = { ...target, ...body, incidentId: req.params.id, updatedAt: new Date().toISOString() };
    storage.saveIncidents?.([...incidents.filter((incident) => incident.incidentId !== req.params.id), updated]);
    return res.json({ incident: updated });
  });
}

module.exports = { registerIncidentRoutes };
