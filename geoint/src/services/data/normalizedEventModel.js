export const DATA_MODE = {
  DEMO: "DEMO",
  LIVE: "LIVE",
  LIVE_UNAVAILABLE: "LIVE UNAVAILABLE",
};

/**
 * @typedef {Object} NormalizedGeoEvent
 * @property {string} id
 * @property {string} type
 * @property {string} category
 * @property {string} title
 * @property {string} source
 * @property {string} timestamp
 * @property {number|null} latitude
 * @property {number|null} longitude
 * @property {"critical"|"high"|"medium"|"low"} severity
 * @property {"verified"|"unverified"|"pending"} verificationStatus
 * @property {string} region
 * @property {Record<string, unknown>} metadata
 */

export const normalizeSeverity = (value) => {
  const raw = String(value || "").toLowerCase();
  if (raw.includes("critical")) return "critical";
  if (raw.includes("high")) return "high";
  if (raw.includes("low")) return "low";
  return "medium";
};

export const normalizeVerification = (isVerified) => (isVerified ? "verified" : "unverified");
