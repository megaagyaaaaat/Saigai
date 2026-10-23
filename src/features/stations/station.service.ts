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
      const timer = setTimeout(res, 50);
      signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        rej(new DOMException('Aborted', 'AbortError'));
      });
    });

    const match = MOCK_STATIONS.filter((s) => s.regionId === regionId);
    if (match.length > 0) return match;
    return [
      {
        id: `stn-${regionId}-01`,
        name: 'State Meteorological & InSAR Ground Station',
        regionId,
        type: 'weather_radar',
        coordinates: [92.0, 26.0],
        elevationM: 1450,
        status: 'online',
        batteryPercent: 96,
        lastTransmission: new Date().toISOString(),
      }
    ];
  }

  async getStationsInGeometry(
    geometry: Polygon | MultiPolygon,
    signal?: AbortSignal
  ): Promise<MonitoringStation[]> {
    await new Promise((res, rej) => {
      const timer = setTimeout(res, 60);
      signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        rej(new DOMException('Aborted', 'AbortError'));
      });
    });

    return MOCK_STATIONS.filter((s) => isPointInsideRegion(s.coordinates, geometry));
  }

  async getAllStations(_signal?: AbortSignal): Promise<MonitoringStation[]> {
    await new Promise((res) => setTimeout(res, 40));
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

export class ResilientStationService implements StationService {
  private fallback = new MockStationService();
  private http = new HttpStationService();

  async getStationsByRegion(regionId: string, signal?: AbortSignal): Promise<MonitoringStation[]> {
    if (APP_CONFIG.dataMode === 'demo') {
      return this.fallback.getStationsByRegion(regionId, signal);
    }
    try {
      const data = await this.http.getStationsByRegion(regionId, signal);
      if (Array.isArray(data) && data.length > 0) return data;
      return this.fallback.getStationsByRegion(regionId, signal);
    } catch (err: any) {
      if (err?.name === 'AbortError') throw err;
      return this.fallback.getStationsByRegion(regionId, signal);
    }
  }

  async getStationsInGeometry(
    geometry: Polygon | MultiPolygon,
    signal?: AbortSignal
  ): Promise<MonitoringStation[]> {
    if (APP_CONFIG.dataMode === 'demo') {
      return this.fallback.getStationsInGeometry(geometry, signal);
    }
    try {
      return await this.http.getStationsInGeometry(geometry, signal);
    } catch (err: any) {
      if (err?.name === 'AbortError') throw err;
      return this.fallback.getStationsInGeometry(geometry, signal);
    }
  }

  async getAllStations(signal?: AbortSignal): Promise<MonitoringStation[]> {
    if (APP_CONFIG.dataMode === 'demo') {
      return this.fallback.getAllStations(signal);
    }
    try {
      const data = await this.http.getAllStations(signal);
      if (Array.isArray(data) && data.length > 0) return data;
      return this.fallback.getAllStations(signal);
    } catch (err: any) {
      if (err?.name === 'AbortError') throw err;
      return this.fallback.getAllStations(signal);
    }
  }

  async getWaypoints(regionId?: string, signal?: AbortSignal): Promise<Waypoint[]> {
    if (APP_CONFIG.dataMode === 'demo') {
      return this.fallback.getWaypoints(regionId, signal);
    }
    try {
      const data = await this.http.getWaypoints(regionId, signal);
      if (Array.isArray(data) && data.length > 0) return data;
      return this.fallback.getWaypoints(regionId, signal);
    } catch (err: any) {
      if (err?.name === 'AbortError') throw err;
      return this.fallback.getWaypoints(regionId, signal);
    }
  }

  async addWaypoint(waypoint: Waypoint): Promise<Waypoint> {
    try {
      return await this.http.addWaypoint(waypoint);
    } catch (err) {
      return this.fallback.addWaypoint(waypoint);
    }
  }
}

export const stationService: StationService = new ResilientStationService();
