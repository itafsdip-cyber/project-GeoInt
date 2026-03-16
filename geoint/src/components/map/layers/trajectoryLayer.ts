import type { IntelligenceEvent } from '../../../types/intelligence';
export const trajectoryLayer = (events: IntelligenceEvent[]) => events.filter((event) => Boolean(event.trajectory));
