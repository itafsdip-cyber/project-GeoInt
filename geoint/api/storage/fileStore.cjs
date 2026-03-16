const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '..', '.geoint-storage.json');

function readStore() {
  try { return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8')); } catch { return { updatedAt: new Date().toISOString(), ingestionRuns: [] }; }
}
function writeStore(next) { fs.writeFileSync(STORE_PATH, JSON.stringify({ ...next, updatedAt: new Date().toISOString() }, null, 2)); }

module.exports = {
  adapter: 'file',
  getState: () => readStore(),
  appendIngestionRun(run) { const current = readStore(); current.ingestionRuns = [...(current.ingestionRuns || []), run].slice(-2000); writeStore(current); return run; },
  listIngestionRuns: () => (readStore().ingestionRuns || []).slice(-200),
};
