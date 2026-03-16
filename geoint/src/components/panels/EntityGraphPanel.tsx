import type { EntityNode, EntityRelation } from '../../types/intelligence';

export default function EntityGraphPanel({ entities, relations }: { entities: EntityNode[]; relations: EntityRelation[] }) {
  const heavyRelations = relations.filter((relation) => relation.weight >= 1).slice(0, 8);
  return <section><div style={{ fontSize: 11, color: '#00e5c8' }}>ENTITY GRAPH</div><div style={{ fontSize: 10 }}>Entities: {entities.length}</div>{heavyRelations.map((relation) => <div key={relation.relationId} style={{ fontSize: 10 }}>{relation.edgeType} ({relation.weight})</div>)}<div style={{ fontSize: 9, color: '#8fa2b6' }}>Co-occurrence does not prove command affiliation.</div></section>;
}
