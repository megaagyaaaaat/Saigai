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
      const timer = setTimeout(res, 60);
      signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        rej(new DOMException('Aborted', 'AbortError'));
      });
    });

    return MOCK_INCIDENTS.filter(
      (inc) =>
        inc.regionId === regionId ||
        (regionId === 'reg-shillong-escarpment' && inc.regionId === 'reg-shillong-escarpment') ||
        (regionId === 'state-meghalaya' && inc.regionId === 'reg-shillong-escarpment') ||
        (regionId === 'state-sikkim' && inc.regionId === 'reg-teesta-rangit')
    );
  }

  async getIncidentsInGeometry(
    geometry: Polygon | MultiPolygon,
    signal?: AbortSignal
  ): Promise<IncidentRecord[]> {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    await new Promise((res, rej) => {
      const timer = setTimeout(res, 70);
      signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        rej(new DOMException('Aborted', 'AbortError'));
      });
    });

    return MOCK_INCIDENTS.filter((inc) => isPointInsideRegion(inc.coordinates, geometry));
  }

  async getAllIncidents(_signal?: AbortSignal): Promise<IncidentRecord[]> {
    await new Promise((res) => setTimeout(res, 40));
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
    return apiRequest<IncidentRecord[]>('/landslides', { signal });
  }
}

export class ResilientIncidentService implements IncidentService {
  private fallback = new MockIncidentService();
  private http = new HttpIncidentService();

  async getIncidentsByRegion(regionId: string, signal?: AbortSignal): Promise<IncidentRecord[]> {
    if (APP_CONFIG.dataMode === 'demo') {
      return this.fallback.getIncidentsByRegion(regionId, signal);
    }
    try {
      const data = await this.http.getIncidentsByRegion(regionId, signal);
      if (data && data.length > 0) return data;
      return this.fallback.getIncidentsByRegion(regionId, signal);
    } catch (err: any) {
      if (err?.name === 'AbortError') throw err;
      return this.fallback.getIncidentsByRegion(regionId, signal);
    }
  }

  async getIncidentsInGeometry(
    geometry: Polygon | MultiPolygon,
    signal?: AbortSignal
  ): Promise<IncidentRecord[]> {
    if (APP_CONFIG.dataMode === 'demo') {
      return this.fallback.getIncidentsInGeometry(geometry, signal);
    }
    try {
      return await this.http.getIncidentsInGeometry(geometry, signal);
    } catch (err: any) {
      if (err?.name === 'AbortError') throw err;
      return this.fallback.getIncidentsInGeometry(geometry, signal);
    }
  }

  async getAllIncidents(signal?: AbortSignal): Promise<IncidentRecord[]> {
    if (APP_CONFIG.dataMode === 'demo') {
      return this.fallback.getAllIncidents(signal);
    }
    try {
      const data = await this.http.getAllIncidents(signal);
      if (data && data.length > 0) return data;
      return this.fallback.getAllIncidents(signal);
    } catch (err: any) {
      if (err?.name === 'AbortError') throw err;
      return this.fallback.getAllIncidents(signal);
    }
  }
}

export const incidentService: IncidentService = new ResilientIncidentService();
