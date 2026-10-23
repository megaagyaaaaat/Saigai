import type { MonitoringStation } from './station.types';
import type { Waypoint } from '../waypoints/waypoint.types';
import { MOCK_STATIONS, MOCK_WAYPOINTS } from '../../data/mockStations';
import { apiRequest } from '../../api/apiClient';
import { APP_CONFIG } from '../../api/apiConfig';
import { isPointInsideRegion } from '../../lib/geo';
import type { Polygon, MultiPolygon } from 'geojson';

export interface StationService {
  getStationsByRegion(regionId: string, signal?: AbortSignal): Promise<MonitoringStation[]>;
  getStationsInGeometry(geometry: Polygon | MultiPolygon, signal?: AbortSignal): Promise<MonitoringStation[]>;
  getAllStations(signal?: AbortSignal): Promise<MonitoringStation[]>;
  getWaypoints(regionId?: string, signal?: AbortSignal): Promise<Waypoint[]>;
  addWaypoint(waypoint: Waypoint): Promise<Waypoint>;
}

export class MockStationService implements StationService {
  private waypoints: Waypoint[] = [...MOCK_WAYPOINTS];

  async getStationsByRegion(regionId: string, signal?: AbortSignal): Promise<MonitoringStation[]> {
    await new Promise((res, rej) => {
      const timer = setTimeout(res, 70);
      signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        rej(new DOMException('Aborted', 'AbortError'));
      });
    });

    return MOCK_STATIONS.filter((s) => s.regionId === regionId);
  }

  async getStationsInGeometry(
    geometry: Polygon | MultiPolygon,
    signal?: AbortSignal
  ): Promise<MonitoringStation[]> {
    await new Promise((res, rej) => {
      const timer = setTimeout(res, 80);
      signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        rej(new DOMException('Aborted', 'AbortError'));
      });
    });

    return MOCK_STATIONS.filter((s) => isPointInsideRegion(s.coordinates, geometry));
  }

  async getAllStations(_signal?: AbortSignal): Promise<MonitoringStation[]> {
    await new Promise((res) => setTimeout(res, 50));
    return [...MOCK_STATIONS];
  }

  async getWaypoints(regionId?: string, _signal?: AbortSignal): Promise<Waypoint[]> {
    if (!regionId) return [...this.waypoints];
    return this.waypoints.filter((w) => w.regionId === regionId);
  }

  async addWaypoint(waypoint: Waypoint): Promise<Waypoint> {
    this.waypoints.push(waypoint);
    return waypoint;
  }
}

export class HttpStationService implements StationService {
  async getStationsByRegion(regionId: string, signal?: AbortSignal): Promise<MonitoringStation[]> {
    return apiRequest<MonitoringStation[]>(`/regions/${regionId}/stations`, { signal });
  }

  async getStationsInGeometry(
    geometry: Polygon | MultiPolygon,
    signal?: AbortSignal
  ): Promise<MonitoringStation[]> {
    return apiRequest<MonitoringStation[]>('/stations/spatial-query', {
      method: 'POST',
      body: JSON.stringify({ geometry }),
      signal,
    });
  }

  async getAllStations(signal?: AbortSignal): Promise<MonitoringStation[]> {
    return apiRequest<MonitoringStation[]>('/stations', { signal });
  }

  async getWaypoints(regionId?: string, signal?: AbortSignal): Promise<Waypoint[]> {
    const url = regionId ? `/regions/${regionId}/waypoints` : '/waypoints';
    return apiRequest<Waypoint[]>(url, { signal });
  }

  async addWaypoint(waypoint: Waypoint): Promise<Waypoint> {
    return apiRequest<Waypoint>('/waypoints', {
      method: 'POST',
      body: JSON.stringify(waypoint),
    });
  }
}

export const stationService: StationService =
  APP_CONFIG.dataMode === 'live' ? new HttpStationService() : new MockStationService();
