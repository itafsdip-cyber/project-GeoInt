function registerBriefingAssistantRoutes({ addRoute, storage }) {
  addRoute('GET', '/briefing-assistant/runs', async (_req, res) => {
    res.json({ runs: storage.getBriefingAssistantRuns?.() || [] });
  });

  addRoute('POST', '/briefing-assistant/runs', async (req, res) => {
    const body = await req.json();
    const run = {
      id: body.id || `assist-${Date.now()}`,
      mode: body.mode || 'heuristic',
      selectedIds: body.selectedIds || {},
      resultSummary: body.resultSummary || '',
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      aiGenerated: Boolean(body.aiGenerated),
      caveat: 'Assisted drafting support only. Analyst retains edit control and publication authority.',
    };
    storage.saveBriefingAssistantRun?.(run);
    res.json({ run }, 201);
  });
}

module.exports = { registerBriefingAssistantRoutes };
