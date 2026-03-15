const WATCH_TYPES = {
  REGION: "region",
  ACTOR: "actor",
  TOPIC: "topic",
  SOURCE: "source",
};

const normalizeTerm = (value = "") => String(value).toLowerCase().trim();

export const WATCH_ITEM_TYPES = [
  { id: WATCH_TYPES.REGION, label: "REGION" },
  { id: WATCH_TYPES.ACTOR, label: "ACTOR" },
  { id: WATCH_TYPES.TOPIC, label: "TOPIC" },
  { id: WATCH_TYPES.SOURCE, label: "SOURCE" },
];

export const createWatchItem = ({ type, term }) => {
  const normalizedType = Object.values(WATCH_TYPES).includes(type) ? type : WATCH_TYPES.TOPIC;
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
    metadata.type,
    metadata.category,
    metadata.detail,
    ...(event.osint?.actorTags || []),
    ...(event.osint?.narrativeTags || []),
  ].filter(Boolean);
};

export const matchEventAgainstWatchlist = (event, watchItems = []) => {
  if (!event || !Array.isArray(watchItems) || watchItems.length === 0) return [];

  const fields = eventTextFields(event);

  return watchItems.filter((item) => {
    const term = item.normalizedTerm || normalizeTerm(item.term);
    if (!term) return false;

    if (item.type === WATCH_TYPES.REGION) {
      return includesTerm(event.region, term) || includesTerm(event.title, term);
    }
    if (item.type === WATCH_TYPES.SOURCE) {
      return includesTerm(event.source, term);
    }
    if (item.type === WATCH_TYPES.ACTOR) {
      return fields.some((field) => includesTerm(field, term));
    }

    return (
      includesTerm(event.type, term)
      || includesTerm(event.category, term)
      || fields.some((field) => includesTerm(field, term))
    );
  });
};

export const buildWatchlistSummary = ({ events = [], watchItems = [] }) => {
  const summary = {
    totalWatchItems: watchItems.length,
    matchedEvents: 0,
    matchedByType: {
      [WATCH_TYPES.REGION]: 0,
      [WATCH_TYPES.ACTOR]: 0,
      [WATCH_TYPES.TOPIC]: 0,
      [WATCH_TYPES.SOURCE]: 0,
    },
  };

  events.forEach((event) => {
    const matches = matchEventAgainstWatchlist(event, watchItems);
    if (matches.length === 0) return;
    summary.matchedEvents += 1;
    const seenTypes = new Set(matches.map((item) => item.type));
    seenTypes.forEach((type) => {
      summary.matchedByType[type] = (summary.matchedByType[type] || 0) + 1;
    });
  });

  return summary;
};
