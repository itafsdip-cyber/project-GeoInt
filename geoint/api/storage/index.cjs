const fileStore = require('./fileStore.cjs');
const { createSqliteStore } = require('./sqliteStore.cjs');

function createStorage() {
  const mode = process.env.GEOINT_STORAGE_ADAPTER || 'file';
  if (mode === 'sqlite') {
    const sqlite = createSqliteStore();
    if (sqlite) return sqlite;
  }
  return fileStore;
}

module.exports = { createStorage };
