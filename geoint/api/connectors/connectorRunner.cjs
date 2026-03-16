function createConnectorRunner({ storage }) {
  async function runConnector(sourceId, connector, config = {}) {
    const run = { runId: `${sourceId}-${Date.now()}`, sourceId, startedAt: new Date().toISOString(), state: 'RUNNING', itemsFetched: 0, itemsNormalized: 0, droppedCount: 0, warningsCount: 0, errorsCount: 0 };
    try {
      const result = await connector(config);
      run.finishedAt = new Date().toISOString();
      run.itemsFetched = result.events?.length || 0;
      run.itemsNormalized = run.itemsFetched;
      run.warningsCount = result.warnings?.length || 0;
      run.state = result.status?.state === 'ACTIVE' ? 'SUCCESS' : 'DEGRADED';
      storage.appendIngestionRun(run);
      return { ...result, run };
    } catch (error) {
      run.finishedAt = new Date().toISOString();
      run.errorsCount = 1;
      run.state = 'FAILED';
      run.lastError = error.message;
      storage.appendIngestionRun(run);
      return { events: [], warnings: [error.message], status: { provider: sourceId, state: 'UNAVAILABLE', checkedAt: new Date().toISOString() }, run };
    }
  }
  return { runConnector };
}
module.exports = { createConnectorRunner };
