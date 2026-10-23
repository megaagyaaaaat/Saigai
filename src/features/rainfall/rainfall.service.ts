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
      const timer = setTimeout(res, 80);
      signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        rej(new DOMException('Aborted', 'AbortError'));
      });
    });

    return MOCK_RAINFALL_OBSERVATIONS.filter((r) => r.regionId === regionId);
  }

  async getObservationsInGeometry(
    geometry: Polygon | MultiPolygon,
    signal?: AbortSignal
  ): Promise<RainfallObservation[]> {
    await new Promise((res, rej) => {
      const timer = setTimeout(res, 90);
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
      const timer = setTimeout(res, 100);
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
    await new Promise((res) => setTimeout(res, 50));
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

export const rainfallService: RainfallService =
  APP_CONFIG.dataMode === 'live' ? new HttpRainfallService() : new MockRainfallService();
