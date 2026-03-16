function registerAlertsRoutes({ addRoute, storage }) {
  addRoute('GET', '/alerts', async (_req, res) => {
    res.json({ alerts: storage.getWatchlistAlerts?.() || [] });
  });

  addRoute('PATCH', '/alerts/:id', async (req, res) => {
    const body = await req.json();
    const alerts = storage.getWatchlistAlerts?.() || [];
    const target = alerts.find((alert) => alert.id === req.params.id);
    if (!target) return res.json({ error: 'Alert not found' }, 404);
    const updated = { ...target, ...body, id: req.params.id };
    storage.saveWatchlistAlerts?.([...alerts.filter((alert) => alert.id !== req.params.id), updated]);
    return res.json({ alert: updated });
  });
}

module.exports = { registerAlertsRoutes };
