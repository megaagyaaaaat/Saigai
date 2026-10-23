import type { IncidentRecord } from './incident.types';
import { MOCK_INCIDENTS } from '../../data/mockIncidents';
import { apiRequest } from '../../api/apiClient';
import { APP_CONFIG } from '../../api/apiConfig';
import { isPointInsideRegion } from '../../lib/geo';
import type { Polygon, MultiPolygon } from 'geojson';

export interface IncidentService {
  getIncidentsByRegion(regionId: string, signal?: AbortSignal): Promise<IncidentRecord[]>;
  getIncidentsInGeometry(geometry: Polygon | MultiPolygon, signal?: AbortSignal): Promise<IncidentRecord[]>;
  getAllIncidents(signal?: AbortSignal): Promise<IncidentRecord[]>;
}

export class MockIncidentService implements IncidentService {
  async getIncidentsByRegion(regionId: string, signal?: AbortSignal): Promise<IncidentRecord[]> {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    await new Promise((res, rej) => {
      const timer = setTimeout(res, 100);
      signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        rej(new DOMException('Aborted', 'AbortError'));
      });
    });

    return MOCK_INCIDENTS.filter((inc) => inc.regionId === regionId);
  }

  async getIncidentsInGeometry(
    geometry: Polygon | MultiPolygon,
    signal?: AbortSignal
  ): Promise<IncidentRecord[]> {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    await new Promise((res, rej) => {
      const timer = setTimeout(res, 120);
      signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        rej(new DOMException('Aborted', 'AbortError'));
      });
    });

    // Spatial filter using point-in-polygon
    return MOCK_INCIDENTS.filter((inc) => isPointInsideRegion(inc.coordinates, geometry));
  }

  async getAllIncidents(_signal?: AbortSignal): Promise<IncidentRecord[]> {
    await new Promise((res) => setTimeout(res, 60));
    return [...MOCK_INCIDENTS];
  }
}

export class HttpIncidentService implements IncidentService {
  async getIncidentsByRegion(regionId: string, signal?: AbortSignal): Promise<IncidentRecord[]> {
    return apiRequest<IncidentRecord[]>(`/regions/${regionId}/incidents`, { signal });
  }

  async getIncidentsInGeometry(
    geometry: Polygon | MultiPolygon,
    signal?: AbortSignal
  ): Promise<IncidentRecord[]> {
    return apiRequest<IncidentRecord[]>('/incidents/spatial-query', {
      method: 'POST',
      body: JSON.stringify({ geometry }),
      signal,
    });
  }

  async getAllIncidents(signal?: AbortSignal): Promise<IncidentRecord[]> {
    return apiRequest<IncidentRecord[]>('/incidents', { signal });
  }
}

export const incidentService: IncidentService =
  APP_CONFIG.dataMode === 'live' ? new HttpIncidentService() : new MockIncidentService();
