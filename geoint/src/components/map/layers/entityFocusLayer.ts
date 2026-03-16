import type { Entity, IntelligenceEvent } from '../../../types/intelligence';

export const entityFocusLayer = (events: IntelligenceEvent[], selectedEntity?: Entity) => {
  if (!selectedEntity) return [];
  return events.filter((event) => event.actors?.some((actor) => actor.actorId === selectedEntity.entityId));
};
