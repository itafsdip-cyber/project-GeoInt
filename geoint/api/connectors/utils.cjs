const crypto = require('crypto');

function stableId(parts) {
  return crypto.createHash('sha1').update(parts.filter(Boolean).join('|')).digest('hex').slice(0, 20);
}

function normalizeRegion(value) {
  if (!value) return 'Unknown';
  return String(value).trim().slice(0, 120);
}

function parseTimestamp(value) {
  const parsed = new Date(value || Date.now());
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }
  return parsed.toISOString();
}

function classifyCategory(text = '') {
  const input = text.toLowerCase();
  if (/(missile|strike|attack|explosion|drone|military)/.test(input)) return 'incident';
  if (/(sanction|market|oil|energy|economy)/.test(input)) return 'economic';
  if (/(election|government|minister|policy|congress)/.test(input)) return 'political';
  if (/(ceasefire|talks|summit|diplomatic|embassy)/.test(input)) return 'diplomatic';
  return 'news';
}

function severityFromConfidence(confidence = 50) {
  if (confidence >= 85) return 'high';
  if (confidence <= 35) return 'low';
  return 'medium';
}

function createStatus({ provider, state, reason = '', lastError = '' }) {
  return {
    provider,
    state,
    reason,
    lastError,
    checkedAt: new Date().toISOString(),
  };
}

module.exports = {
  stableId,
  normalizeRegion,
  parseTimestamp,
  classifyCategory,
  severityFromConfidence,
  createStatus,
};
