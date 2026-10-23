import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Map as MapLibreMap, GeoJSONSource, NavigationControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { RegionEntity } from '../../features/regions/region.types';
import type { IncidentRecord } from '../../features/incidents/incident.types';
import type { MonitoringStation } from '../../features/stations/station.types';
import type { Waypoint } from '../../features/waypoints/waypoint.types';
import type { MapLayerVisibility } from './MapControls';
import { RegionDrawingTools } from './RegionDrawingTools';
import { APP_CONFIG } from '../../api/apiConfig';
import { MOCK_REGIONS_GEOJSON } from '../../data/mockRegions';
import { computeBounds, calculateAreaKm2 } from '../../lib/geo';
import type { Position } from 'geojson';

const NE_CENTER: [number, number] = [92.8, 25.8];
const NE_DEFAULT_ZOOM = 6.4;

interface RegionalMapProps {
  selectedRegion: RegionEntity | null;
  hoveredRegion: RegionEntity | null;
  onSelectRegion: (region: RegionEntity | null) => void;
  onHoverRegionEnter: (region: RegionEntity) => void;
  onHoverRegionLeave: () => void;
  isDrawingMode: boolean;
  onCommitDrawnRegion: (region: RegionEntity) => void;
  layers: MapLayerVisibility;
  incidents: IncidentRecord[];
  stations: MonitoringStation[];
  waypoints?: Waypoint[];
  onSelectIncidentMarker?: (incident: IncidentRecord) => void;
}

export interface RegionalMapHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  resetNorth: () => void;
  togglePitch: () => void;
  getMap: () => MapLibreMap | null;
}

