import type { MonitoringStation } from '../features/stations/station.types';
import type { WarningRecord } from '../features/warnings/warning.types';
import type { Waypoint } from '../features/waypoints/waypoint.types';

export const MOCK_STATIONS: MonitoringStation[] = [
  // Stations across regions
  {
    id: 'stn-ml-01',
    regionId: 'reg-shillong-escarpment',
    name: 'Sohra Slope Inclinometer Array',
    type: 'INCLINOMETER',
    coordinates: [91.73, 25.29],
    status: 'operational',
    elevationM: 1430,
    batteryPercent: 94,
    lastTransmission: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
    sensorsActive: ['Borehole Tilt', 'Pore Pressure', 'Rain Gauge']
  },
  {
    id: 'stn-ml-02',
    regionId: 'reg-shillong-escarpment',
    name: 'Sonapur Tunnel Seismic Geophone',
    type: 'SEISMOMETER',
    coordinates: [92.35, 25.13],
    status: 'operational',
    elevationM: 320,
    batteryPercent: 88,
    lastTransmission: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    sensorsActive: ['3-Axis Accelerometer', 'Displacement Sensor']
  },
  {
    id: 'stn-as-01',
    regionId: 'reg-barail-haflong',
    name: 'Jatinga Gorge Piezometer Station',
    type: 'PIEZOMETER',
    coordinates: [93.04, 25.13],
    status: 'operational',
    elevationM: 680,
    batteryPercent: 79,
    lastTransmission: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
    sensorsActive: ['Vibrating Wire Piezometer', 'Soil Moisture Probe']
  },
  {
    id: 'stn-sk-01',
    regionId: 'reg-teesta-rangit',
    name: 'Chungthang Valley Early Warning Radar',
    type: 'DOPPLER_RADAR',
    coordinates: [88.64, 27.61],
    status: 'operational',
    elevationM: 1790,
    batteryPercent: 96,
    lastTransmission: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    sensorsActive: ['X-Band Micro-Radar', 'Surface Velocity Radar', 'Rainfall Sensor']
  },
  {
    id: 'stn-ar-01',
    regionId: 'reg-kameng-subansiri',
    name: 'Bhalukpong Rockfall Sensor Tower',
    type: 'INCLINOMETER',
    coordinates: [92.58, 27.02],
    status: 'maintenance',
    elevationM: 215,
    batteryPercent: 42,
    lastTransmission: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    sensorsActive: ['Crackmeter Wire', 'Ambient Temperature']
  },
  {
    id: 'stn-nl-01',
    regionId: 'reg-naga-hills-nh2',
    name: 'Pagla Pahar Deep Borehole Array',
    type: 'PIEZOMETER',
    coordinates: [93.76, 25.83],
    status: 'operational',
    elevationM: 310,
    batteryPercent: 85,
    lastTransmission: new Date(Date.now() - 1000 * 60 * 16).toISOString(),
    sensorsActive: ['Differential Settlement Transducer', 'Water Table Depth']
  },
  {
    id: 'stn-mz-01',
    regionId: 'reg-mizo-hills-tuirial',
    name: 'Tuirial Dam Inflow & Slope Monitoring',
    type: 'AWS',
    coordinates: [92.85, 24.15],
    status: 'operational',
    elevationM: 125,
    batteryPercent: 91,
    lastTransmission: new Date(Date.now() - 1000 * 60 * 19).toISOString(),
    sensorsActive: ['Ultrasonic Water Level', 'Optical Disdrometer']
  },
  {
    id: 'stn-ar-02',
    regionId: 'reg-siang-dibang',
    name: 'Tuting Gorge Seismic Telemetry',
    type: 'SEISMOMETER',
    coordinates: [94.90, 28.98],
    status: 'operational',
    elevationM: 740,
    batteryPercent: 93,
    lastTransmission: new Date(Date.now() - 1000 * 60 * 9).toISOString(),
    sensorsActive: ['Broadband Seismometer', 'Infrasound Microphone']
  }
];

