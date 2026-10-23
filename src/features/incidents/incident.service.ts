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

interface StaticIncident {
  record: IncidentRecord;
  stateSlug: string;
}

const slugify = (v: string) => v.toLowerCase().trim().replace(/\s+/g, '-');

let staticIncidentsPromise: Promise<StaticIncident[]> | null = null;

/** Loads the real NER landslide inventory shipped as a static asset (no backend required). */
function loadStaticIncidents(): Promise<StaticIncident[]> {
  if (!staticIncidentsPromise) {
    staticIncidentsPromise = fetch('/data/ner_landslides.geojson')
      .then((res) => {
        if (!res.ok) throw new Error(`Landslide inventory HTTP ${res.status}`);
        return res.json();
      })
      .then((fc: any): StaticIncident[] =>
        (fc.features ?? []).map((f: any) => {
          const p = f.properties ?? {};
          const loc = p.location_name || 'Slope Failure';
          const type = String(p.landslide_type || 'landslide').replace(/_/g, ' ');
          const fatalities = p.fatalities ?? 0;
          const injuries = p.injuries ?? 0;
          return {
            stateSlug: slugify(p.state ?? ''),
            record: {
              id: p.event_id,
              regionId: p.region_id ?? `state-${slugify(p.state ?? '')}`,
              title: `${loc} - ${type.replace(/\b\w/g, (c: string) => c.toUpperCase())}`,
              date: p.event_date,
              coordinates: f.geometry.coordinates as [number, number],
              severity: p.severity_or_impact ?? 'moderate',
              trigger: p.trigger ?? 'unknown',
              casualties: fatalities + injuries,
              damageDescription: `${type} in ${p.state}. Fatalities: ${fatalities}, Injuries: ${injuries}. ${p.notes ?? ''}`.trim(),
              highwayAffected: p.highway_affected ?? undefined,
              status: fatalities === 0 ? 'debris_cleared' : 'resolved',
              verified: !!p.verified,
              dataSource: p.source ?? 'NASA GLC / GSI',
              elevationM: p.elevation_m ?? undefined,
              slopeDeg: p.slope_deg ?? undefined,
            } as IncidentRecord,
          };
        })
      )
      .catch((err) => {
        staticIncidentsPromise = null;
        throw err;
      });
  }
  return staticIncidentsPromise;
}

export class StaticIncidentService implements IncidentService {
  private mock = new MockIncidentService();

  /** Uses the real inventory; if the static asset can't be loaded, degrades to the mock data. */
  private async withMock<T>(real: () => Promise<T>, mock: () => Promise<T>): Promise<T> {
    try {
      return await real();
    } catch {
      return mock();
    }
  }

  getIncidentsByRegion(regionId: string, signal?: AbortSignal): Promise<IncidentRecord[]> {
    return this.withMock(
      async () => {
        const all = await loadStaticIncidents();
        const id = regionId.toLowerCase();
        return all
          .filter((i) => i.record.regionId === regionId || `state-${i.stateSlug}` === id)
          .map((i) => i.record);
      },
      () => this.mock.getIncidentsByRegion(regionId, signal)
    );
  }

  getIncidentsInGeometry(geometry: Polygon | MultiPolygon, signal?: AbortSignal): Promise<IncidentRecord[]> {
    return this.withMock(
      async () =>
        (await loadStaticIncidents())
          .filter((i) => isPointInsideRegion(i.record.coordinates, geometry))
          .map((i) => i.record),
      () => this.mock.getIncidentsInGeometry(geometry, signal)
    );
  }

  getAllIncidents(signal?: AbortSignal): Promise<IncidentRecord[]> {
    return this.withMock(
      async () => (await loadStaticIncidents()).map((i) => i.record),
      () => this.mock.getAllIncidents(signal)
    );
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
  private fallback: IncidentService = new StaticIncidentService();
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
