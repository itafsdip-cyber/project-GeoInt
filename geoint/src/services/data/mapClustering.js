const zoomBucketDegrees = (zoom = 4) => {
  if (zoom >= 9) return 0.12;
  if (zoom >= 7) return 0.25;
  if (zoom >= 5) return 0.55;
  return 1.1;
};

export const precisionRadiusKm = (precision = "unknown") => {
  if (precision === "city") return 18;
  if (precision === "region") return 55;
  if (precision === "country") return 110;
  return 0;
};

export function clusterEventsForZoom(events = [], zoom = 4) {
  const bucketSize = zoomBucketDegrees(zoom);
  const buckets = new Map();

  events.forEach((event) => {
    if (event.latitude == null || event.longitude == null) return;
    const latBucket = Math.round(event.latitude / bucketSize);
    const lngBucket = Math.round(event.longitude / bucketSize);
    const key = `${latBucket}:${lngBucket}`;
    if (!buckets.has(key)) {
      buckets.set(key, []);
    }
    buckets.get(key).push(event);
  });

  return [...buckets.values()].map((bucketEvents, index) => {
    const count = bucketEvents.length;
    const centroidLat = bucketEvents.reduce((acc, event) => acc + event.latitude, 0) / count;
    const centroidLng = bucketEvents.reduce((acc, event) => acc + event.longitude, 0) / count;
    const sources = [...new Set(bucketEvents.map((event) => event.source))];

    return {
      id: `map-cluster-${index + 1}`,
      count,
      latitude: centroidLat,
      longitude: centroidLng,
      events: bucketEvents,
      sources,
      isCluster: count > 1,
      avgLocationConfidence: Math.round(bucketEvents.reduce((acc, event) => acc + (event.osint?.locationConfidence || event.locationConfidence || 0), 0) / count),
    };
  });
}
