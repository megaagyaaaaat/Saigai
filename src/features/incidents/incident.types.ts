export type IncidentSeverity = 'minor' | 'moderate' | 'severe' | 'catastrophic';

export type IncidentTrigger = 
  | 'monsoon_rainfall' 
  | 'cloudburst' 
  | 'slope_cut_construction' 
  | 'earthquake_induced' 
  | 'river_bank_erosion';

export interface IncidentRecord {
  id: string;
  regionId: string;
  title: string;
  date: string;
  coordinates: [number, number]; // [lng, lat]
  severity: IncidentSeverity;
  trigger: IncidentTrigger;
  casualties: number;
  damageDescription: string;
  highwayAffected?: string;
  status: 'resolved' | 'monitoring' | 'debris_cleared';
  verified: boolean;
  dataSource: string;
}