export const RegionalMap = forwardRef<RegionalMapHandle, RegionalMapProps>(({
  selectedRegion,
  hoveredRegion,
  onSelectRegion,
  onHoverRegionEnter,
  onHoverRegionLeave,
  isDrawingMode,
  onCommitDrawnRegion,
  layers,
  incidents,
  stations,
  waypoints,
  onSelectIncidentMarker,
}, ref) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      mapRef.current?.zoomIn({ duration: 300 });
    },
    zoomOut: () => {
      mapRef.current?.zoomOut({ duration: 300 });
    },
    resetNorth: () => {
      mapRef.current?.resetNorthPitch({ duration: 500 });
    },
    togglePitch: () => {
      if (!mapRef.current) return;
      const currentPitch = mapRef.current.getPitch();
      mapRef.current.easeTo({ pitch: currentPitch > 10 ? 0 : 45, duration: 500 });
    },
    getMap: () => mapRef.current,
  }));

  // Drawing state
  const [drawingVertices, setDrawingVertices] = useState<Position[]>([]);
  const hoveredFeatureIdRef = useRef<string | null>(null);

  // Initialize MapLibre GL map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Basemap style with Esri World Imagery Satellite tiles
    const map = new MapLibreMap({
      container: mapContainerRef.current,
      style: {
        version: 8,
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sources: {
          'satellite-tiles': {
            type: 'raster',
            tiles: [APP_CONFIG.satelliteTileUrl],
            tileSize: 256,
            attribution: APP_CONFIG.satelliteAttribution,
            maxzoom: 19,
          },
          'dark-canvas-tiles': {
            type: 'raster',
            tiles: [APP_CONFIG.darkCanvasTileUrl],
            tileSize: 256,
            attribution: APP_CONFIG.darkCanvasAttribution,
            maxzoom: 18,
          },
        },
        layers: [
          {
            id: 'dark-canvas-layer',
            type: 'raster',
            source: 'dark-canvas-tiles',
            layout: {
              visibility: layers.showSatellite ? 'none' : 'visible',
            },
          },
          {
            id: 'satellite-layer',
            type: 'raster',
            source: 'satellite-tiles',
            layout: {
              visibility: layers.showSatellite ? 'visible' : 'none',
            },
            paint: {
              'raster-brightness-max': 0.88,
              'raster-contrast': 0.1,
              'raster-saturation': -0.15, // Cinematic toned-down satellite look
            },
          },
        ],
      },
      center: NE_CENTER,
      zoom: NE_DEFAULT_ZOOM,
      minZoom: 5.0,
      maxZoom: 16.0,
      pitch: 0,
      bearing: 0,
      attributionControl: {
        compact: true,
      },
    });

    const navControl = new NavigationControl({ showCompass: true, showZoom: true, visualizePitch: true });
    map.addControl(navControl, 'bottom-left');

    map.on('load', () => {
      // 1. Add Contextual State Boundaries Reference Source & Layer
      map.addSource('state-boundaries-src', {
        type: 'geojson',
        data: '/data/ne_states_reference.geojson',
      });

      map.addLayer({
        id: 'state-boundaries-line',
        type: 'line',
        source: 'state-boundaries-src',
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': '#96A8BA',
          'line-width': 1.2,
          'line-dasharray': [3, 2],
          'line-opacity': 0.45,
        },
      });

      // 2. Add Predefined Regions Source & Layers
      map.addSource('regions-src', {
        type: 'geojson',
        data: MOCK_REGIONS_GEOJSON as any,
        promoteId: 'id',
      });

      // Regional Fill Layer
      map.addLayer({
        id: 'regions-fill',
        type: 'fill',
        source: 'regions-src',
        paint: {
          'fill-color': [
            'match',
            ['get', 'riskLevel'],
            'critical', '#EF4444',
            'high', '#F97316',
            'elevated', '#F59E0B',
            '#10B981',
          ],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            0.45,
            ['boolean', ['feature-state', 'hover'], false],
            0.32,
            0.18,
          ],
        },
      });

      // Regional Stroke / Outline Layer
      map.addLayer({
        id: 'regions-stroke',
        type: 'line',
        source: 'regions-src',
        paint: {
          'line-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            '#64E2E8',
            ['boolean', ['feature-state', 'hover'], false],
            '#64A8FF',
            [
              'match',
              ['get', 'riskLevel'],
              'critical', '#EF4444',
              'high', '#F97316',
              'elevated', '#F59E0B',
              '#10B981',
            ],
          ],
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            3.2,
            ['boolean', ['feature-state', 'hover'], false],
            2.4,
            1.5,
          ],
          'line-opacity': 0.9,
        },
      });

      // 3. User Drawn Region Source & Layer
      map.addSource('user-drawn-src', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      map.addLayer({
        id: 'user-drawn-fill',
        type: 'fill',
        source: 'user-drawn-src',
        paint: {
          'fill-color': '#64E2E8',
          'fill-opacity': 0.35,
        },
      });

      map.addLayer({
        id: 'user-drawn-line',
        type: 'line',
        source: 'user-drawn-src',
        paint: {
          'line-color': '#64E2E8',
          'line-width': 2.5,
          'line-dasharray': [2, 1],
        },
      });

      // 4. Drawing in progress preview line
      map.addSource('drawing-progress-src', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      map.addLayer({
        id: 'drawing-progress-line',
        type: 'line',
        source: 'drawing-progress-src',
        paint: {
          'line-color': '#64E2E8',
          'line-width': 2,
          'line-dasharray': [2, 1],
        },
      });

      map.addLayer({
        id: 'drawing-progress-points',
        type: 'circle',
        source: 'drawing-progress-src',
        paint: {
          'circle-radius': 5,
          'circle-color': '#64E2E8',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#080D14',
        },
      });

      // 5. Landslide Incident Markers Source & Layer
      map.addSource('incidents-src', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      map.addLayer({
        id: 'incidents-points',
        type: 'circle',
        source: 'incidents-src',
        paint: {
          'circle-radius': [
            'match',
            ['get', 'severity'],
            'catastrophic', 9,
            'severe', 7,
            'moderate', 5.5,
            4,
          ],
          'circle-color': [
            'match',
            ['get', 'severity'],
            'catastrophic', '#EF4444',
            'severe', '#F97316',
            'moderate', '#F59E0B',
            '#64A8FF',
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#FFFFFF',
          'circle-opacity': 0.9,
        },
      });

      // 6. Monitoring & AWS Stations Source & Layer
      map.addSource('stations-src', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      map.addLayer({
        id: 'stations-points',
        type: 'circle',
        source: 'stations-src',
        paint: {
          'circle-radius': 6,
          'circle-color': '#64E2E8',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#0E1621',
          'circle-opacity': 0.95,
        },
      });

      // 7. Field Waypoints Source & Layer
      map.addSource('waypoints-src', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      map.addLayer({
        id: 'waypoints-points',
        type: 'circle',
        source: 'waypoints-src',
        paint: {
          'circle-radius': 5,
          'circle-color': '#64A8FF',
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#FFFFFF',
          'circle-opacity': 0.9,
        },
      });

      mapRef.current = map;
      setMapLoaded(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync Satellite vs Dark Canvas basemap visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (map.getLayer('satellite-layer')) {
      map.setLayoutProperty('satellite-layer', 'visibility', layers.showSatellite ? 'visible' : 'none');
    }
    if (map.getLayer('dark-canvas-layer')) {
      map.setLayoutProperty('dark-canvas-layer', 'visibility', layers.showSatellite ? 'none' : 'visible');
    }
    if (map.getLayer('state-boundaries-line')) {
      map.setLayoutProperty('state-boundaries-line', 'visibility', layers.showStateBoundaries ? 'visible' : 'none');
    }
    if (map.getLayer('regions-fill')) {
      map.setLayoutProperty('regions-fill', 'visibility', layers.showRegions ? 'visible' : 'none');
      map.setLayoutProperty('regions-stroke', 'visibility', layers.showRegions ? 'visible' : 'none');
    }
    if (map.getLayer('incidents-points')) {
      map.setLayoutProperty('incidents-points', 'visibility', layers.showIncidents ? 'visible' : 'none');
    }
    if (map.getLayer('stations-points')) {
      map.setLayoutProperty('stations-points', 'visibility', layers.showStations ? 'visible' : 'none');
    }
  }, [layers, mapLoaded]);

  // Update Incidents markers data
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const source = map.getSource('incidents-src') as GeoJSONSource;
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: incidents.map((inc) => ({
          type: 'Feature',
          id: inc.id,
          properties: { ...inc },
          geometry: {
            type: 'Point',
            coordinates: inc.coordinates,
          },
        })),
      });
    }
  }, [incidents, mapLoaded]);

  // Update Stations markers data
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const source = map.getSource('stations-src') as GeoJSONSource;
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: stations.map((stn) => ({
          type: 'Feature',
          id: stn.id,
          properties: { ...stn },
          geometry: {
            type: 'Point',
            coordinates: stn.coordinates,
          },
        })),
      });
    }
  }, [stations, mapLoaded]);

  // Update Waypoints markers data
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !waypoints) return;

    const source = map.getSource('waypoints-src') as GeoJSONSource;
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: waypoints.map((wpt) => ({
          type: 'Feature',
          id: wpt.id,
          properties: { ...wpt },
          geometry: {
            type: 'Point',
            coordinates: wpt.coordinates,
          },
        })),
      });
    }
  }, [waypoints, mapLoaded]);

  // Handle Feature-State for Hover and Selection
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Reset old hover
    if (hoveredFeatureIdRef.current) {
      map.setFeatureState(
        { source: 'regions-src', id: hoveredFeatureIdRef.current },
        { hover: false }
      );
    }

    if (hoveredRegion && !hoveredRegion.isUserDrawn) {
      hoveredFeatureIdRef.current = hoveredRegion.id;
      map.setFeatureState(
        { source: 'regions-src', id: hoveredRegion.id },
        { hover: true }
      );
    } else {
      hoveredFeatureIdRef.current = null;
    }
  }, [hoveredRegion, mapLoaded]);

  // Sync selected region highlight and camera framing
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Clear feature selection states across all features
    MOCK_REGIONS_GEOJSON.features.forEach((feat) => {
      map.setFeatureState(
        { source: 'regions-src', id: feat.id },
        { selected: selectedRegion?.id === feat.id }
      );
    });

    // If user drawn region is selected, update user-drawn source
    const userDrawnSource = map.getSource('user-drawn-src') as GeoJSONSource;
    if (userDrawnSource) {
      if (selectedRegion?.isUserDrawn) {
        userDrawnSource.setData({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              id: selectedRegion.id,
              properties: { ...selectedRegion },
              geometry: selectedRegion.geometry,
            },
          ],
        });
      } else {
        userDrawnSource.setData({
          type: 'FeatureCollection',
          features: [],
        });
      }
    }

    // Camera fly-to when selected
    if (selectedRegion) {
      const [minLng, minLat, maxLng, maxLat] = selectedRegion.bounds;
      map.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        {
          padding: { top: 80, bottom: 80, left: 100, right: 460 }, // Leave room for split details panel
          duration: 900,
          maxZoom: 11.5,
        }
      );
    }
  }, [selectedRegion, mapLoaded]);

  // Map interaction events: Hover, Click, Drawing
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Cursor pointer management
    const onMouseEnter = () => {
      if (!isDrawingMode) map.getCanvas().style.cursor = 'pointer';
    };
    const onMouseLeave = () => {
      if (!isDrawingMode) map.getCanvas().style.cursor = '';
      onHoverRegionLeave();
    };

    const onMouseMove = (e: any) => {
      if (isDrawingMode) return;

      const features = map.queryRenderedFeatures(e.point, {
        layers: ['regions-fill'],
      });

      if (features.length > 0) {
        const feature = features[0];
        const properties = feature.properties as any;
        const regionEntity: RegionEntity = {
          id: properties.id,
          name: properties.name,
          category: properties.category,
          riskLevel: properties.riskLevel,
          statesCrossed: typeof properties.statesCrossed === 'string' 
            ? JSON.parse(properties.statesCrossed) 
            : properties.statesCrossed || [],
          areaKm2: Number(properties.areaKm2) || 0,
          dominantGeology: properties.dominantGeology || '',
          activeWarningCount: Number(properties.activeWarningCount) || 0,
          historicalIncidentCount: Number(properties.historicalIncidentCount) || 0,
          monitoringStationCount: Number(properties.monitoringStationCount) || 0,
          avgRainfall72h: Number(properties.avgRainfall72h) || 0,
          soilSaturationPercent: Number(properties.soilSaturationPercent) || 0,
          isUserDrawn: false,
          description: properties.description || '',
          dataSource: properties.dataSource || '',
          lastUpdated: properties.lastUpdated || '',
          geometry: feature.geometry as any,
          bounds: computeBounds(feature.geometry as any),
        };
        onHoverRegionEnter(regionEntity);
      } else {
        onHoverRegionLeave();
      }
    };

    // Click handler for regions and markers
    const onMapClick = (e: any) => {
      if (isDrawingMode) {
        // Drawing vertex placement
        const newCoord: Position = [e.lngLat.lng, e.lngLat.lat];
        setDrawingVertices((prev) => {
          const next = [...prev, newCoord];
          // Update drawing progress source
          const drawingSource = map.getSource('drawing-progress-src') as GeoJSONSource;
          if (drawingSource) {
            drawingSource.setData({
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'LineString',
                    coordinates: next,
                  },
                },
                ...next.map((pt) => ({
                  type: 'Feature' as const,
                  properties: {},
                  geometry: {
                    type: 'Point' as const,
                    coordinates: pt,
                  },
                })),
              ],
            });
          }
          return next;
        });
        return;
      }

      // Check incident markers click first
      const incidentFeatures = map.queryRenderedFeatures(e.point, {
        layers: ['incidents-points'],
      });
      if (incidentFeatures.length > 0) {
        const incProp = incidentFeatures[0].properties as any;
        const incRecord = incidents.find((i) => i.id === incProp.id);
        if (incRecord && onSelectIncidentMarker) {
          onSelectIncidentMarker(incRecord);
          return;
        }
      }

      // Check regions click
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['regions-fill'],
      });

      if (features.length > 0) {
        const feature = features[0];
        const properties = feature.properties as any;
        const regionEntity: RegionEntity = {
          id: properties.id,
          name: properties.name,
          category: properties.category,
          riskLevel: properties.riskLevel,
          statesCrossed: typeof properties.statesCrossed === 'string' 
            ? JSON.parse(properties.statesCrossed) 
            : properties.statesCrossed || [],
          areaKm2: Number(properties.areaKm2) || 0,
          dominantGeology: properties.dominantGeology || '',
          activeWarningCount: Number(properties.activeWarningCount) || 0,
          historicalIncidentCount: Number(properties.historicalIncidentCount) || 0,
          monitoringStationCount: Number(properties.monitoringStationCount) || 0,
          avgRainfall72h: Number(properties.avgRainfall72h) || 0,
          soilSaturationPercent: Number(properties.soilSaturationPercent) || 0,
          isUserDrawn: false,
          description: properties.description || '',
          dataSource: properties.dataSource || '',
          lastUpdated: properties.lastUpdated || '',
          geometry: feature.geometry as any,
          bounds: computeBounds(feature.geometry as any),
        };
        onSelectRegion(regionEntity);
      }
    };

    map.on('mouseenter', 'regions-fill', onMouseEnter);
    map.on('mouseleave', 'regions-fill', onMouseLeave);
    map.on('mousemove', onMouseMove);
    map.on('click', onMapClick);

    return () => {
      map.off('mouseenter', 'regions-fill', onMouseEnter);
      map.off('mouseleave', 'regions-fill', onMouseLeave);
      map.off('mousemove', onMouseMove);
      map.off('click', onMapClick);
    };
  }, [isDrawingMode, mapLoaded, onHoverRegionEnter, onHoverRegionLeave, onSelectRegion, incidents, onSelectIncidentMarker]);

  // Handle cursor and clear drawing on mode switch
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (isDrawingMode) {
      map.getCanvas().style.cursor = 'crosshair';
      setDrawingVertices([]);
    } else {
      map.getCanvas().style.cursor = '';
      // Clear drawing progress source
      const drawingSource = map.getSource('drawing-progress-src') as GeoJSONSource;
      if (drawingSource) {
        drawingSource.setData({
          type: 'FeatureCollection',
          features: [],
        });
      }
      setDrawingVertices([]);
    }
  }, [isDrawingMode]);

  // Complete drawing polygon
  const handleFinishDrawing = useCallback(() => {
    if (drawingVertices.length < 3) return;

    // Close ring
    const closedCoords = [...drawingVertices, drawingVertices[0]];
    const geometry = {
      type: 'Polygon' as const,
      coordinates: [closedCoords],
    };

    const areaKm2 = calculateAreaKm2(geometry);
    const bounds = computeBounds(geometry);
    const id = `user-region-${Date.now()}`;

    const drawnEntity: RegionEntity = {
      id,
      name: `User-Defined AOI (${areaKm2.toLocaleString()} km²)`,
      category: 'user_drawn',
      riskLevel: 'elevated',
      statesCrossed: ['Cross-Regional Boundary AOI'],
      areaKm2,
      dominantGeology: 'Custom User Survey Boundary',
      activeWarningCount: 0,
      historicalIncidentCount: 0,
      monitoringStationCount: 0,
      avgRainfall72h: 165.0,
      soilSaturationPercent: 72,
      isUserDrawn: true,
      description: `User-defined geographic boundary covering ~${areaKm2.toLocaleString()} km² across Northeast India. Spatial queries dynamically calculated client-side.`,
      dataSource: 'Frontend Geographic Spatial Query Tool',
      lastUpdated: new Date().toISOString(),
      geometry,
      bounds,
    };

    onCommitDrawnRegion(drawnEntity);
    setDrawingVertices([]);
  }, [drawingVertices, onCommitDrawnRegion]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#080D14]">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Drawing Mode Controls Overlay */}
      {isDrawingMode && (
        <RegionDrawingTools
          vertices={drawingVertices}
          onFinishDrawing={handleFinishDrawing}
          onCancelDrawing={() => {
            setDrawingVertices([]);
            onSelectRegion(null);
          }}
          onClearVertices={() => setDrawingVertices([])}
        />
      )}

      {/* Floating Region Hover Tooltip (Section 8: Exact hover behavior) */}
      {hoveredRegion && !isDrawingMode && !selectedRegion && (
        <div className="absolute top-20 left-6 z-20 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <div className="ner-glass rounded-xl p-3 shadow-panel border border-ner-cyan/40 max-w-xs text-xs">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-ner-cyan animate-ping" />
              <span className="font-mono text-[10px] text-ner-cyan uppercase tracking-wider">
                Geographic Region Preview
              </span>
            </div>
            <h4 className="font-semibold text-ner-text text-sm mb-1">{hoveredRegion.name}</h4>
            <div className="flex items-center gap-2 text-[11px] text-ner-muted font-mono mb-2">
              <span>{hoveredRegion.statesCrossed.join(' · ')}</span>
              <span>•</span>
              <span>{hoveredRegion.areaKm2.toLocaleString()} km²</span>
            </div>
            <p className="text-[11px] text-ner-muted line-clamp-2 leading-relaxed">
              {hoveredRegion.dominantGeology}
            </p>
            <div className="mt-2 pt-2 border-t border-ner-border/40 text-[10px] font-mono text-ner-cyan">
              Click to inspect regional telemetry & history →
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
RegionalMap.displayName = "RegionalMap";
