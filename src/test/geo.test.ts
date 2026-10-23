import { describe, it, expect } from 'vitest';
import { 
  isValidPolygonRing, 
  calculateAreaKm2, 
  computeBounds, 
  isPointInsideRegion, 
  formatCoordinates 
} from '../lib/geo';
import { MOCK_REGIONS } from '../data/mockRegions';

describe('Geospatial Geometry Engine (geo.ts)', () => {
  it('validates proper closed polygon rings', () => {
    const validRing = [
      [91.0, 25.0],
      [92.0, 25.0],
      [92.0, 26.0],
      [91.0, 25.0],
    ];
    expect(isValidPolygonRing(validRing)).toBe(true);
  });

  it('rejects unclosed or degenerate polygon rings', () => {
    const unclosedRing = [
      [91.0, 25.0],
      [92.0, 25.0],
      [92.0, 26.0],
    ];
    expect(isValidPolygonRing(unclosedRing)).toBe(false);

    const outOfBoundsRing = [
      [195.0, 25.0],
      [92.0, 25.0],
      [92.0, 26.0],
      [195.0, 25.0],
    ];
    expect(isValidPolygonRing(outOfBoundsRing)).toBe(false);
  });

  it('accurately calculates polygon surface area in km²', () => {
    const shillong = MOCK_REGIONS[0];
    const area = calculateAreaKm2(shillong.geometry);
    expect(area).toBeGreaterThan(1000);
    expect(area).toBeLessThan(50000);
  });

  it('computes correct geographic bounding boxes [minLng, minLat, maxLng, maxLat]', () => {
    const shillong = MOCK_REGIONS[0];
    const bounds = computeBounds(shillong.geometry);
    expect(bounds[0]).toBeLessThan(bounds[2]); // minLng < maxLng
    expect(bounds[1]).toBeLessThan(bounds[3]); // minLat < maxLat
    expect(bounds[0]).toBeCloseTo(91.05, 1);
    expect(bounds[2]).toBeCloseTo(92.55, 1);
  });

  it('accurately identifies points inside vs outside regional polygons', () => {
    const shillong = MOCK_REGIONS.find((r) => r.id === 'reg-shillong-escarpment')!;

    // Cherrapunji coordinates (inside Shillong Plateau region)
    const cherraCoord: [number, number] = [91.73, 25.27];
    expect(isPointInsideRegion(cherraCoord, shillong.geometry)).toBe(true);

    // Delhi coordinates (far outside Northeast India)
    const delhiCoord: [number, number] = [77.10, 28.70];
    expect(isPointInsideRegion(delhiCoord, shillong.geometry)).toBe(false);
  });

  it('formats coordinates with cardinal compass symbols', () => {
    const formatted = formatCoordinates(91.8933, 25.5788);
    expect(formatted).toBe('25.5788° N, 91.8933° E');
  });
});
