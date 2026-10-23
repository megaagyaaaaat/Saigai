import { booleanPointInPolygon } from '@turf/boolean-point-in-polygon';
import { area } from '@turf/area';
import { point, polygon as turfPolygon } from '@turf/helpers';
import type { Polygon, MultiPolygon, Position } from 'geojson';

/**
 * Validates whether coordinates form a valid GeoJSON polygon ring.
 * Requires at least 4 coordinates (3 unique points + closing point).
 */
export function isValidPolygonRing(coords: Position[]): boolean {
  if (!Array.isArray(coords) || coords.length < 4) {
    return false;
  }
  // Check if first and last coordinates match
  const first = coords[0];
  const last = coords[coords.length - 1];
  const isClosed = Math.abs(first[0] - last[0]) < 1e-7 && Math.abs(first[1] - last[1]) < 1e-7;
  if (!isClosed) return false;

  // Validate coordinates are within geographic bounds
  for (const [lng, lat] of coords) {
    if (typeof lng !== 'number' || typeof lat !== 'number') return false;
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return false;
  }

  return true;
}

/**
 * Calculates approximate area of a Polygon or MultiPolygon in square kilometers.
 */
export function calculateAreaKm2(geometry: Polygon | MultiPolygon): number {
  try {
    if (geometry.type === 'Polygon') {
      const poly = turfPolygon(geometry.coordinates);
      const areaM2 = area(poly);
      return Math.round((areaM2 / 1_000_000) * 10) / 10;
    } else if (geometry.type === 'MultiPolygon') {
      let totalM2 = 0;
      for (const polyCoords of geometry.coordinates) {
        const poly = turfPolygon(polyCoords);
        totalM2 += area(poly);
      }
      return Math.round((totalM2 / 1_000_000) * 10) / 10;
    }
  } catch (err) {
    console.warn('Area calculation fallback triggered:', err);
  }
  return 0;
}

/**
 * Computes bounding box [minLng, minLat, maxLng, maxLat] from a geometry.
 */
export function computeBounds(geometry: Polygon | MultiPolygon): [number, number, number, number] {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  const traverse = (coords: any) => {
    if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      const [lng, lat] = coords;
      if (lng < minLng) minLng = lng;
      if (lat < minLat) minLat = lat;
      if (lng > maxLng) maxLng = lng;
      if (lat > maxLat) maxLat = lat;
    } else if (Array.isArray(coords)) {
      for (const item of coords) {
        traverse(item);
      }
    }
  };

  traverse(geometry.coordinates);

  if (minLng === Infinity) {
    // Default Northeast India bounding box
    return [88.0, 21.5, 97.5, 29.5];
  }

  return [minLng, minLat, maxLng, maxLat];
}

/**
 * Computes the center [lng, lat] from a bounding box.
 */
export function getBoundsCenter(bounds: [number, number, number, number]): [number, number] {
  const [minLng, minLat, maxLng, maxLat] = bounds;
  return [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
}

/**
 * Checks whether a given [lng, lat] coordinate lies inside the specified Polygon or MultiPolygon.
 */
export function isPointInsideRegion(
  coordinates: [number, number],
  geometry: Polygon | MultiPolygon
): boolean {
  try {
    const pt = point(coordinates);
    if (geometry.type === 'Polygon') {
      return booleanPointInPolygon(pt, turfPolygon(geometry.coordinates));
    } else if (geometry.type === 'MultiPolygon') {
      for (const polyCoords of geometry.coordinates) {
        if (booleanPointInPolygon(pt, turfPolygon(polyCoords))) {
          return true;
        }
      }
    }
  } catch (err) {
    console.warn('Point-in-polygon check failed:', err);
  }
  return false;
}

/**
 * Formats longitude and latitude with compass cardinals.
 */
export function formatCoordinates(lng: number, lat: number): string {
  const latCard = lat >= 0 ? 'N' : 'S';
  const lngCard = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latCard}, ${Math.abs(lng).toFixed(4)}° ${lngCard}`;
}
