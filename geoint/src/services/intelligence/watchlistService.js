const WATCH_TYPES = {
  REGION: "region",
  COUNTRY: "country",
  ACTOR: "actor",
  CATEGORY: "category",
  KEYWORD: "keyword",
  SOURCE: "source",
  PROVIDER: "provider",
};

const normalizeTerm = (value = "") => String(value).toLowerCase().trim();

export const WATCH_ITEM_TYPES = [
  { id: WATCH_TYPES.REGION, label: "REGION" },
  { id: WATCH_TYPES.COUNTRY, label: "COUNTRY" },
  { id: WATCH_TYPES.ACTOR, label: "ACTOR" },
  { id: WATCH_TYPES.CATEGORY, label: "CATEGORY" },
  { id: WATCH_TYPES.KEYWORD, label: "KEYWORD" },
  { id: WATCH_TYPES.SOURCE, label: "SOURCE" },
  { id: WATCH_TYPES.PROVIDER, label: "PROVIDER" },
];

export const createWatchItem = ({ type, term }) => {
  const normalizedType = Object.values(WATCH_TYPES).includes(type) ? type : WATCH_TYPES.KEYWORD;
  const cleanTerm = String(term || "").trim();
  if (!cleanTerm) return null;
  return {
    id: `watch-${normalizedType}-${normalizeTerm(cleanTerm)}-${Date.now()}`,
    type: normalizedType,
    term: cleanTerm,
    normalizedTerm: normalizeTerm(cleanTerm),
    createdAt: new Date().toISOString(),
  };
};

const includesTerm = (value, term) => normalizeTerm(value).includes(term);

const eventTextFields = (event = {}) => {
  const metadata = event.metadata || {};
  return [
    event.title,
    event.region,
    event.source,
    metadata.provider,
    metadata.type,
    metadata.category,
    metadata.detail,
    ...(event.osint?.actorTags || []),
    ...(event.osint?.narrativeTags || []),
  ].filter(Boolean);
};

const matchByType = (item, event, fields) => {
  const term = item.normalizedTerm || normalizeTerm(item.term);
  if (!term) return false;

  if (item.type === WATCH_TYPES.REGION || item.type === WATCH_TYPES.COUNTRY) {
    return includesTerm(event.region, term) || includesTerm(event.title, term);
  }

  if (item.type === WATCH_TYPES.SOURCE) {
    return includesTerm(event.source, term);
  }

  if (item.type === WATCH_TYPES.PROVIDER) {
    return includesTerm(event.metadata?.provider, term) || includesTerm(event.osint?.providerCategory, term);
  }

  if (item.type === WATCH_TYPES.CATEGORY) {
    return includesTerm(event.category, term) || includesTerm(event.type, term) || includesTerm(event.metadata?.category, term);
  }

  return fields.some((field) => includesTerm(field, term));
};

export const matchEventAgainstWatchlist = (event, watchItems = []) => {
  if (!event || !Array.isArray(watchItems) || watchItems.length === 0) return [];
  const fields = eventTextFields(event);
  return watchItems.filter((item) => matchByType(item, event, fields));
};

export const matchIncidentAgainstWatchlist = (incident, watchItems = []) => {
  if (!incident || !Array.isArray(watchItems) || watchItems.length === 0) return [];
  const syntheticEvent = {
    title: incident.title,
    region: incident.region,
    source: (incident.sourceSet || []).join(" "),
    type: incident.categories?.join(" "),
    category: incident.categories?.join(" "),
    metadata: { provider: (incident.sourceSet || []).join(" ") },
    osint: { actorTags: incident.involvedActors || [] },
  };
  return matchEventAgainstWatchlist(syntheticEvent, watchItems);
};

export const buildWatchlistSummary = ({ events = [], incidents = [], watchItems = [] }) => {
  const summary = {
    totalWatchItems: watchItems.length,
    matchedEvents: 0,
    matchedIncidents: 0,
    matchedByType: Object.values(WATCH_TYPES).reduce((acc, type) => ({ ...acc, [type]: 0 }), {}),
  };

  events.forEach((event) => {
    const matches = matchEventAgainstWatchlist(event, watchItems);
    if (matches.length === 0) return;
    summary.matchedEvents += 1;
    new Set(matches.map((item) => item.type)).forEach((type) => {
      summary.matchedByType[type] = (summary.matchedByType[type] || 0) + 1;
    });
  });

  incidents.forEach((incident) => {
    const matches = matchIncidentAgainstWatchlist(incident, watchItems);
    if (matches.length === 0) return;
    summary.matchedIncidents += 1;
  });

  return summary;
};

export function createWatchlistEntry(partial = {}) {
  return {
    id: partial.id || `watch-${Date.now()}`,
    title: partial.title || 'Untitled watchlist',
    type: partial.type || 'KEYWORD',
    criteria: partial.criteria || partial.term || '',
    createdAt: partial.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    enabled: partial.enabled !== false,
    severity: partial.severity || 'MEDIUM',
    analystOwner: partial.analystOwner || 'Analyst',
    tags: Array.isArray(partial.tags) ? partial.tags : [],
  };
}

export function evaluateWatchlistAlerts({ watchlists = [], events = [], narratives = [], overlays = [] }) {
  const alerts = [];
  watchlists.filter((watch) => watch.enabled).forEach((watch) => {
    const needle = String(watch.criteria || '').toLowerCase();
    events.slice(0, 60).forEach((event) => {
      if (`${event.title || ''} ${event.summary || ''} ${event.region || ''}`.toLowerCase().includes(needle)) {
        alerts.push({ id: `alert-${watch.id}-${event.id}`, watchlistId: watch.id, matchedObjectType: 'event', matchedObjectId: event.id, reason: `Event match for ${watch.criteria}`, createdAt: new Date().toISOString(), severity: watch.severity || 'MEDIUM', read: false });
      }
    });
    narratives.forEach((narrative) => {
      if (`${narrative.title || ''}`.toLowerCase().includes(needle)) {
        alerts.push({ id: `alert-${watch.id}-${narrative.narrativeId}`, watchlistId: watch.id, matchedObjectType: 'narrative', matchedObjectId: narrative.narrativeId, reason: `Narrative signal for ${watch.criteria}`, createdAt: new Date().toISOString(), severity: watch.severity || 'MEDIUM', read: false });
      }
    });
    overlays.forEach((overlay) => {
      if (`${overlay.type || ''} ${overlay.label || ''}`.toLowerCase().includes(needle)) {
        alerts.push({ id: `alert-${watch.id}-${overlay.trackId}`, watchlistId: watch.id, matchedObjectType: 'overlay', matchedObjectId: overlay.trackId, reason: `Overlay match for ${watch.criteria}`, createdAt: new Date().toISOString(), severity: watch.severity || 'MEDIUM', read: false });
      }
    });
  });
  return alerts;
}
