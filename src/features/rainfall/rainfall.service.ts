import type { RainfallObservation, RainfallTimeSeriesPoint } from './rainfall.types';
import { MOCK_RAINFALL_OBSERVATIONS, MOCK_RAINFALL_SERIES_MAP } from '../../data/mockRainfall';
import { apiRequest } from '../../api/apiClient';
import { APP_CONFIG } from '../../api/apiConfig';
import { isPointInsideRegion } from '../../lib/geo';
import type { Polygon, MultiPolygon } from 'geojson';

export interface RainfallService {
  getObservationsByRegion(regionId: string, signal?: AbortSignal): Promise<RainfallObservation[]>;
  getObservationsInGeometry(geometry: Polygon | MultiPolygon, signal?: AbortSignal): Promise<RainfallObservation[]>;
  getTimeSeriesByRegion(regionId: string, signal?: AbortSignal): Promise<RainfallTimeSeriesPoint[]>;
  getAllObservations(signal?: AbortSignal): Promise<RainfallObservation[]>;
}

export class MockRainfallService implements RainfallService {
  async getObservationsByRegion(regionId: string, signal?: AbortSignal): Promise<RainfallObservation[]> {
    await new Promise((res, rej) => {
      const timer = setTimeout(res, 50);
      signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        rej(new DOMException('Aborted', 'AbortError'));
      });
    });

    const match = MOCK_RAINFALL_OBSERVATIONS.filter((r) => r.regionId === regionId);
    if (match.length > 0) return match;
    return [
      {
        id: `rain-${regionId}-default`,
        regionId,
        stationId: `rain-station-${regionId}`,
        stationName: 'State Doppler Telemetry Station',
        coordinates: [92.0, 26.0],
        rainfall1h: 8.5,
        rainfall24h: 45.2,
        rainfall72h: 165.4,
        threshold72h: 150,
        thresholdExceeded: true,
        timestamp: new Date().toISOString(),
        trend: 'rising',
      },
    ];
  }

  async getObservationsInGeometry(
    geometry: Polygon | MultiPolygon,
    signal?: AbortSignal
  ): Promise<RainfallObservation[]> {
    await new Promise((res, rej) => {
      const timer = setTimeout(res, 60);
      signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        rej(new DOMException('Aborted', 'AbortError'));
      });
    });

    return MOCK_RAINFALL_OBSERVATIONS.filter((r) => isPointInsideRegion(r.coordinates, geometry));
  }

  async getTimeSeriesByRegion(
    regionId: string,
    signal?: AbortSignal
  ): Promise<RainfallTimeSeriesPoint[]> {
    await new Promise((res, rej) => {
      const timer = setTimeout(res, 60);
      signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        rej(new DOMException('Aborted', 'AbortError'));
      });
    });

    return (
      MOCK_RAINFALL_SERIES_MAP[regionId] || [
        { date: 'Day -6', actualMm: 15, thresholdMm: 80, anomalyPercent: -40 },
        { date: 'Day -5', actualMm: 25, thresholdMm: 80, anomalyPercent: -20 },
        { date: 'Day -4', actualMm: 45, thresholdMm: 80, anomalyPercent: +5 },
        { date: 'Day -3', actualMm: 70, thresholdMm: 80, anomalyPercent: +25 },
        { date: 'Day -2', actualMm: 95, thresholdMm: 80, anomalyPercent: +45 },
        { date: 'Yesterday', actualMm: 110, thresholdMm: 80, anomalyPercent: +60 },
        { date: 'Today (Live)', actualMm: 125, thresholdMm: 80, anomalyPercent: +75 },
      ]
    );
  }

  async getAllObservations(_signal?: AbortSignal): Promise<RainfallObservation[]> {
    await new Promise((res) => setTimeout(res, 40));
    return [...MOCK_RAINFALL_OBSERVATIONS];
  }
}

export class HttpRainfallService implements RainfallService {
  async getObservationsByRegion(regionId: string, signal?: AbortSignal): Promise<RainfallObservation[]> {
    return apiRequest<RainfallObservation[]>(`/regions/${regionId}/rainfall`, { signal });
  }

  async getObservationsInGeometry(
    geometry: Polygon | MultiPolygon,
    signal?: AbortSignal
  ): Promise<RainfallObservation[]> {
    return apiRequest<RainfallObservation[]>('/rainfall/spatial-query', {
      method: 'POST',
      body: JSON.stringify({ geometry }),
      signal,
    });
  }

  async getTimeSeriesByRegion(regionId: string, signal?: AbortSignal): Promise<RainfallTimeSeriesPoint[]> {
    return apiRequest<RainfallTimeSeriesPoint[]>(`/regions/${regionId}/rainfall/timeseries`, { signal });
  }

  async getAllObservations(signal?: AbortSignal): Promise<RainfallObservation[]> {
    return apiRequest<RainfallObservation[]>('/rainfall', { signal });
  }
}

export class ResilientRainfallService implements RainfallService {
  private fallback = new MockRainfallService();
  private http = new HttpRainfallService();

  async getObservationsByRegion(regionId: string, signal?: AbortSignal): Promise<RainfallObservation[]> {
    if (APP_CONFIG.dataMode === 'demo') {
      return this.fallback.getObservationsByRegion(regionId, signal);
    }
    try {
      const data = await this.http.getObservationsByRegion(regionId, signal);
      if (Array.isArray(data) && data.length > 0) return data;
      return this.fallback.getObservationsByRegion(regionId, signal);
    } catch (err: any) {
      if (err?.name === 'AbortError') throw err;
      return this.fallback.getObservationsByRegion(regionId, signal);
    }
  }

  async getObservationsInGeometry(
    geometry: Polygon | MultiPolygon,
    signal?: AbortSignal
  ): Promise<RainfallObservation[]> {
    if (APP_CONFIG.dataMode === 'demo') {
      return this.fallback.getObservationsInGeometry(geometry, signal);
    }
    try {
      return await this.http.getObservationsInGeometry(geometry, signal);
    } catch (err: any) {
      if (err?.name === 'AbortError') throw err;
      return this.fallback.getObservationsInGeometry(geometry, signal);
    }
  }

  async getTimeSeriesByRegion(regionId: string, signal?: AbortSignal): Promise<RainfallTimeSeriesPoint[]> {
    if (APP_CONFIG.dataMode === 'demo') {
      return this.fallback.getTimeSeriesByRegion(regionId, signal);
    }
    try {
      const data = await this.http.getTimeSeriesByRegion(regionId, signal);
      if (Array.isArray(data) && data.length > 0) return data;
      return this.fallback.getTimeSeriesByRegion(regionId, signal);
    } catch (err: any) {
      if (err?.name === 'AbortError') throw err;
      return this.fallback.getTimeSeriesByRegion(regionId, signal);
    }
  }

  async getAllObservations(signal?: AbortSignal): Promise<RainfallObservation[]> {
    if (APP_CONFIG.dataMode === 'demo') {
      return this.fallback.getAllObservations(signal);
    }
    try {
      const data = await this.http.getAllObservations(signal);
      if (Array.isArray(data) && data.length > 0) return data;
      return this.fallback.getAllObservations(signal);
    } catch (err: any) {
      if (err?.name === 'AbortError') throw err;
      return this.fallback.getAllObservations(signal);
    }
  }
}

export const rainfallService: RainfallService = new ResilientRainfallService();
