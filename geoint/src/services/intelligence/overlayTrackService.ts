import type { OverlayTrack } from '../../types/intelligence';

export function pruneStaleOverlayTracks(tracks: OverlayTrack[], now = Date.now()) {
  return tracks.filter((track) => !track.expiresAt || +new Date(track.expiresAt) > now);
}
