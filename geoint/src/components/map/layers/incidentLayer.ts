import type { IntelligenceEvent } from '../../../types/intelligence';
export const incidentLayer = (events: IntelligenceEvent[]) => events.filter((event) => !!event.latitude && !!event.longitude);
