import type { RegionEntity, RegionGeoJSONFeatureCollection } from './region.types';
import { MOCK_REGIONS, MOCK_REGIONS_GEOJSON } from '../../data/mockRegions';
import { apiRequest } from '../../api/apiClient';
import { APP_CONFIG } from '../../api/apiConfig';

export interface RegionService {
  getRegions(signal?: AbortSignal): Promise<RegionEntity[]>;
  getRegionsGeoJSON(signal?: AbortSignal): Promise<RegionGeoJSONFeatureCollection>;
  getRegionById(regionId: string, signal?: AbortSignal): Promise<RegionEntity | null>;
  searchRegions(query: string, signal?: AbortSignal): Promise<RegionEntity[]>;
}

export class MockRegionService implements RegionService {
  private regions: RegionEntity[] = [...MOCK_REGIONS];

  async getRegions(_signal?: AbortSignal): Promise<RegionEntity[]> {
    // Simulate brief network latency for realistic loading states
    await new Promise((res) => setTimeout(res, 80));
    return [...this.regions];
  }

  async getRegionsGeoJSON(_signal?: AbortSignal): Promise<RegionGeoJSONFeatureCollection> {
    await new Promise((res) => setTimeout(res, 60));
    return MOCK_REGIONS_GEOJSON;
  }

  async getRegionById(regionId: string, signal?: AbortSignal): Promise<RegionEntity | null> {
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

    const match = this.regions.find((r) => r.id === regionId);
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
        r.category.toLowerCase().includes(lower)
    );
  }

  // Helper to add or replace user-drawn regions dynamically
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

export const regionService: RegionService =
  APP_CONFIG.dataMode === 'live' ? new HttpRegionService() : new MockRegionService();
