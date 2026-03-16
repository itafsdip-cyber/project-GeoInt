import type { OverlayTrack } from '../../types/intelligence';

function toNumber(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export function pruneStaleOverlayTracks(tracks: OverlayTrack[], now = Date.now()) {
  return tracks.filter((track) => !track.expiresAt || +new Date(track.expiresAt) > now);
}

export function normalizeOverlayTracks(input: unknown[]): OverlayTrack[] {
  return input
    .filter(Boolean)
    .map((item: any) => {
      const latitude = toNumber(item.latitude ?? item.position?.latitude);
      const longitude = toNumber(item.longitude ?? item.position?.longitude);
      if (latitude == null || longitude == null) return null;

      return {
        trackId: String(item.trackId || item.id),
        type: item.type || item.overlayType,
        label: item.label || item.type || item.overlayType,
        latitude,
        longitude,
        observedAt: item.observedAt || new Date().toISOString(),
        collectedAt: item.collectedAt,
        expiresAt: item.expiresAt,
        verificationLevel: item.verificationLevel || 'UNKNOWN',
        locationPrecision: item.locationPrecision || 'APPROXIMATE',
        sourceReference: item.sourceReference || (Array.isArray(item.sourceRefs) ? item.sourceRefs[0] : undefined),
      } as OverlayTrack;
    })
    .filter((track): track is OverlayTrack => Boolean(track));
}
