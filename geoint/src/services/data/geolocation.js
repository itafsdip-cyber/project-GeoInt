const GEO_LOOKUP = [
  { pattern: /abu dhabi|uae|united arab emirates/i, latitude: 24.4539, longitude: 54.3773, precision: "country", region: "UAE" },
  { pattern: /dubai/i, latitude: 25.2048, longitude: 55.2708, precision: "city", region: "UAE" },
  { pattern: /hormuz|strait of hormuz/i, latitude: 26.5667, longitude: 56.25, precision: "region", region: "Hormuz Strait" },
  { pattern: /tehran|iran/i, latitude: 35.6892, longitude: 51.389, precision: "country", region: "Iran" },
  { pattern: /israel|tel aviv|jerusalem/i, latitude: 31.0461, longitude: 34.8516, precision: "country", region: "Israel" },
  { pattern: /lebanon|beirut/i, latitude: 33.8547, longitude: 35.8623, precision: "country", region: "Lebanon" },
  { pattern: /yemen|aden|sanaa|houthi/i, latitude: 15.5527, longitude: 48.5164, precision: "country", region: "Yemen" },
  { pattern: /iraq|baghdad/i, latitude: 33.2232, longitude: 43.6793, precision: "country", region: "Iraq" },
  { pattern: /syria|damascus/i, latitude: 34.8021, longitude: 38.9968, precision: "country", region: "Syria" },
  { pattern: /saudi|riyadh|ksa/i, latitude: 23.8859, longitude: 45.0792, precision: "country", region: "Saudi Arabia" },
  { pattern: /oman|muscat/i, latitude: 21.5126, longitude: 55.9233, precision: "country", region: "Oman" },
  { pattern: /qatar|doha/i, latitude: 25.3548, longitude: 51.1839, precision: "country", region: "Qatar" },
  { pattern: /bahrain|manama/i, latitude: 26.0667, longitude: 50.5577, precision: "country", region: "Bahrain" },
  { pattern: /kuwait/i, latitude: 29.3117, longitude: 47.4818, precision: "country", region: "Kuwait" },
  { pattern: /red sea/i, latitude: 20.0, longitude: 38.0, precision: "region", region: "Red Sea" },
  { pattern: /gaza/i, latitude: 31.3547, longitude: 34.3088, precision: "region", region: "Gaza" },
  { pattern: /global|international/i, latitude: null, longitude: null, precision: "unknown", region: "Global" },
];

const inRange = (value, min, max) => Number.isFinite(value) && value >= min && value <= max;

const toNumberOrNull = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeCoordinates = (latitude, longitude) => {
  const lat = toNumberOrNull(latitude);
  const lon = toNumberOrNull(longitude);
  if (!inRange(lat, -90, 90) || !inRange(lon, -180, 180)) return { latitude: null, longitude: null };
  return { latitude: lat, longitude: lon };
};

const confidenceForPrecision = (precision) => {
  if (precision === "exact") return 90;
  if (precision === "city") return 62;
  if (precision === "region") return 48;
  if (precision === "country") return 36;
  return 0;
};

const inferFromText = (event) => {
  const text = [
    event?.region,
    event?.title,
    event?.metadata?.detail,
    event?.metadata?.location,
    event?.metadata?.country,
  ]
    .filter(Boolean)
    .join(" ");

  for (const candidate of GEO_LOOKUP) {
    if (candidate.pattern.test(text)) {
      return {
        latitude: candidate.latitude,
        longitude: candidate.longitude,
        geolocationPrecision: candidate.precision,
        geolocationSource: "text_inference",
        locationConfidence: confidenceForPrecision(candidate.precision),
        inferred: true,
        inferredRegion: candidate.region,
      };
    }
  }

  return {
    latitude: null,
    longitude: null,
    geolocationPrecision: "unknown",
    geolocationSource: "unknown",
    locationConfidence: 0,
    inferred: true,
    inferredRegion: null,
  };
};

export function enrichEventGeolocation(event = {}) {
  const normalized = normalizeCoordinates(event.latitude, event.longitude);
  const hasProviderCoordinates = normalized.latitude != null && normalized.longitude != null;

  if (hasProviderCoordinates) {
    const providerPrecision = String(event?.metadata?.geolocationPrecision || event?.metadata?.locationPrecision || "exact").toLowerCase();
    const geolocationPrecision = ["exact", "city", "region", "country"].includes(providerPrecision) ? providerPrecision : "exact";
    const baseConfidence = confidenceForPrecision(geolocationPrecision);
    return {
      latitude: normalized.latitude,
      longitude: normalized.longitude,
      geolocationPrecision,
      geolocationSource: "provider_coordinates",
      locationConfidence: Math.max(baseConfidence, 70),
      inferred: geolocationPrecision !== "exact",
      inferredRegion: null,
    };
  }

  const inferred = inferFromText(event);
  return {
    ...inferred,
    locationConfidence: inferred.locationConfidence,
  };
}
