import type { IntelligenceEvent } from '../../../types/intelligence';
export const uncertaintyLayer = (events: IntelligenceEvent[]) => events.filter((event) => (event.uncertaintyRadiusKm ?? 0) > 0);
