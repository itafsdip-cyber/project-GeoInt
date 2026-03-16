import type { MonitoredRegion } from '../../../types/intelligence';

export function watchAreaLayer(regions: MonitoredRegion[]) {
  return regions.map((region) => ({
    id: region.id,
    label: region.name,
    geometryType: region.geometryType,
    caveat: 'Watch area highlights monitoring scope only; not predictive.',
  }));
}
