function applyRetention(runs = [], maxRuns = Number(process.env.GEOINT_MAX_RUNS || 500)) {
  if (runs.length <= maxRuns) return runs;
  return runs.slice(-maxRuns);
}
module.exports = { applyRetention };
