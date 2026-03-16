import type { Incident, IntelligenceEvent, MonitoredRegion, OverlayTrack } from '../../types/intelligence';

function inRegionLatLng(region: MonitoredRegion, latitude?: number | null, longitude?: number | null) {
  if (latitude == null || longitude == null) return false;
  if (region.bbox) {
    return latitude >= region.bbox.minLat && latitude <= region.bbox.maxLat && longitude >= region.bbox.minLng && longitude <= region.bbox.maxLng;
  }
  if (region.circle) {
    const dLat = latitude - region.circle.center.latitude;
    const dLon = longitude - region.circle.center.longitude;
    const approxKm = Math.sqrt((dLat * 111) ** 2 + (dLon * 111) ** 2);
    return approxKm <= region.circle.radiusKm;
  }
  if (region.polygon?.length) {
    const lats = region.polygon.map((point) => point.latitude);
    const lngs = region.polygon.map((point) => point.longitude);
    return latitude >= Math.min(...lats) && latitude <= Math.max(...lats) && longitude >= Math.min(...lngs) && longitude <= Math.max(...lngs);
  }
  return true;
}

export function filterRecordsByRegion<T extends { latitude?: number | null; longitude?: number | null }>(records: T[], region?: MonitoredRegion) {
  if (!region) return records;
  return records.filter((item) => inRegionLatLng(region, item.latitude, item.longitude));
}

export function buildHeatSignals(input: { events: IntelligenceEvent[]; overlays: OverlayTrack[]; region?: MonitoredRegion; byCategory?: boolean }) {
  const regionEvents = filterRecordsByRegion(input.events, input.region);
  const regionOverlays = filterRecordsByRegion(input.overlays, input.region);
  const bins = new Map<string, { id: string; latitude: number; longitude: number; incidents: number; overlays: number; category?: string }>();
  const accumulate = (lat: number, lng: number, keyPart: string, type: 'incidents' | 'overlays', category?: string) => {
    const key = `${Math.round(lat * 2) / 2}:${Math.round(lng * 2) / 2}:${keyPart}`;
    const existing = bins.get(key) || { id: key, latitude: lat, longitude: lng, incidents: 0, overlays: 0, category };
    existing[type] += 1;
    bins.set(key, existing);
  };
  regionEvents.forEach((event) => {
    if (event.latitude == null || event.longitude == null) return;
    accumulate(event.latitude, event.longitude, input.byCategory ? (event.category || 'general') : 'all', 'incidents', event.category || 'general');
  });
  regionOverlays.forEach((overlay) => accumulate(overlay.latitude, overlay.longitude, input.byCategory ? overlay.type : 'all', 'overlays', overlay.type));
  return [...bins.values()].map((item) => ({ ...item, weight: item.incidents + item.overlays }));
}

export function getRegionLinkedIncidentIds(region: MonitoredRegion, incidents: Incident[], events: IntelligenceEvent[]) {
  const eventSet = new Set(filterRecordsByRegion(events, region).map((event) => event.id));
  return incidents.filter((incident) => incident.eventIds.some((id) => eventSet.has(id))).map((incident) => incident.incidentId);
}
