import { useState, useRef, useCallback, useEffect } from 'react';
import type { RegionEntity } from '../features/regions/region.types';
import type { IncidentRecord } from '../features/incidents/incident.types';
import type { RainfallObservation, RainfallTimeSeriesPoint } from '../features/rainfall/rainfall.types';
import type { WarningRecord } from '../features/warnings/warning.types';
import type { MonitoringStation } from '../features/stations/station.types';
import { dataProvider } from '../api/dataProvider';
import { MockRegionService } from '../features/regions/region.service';

export interface RegionDetailData {
  region: RegionEntity;
  incidents: IncidentRecord[];
  rainfall: RainfallObservation[];
  rainfallSeries: RainfallTimeSeriesPoint[];
  warnings: WarningRecord[];
  stations: MonitoringStation[];
}

export function useRegionSelection() {
  const [selectedRegion, setSelectedRegion] = useState<RegionEntity | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<RegionEntity | null>(null);
  const [hoverPreviewRegion, setHoverPreviewRegion] = useState<RegionEntity | null>(null);

  const [detailData, setDetailData] = useState<RegionDetailData | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Drawing mode state
  const [isDrawingMode, setIsDrawingMode] = useState<boolean>(false);
  const [drawnPolygon, setDrawnPolygon] = useState<RegionEntity | null>(null);

  // Hover debounce timer (150ms per specification)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeAbortRef = useRef<AbortController | null>(null);

  // Hover handlers
  const handleRegionHoverEnter = useCallback((region: RegionEntity) => {
    // Avoid restarting preview if hovering over the same region
    setHoveredRegion(region);

    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }

    hoverTimerRef.current = setTimeout(() => {
      setHoverPreviewRegion(region);
    }, 150);
  }, []);

  const handleRegionHoverLeave = useCallback(() => {
    setHoveredRegion(null);
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setHoverPreviewRegion(null);
  }, []);

  // Selection handler with AbortController for race condition / cancellation prevention
  const selectRegion = useCallback(async (region: RegionEntity | null) => {
    // Cancel any in-flight request
    if (activeAbortRef.current) {
      activeAbortRef.current.abort();
      activeAbortRef.current = null;
    }

    if (!region) {
      setSelectedRegion(null);
      setDetailData(null);
      setDetailsError(null);
      setIsLoadingDetails(false);
      return;
    }

    setSelectedRegion(region);
    setIsLoadingDetails(true);
    setDetailsError(null);

    const controller = new AbortController();
    activeAbortRef.current = controller;
    const { signal } = controller;

    try {
      // Query region-specific records
      let incidents: IncidentRecord[];
      let rainfall: RainfallObservation[];
      let stations: MonitoringStation[];

      if (region.isUserDrawn) {
        // Point-in-polygon spatial queries for user-drawn geometries
        [incidents, rainfall, stations] = await Promise.all([
          dataProvider.incidents.getIncidentsInGeometry(region.geometry, signal),
          dataProvider.rainfall.getObservationsInGeometry(region.geometry, signal),
          dataProvider.stations.getStationsInGeometry(region.geometry, signal),
        ]);
      } else {
        [incidents, rainfall, stations] = await Promise.all([
          dataProvider.incidents.getIncidentsByRegion(region.id, signal),
          dataProvider.rainfall.getObservationsByRegion(region.id, signal),
          dataProvider.stations.getStationsByRegion(region.id, signal),
        ]);
      }

      const [warnings, rainfallSeries] = await Promise.all([
        dataProvider.warnings.getWarningsByRegion(region.id, signal),
        dataProvider.rainfall.getTimeSeriesByRegion(region.id, signal),
      ]);

      if (!signal.aborted) {
        setDetailData({
          region,
          incidents,
          rainfall,
          rainfallSeries,
          warnings,
          stations,
        });
        setIsLoadingDetails(false);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Stale request cancelled; ignore safely
        return;
      }
      console.error('Error fetching region details:', err);
      if (!signal.aborted) {
        setDetailsError(err.message || 'Failed to load telemetry for selected region');
        setIsLoadingDetails(false);
      }
    }
  }, []);

  const clearSelection = useCallback(() => {
    if (activeAbortRef.current) {
      activeAbortRef.current.abort();
      activeAbortRef.current = null;
    }
    setSelectedRegion(null);
    setDetailData(null);
    setDetailsError(null);
    setIsLoadingDetails(false);
  }, []);

  // Handle completed user drawing
  const commitDrawnRegion = useCallback((drawnEntity: RegionEntity) => {
    setDrawnPolygon(drawnEntity);
    setIsDrawingMode(false);

    // Register user drawn region in service
    if (dataProvider.regions instanceof MockRegionService) {
      dataProvider.regions.addUserDrawnRegion(drawnEntity);
    }

    // Auto-select the newly drawn region
    selectRegion(drawnEntity);
  }, [selectRegion]);

  const clearDrawnRegion = useCallback(() => {
    if (drawnPolygon && dataProvider.regions instanceof MockRegionService) {
      dataProvider.regions.removeUserDrawnRegion(drawnPolygon.id);
    }
    setDrawnPolygon(null);
    if (selectedRegion?.id === drawnPolygon?.id) {
      clearSelection();
    }
  }, [drawnPolygon, selectedRegion, clearSelection]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (activeAbortRef.current) activeAbortRef.current.abort();
    };
  }, []);

  return {
    selectedRegion,
    hoveredRegion,
    hoverPreviewRegion,
    detailData,
    isLoadingDetails,
    detailsError,
    isDrawingMode,
    drawnPolygon,
    setIsDrawingMode,
    selectRegion,
    clearSelection,
    handleRegionHoverEnter,
    handleRegionHoverLeave,
    commitDrawnRegion,
    clearDrawnRegion,
  };
}
