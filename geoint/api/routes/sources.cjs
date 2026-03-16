function registerSourceRoutes({ addRoute, storage }) {
  addRoute('GET', '/sources/operations', async (_req, res) => {
    res.json({ runs: storage.listIngestionRuns() });
  });
}
module.exports = { registerSourceRoutes };
