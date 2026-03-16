import { enrichEventGeolocation } from "./geolocation";
import { refineCredibility } from "../intelligence/credibilityService";

export const DATA_MODE = {
  DEMO: "DEMO",
  LIVE: "LIVE",
  LIVE_UNAVAILABLE: "LIVE UNAVAILABLE",
};

const PROVIDER_TYPE_BY_KEY = {
  gdelt: "news",
  rss: "rss",
  reddit: "social",
  x: "social",
};

const MS_PER_HOUR = 3600000;

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
 * @property {number} locationConfidence
 * @property {"provider_coordinates"|"text_inference"|"unknown"} geolocationSource
 * @property {"exact"|"city"|"region"|"country"|"unknown"} geolocationPrecision
 * @property {"critical"|"high"|"medium"|"low"} severity
 * @property {"verified"|"unverified"|"pending"} verificationStatus
 * @property {string} region
 * @property {Record<string, unknown>} metadata
 * @property {Object} [osint]
 * @property {number} [osint.sourceReliability]
 * @property {"TIER-1"|"TIER-2"|"TIER-3"|"TIER-4"} [osint.credibilityTier]
 * @property {"strong"|"limited"|"weak"} [osint.verificationSignalStrength]
 * @property {"strong"|"moderate"|"limited"} [osint.corroborationLevel]
 * @property {"verified"|"unverified"|"disputed"} [osint.verificationStatus]
 * @property {number} [osint.confidenceScore]
 * @property {number} [osint.crossSourceCount]
 * @property {string|null} [osint.firstSeenAt]
 * @property {string} [osint.lastUpdatedAt]
 * @property {string[]} [osint.actorTags]
 * @property {number} [osint.locationConfidence]
 * @property {"official"|"news"|"social"|"rss"|"open_source"|"unknown"} [osint.providerCategory]
 * @property {string|null} [osint.duplicateClusterId]
 * @property {string[]} [osint.narrativeTags]
 * @property {boolean} [osint.inferred]
 */

export const normalizeSeverity = (value) => {
  const raw = String(value || "").toLowerCase();
  if (raw.includes("critical")) return "critical";
  if (raw.includes("high")) return "high";
  if (raw.includes("low")) return "low";
  return "medium";
};

export const normalizeVerification = (isVerified) => (isVerified ? "verified" : "unverified");

