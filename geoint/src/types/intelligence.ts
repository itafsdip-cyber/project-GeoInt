export type VerificationLevel = 'VERIFIED' | 'HEURISTIC' | 'INFERRED' | 'UNKNOWN';
export type GeolocationPrecision = 'EXACT' | 'APPROXIMATE' | 'REGION' | 'UNKNOWN';
export type NarrativeStatus = 'EMERGING' | 'TRENDING' | 'STABLE' | 'DISPUTED' | 'DECLINING';
export type SourceHealthState = 'ACTIVE' | 'AUTH_MISSING' | 'RATE_LIMITED' | 'STALE' | 'UNAVAILABLE';
export type OverlayTrackType = 'MARITIME' | 'AIR' | 'FIRE' | 'HOTSPOT' | 'SATELLITE';

export interface SourceReference {
  sourceId: string;
  sourceName: string;
  url?: string;
  collectedAt: string;
  health: SourceHealthState;
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
}

export interface Incident {
  incidentId: string;
  title: string;
  eventIds: string[];
  verificationLevel: VerificationLevel;
  confidenceNote?: string;
  intelligenceGaps?: string[];
}

export interface AnalystNote {
  noteId: string;
  createdAt: string;
  analyst: string;
  text: string;
  linkedIncidentIds: string[];
  linkedEntityIds: string[];
  linkedNarrativeIds: string[];
}

export interface BriefingSection { id: string; heading: string; body: string; }
export interface BriefingDocument {
  briefingId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  sections: BriefingSection[];
}

export interface EntityNode { entityId: string; label: string; aliases: string[]; firstSeen: string; lastSeen: string; }
export interface EntityRelation { relationId: string; fromEntityId: string; toEntityId: string; edgeType: string; weight: number; firstSeen: string; lastSeen: string; }

export interface NarrativeCluster {
  narrativeId: string;
  title: string;
  status: NarrativeStatus;
  firstSeen: string;
  lastSeen: string;
  sourceCount: number;
  platformCount: number;
  confidenceWarning?: string;
}

export interface OverlayTrack {
  trackId: string;
  type: OverlayTrackType;
  label: string;
  latitude: number;
  longitude: number;
  observedAt: string;
  expiresAt?: string;
  verificationLevel: VerificationLevel;
}
