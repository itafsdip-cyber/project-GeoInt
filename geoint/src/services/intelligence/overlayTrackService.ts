import type { OverlayTrack } from '../../types/intelligence';

export function pruneStaleOverlayTracks(tracks: OverlayTrack[], now = Date.now()) {
  return tracks.filter((track) => !track.expiresAt || +new Date(track.expiresAt) > now);
}

export function normalizeOverlayTracks(input: unknown[]): OverlayTrack[] {
  return input.filter(Boolean).map((item: any) => ({
    trackId: String(item.trackId),
    type: item.type,
    label: item.label || item.type,
    latitude: Number(item.latitude),
    longitude: Number(item.longitude),
    observedAt: item.observedAt || new Date().toISOString(),
    collectedAt: item.collectedAt,
    expiresAt: item.expiresAt,
    verificationLevel: item.verificationLevel || 'UNKNOWN',
    locationPrecision: item.locationPrecision || 'APPROXIMATE',
    sourceReference: item.sourceReference,
  })).filter((track) => Number.isFinite(track.latitude) && Number.isFinite(track.longitude));
}
