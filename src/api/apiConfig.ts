export interface AppConfig {
  apiBaseUrl: string;
  dataMode: 'demo' | 'live';
  requestTimeoutMs: number;
  satelliteTileUrl: string;
  satelliteAttribution: string;
  darkCanvasTileUrl: string;
  darkCanvasAttribution: string;
  telemetryRefreshIntervalMs: number;
}

export const APP_CONFIG: AppConfig = {
  // Configurable base URL: points to local backend via Vite proxy or direct URL
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  
  // Default to 'live' backend mode with graceful fallback to mock data if offline
  dataMode: (import.meta.env.VITE_DATA_MODE as 'demo' | 'live') || 'live',
  
  requestTimeoutMs: 10000,

  // High-resolution Satellite Imagery provider (Esri World Imagery) with verified open GIS attribution
  satelliteTileUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  satelliteAttribution: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, GIS User Community',

  // Dark Canvas base layer alternative for high contrast vector analysis
  darkCanvasTileUrl: 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
  darkCanvasAttribution: '© OpenStreetMap contributors, © CARTO',

  telemetryRefreshIntervalMs: 60000,
};
