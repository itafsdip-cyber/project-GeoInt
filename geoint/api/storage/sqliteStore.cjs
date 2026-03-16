let Database = null;
try { ({ Database } = require('sqlite3')); } catch {}

function createSqliteStore() {
  if (!Database) return null;
  return {
    adapter: 'sqlite',
    getState: () => ({ updatedAt: new Date().toISOString(), ingestionRuns: [] }),
    appendIngestionRun: (run) => run,
    listIngestionRuns: () => [],
  };
}

module.exports = { createSqliteStore };
