const INCIDENT_TIME_WINDOW_MS = 2 * 3600000;
const SPIKE_WINDOW_MS = 90 * 60000;
const ESCALATION_WINDOW_MS = 6 * 3600000;

const EVENT_TYPE_WEIGHT = {
  missile: 16,
  drone: 12,
  naval: 11,
  cyber: 13,
  ballistic: 15,
  strike: 10,
};

const severityScale = [
  { label: "CRITICAL", min: 82 },
  { label: "HIGH", min: 62 },
  { label: "MEDIUM", min: 38 },
  { label: "LOW", min: 0 },
];

/**
 * @typedef {Object} DetectedIncident
 * @property {string} incidentId
 * @property {string} title
 * @property {string} region
 * @property {string[]} involvedActors
 * @property {number} eventCount
 * @property {number} sourceCount
 * @property {"LOW"|"MEDIUM"|"HIGH"|"CRITICAL"} severity
 * @property {number} severityScore
 * @property {string} firstSeen
 * @property {string} lastUpdated
 * @property {string[]} eventIds
 * @property {string[]} categories
 * @property {string} rationale
 * @property {string[]} sourceSet
 * @property {number} averageReliability
 * @property {"TIER-1"|"TIER-2"|"TIER-3"|"TIER-4"} credibilityTier
 * @property {string|null} mapClusterId
 */

const normalizedText = (value = "") => String(value).toLowerCase();

const parseTs = (value) => new Date(value).getTime();

const toSeverity = (score) => severityScale.find((step) => score >= step.min)?.label || "LOW";

const unique = (items = []) => [...new Set(items.filter(Boolean))];

const toCredibilityTier = (score) => {
  if (score >= 82) return "TIER-1";
  if (score >= 68) return "TIER-2";
  if (score >= 52) return "TIER-3";
  return "TIER-4";
};

const eventTypeWeight = (event) => {
  const label = normalizedText(`${event?.type || ""} ${event?.category || ""} ${event?.title || ""}`);
  return Object.entries(EVENT_TYPE_WEIGHT).reduce((acc, [needle, weight]) => (label.includes(needle) ? Math.max(acc, weight) : acc), 0);
};

const scoreIncident = ({ events, sourceCount, actorCount, reasons }) => {
  const avgReliability = events.reduce((acc, event) => acc + (event.osint?.sourceReliability || 50), 0) / Math.max(1, events.length);
  const avgConfidence = events.reduce((acc, event) => acc + (event.osint?.confidenceScore || 40), 0) / Math.max(1, events.length);
  const multiSourceBoost = events.some((event) => (event.osint?.crossSourceCount || 1) > 1) ? 12 : 0;
  const verifiedBoost = events.some((event) => event.osint?.verificationStatus === "verified") ? 10 : 0;
  const categoryWeight = Math.max(...events.map(eventTypeWeight), 0);
  const eventPressure = Math.min(30, events.length * 5);
  const sourcePressure = Math.min(16, sourceCount * 4);
  const actorPressure = Math.min(12, actorCount * 3);
  const rationaleBoost = reasons.includes("ESCALATION") ? 12 : reasons.includes("SPIKE") ? 8 : 4;

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(eventPressure + sourcePressure + actorPressure + avgReliability * 0.14 + avgConfidence * 0.16 + multiSourceBoost + verifiedBoost + categoryWeight + rationaleBoost),
    ),
  );
};

const buildRegionBursts = (events = []) => {
  const sorted = [...events].sort((a, b) => parseTs(a.timestamp) - parseTs(b.timestamp));
  const buckets = new Map();

  sorted.forEach((event) => {
    const region = event.region || "Unknown";
    const ts = parseTs(event.timestamp);
    if (!Number.isFinite(ts)) return;
    const list = buckets.get(region) || [];
    list.push(event);
    buckets.set(region, list);
  });

  const incidentGroups = [];

  buckets.forEach((eventsInRegion, region) => {
    for (let i = 0; i < eventsInRegion.length; i += 1) {
      const baseTs = parseTs(eventsInRegion[i].timestamp);
      const matches = eventsInRegion.filter((candidate) => {
        const candidateTs = parseTs(candidate.timestamp);
        return Number.isFinite(candidateTs) && candidateTs >= baseTs && candidateTs - baseTs <= INCIDENT_TIME_WINDOW_MS;
      });
      if (matches.length < 3) continue;
      const sourceCount = unique(matches.map((event) => event.source)).length;
      if (sourceCount < 2) continue;
      incidentGroups.push({ region, events: matches, reasons: ["REGION_BURST", "MULTI_SOURCE"] });
      break;
    }
  });

  return incidentGroups;
};

