const providerCategoryWeight = {
  official: 82,
  news: 72,
  rss: 64,
  open_source: 58,
  social: 38,
  unknown: 50,
};

const verificationSignalWeight = {
  verified: 22,
  unverified: 4,
  disputed: -12,
};

export const credibilityTier = (score) => {
  if (score >= 82) return "TIER-1";
  if (score >= 68) return "TIER-2";
  if (score >= 52) return "TIER-3";
  return "TIER-4";
};

export const refineCredibility = ({ providerCategory = "unknown", verificationStatus = "unverified", crossSourceCount = 1, timestamp, inferred = false, locationConfidence = 0 }) => {
  const nowTs = Date.now();
  const ts = new Date(timestamp).getTime();
  const ageHours = Number.isFinite(ts) ? Math.max(0, (nowTs - ts) / 3600000) : 48;
  const recencyBoost = ageHours <= 6 ? 8 : ageHours <= 24 ? 4 : 0;
  const recencyPenalty = ageHours > 96 ? -10 : 0;
  const corroborationLevel = crossSourceCount >= 4 ? "strong" : crossSourceCount >= 2 ? "moderate" : "limited";
  const corroborationBoost = crossSourceCount >= 4 ? 12 : crossSourceCount >= 2 ? 7 : 0;
  const timestampQuality = Number.isFinite(ts) ? (ageHours <= 24 ? "timely" : "stale") : "uncertain";

  const cautionFlags = [];
  if (providerCategory === "social") cautionFlags.push("social-origin");
  if (inferred) cautionFlags.push("heuristic-inference");
  if (verificationStatus === "disputed") cautionFlags.push("disputed-signal");
  if (timestampQuality !== "timely") cautionFlags.push("timestamp-lag");

  const verificationSignalStrength = verificationStatus === "verified" ? "strong" : verificationStatus === "disputed" ? "weak" : "limited";

  const score = Math.max(
    20,
    Math.min(
      96,
      Math.round(
        (providerCategoryWeight[providerCategory] || providerCategoryWeight.unknown)
        + (verificationSignalWeight[verificationStatus] || 0)
        + corroborationBoost
        + recencyBoost
        + recencyPenalty
        + locationConfidence * 0.08
        - cautionFlags.length * 3,
      ),
    ),
  );

  return {
    sourceReliability: score,
    credibilityTier: credibilityTier(score),
    verificationSignalStrength,
    corroborationLevel,
    timestampQuality,
    cautionFlags,
    heuristic: cautionFlags.length > 0,
  };
};
