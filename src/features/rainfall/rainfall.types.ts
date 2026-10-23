export interface RainfallObservation {
  id: string;
  regionId: string;
  stationName: string;
  stationId: string;
  coordinates: [number, number];
  rainfall1h: number; // mm
  rainfall24h: number; // mm
  rainfall72h: number; // mm
  threshold72h: number; // mm warning threshold
  thresholdExceeded: boolean;
  timestamp: string;
  trend: 'rising' | 'steady' | 'falling';
}

export interface RainfallTimeSeriesPoint {
  date: string;
  actualMm: number;
  thresholdMm: number;
  anomalyPercent: number;
}
