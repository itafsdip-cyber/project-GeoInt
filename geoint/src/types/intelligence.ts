export type VerificationLevel = 'VERIFIED' | 'HEURISTIC' | 'INFERRED' | 'UNKNOWN';
export type GeoPrecision = 'EXACT' | 'APPROXIMATE' | 'REGION' | 'UNKNOWN';
export type GeolocationPrecision = GeoPrecision;
export type NarrativeStatus = 'EMERGING' | 'TRENDING' | 'STABLE' | 'DISPUTED' | 'DECLINING';
export type SourceHealthState = 'ACTIVE' | 'AUTH_MISSING' | 'RATE_LIMITED' | 'STALE' | 'UNAVAILABLE' | 'DEGRADED' | 'UNKNOWN';
export type OverlayTrackType = 'MARITIME' | 'AIR' | 'FIRE' | 'HOTSPOT' | 'SATELLITE';
export type IntelligenceNodeType = 'actor' | 'entity' | 'incident' | 'region' | 'narrative' | 'source' | 'vessel' | 'aircraft';
export type IntelligenceEdgeType =
  | 'CO_OCCURS_WITH'
  | 'MENTIONED_IN_INCIDENT'
  | 'OPERATES_IN_REGION'
  | 'ATTRIBUTED_TO'
  | 'AMPLIFIES_NARRATIVE'
  | 'SOURCE_REPORTS_ON'
  | 'CONNECTED_TO_VESSEL'
  | 'CONNECTED_TO_AIRCRAFT';
export type IncidentLifecycleState = 'NEW' | 'ACTIVE' | 'MONITORING' | 'ESCALATED' | 'STABLE' | 'RESOLVED' | 'ARCHIVED';
export type ConfidenceBand = 'LOW' | 'MEDIUM' | 'HIGH';
export type RegionGeometryType = 'BBOX' | 'CIRCLE' | 'POLYGON' | 'VIEWPORT';

export interface ConfidenceBreakdown {
  freshness: number;
  sourceType: number;
  corroboration: number;
  sourceDiversity: number;
  sourceHealth: number;
  credibilityBaseline: number;
  narrativeDispute: number;
  geolocationPrecision: number;
}

