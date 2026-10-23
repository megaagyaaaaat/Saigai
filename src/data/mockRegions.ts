import type { RegionEntity, RegionGeoJSONFeatureCollection } from '../features/regions/region.types';
import { computeBounds } from '../lib/geo';

export const MOCK_REGIONS: RegionEntity[] = [
  {
    id: 'reg-shillong-escarpment',
    name: 'Shillong Plateau & Southern Escarpment',
    category: 'transboundary_zone',
    riskLevel: 'critical',
    statesCrossed: ['Meghalaya', 'Assam'],
    areaKm2: 7420,
    dominantGeology: 'Archaean Gneissic Complex & Cretaceous-Tertiary Sandstone',
    activeWarningCount: 3,
    historicalIncidentCount: 84,
    monitoringStationCount: 6,
    avgRainfall72h: 312.4,
    soilSaturationPercent: 88,
    isUserDrawn: false,
    description: 'Steep southern escarpment bordering Bangladesh plains and Guwahati corridor. Subject to extreme orographic monsoonal precipitation (>10,000mm/yr) and severe rockfalls along NH-6 and NH-40 lifelines.',
    dataSource: 'Geological Survey of India (GSI) & IMD AWS Telemetry (Simulated)',
    lastUpdated: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [91.15, 25.10],
        [91.90, 25.08],
        [92.45, 25.18],
        [92.55, 25.55],
        [92.20, 25.75],
        [91.60, 25.80],
        [91.20, 25.65],
        [91.05, 25.35],
        [91.15, 25.10]
      ]]
    },
    bounds: [91.05, 25.08, 92.55, 25.80]
  },
  {
    id: 'reg-barail-haflong',
    name: 'Barail Mountain Range & Haflong Corridor',
    category: 'mountain_range',
    riskLevel: 'high',
    statesCrossed: ['Assam', 'Nagaland', 'Manipur'],
    areaKm2: 6180,
    dominantGeology: 'Disang Group splintery shales & Barail arenaceous formations',
    activeWarningCount: 2,
    historicalIncidentCount: 62,
    monitoringStationCount: 5,
    avgRainfall72h: 224.6,
    soilSaturationPercent: 81,
    isUserDrawn: false,
    description: 'The geologically fragile Barail Range spans Dima Hasao, Peren, and Tamenglong. Characterized by high relief, active slope creep, and severe railway washouts along the Lumding-Badarpur hill track.',
    dataSource: 'NERIST Geohazards Observatory & NESAC Satellite Radar (Simulated)',
    lastUpdated: new Date(Date.now() - 1000 * 60 * 32).toISOString(),
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [92.60, 25.00],
        [93.15, 24.85],
        [93.55, 25.10],
        [93.65, 25.45],
        [93.30, 25.60],
        [92.80, 25.50],
        [92.60, 25.00]
      ]]
    },
    bounds: [92.60, 24.85, 93.65, 25.60]
  },
  {
    id: 'reg-teesta-rangit',
    name: 'Teesta-Rangit Himalayan Basin',
    category: 'watershed_basin',
    riskLevel: 'critical',
    statesCrossed: ['Sikkim', 'West Bengal (Sub-Himalayan)'],
    areaKm2: 4890,
    dominantGeology: 'Daling Group phyllites, schists & High Himalayan Gneiss',
    activeWarningCount: 4,
    historicalIncidentCount: 112,
    monitoringStationCount: 8,
    avgRainfall72h: 285.0,
    soilSaturationPercent: 92,
    isUserDrawn: false,
    description: 'Vulnerable gorge corridor spanning NH-10 from Sevoke to Chungthang. Highly prone to glacial lake outburst flood (GLOF) compounding, debris flows, and sudden road fractures.',
    dataSource: 'Sikkim State Disaster Management Authority & CWC Telemetry (Simulated)',
    lastUpdated: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [88.15, 27.05],
        [88.55, 26.90],
        [88.85, 27.20],
        [88.92, 27.75],
        [88.65, 28.05],
        [88.25, 27.80],
        [88.10, 27.40],
        [88.15, 27.05]
      ]]
    },
    bounds: [88.10, 26.90, 88.92, 28.05]
  },
  {
    id: 'reg-kameng-subansiri',
    name: 'Kameng & Subansiri Foothills Corridor',
    category: 'landslide_corridor',
    riskLevel: 'high',
    statesCrossed: ['Arunachal Pradesh', 'Assam'],
    areaKm2: 8350,
    dominantGeology: 'Main Boundary Thrust (MBT) zone & Siwalik sandstone-conglomerate',
    activeWarningCount: 2,
    historicalIncidentCount: 53,
    monitoringStationCount: 5,
    avgRainfall72h: 198.3,
    soilSaturationPercent: 74,
    isUserDrawn: false,
    description: 'Strategic military and civilian lifeline corridor along NH-13 spanning Bhalukpong, Tenga valley, and Subansiri gorges. Severe slope destabilization from intense monsoon downpours.',
    dataSource: 'Border Roads Organisation (BRO Project Vartak) & IMD (Simulated)',
    lastUpdated: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [92.15, 27.00],
        [92.70, 26.85],
        [93.60, 27.15],
        [93.85, 27.60],
        [93.50, 27.95],
        [92.65, 27.85],
        [92.10, 27.45],
        [92.15, 27.00]
      ]]
    },
    bounds: [92.10, 26.85, 93.85, 27.95]
  },
  {
    id: 'reg-naga-hills-nh2',
    name: 'Naga Hills & Kohima-Dimapur Pass',
    category: 'landslide_corridor',
    riskLevel: 'elevated',
    statesCrossed: ['Nagaland', 'Manipur'],
    areaKm2: 4320,
    dominantGeology: 'Tertiary fold belt shales & sheared mudstones',
    activeWarningCount: 1,
    historicalIncidentCount: 47,
    monitoringStationCount: 4,
    avgRainfall72h: 145.2,
    soilSaturationPercent: 68,
    isUserDrawn: false,
    description: 'Active sinking zones along NH-2 including Pagla Pahar, Zubza, and Phesama. Clay-rich weathered matrix undergoes liquefaction under prolonged precipitation.',
    dataSource: 'Nagaland NSDMA & Regional Remote Sensing Centre (Simulated)',
    lastUpdated: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [93.65, 25.55],
        [94.15, 25.40],
        [94.55, 25.70],
        [94.45, 26.15],
        [93.95, 26.25],
        [93.60, 25.90],
        [93.65, 25.55]
      ]]
    },
    bounds: [93.60, 25.40, 94.55, 26.25]
  },
  {
    id: 'reg-mizo-hills-tuirial',
    name: 'Mizo Ridge & Tuirial River Basin',
    category: 'watershed_basin',
    riskLevel: 'elevated',
    statesCrossed: ['Mizoram', 'Assam'],
    areaKm2: 5610,
    dominantGeology: 'Surma Group alternating siltstone, shale and sandstone bands',
    activeWarningCount: 1,
    historicalIncidentCount: 39,
    monitoringStationCount: 4,
    avgRainfall72h: 162.7,
    soilSaturationPercent: 65,
    isUserDrawn: false,
    description: 'Parallel N-S trending ridges with steep valley profiles. NH-306 connects Aizawl to Assam; vulnerable to slope cutting failures and torrential monsoon slips.',
    dataSource: 'Mizoram Disaster Management & MZU Dept of Geology (Simulated)',
    lastUpdated: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [92.50, 23.60],
        [92.95, 23.50],
        [93.25, 23.90],
        [93.10, 24.50],
        [92.65, 24.65],
        [92.40, 24.15],
        [92.50, 23.60]
      ]]
    },
    bounds: [92.40, 23.50, 93.25, 24.65]
  },
  {
    id: 'reg-siang-dibang',
    name: 'Siang Canyon & Dibang Escarpment',
    category: 'transboundary_zone',
    riskLevel: 'high',
    statesCrossed: ['Arunachal Pradesh', 'Assam'],
    areaKm2: 9780,
    dominantGeology: 'Eastern Himalayan Syntaxis gneisses & Abor Volcanics',
    activeWarningCount: 2,
    historicalIncidentCount: 71,
    monitoringStationCount: 6,
    avgRainfall72h: 245.5,
    soilSaturationPercent: 78,
    isUserDrawn: false,
    description: 'Massive vertical gorges dropping from high alpine elevations to the Brahmaputra floodplain. Highly active seismic setting with large-scale rock avalanches and river damming risks.',
    dataSource: 'Wadia Institute of Himalayan Geology & CWC (Simulated)',
    lastUpdated: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [94.60, 28.00],
        [95.40, 27.85],
        [95.95, 28.25],
        [95.80, 29.15],
        [94.95, 29.25],
        [94.40, 28.65],
        [94.60, 28.00]
      ]]
    },
    bounds: [94.40, 27.85, 95.95, 29.25]
  },
  {
    id: 'reg-surma-barak-jaintia',
    name: 'Surma-Barak Piedmont & Jaintia Slopes',
    category: 'mountain_range',
    riskLevel: 'low',
    statesCrossed: ['Meghalaya', 'Assam'],
    areaKm2: 3840,
    dominantGeology: 'Jaintia Group nummulitic limestones & tertiary shales',
    activeWarningCount: 0,
    historicalIncidentCount: 28,
    monitoringStationCount: 3,
    avgRainfall72h: 110.2,
    soilSaturationPercent: 52,
    isUserDrawn: false,
    description: 'Transition zone between eastern Meghalaya hills and Cachar plain. Karst topography with localized subsidence and moderate slope washouts during heavy pre-monsoon squalls.',
    dataSource: 'North Eastern Council (NEC) Geo-Portal (Simulated)',
    lastUpdated: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [92.20, 24.95],
        [92.75, 24.80],
        [93.05, 25.10],
        [92.90, 25.40],
        [92.40, 25.45],
        [92.15, 25.20],
        [92.20, 24.95]
      ]]
    },
    bounds: [92.15, 24.80, 93.05, 25.45]
  }
];

// Ensure bounds are computed correctly
for (const region of MOCK_REGIONS) {
  region.bounds = computeBounds(region.geometry);
}

export const MOCK_REGIONS_GEOJSON: RegionGeoJSONFeatureCollection = {
  type: 'FeatureCollection',
  features: MOCK_REGIONS.map((region) => ({
    type: 'Feature',
    id: region.id,
    properties: {
      id: region.id,
      name: region.name,
      category: region.category,
      riskLevel: region.riskLevel,
      statesCrossed: region.statesCrossed,
      areaKm2: region.areaKm2,
      dominantGeology: region.dominantGeology,
      activeWarningCount: region.activeWarningCount,
      historicalIncidentCount: region.historicalIncidentCount,
      monitoringStationCount: region.monitoringStationCount,
      avgRainfall72h: region.avgRainfall72h,
      soilSaturationPercent: region.soilSaturationPercent,
      isUserDrawn: region.isUserDrawn,
      description: region.description,
      dataSource: region.dataSource,
      lastUpdated: region.lastUpdated,
    },
    geometry: region.geometry,
    bbox: region.bounds,
  }))
};
