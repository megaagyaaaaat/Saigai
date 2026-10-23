export type WaypointCategory = 
  | 'survey_camp' 
  | 'evacuation_center' 
  | 'roadblock' 
  | 'critical_infrastructure' 
  | 'culvert_choke';

export interface Waypoint {
  id: string;
  regionId?: string;
  name: string;
  coordinates: [number, number]; // [lng, lat]
  category: WaypointCategory;
  notes: string;
  createdAt: string;
  createdBy: string;
}
