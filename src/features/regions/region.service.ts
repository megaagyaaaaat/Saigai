import type { RegionEntity, RegionGeoJSONFeatureCollection } from './region.types';
import { MOCK_REGIONS, MOCK_REGIONS_GEOJSON } from '../../data/mockRegions';
import { apiRequest } from '../../api/apiClient';
import { APP_CONFIG } from '../../api/apiConfig';

export interface RegionService {
  getRegions(signal?: AbortSignal): Promise<RegionEntity[]>;
  getRegionsGeoJSON(signal?: AbortSignal): Promise<RegionGeoJSONFeatureCollection>;
  getRegionById(regionId: string, signal?: AbortSignal): Promise<RegionEntity | null>;
  searchRegions(query: string, signal?: AbortSignal): Promise<RegionEntity[]>;
  addUserDrawnRegion?(region: RegionEntity): void;
  removeUserDrawnRegion?(regionId: string): void;
}

export class MockRegionService implements RegionService {
  private regions: RegionEntity[] = [...MOCK_REGIONS];

  async getRegions(_signal?: AbortSignal): Promise<RegionEntity[]> {
    await new Promise((res) => setTimeout(res, 40));
    return [...this.regions];
  }

  async getRegionsGeoJSON(_signal?: AbortSignal): Promise<RegionGeoJSONFeatureCollection> {
    await new Promise((res) => setTimeout(res, 30));
    return MOCK_REGIONS_GEOJSON;
  }

  async getRegionById(regionId: string, signal?: AbortSignal): Promise<RegionEntity | null> {
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

    const match = this.regions.find(
      (r) =>
        r.id === regionId ||
        (regionId === 'reg-shillong-escarpment' && (r.id === 'reg-shillong-escarpment' || r.name.toLowerCase() === 'meghalaya')) ||
        (regionId === 'state-meghalaya' && (r.id === 'reg-shillong-escarpment' || r.name.toLowerCase() === 'meghalaya')) ||
        (regionId === 'reg-teesta-rangit' && (r.id === 'reg-teesta-rangit' || r.name.toLowerCase() === 'sikkim')) ||
        (regionId === 'state-sikkim' && (r.id === 'reg-teesta-rangit' || r.name.toLowerCase() === 'sikkim')) ||
        r.name.toLowerCase() === regionId.toLowerCase()
    );
    return match || null;
  }

  async searchRegions(query: string, _signal?: AbortSignal): Promise<RegionEntity[]> {
    if (!query.trim()) return this.regions;
    const lower = query.toLowerCase();
    return this.regions.filter(
      (r) =>
        r.name.toLowerCase().includes(lower) ||
        r.statesCrossed.some((s) => s.toLowerCase().includes(lower)) ||
        r.dominantGeology.toLowerCase().includes(lower) ||
        r.category.toLowerCase().includes(lower) ||
        r.id.toLowerCase().includes(lower)
    );
  }

  addUserDrawnRegion(region: RegionEntity) {
    const existingIndex = this.regions.findIndex((r) => r.id === region.id);
    if (existingIndex >= 0) {
      this.regions[existingIndex] = region;
    } else {
      this.regions.unshift(region);
    }
  }

  removeUserDrawnRegion(regionId: string) {
    this.regions = this.regions.filter((r) => r.id !== regionId);
  }
}

export class HttpRegionService implements RegionService {
  async getRegions(signal?: AbortSignal): Promise<RegionEntity[]> {
    return apiRequest<RegionEntity[]>('/regions', { signal });
  }

  async getRegionsGeoJSON(signal?: AbortSignal): Promise<RegionGeoJSONFeatureCollection> {
    return apiRequest<RegionGeoJSONFeatureCollection>('/regions/geojson', { signal });
  }

  async getRegionById(regionId: string, signal?: AbortSignal): Promise<RegionEntity | null> {
    return apiRequest<RegionEntity>(`/regions/${regionId}`, { signal });
  }

  async searchRegions(query: string, signal?: AbortSignal): Promise<RegionEntity[]> {
    return apiRequest<RegionEntity[]>(`/regions/search?q=${encodeURIComponent(query)}`, { signal });
  }
}

export class ResilientRegionService implements RegionService {
  private fallback = new MockRegionService();
  private http = new HttpRegionService();

  async getRegions(signal?: AbortSignal): Promise<RegionEntity[]> {
    if (APP_CONFIG.dataMode === 'demo') {
      return this.fallback.getRegions(signal);
    }
    try {
      const data = await this.http.getRegions(signal);
      if (data && data.length > 0) return data;
      return this.fallback.getRegions(signal);
    } catch (err: any) {
      if (err?.name === 'AbortError') throw err;
      return this.fallback.getRegions(signal);
    }
  }

  async getRegionsGeoJSON(signal?: AbortSignal): Promise<RegionGeoJSONFeatureCollection> {
    if (APP_CONFIG.dataMode === 'demo') {
      return this.fallback.getRegionsGeoJSON(signal);
    }
    try {
      const data = await this.http.getRegionsGeoJSON(signal);
      if (data && data.features?.length > 0) return data;
      return this.fallback.getRegionsGeoJSON(signal);
    } catch (err: any) {
      if (err?.name === 'AbortError') throw err;
      return this.fallback.getRegionsGeoJSON(signal);
    }
  }

  async getRegionById(regionId: string, signal?: AbortSignal): Promise<RegionEntity | null> {
    if (APP_CONFIG.dataMode === 'demo') {
      return this.fallback.getRegionById(regionId, signal);
    }
    try {
      const data = await this.http.getRegionById(regionId, signal);
      if (data) return data;
      return this.fallback.getRegionById(regionId, signal);
    } catch (err: any) {
      if (err?.name === 'AbortError') throw err;
      return this.fallback.getRegionById(regionId, signal);
    }
  }

  async searchRegions(query: string, signal?: AbortSignal): Promise<RegionEntity[]> {
    if (APP_CONFIG.dataMode === 'demo') {
      return this.fallback.searchRegions(query, signal);
    }
    try {
      const data = await this.http.searchRegions(query, signal);
      if (data && data.length > 0) return data;
      return this.fallback.searchRegions(query, signal);
    } catch (err: any) {
      if (err?.name === 'AbortError') throw err;
      return this.fallback.searchRegions(query, signal);
    }
  }

  addUserDrawnRegion(region: RegionEntity) {
    this.fallback.addUserDrawnRegion(region);
  }

  removeUserDrawnRegion(regionId: string) {
    this.fallback.removeUserDrawnRegion(regionId);
  }
}

export const regionService: RegionService = new ResilientRegionService();
