export const DATA_MODE = {
  DEMO: "DEMO",
  LIVE: "LIVE",
  LIVE_UNAVAILABLE: "LIVE UNAVAILABLE",
};

const PROVIDER_TYPE_BY_KEY = {
  gdelt: "newswire",
  rss: "newswire",
  reddit: "social",
  x: "social",
};

const RELIABILITY_BY_PROVIDER_TYPE = {
  official: 88,
  newswire: 78,
  social: 45,
  unknown: 55,
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
 * @property {Object} [osint]
 * @property {number} [osint.sourceReliability]
 * @property {"verified"|"unverified"|"disputed"} [osint.verificationStatus]
 * @property {number} [osint.confidenceScore]
 * @property {number} [osint.crossSourceCount]
 * @property {string|null} [osint.firstSeenAt]
 * @property {string} [osint.lastUpdatedAt]
 * @property {string[]} [osint.actorTags]
 * @property {number} [osint.locationConfidence]
 */

export const normalizeSeverity = (value) => {
  const raw = String(value || "").toLowerCase();
  if (raw.includes("critical")) return "critical";
  if (raw.includes("high")) return "high";
  if (raw.includes("low")) return "low";
  return "medium";
};

export const normalizeVerification = (isVerified) => (isVerified ? "verified" : "unverified");

const fingerprintForEvent = (event) =>
  String(event?.title || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 8)
    .join(" ");

const inferProviderType = (event) => {
  const providerKey = String(event?.metadata?.provider || event?.source || "").toLowerCase();
  if (PROVIDER_TYPE_BY_KEY[providerKey]) return PROVIDER_TYPE_BY_KEY[providerKey];
  if (providerKey.includes("mod") || providerKey.includes("defense") || providerKey.includes("centcom")) return "official";
  return "unknown";
};

const inferActorTags = (event) => {
  const explicitTags = Array.isArray(event?.metadata?.tags) ? event.metadata.tags : [];
  if (explicitTags.length > 0) return explicitTags.slice(0, 6);
  const text = `${event?.title || ""} ${event?.region || ""}`;
  return (text.match(/\b([A-Z]{2,}|Iran|Israel|UAE|US|Russia|China|NATO|Houthi|IDF)\b/g) || []).slice(0, 6);
};

export function enrichEventsWithOsint(events = [], generatedAt = new Date().toISOString()) {
  const counts = new Map();
  const firstSeen = new Map();

  events.forEach((event) => {
    const key = fingerprintForEvent(event);
    if (!key) return;
    counts.set(key, (counts.get(key) || 0) + 1);
    const ts = new Date(event.timestamp).getTime();
    if (!Number.isFinite(ts)) return;
    const current = firstSeen.get(key);
    if (!current || ts < current) firstSeen.set(key, ts);
  });

  return events.map((event) => {
    const key = fingerprintForEvent(event);
    const crossSourceCount = counts.get(key) || 1;
    const providerType = inferProviderType(event);
    const sourceReliability = RELIABILITY_BY_PROVIDER_TYPE[providerType] || RELIABILITY_BY_PROVIDER_TYPE.unknown;
    const baseVerified = event.verificationStatus === "verified";
    const verificationStatus = baseVerified
      ? "verified"
      : (providerType === "social" && crossSourceCount > 1 ? "disputed" : "unverified");
    const confidenceScore = Math.max(
      20,
      Math.min(96, Math.round(sourceReliability * 0.6 + crossSourceCount * 12 + (baseVerified ? 15 : 0))),
    );
    const locationConfidence = event.latitude != null && event.longitude != null
      ? Math.min(95, sourceReliability + 12)
      : Math.max(35, sourceReliability - 18);

    return {
      ...event,
      osint: {
        sourceReliability,
        verificationStatus,
        confidenceScore,
        crossSourceCount,
        firstSeenAt: firstSeen.get(key) ? new Date(firstSeen.get(key)).toISOString() : event.timestamp || null,
        lastUpdatedAt: generatedAt,
        actorTags: inferActorTags(event),
        locationConfidence,
      },
    };
  });
}

export function enrichFeedWithOsint(feed = {}) {
  const generatedAt = feed.generatedAt || new Date().toISOString();
  return {
    ...feed,
    alerts: enrichEventsWithOsint(feed.alerts || [], generatedAt),
    events: enrichEventsWithOsint(feed.events || [], generatedAt),
    timeline: enrichEventsWithOsint(feed.timeline || [], generatedAt),
    trajectories: enrichEventsWithOsint(feed.trajectories || [], generatedAt),
  };
}

export const osintLabel = (osint = {}) => {
  if (osint.verificationStatus === "verified") return "VERIFIED";
  if (osint.verificationStatus === "disputed") return "DISPUTED";
  if ((osint.crossSourceCount || 0) > 1) return "MULTI-SOURCE";
  return "UNVERIFIED";
};
