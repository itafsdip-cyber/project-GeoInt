function toMillis(value) {
  const parsed = Date.parse(value || '');
  return Number.isFinite(parsed) ? parsed : 0;
}

function applyRunRetention(runs = [], maxRuns = Number(process.env.GEOINT_MAX_RUNS || 500)) {
  if (runs.length <= maxRuns) return runs;
  return [...runs]
    .sort((a, b) => toMillis(a.startedAt) - toMillis(b.startedAt))
    .slice(-maxRuns);
}

function pruneExpiredOverlayTracks(tracks = [], now = Date.now()) {
  return tracks.filter((track) => !track.expiresAt || toMillis(track.expiresAt) > now);
}

function pruneByAge(items = [], timestampField, ttlMs) {
  if (!ttlMs || ttlMs <= 0) return items;
  const cutoff = Date.now() - ttlMs;
  return items.filter((item) => toMillis(item[timestampField]) >= cutoff);
}

module.exports = {
  applyRunRetention,
  pruneExpiredOverlayTracks,
  pruneByAge,
  toMillis,
};