export const MOCK_WARNINGS: WarningRecord[] = [
  {
    id: 'wrn-ml-01',
    regionId: 'reg-shillong-escarpment',
    level: 'emergency',
    title: 'RED ALERT: High Probability of Debris Flows along NH-6 Corridor',
    issuedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 18).toISOString(),
    summary: 'Continuous antecedent rainfall exceeding 300mm over 72h coupled with active slope creep detected at Sonapur and Lubha sections. Immediate danger of mass movement.',
    confidence: 'high',
    recommendedAction: 'Suspend heavy commercial vehicular movement on NH-6. Pre-position excavators at Lumshnong and Sonapur.',
    affectedCorridor: 'NH-6 (East Jaintia Hills to Silchar Link)',
    sourceAuthority: 'Geological Survey of India (GSI) & Meghalaya SDMA'
  },
  {
    id: 'wrn-ml-02',
    regionId: 'reg-shillong-escarpment',
    level: 'warning',
    title: 'ORANGE WARNING: Rockfall Potential on Cherrapunji-Shella Escarpment',
    issuedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(),
    summary: 'Overhanging limestone fractures showing micro-strain. Avoid non-essential night journeys on Sohra ghat roads.',
    confidence: 'medium',
    recommendedAction: 'Issue travel advisory to tourists and local minivans. Monitor drone inspection points.',
    affectedCorridor: 'Sohra-Shella Rim Road',
    sourceAuthority: 'District Emergency Operations Centre (DEOC) Sohra'
  },
  {
    id: 'wrn-tr-01',
    regionId: 'reg-teesta-rangit',
    level: 'emergency',
    title: 'RED ALERT: NH-10 Riverine Toe Undercutting & Landslide Hazard',
    issuedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    summary: 'Teesta water velocity exceeding 4.8 m/s with heavy bank scouring between 28th and 29th Mile. Road foundation instability critical.',
    confidence: 'high',
    recommendedAction: 'Divert Kalimpong & Gangtok traffic via Panbu or Lava route. Deploy quick reaction engineering squads.',
    affectedCorridor: 'NH-10 (Sevoke to Teesta Bridge)',
    sourceAuthority: 'Sikkim SDMA & Kalimpong Police'
  },
  {
    id: 'wrn-br-01',
    regionId: 'reg-barail-haflong',
    level: 'warning',
    title: 'ORANGE WARNING: Barail Slope Saturation Threshold Exceeded',
    issuedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 16).toISOString(),
    summary: 'Piezometer reading shows water table within 0.8m of ground surface. Potential slumps on Jatinga cutting.',
    confidence: 'medium',
    recommendedAction: 'Caution trains on Haflong hill section to operate at restricted speed (20 km/h max).',
    affectedCorridor: 'Lumding-Badarpur Railway Hill Section',
    sourceAuthority: 'NFR Disaster Management Center'
  },
  {
    id: 'wrn-ks-01',
    regionId: 'reg-kameng-subansiri',
    level: 'advisory',
    title: 'YELLOW ADVISORY: Weather Radar Detects Intense Cloud Cell over Bhalukpong',
    issuedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
    summary: 'Localized convective cloud cluster likely to dump 60-80mm rain over next 3 hours. Watch culverts for blockages.',
    confidence: 'low',
    recommendedAction: 'Clear road culverts and maintain continuous radio relay with military checkpoints.',
    affectedCorridor: 'NH-13 (Bhalukpong to Bomdila)',
    sourceAuthority: 'IMD Regional Meteorological Centre Guwahati'
  }
];

export const MOCK_WAYPOINTS: Waypoint[] = [
  {
    id: 'wpt-01',
    regionId: 'reg-shillong-escarpment',
    name: 'Sonapur Tunnel Emergency Excavator Staging Point',
    coordinates: [92.36, 25.13],
    category: 'critical_infrastructure',
    notes: 'Heavy earthmovers and diesel tankers stationed 24/7 during monsoon season.',
    createdAt: '2025-05-10T08:00:00Z',
    createdBy: 'BRO Task Force 44'
  },
  {
    id: 'wpt-02',
    regionId: 'reg-barail-haflong',
    name: 'Jatinga Relief & Helipad Ground',
    coordinates: [93.05, 25.14],
    category: 'evacuation_center',
    notes: 'Primary staging field for airlifting injured civilians during railway washouts.',
    createdAt: '2025-05-12T10:00:00Z',
    createdBy: 'Dima Hasao DC Office'
  },
  {
    id: 'wpt-03',
    regionId: 'reg-teesta-rangit',
    name: '29th Mile Traffic Diversion Checkpoint',
    coordinates: [88.43, 27.03],
    category: 'roadblock',
    notes: 'Manned police outpost with satellite phone for emergency rerouting to Lava.',
    createdAt: '2025-06-01T06:00:00Z',
    createdBy: 'Kalimpong Traffic Control'
  },
  {
    id: 'wpt-04',
    regionId: 'reg-naga-hills-nh2',
    name: 'Pagla Pahar Slope Drainage Sump Point',
    coordinates: [93.77, 25.84],
    category: 'culvert_choke',
    notes: 'High-volume debris chute requiring hourly clearance during torrential rain.',
    createdAt: '2025-06-15T09:30:00Z',
    createdBy: 'NHIDCL Maintenance Crew'
  }
];