const buildCategorySpikes = (events = [], nowTs) => {
  if (!Number.isFinite(nowTs)) return [];
  const byCategory = new Map();
  events.forEach((event) => {
    const category = (event.category || "unknown").toLowerCase();
    const list = byCategory.get(category) || [];
    list.push(event);
    byCategory.set(category, list);
  });

  const spikeGroups = [];

  byCategory.forEach((categoryEvents, category) => {
    const recent = categoryEvents.filter((event) => {
      const ts = parseTs(event.timestamp);
      return Number.isFinite(ts) && nowTs - ts <= SPIKE_WINDOW_MS;
    });

    if (recent.length < 3) return;

    const previous = categoryEvents.filter((event) => {
      const ts = parseTs(event.timestamp);
      return Number.isFinite(ts) && nowTs - ts > SPIKE_WINDOW_MS && nowTs - ts <= SPIKE_WINDOW_MS * 2;
    });

    if (recent.length < Math.max(3, previous.length + 2)) return;

    const dominantRegion = recent.reduce((acc, event) => {
      const region = event.region || "Unknown";
      acc[region] = (acc[region] || 0) + 1;
      return acc;
    }, {});

    const topRegion = Object.entries(dominantRegion).sort((a, b) => b[1] - a[1])[0]?.[0] || "Unknown";

    spikeGroups.push({
      region: topRegion,
      events: recent,
      reasons: ["SPIKE", `CATEGORY_${category.toUpperCase()}`],
    });
  });

  return spikeGroups;
};

const buildEscalationPatterns = (events = [], nowTs) => {
  const recent = events.filter((event) => {
    const ts = parseTs(event.timestamp);
    return Number.isFinite(ts) && nowTs - ts <= ESCALATION_WINDOW_MS;
  });

  const grouped = new Map();

  recent.forEach((event) => {
    const key = `${event.region || "Unknown"}-${(event.osint?.actorTags || []).slice(0, 2).join("|")}`;
    const list = grouped.get(key) || [];
    list.push(event);
    grouped.set(key, list);
  });

  return [...grouped.values()]
    .filter((group) => {
      const severitySet = new Set(group.map((event) => event.severity));
      const actorSet = new Set(group.flatMap((event) => event.osint?.actorTags || []));
      return group.length >= 3 && severitySet.has("high") && actorSet.size >= 2;
    })
    .map((group) => ({
      region: group[0]?.region || "Unknown",
      events: group,
      reasons: ["ESCALATION", "ACTOR_PATTERN"],
    }));
};

const dedupeGroups = (groups = []) => {
  const seen = new Set();
  return groups.filter((group) => {
    const key = unique(group.events.map((event) => event.id)).sort().join("|");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const detectIncidents = ({ events = [], now = new Date() }) => {
  const uniqueEvents = unique(events.map((event) => event.id)).map((id) => events.find((event) => event.id === id)).filter(Boolean);
  const nowTs = now.getTime();

  const groups = dedupeGroups([
    ...buildRegionBursts(uniqueEvents),
    ...buildCategorySpikes(uniqueEvents, nowTs),
    ...buildEscalationPatterns(uniqueEvents, nowTs),
  ]);

  return groups.map((group, index) => {
    const sorted = [...group.events].sort((a, b) => parseTs(a.timestamp) - parseTs(b.timestamp));
    const involvedActors = unique(sorted.flatMap((event) => event.osint?.actorTags || []));
    const sourceCount = unique(sorted.map((event) => event.source)).length;
    const avgReliability = Math.round(sorted.reduce((acc, event) => acc + (event.osint?.sourceReliability || 50), 0) / Math.max(1, sorted.length));
    const severityScore = scoreIncident({
      events: sorted,
      sourceCount,
      actorCount: involvedActors.length,
      reasons: group.reasons,
    });

    return {
      incidentId: `inc-${String(index + 1).padStart(3, "0")}`,
      title: `${group.reasons.includes("SPIKE") ? "Category spike" : group.reasons.includes("ESCALATION") ? "Escalation pattern" : "Regional burst"} · ${group.region}`,
      region: group.region,
      involvedActors,
      eventCount: sorted.length,
      sourceCount,
      severityScore,
      severity: toSeverity(severityScore),
      firstSeen: sorted[0]?.timestamp || new Date(nowTs).toISOString(),
      lastUpdated: sorted[sorted.length - 1]?.timestamp || new Date(nowTs).toISOString(),
      eventIds: sorted.map((event) => event.id),
      categories: unique(sorted.map((event) => String(event.category || "unknown").toUpperCase())),
      rationale: group.reasons.join(" + "),
      sourceSet: unique(sorted.map((event) => event.source)),
      averageReliability: avgReliability,
      credibilityTier: toCredibilityTier(avgReliability),
      mapClusterId: sorted.find((event) => event.osint?.duplicateClusterId)?.osint?.duplicateClusterId || null,
    };
  }).sort((a, b) => b.severityScore - a.severityScore || parseTs(b.lastUpdated) - parseTs(a.lastUpdated));
};
