import type { Polygon, MultiPolygon, BBox } from 'geojson';

export type RiskLevel = 'low' | 'elevated' | 'high' | 'critical';

export type RegionCategory = 
  | 'mountain_range' 
  | 'landslide_corridor' 
  | 'watershed_basin' 
  | 'transboundary_zone' 
  | 'user_drawn';

export interface RegionMetadata {
  id: string;
  name: string;
  category: RegionCategory;
  riskLevel: RiskLevel;
  statesCrossed: string[];
  areaKm2: number;
  dominantGeology: string;
  activeWarningCount: number;
  historicalIncidentCount: number;
  monitoringStationCount: number;
  avgRainfall72h: number;
  soilSaturationPercent: number;
  isUserDrawn?: boolean;
  description: string;
  dataSource: string;
  lastUpdated: string;
}

export interface RegionEntity extends RegionMetadata {
  geometry: Polygon | MultiPolygon;
  bounds: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
}

export interface RegionGeoJSONFeature {
  type: 'Feature';
  id: string;
  properties: RegionMetadata;
  geometry: Polygon | MultiPolygon;
  bbox?: BBox;
}

export interface RegionGeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: RegionGeoJSONFeature[];
}
