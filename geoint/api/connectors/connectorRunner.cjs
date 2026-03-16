function nowIso() {
  return new Date().toISOString();
}

function normalizeState(result, warningCount, errorCount) {
  if (errorCount > 0 && warningCount > 0) return 'PARTIAL_SUCCESS';
  if (errorCount > 0) return 'FAILED';
  if (result?.status?.state === 'DEGRADED' || result?.status?.state === 'STALE') return 'DEGRADED';
  if (warningCount > 0) return 'PARTIAL_SUCCESS';
  return 'SUCCESS';
}

function createConnectorRunner({ storage }) {
  async function runConnector(sourceId, connector, config = {}, sourceType = 'event') {
    const startMs = Date.now();
    const run = {
      id: `${sourceId}-${startMs}`,
      sourceId,
      sourceType,
      startedAt: nowIso(),
      state: 'RUNNING',
      itemsFetched: 0,
      itemsNormalized: 0,
      itemsDropped: 0,
      warningsCount: 0,
      errorsCount: 0,
      warningMessages: [],
      errorMessages: [],
      healthStateAfterRun: 'UNKNOWN',
    };

    storage.recordIngestionRun(run);

    try {
      const result = await connector(config);
      const warnings = Array.isArray(result?.warnings) ? result.warnings : [];
      const errors = Array.isArray(result?.errors) ? result.errors : [];
      run.finishedAt = nowIso();
      run.durationMs = Date.now() - startMs;
      run.itemsFetched = Number(result?.meta?.itemsFetched ?? result?.events?.length ?? 0);
      run.itemsNormalized = Number(result?.meta?.itemsNormalized ?? result?.events?.length ?? 0);
      run.itemsDropped = Number(result?.meta?.itemsDropped ?? Math.max(0, run.itemsFetched - run.itemsNormalized));
      run.warningsCount = warnings.length;
      run.errorsCount = errors.length;
      run.warningMessages = warnings;
      run.errorMessages = errors;
      run.state = normalizeState(result, run.warningsCount, run.errorsCount);
      run.healthStateAfterRun = result?.status?.state || (run.state === 'SUCCESS' ? 'ACTIVE' : 'DEGRADED');
      storage.recordIngestionRun(run);
      return { ...result, run };
    } catch (error) {
      run.finishedAt = nowIso();
      run.durationMs = Date.now() - startMs;
      run.errorsCount = 1;
      run.errorMessages = [error.message || 'Connector failed'];
      run.state = 'FAILED';
      run.healthStateAfterRun = 'UNAVAILABLE';
      storage.recordIngestionRun(run);
      return {
        events: [],
        warnings: [error.message || 'Connector failed'],
        errors: [error.message || 'Connector failed'],
        status: { provider: sourceId, state: 'UNAVAILABLE', checkedAt: nowIso(), lastError: error.message || 'Connector failed' },
        run,
      };
    }
  }

  return { runConnector };
}

module.exports = { createConnectorRunner };
