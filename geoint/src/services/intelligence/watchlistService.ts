import type { IntelligenceEvent, NarrativeCluster, OverlayTrack, WatchlistAlert, WatchlistEntry } from '../../types/intelligence';

export function evaluateWatchlistAlerts({ watchlists, events, narratives, overlays }: {
  watchlists: WatchlistEntry[];
  events: IntelligenceEvent[];
  narratives: NarrativeCluster[];
  overlays: OverlayTrack[];
}): WatchlistAlert[] {
  const alerts: WatchlistAlert[] = [];
  const now = new Date().toISOString();
  const latestEvents = events.slice(0, 80);

  watchlists.filter((item) => item.enabled).forEach((watch) => {
    const criterion = watch.criteria.toLowerCase();
    latestEvents.forEach((event) => {
      if (`${event.title} ${event.summary || ''} ${event.region || ''}`.toLowerCase().includes(criterion)) {
        alerts.push({ id: `alert-${watch.id}-${event.id}`, watchlistId: watch.id, matchedObjectType: 'event', matchedObjectId: event.id, reason: `New matching event for watch criteria: ${watch.criteria}`, createdAt: now, severity: watch.severity, read: false });
      }
    });
    narratives.forEach((narrative) => {
      if (`${narrative.title} ${(narrative.keywords || []).join(' ')}`.toLowerCase().includes(criterion)) {
        alerts.push({ id: `alert-${watch.id}-${narrative.narrativeId}`, watchlistId: watch.id, matchedObjectType: 'narrative', matchedObjectId: narrative.narrativeId, reason: 'New narrative signal linked to watch criteria.', createdAt: now, severity: watch.severity, read: false });
      }
    });
    overlays.forEach((overlay) => {
      if (`${overlay.type} ${overlay.label}`.toLowerCase().includes(criterion)) {
        alerts.push({ id: `alert-${watch.id}-${overlay.trackId}`, watchlistId: watch.id, matchedObjectType: 'overlay', matchedObjectId: overlay.trackId, reason: 'Overlay activity matched watch criteria.', createdAt: now, severity: watch.severity, read: false });
      }
    });
  });

  return alerts.slice(0, 120);
}

export function createWatchlistEntry(partial: Partial<WatchlistEntry>): WatchlistEntry {
  const now = new Date().toISOString();
  return {
    id: partial.id || `watch-${Date.now()}`,
    title: partial.title || 'Untitled watchlist',
    type: partial.type || 'KEYWORD',
    criteria: partial.criteria || '',
    createdAt: partial.createdAt || now,
    updatedAt: now,
    enabled: partial.enabled ?? true,
    severity: partial.severity || 'MEDIUM',
    analystOwner: partial.analystOwner || 'Analyst',
    tags: partial.tags || [],
  };
}
