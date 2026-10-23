import type { WarningRecord } from './warning.types';
import { MOCK_WARNINGS } from '../../data/mockStations';
import { apiRequest } from '../../api/apiClient';
import { APP_CONFIG } from '../../api/apiConfig';

export interface WarningService {
  getWarningsByRegion(regionId: string, signal?: AbortSignal): Promise<WarningRecord[]>;
  getActiveWarnings(signal?: AbortSignal): Promise<WarningRecord[]>;
}

export class MockWarningService implements WarningService {
  async getWarningsByRegion(regionId: string, signal?: AbortSignal): Promise<WarningRecord[]> {
    await new Promise((res, rej) => {
      const timer = setTimeout(res, 50);
      signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        rej(new DOMException('Aborted', 'AbortError'));
      });
    });

    return MOCK_WARNINGS.filter(
      (w) =>
        w.regionId === regionId ||
        (regionId.includes('meghalaya') && w.regionId.includes('shillong')) ||
        (regionId.includes('sikkim') && w.regionId.includes('teesta'))
    );
  }

  async getActiveWarnings(_signal?: AbortSignal): Promise<WarningRecord[]> {
    await new Promise((res) => setTimeout(res, 40));
    return [...MOCK_WARNINGS];
  }
}

export class HttpWarningService implements WarningService {
  async getWarningsByRegion(regionId: string, signal?: AbortSignal): Promise<WarningRecord[]> {
    return apiRequest<WarningRecord[]>(`/regions/${regionId}/warnings`, { signal });
  }

  async getActiveWarnings(signal?: AbortSignal): Promise<WarningRecord[]> {
    return apiRequest<WarningRecord[]>('/warnings/active', { signal });
  }
}

export class ResilientWarningService implements WarningService {
  private fallback = new MockWarningService();
  private http = new HttpWarningService();

  async getWarningsByRegion(regionId: string, signal?: AbortSignal): Promise<WarningRecord[]> {
    if (APP_CONFIG.dataMode === 'demo') {
      return this.fallback.getWarningsByRegion(regionId, signal);
    }
    try {
      const data = await this.http.getWarningsByRegion(regionId, signal);
      if (Array.isArray(data)) return data;
      return this.fallback.getWarningsByRegion(regionId, signal);
    } catch (err: any) {
      if (err?.name === 'AbortError') throw err;
      return this.fallback.getWarningsByRegion(regionId, signal);
    }
  }

  async getActiveWarnings(signal?: AbortSignal): Promise<WarningRecord[]> {
    if (APP_CONFIG.dataMode === 'demo') {
      return this.fallback.getActiveWarnings(signal);
    }
    try {
      const data = await this.http.getActiveWarnings(signal);
      if (Array.isArray(data)) return data;
      return this.fallback.getActiveWarnings(signal);
    } catch (err: any) {
      if (err?.name === 'AbortError') throw err;
      return this.fallback.getActiveWarnings(signal);
    }
  }
}

export const warningService: WarningService = new ResilientWarningService();
