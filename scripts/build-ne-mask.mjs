// Precomputes the soft "everything outside the 8 Northeast states fades to black" mask,
// so the browser loads a ready-made GeoJSON instead of buffering/unioning polygons at startup.
// Usage: node scripts/build-ne-mask.mjs   (re-run if public/data/ne_states_reference.geojson changes)
import fs from 'node:fs';
import buffer from '@turf/buffer';
import union from '@turf/union';
import { featureCollection } from '@turf/helpers';

// Each ring covers everything farther than `km` from a state; stacked, they give a feathered edge.
const MASK_RINGS = [
  { km: 8, opacity: 0.18 },
  { km: 24, opacity: 0.18 },
  { km: 48, opacity: 0.2 },
  { km: 80, opacity: 0.25 },
  { km: 120, opacity: 0.45 },
];
const WORLD_RING = [[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]];
const round = (ring) => ring.map(([x, y]) => [Math.round(x * 1e4) / 1e4, Math.round(y * 1e4) / 1e4]);

const states = JSON.parse(fs.readFileSync('public/data/ne_states_reference.geojson', 'utf8'));

const features = MASK_RINGS.flatMap(({ km, opacity }) => {
  const merged = union(featureCollection(states.features.map((f) => buffer(f, km, { units: 'kilometers' }))));
  if (!merged) return [];
  const polys = merged.geometry.type === 'Polygon' ? [merged.geometry.coordinates] : merged.geometry.coordinates;
  return [{
    type: 'Feature',
    properties: { opacity },
    geometry: { type: 'Polygon', coordinates: [WORLD_RING, ...polys.map((p) => round(p[0]))] },
  }];
});

fs.writeFileSync('public/data/ne_outside_mask.geojson', JSON.stringify(featureCollection(features)));
console.log(`wrote ${features.length} rings`);
