const fileStore = require('./fileStore.cjs');
const { createSqliteStore } = require('./sqliteStore.cjs');

function parseBool(value, fallback = false) {
  if (value == null) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function createStorage() {
  const mode = (process.env.GEOINT_STORAGE_ADAPTER || 'file').toLowerCase();
  const allowFallback = parseBool(process.env.GEOINT_STORAGE_ALLOW_FALLBACK, true);

  if (mode === 'sqlite') {
    const sqliteStore = createSqliteStore();
    if (sqliteStore) {
      console.log('[storage] adapter=sqlite');
      return sqliteStore;
    }
    const message = '[storage] sqlite requested but dependency unavailable';
    if (!allowFallback) {
      console.warn(`${message}; fallback disabled, using read-safe file adapter shim`);
      return fileStore;
    }
    console.warn(`${message}; falling back to file adapter`);
    return fileStore;
  }

  console.log('[storage] adapter=file');
  return fileStore;
}

module.exports = { createStorage };
