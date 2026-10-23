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
      const timer = setTimeout(res, 80);
      signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        rej(new DOMException('Aborted', 'AbortError'));
      });
    });

    return MOCK_WARNINGS.filter((w) => w.regionId === regionId);
  }

  async getActiveWarnings(_signal?: AbortSignal): Promise<WarningRecord[]> {
    await new Promise((res) => setTimeout(res, 50));
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

export const warningService: WarningService =
  APP_CONFIG.dataMode === 'live' ? new HttpWarningService() : new MockWarningService();
