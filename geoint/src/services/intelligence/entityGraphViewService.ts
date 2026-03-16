import type { EntityNode, EntityRelation } from '../../types/intelligence';

export interface EntityGraphViewFilters {
  search: string;
  edgeTypes: string[];
  minimumWeight: number;
  recentOnlyDays?: number;
  depth: number;
  focusedEntityId?: string;
}

function withinRecentWindow(iso: string, recentOnlyDays?: number) {
  if (!recentOnlyDays) return true;
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return true;
  return Date.now() - ts <= recentOnlyDays * 24 * 60 * 60 * 1000;
}

export function buildGraphView(nodes: EntityNode[], edges: EntityRelation[], filters: EntityGraphViewFilters) {
  const searchTerm = filters.search.toLowerCase().trim();
  const allowedEdgeTypes = new Set(filters.edgeTypes);
  const weightedEdges = edges.filter((edge) => edge.weight >= filters.minimumWeight)
    .filter((edge) => !filters.edgeTypes.length || allowedEdgeTypes.has(edge.edgeType))
    .filter((edge) => withinRecentWindow(edge.lastSeen, filters.recentOnlyDays));

  const adjacency = new Map<string, Set<string>>();
  weightedEdges.forEach((edge) => {
    if (!adjacency.has(edge.fromEntityId)) adjacency.set(edge.fromEntityId, new Set());
    if (!adjacency.has(edge.toEntityId)) adjacency.set(edge.toEntityId, new Set());
    adjacency.get(edge.fromEntityId)!.add(edge.toEntityId);
    adjacency.get(edge.toEntityId)!.add(edge.fromEntityId);
  });

  let visibleNodeIds = new Set(nodes.map((node) => node.entityId));
  if (filters.focusedEntityId) {
    visibleNodeIds = new Set([filters.focusedEntityId]);
    let frontier = new Set([filters.focusedEntityId]);
    for (let i = 0; i < Math.max(1, filters.depth); i += 1) {
      const next = new Set<string>();
      frontier.forEach((nodeId) => (adjacency.get(nodeId) || new Set()).forEach((neighbor) => {
        visibleNodeIds.add(neighbor);
        next.add(neighbor);
      }));
      frontier = next;
    }
  }

  const searchedNodes = nodes.filter((node) => {
    if (!visibleNodeIds.has(node.entityId)) return false;
    if (!searchTerm) return true;
    return node.label.toLowerCase().includes(searchTerm) || node.aliases.some((alias) => alias.toLowerCase().includes(searchTerm));
  });

  const nodeIds = new Set(searchedNodes.map((node) => node.entityId));
  const searchedEdges = weightedEdges.filter((edge) => nodeIds.has(edge.fromEntityId) && nodeIds.has(edge.toEntityId));

  return {
    nodes: searchedNodes,
    edges: searchedEdges,
    edgeTypes: [...new Set(edges.map((edge) => edge.edgeType))],
  };
}
