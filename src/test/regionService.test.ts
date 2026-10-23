import { describe, it, expect } from 'vitest';
import { MockRegionService } from '../features/regions/region.service';
import { MockIncidentService } from '../features/incidents/incident.service';
import { MOCK_REGIONS } from '../data/mockRegions';

describe('Data Access Layer & Region Service', () => {
  const regionService = new MockRegionService();
  const incidentService = new MockIncidentService();

  it('retrieves full list of predefined Northeast India regions', async () => {
    const regions = await regionService.getRegions();
    expect(regions.length).toBeGreaterThanOrEqual(8);
    // Verify each region has cross-state information
    regions.forEach((r) => {
      expect(r.statesCrossed).toBeDefined();
      expect(Array.isArray(r.statesCrossed)).toBe(true);
      expect(r.geometry).toBeDefined();
    });
  });

  it('searches regions by name and cross-state keywords', async () => {
    const results = await regionService.searchRegions('Meghalaya');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.id === 'reg-shillong-escarpment')).toBe(true);
  });

  it('cancels requests gracefully with AbortController without unhandled rejection', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(regionService.getRegionById('reg-shillong-escarpment', controller.signal)).rejects.toThrow();
  });

  it('spatial query filters incidents within a user geometry', async () => {
    const shillong = MOCK_REGIONS[0];
    const spatialIncidents = await incidentService.getIncidentsInGeometry(shillong.geometry);
    expect(spatialIncidents.length).toBeGreaterThan(0);
    // All returned incidents must be geographically inside or matching region
    spatialIncidents.forEach((inc) => {
      expect(inc.regionId).toBe(shillong.id);
    });
  });
});