export interface SourceReference {
  sourceId: string;
  sourceName: string;
  url?: string;
  collectedAt: string;
  health: SourceHealthState;
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface ActorRef {
  actorId: string;
  label: string;
  role?: string;
}

export interface TrajectoryMetadata {
  launchCoordinate?: [number, number];
  impactCoordinate?: [number, number];
  confidence: number;
  inferred: boolean;
  caveat: string;
}

export interface IntelligenceEvent {
  id: string;
  title: string;
  timestamp: string;
  latitude?: number | null;
  longitude?: number | null;
  region?: string;
  summary?: string;
  verificationLevel: VerificationLevel;
  geolocationPrecision: GeolocationPrecision;
  uncertaintyRadiusKm?: number;
  trajectory?: TrajectoryMetadata;
  references: SourceReference[];
  actors?: ActorRef[];
  source?: string;
  providerCategory?: string;
  reliability?: number;
  verificationStatus?: string;
  metadata?: Record<string, unknown>;
  category?: string;
  tags?: string[];
}

export interface Incident {
  incidentId: string;
  title: string;
  summary?: string;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
  firstSeen?: string;
  lastSeen?: string;
  lifecycleState?: IncidentLifecycleState;
  eventIds: string[];
  linkedEventIds?: string[];
  linkedEntityIds?: string[];
  linkedNarrativeIds?: string[];
  linkedOverlayIds?: string[];
  analystPriority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  escalationReason?: string;
  regionTags?: string[];
  sourceCount?: number;
  verificationLevel: VerificationLevel;
  confidenceScore?: number;
  confidenceBand?: ConfidenceBand;
  caveatText?: string;
  reliabilityBreakdown?: Partial<ConfidenceBreakdown>;
  gapsNote?: string;
  fusionRationale?: string[];
  mergeHistory?: Array<{ mergedIncidentId: string; mergedAt: string; rationale: string }>;
  confidenceNote?: string;
  intelligenceGaps?: string[];
  region?: string;
  primaryCategory?: string;
  sourceSet?: string[];
  involvedActors?: string[];
  categories?: string[];
}

export interface NarrativeSignal {
  signalId: string;
  narrativeId: string;
  sourceId: string;
  observedAt: string;
  amplificationScore: number;
  credibilityDelta: number;
  platform?: string;
  disputed?: boolean;
}

export interface AnalystNote {
  noteId: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
  analyst: string;
  tags: string[];
  linkedIncidentIds: string[];
  linkedEntityIds: string[];
  linkedNarrativeIds: string[];
  classification: string;
  confidenceNote?: string;
}

export interface BriefingSection {
  id: string;
  type: string;
  title: string;
  content: string;
  linkedIds: string[];
}

export interface BriefingDocument {
  briefingId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  sections: BriefingSection[];
}

export interface EntityNode {
  entityId: string;
  label: string;
  aliases: string[];
  firstSeen: string;
  lastSeen: string;
  type?: IntelligenceNodeType;
  linkedIncidentCount?: number;
  linkedNoteCount?: number;
  linkedNarrativeCount?: number;
}
export interface EntityRelation {
  relationId: string;
  fromEntityId: string;
  toEntityId: string;
  edgeType: IntelligenceEdgeType | string;
  weight: number;
  firstSeen: string;
  lastSeen: string;
  caveat?: string;
}
export type Entity = EntityNode;

export interface NarrativeCluster {
  narrativeId: string;
  title: string;
  status: NarrativeStatus;
  firstSeen: string;
  lastSeen: string;
  sourceCount: number;
  platformCount: number;
  confidenceWarning?: string;
  keywords?: string[];
  eventIds?: string[];
  relatedIncidentIds?: string[];
  relatedEntityIds?: string[];
  relatedNoteIds?: string[];
  sourceCredibilityMix?: { high: number; medium: number; low: number };
  disputedIndicators?: number;
  amplificationScore?: number;
  caveatNote?: string;
}

export interface OverlayTrack {
  trackId: string;
  type: OverlayTrackType;
  label: string;
  latitude: number;
  longitude: number;
  observedAt: string;
  collectedAt?: string;
  expiresAt?: string;
  verificationLevel: VerificationLevel;
  sourceReference?: SourceReference;
  locationPrecision?: GeoPrecision;
}

export interface CorrelationCandidate {
  id: string;
  correlationType: string;
  score: number;
  rationale: string[];
  caveat: string;
  linkedRecordIds: string[];
  breakdown: Record<string, number>;
  pinned?: boolean;
}

export interface SearchResult {
  id: string;
  type: string;
  title: string;
  timestamp: string;
  sourceCount: number;
  confidenceHint: string;
  caveatHint?: string;
  linkedIds?: string[];
  score?: number;
  matchExcerpt?: string;
  sourceRefs?: string[];
  region?: string;
}

export type WatchlistType = 'ENTITY' | 'KEYWORD' | 'NARRATIVE' | 'SOURCE' | 'REGION' | 'OVERLAY_TYPE';

export interface WatchlistEntry {
  id: string;
  title: string;
  type: WatchlistType;
  criteria: string;
  createdAt: string;
  updatedAt: string;
  enabled: boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  analystOwner: string;
  tags: string[];
}

export interface WatchlistAlert {
  id: string;
  watchlistId: string;
  matchedObjectType: string;
  matchedObjectId: string;
  reason: string;
  createdAt: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  read: boolean;
  priorityScore?: number;
  scoreBreakdown?: Record<string, number>;
  escalationHint?: string;
  relatedRegionIds?: string[];
  relatedIncidentIds?: string[];
  confidenceScore?: number;
  confidenceBand?: ConfidenceBand;
  caveatText?: string;
  reliabilityBreakdown?: Partial<ConfidenceBreakdown>;
  gapsNote?: string;
}

export interface MonitoredRegion {
  id: string;
  name: string;
  geometryType: RegionGeometryType;
  bbox?: { minLat: number; minLng: number; maxLat: number; maxLng: number };
  circle?: { center: GeoPoint; radiusKm: number };
  polygon?: GeoPoint[];
  viewport?: { center: GeoPoint; zoom: number; bounds?: { north: number; south: number; east: number; west: number } };
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

export interface RegionSummary {
  regionId: string;
  incidentCount: number;
  overlayCount: number;
  narrativeActivityCount: number;
  watchlistMatches: number;
  activeAlerts: number;
  recentSourceDiversity: number;
  confidenceMix: { low: number; medium: number; high: number };
  caveatText: string;
  heuristicSummary: string;
  lastUpdated: string;
  confidenceScore?: number;
  confidenceBand?: ConfidenceBand;
  reliabilityBreakdown?: Partial<ConfidenceBreakdown>;
  gapsNote?: string;
}

export interface InvestigationSession {
  id: string;
  title: string;
  summary: string;
  createdAt: string;
  updatedAt: string;
  selectedEntityIds: string[];
  selectedIncidentIds: string[];
  selectedNarrativeIds: string[];
  selectedOverlayIds: string[];
  savedQuery?: string;
  savedFilters?: Record<string, unknown>;
  mapCenter?: GeoPoint;
  mapZoom?: number;
  activeWatchAreaIds?: string[];
  timelineFilters?: Record<string, unknown>;
  searchFilters?: Record<string, unknown>;
  pinnedCorrelationIds?: string[];
  pinnedAlertIds?: string[];
  linkedNoteIds: string[];
  linkedBriefingIds: string[];
}