const normalizeText = (value = "") => String(value)
  .toLowerCase()
  .replace(/[^a-z0-9\s]/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const tokenizeTitle = (value = "") => normalizeText(value).split(" ").filter((token) => token.length >= 4);

const titleSimilarity = (a, b) => {
  const aSet = new Set(tokenizeTitle(a));
  const bSet = new Set(tokenizeTitle(b));
  if (aSet.size === 0 || bSet.size === 0) return 0;
  const overlap = [...aSet].filter((token) => bSet.has(token)).length;
  return overlap / Math.max(aSet.size, bSet.size);
};

const inferProviderType = (event) => {
  const providerKey = String(event?.metadata?.provider || event?.source || "").toLowerCase();
  if (PROVIDER_TYPE_BY_KEY[providerKey]) return PROVIDER_TYPE_BY_KEY[providerKey];
  if (providerKey.includes("mod") || providerKey.includes("defense") || providerKey.includes("centcom") || providerKey.includes("ministry")) return "official";
  if (providerKey.includes("open source") || providerKey.includes("osint")) return "open_source";
  if (providerKey.includes("times") || providerKey.includes("post") || providerKey.includes("news") || providerKey.includes("reuters") || providerKey.includes("ap")) return "news";
  return "unknown";
};

const inferActorTags = (event) => {
  const explicitTags = Array.isArray(event?.metadata?.tags) ? event.metadata.tags : [];
  if (explicitTags.length > 0) return explicitTags.slice(0, 6);
  const text = `${event?.title || ""} ${event?.region || ""}`;
  return (text.match(/\b([A-Z]{2,}|Iran|Israel|UAE|US|Russia|China|NATO|Houthi|IDF|IRGC|Hezbollah)\b/g) || []).slice(0, 6);
};

const inferNarrativeTags = (event) => {
  const text = normalizeText(`${event?.title || ""} ${event?.metadata?.detail || ""}`);
  const tags = [];
  if (/missile|drone|strike|intercept|air defense|rocket/.test(text)) tags.push("kinetic-activity");
  if (/shipping|hormuz|tanker|maritime|port/.test(text)) tags.push("maritime-disruption");
  if (/sanction|oil|market|price|insurance|trade/.test(text)) tags.push("economic-pressure");
  if (/summit|talks|diplom|ceasefire|negotiat/.test(text)) tags.push("diplomatic-signal");
  if (/cyber|network|satellite|jamming/.test(text)) tags.push("information-domain");
  return tags.slice(0, 3);
};

const buildClusters = (events = []) => {
  const clusters = [];
  const eventById = new Map(events.map((event) => [event.id, event]));

  events.forEach((event) => {
    const eventTime = new Date(event.timestamp).getTime();
    const title = event.title || "";
    const region = normalizeText(event.region || "");

    let targetCluster = null;
    for (const cluster of clusters) {
      const clusterTime = cluster.averageTime;
      const hoursDelta = Number.isFinite(eventTime) && Number.isFinite(clusterTime)
        ? Math.abs(eventTime - clusterTime) / MS_PER_HOUR
        : Infinity;
      const sameRegion = region && cluster.region && (region.includes(cluster.region) || cluster.region.includes(region));
      const similarTitle = titleSimilarity(title, cluster.representativeTitle) >= 0.45;
      if (hoursDelta <= 8 && (sameRegion || similarTitle)) {
        targetCluster = cluster;
        break;
      }
    }

    if (!targetCluster) {
      targetCluster = {
        id: `cluster-${clusters.length + 1}`,
        eventIds: [],
        sourceSet: new Set(),
        firstSeen: event.timestamp,
        lastSeen: event.timestamp,
        representativeTitle: title,
        region,
        averageTime: Number.isFinite(eventTime) ? eventTime : Date.now(),
      };
      clusters.push(targetCluster);
    }

    targetCluster.eventIds.push(event.id);
    targetCluster.sourceSet.add(String(event.source || "unknown").toLowerCase());

    if (new Date(event.timestamp).getTime() < new Date(targetCluster.firstSeen).getTime()) targetCluster.firstSeen = event.timestamp;
    if (new Date(event.timestamp).getTime() > new Date(targetCluster.lastSeen).getTime()) targetCluster.lastSeen = event.timestamp;

    const sumTimes = targetCluster.eventIds.reduce((acc, id) => {
      const ts = new Date(eventById.get(id)?.timestamp).getTime();
      return Number.isFinite(ts) ? acc + ts : acc;
    }, 0);
    targetCluster.averageTime = sumTimes / targetCluster.eventIds.length;
  });

  return clusters;
};

export function enrichEventsWithOsint(events = [], generatedAt = new Date().toISOString()) {
  const geolocatedEvents = events.map((event) => {
    const geolocation = enrichEventGeolocation(event);
    return {
      ...event,
      ...geolocation,
      metadata: {
        ...(event.metadata || {}),
        geolocationInferred: geolocation.inferred,
        inferredRegion: geolocation.inferredRegion,
      },
    };
  });

  const clusters = buildClusters(geolocatedEvents);
  const clusterByEventId = new Map();
  clusters.forEach((cluster) => {
    cluster.eventIds.forEach((id) => clusterByEventId.set(id, cluster));
  });

  return geolocatedEvents.map((event) => {
    const cluster = clusterByEventId.get(event.id) || null;
    const crossSourceCount = cluster ? Math.max(1, cluster.sourceSet.size) : 1;
    const providerCategory = inferProviderType(event);
    const hasCoordinates = event.latitude != null && event.longitude != null;
    const baseVerified = event.verificationStatus === "verified";
    const inferred = !baseVerified;

    let verificationStatus = "unverified";
    if (baseVerified) verificationStatus = "verified";
    else if (providerCategory === "social" && crossSourceCount <= 1) verificationStatus = "disputed";

    const credibility = refineCredibility({
      providerCategory,
      verificationStatus,
      crossSourceCount,
      timestamp: event.timestamp,
      inferred,
      locationConfidence: event.locationConfidence || 0,
    });

    const proximityBoost = cluster && cluster.eventIds.length > 1 ? 8 : 0;
    const confidenceScore = Math.max(
      18,
      Math.min(
        95,
        Math.round(credibility.sourceReliability * 0.58 + crossSourceCount * 10 + (hasCoordinates ? 7 : 0) + proximityBoost + (baseVerified ? 16 : 0)),
      ),
    );

    const locationConfidence = hasCoordinates
      ? Math.min(96, Math.round((event.locationConfidence || 0) * 0.72 + credibility.sourceReliability * 0.28 + (crossSourceCount > 1 ? 4 : 0)))
      : Math.max(0, event.locationConfidence || 0);

    return {
      ...event,
      osint: {
        sourceReliability: credibility.sourceReliability,
        credibilityTier: credibility.credibilityTier,
        verificationSignalStrength: credibility.verificationSignalStrength,
        corroborationLevel: credibility.corroborationLevel,
        timestampQuality: credibility.timestampQuality,
        cautionFlags: credibility.cautionFlags,
        verificationStatus,
        confidenceScore,
        crossSourceCount,
        firstSeenAt: cluster?.firstSeen || event.timestamp || null,
        lastUpdatedAt: generatedAt,
        actorTags: inferActorTags(event),
        locationConfidence,
        providerCategory,
        duplicateClusterId: cluster?.id || null,
        narrativeTags: inferNarrativeTags(event),
        inferred,
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
