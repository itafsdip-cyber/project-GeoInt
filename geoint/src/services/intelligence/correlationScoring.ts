export interface CorrelationFactors {
  timeProximity: number;
  locationProximity: number;
  sharedEntities: number;
  sharedNarratives: number;
  sourceOverlap: number;
  categorySimilarity: number;
  overlayProximity: number;
  repeatedMentions: number;
}

export function scoreCorrelation(factors: CorrelationFactors) {
  const weighted = {
    time: factors.timeProximity * 0.2,
    location: factors.locationProximity * 0.2,
    entities: factors.sharedEntities * 0.15,
    narratives: factors.sharedNarratives * 0.15,
    sources: factors.sourceOverlap * 0.1,
    category: factors.categorySimilarity * 0.1,
    overlay: factors.overlayProximity * 0.05,
    mentions: factors.repeatedMentions * 0.05,
  };
  const total = Object.values(weighted).reduce((a, b) => a + b, 0);
  return { total: Number(total.toFixed(3)), weighted };
}
