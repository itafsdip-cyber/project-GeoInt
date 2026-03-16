function registerProviderRoutes({ addRoute }) {
  addRoute('GET', '/providers/options', async (_req, res) => {
    res.json({
      modes: ['none', 'hosted-openai-compatible', 'user-openai-compatible', 'user-ollama-compatible'],
      caveat: 'User-local endpoints may not be reachable from hosted deployments without a bridge/relay.',
    });
  });
}
module.exports = { registerProviderRoutes };
