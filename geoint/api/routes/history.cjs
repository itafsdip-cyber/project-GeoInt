function registerHistoryRoutes({ addRoute, persistenceStore }) {
  addRoute('GET', '/history', async (_req, res) => res.json(persistenceStore.safeReadStore()));
  addRoute('POST', '/history/snapshot', async (req, res) => {
    const body = await req.json();
    res.json(persistenceStore.appendSnapshot(body || {}));
  });
}
module.exports = { registerHistoryRoutes };
