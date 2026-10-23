export type StationType = 
  | 'AWS' 
  | 'PIEZOMETER' 
  | 'INCLINOMETER' 
  | 'SEISMOMETER' 
  | 'DOPPLER_RADAR';

export interface MonitoringStation {
  id: string;
  regionId: string;
  name: string;
  type: StationType;
  coordinates: [number, number];
  status: 'operational' | 'maintenance' | 'offline';
  elevationM: number;
  batteryPercent: number;
  lastTransmission: string;
  sensorsActive: string[];
}
