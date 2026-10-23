import { useState, useRef, useCallback } from 'react';
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

  // Selection handler with resilient parallel resolution
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
      // Parallel resilient query
      const [incRes, rainRes, stnRes, wrnRes, seriesRes] = await Promise.allSettled([
        region.isUserDrawn
          ? dataProvider.incidents.getIncidentsInGeometry(region.geometry, signal)
          : dataProvider.incidents.getIncidentsByRegion(region.id, signal),
        region.isUserDrawn
          ? dataProvider.rainfall.getObservationsInGeometry(region.geometry, signal)
          : dataProvider.rainfall.getObservationsByRegion(region.id, signal),
        region.isUserDrawn
          ? dataProvider.stations.getStationsInGeometry(region.geometry, signal)
          : dataProvider.stations.getStationsByRegion(region.id, signal),
        dataProvider.warnings.getWarningsByRegion(region.id, signal),
        dataProvider.rainfall.getTimeSeriesByRegion(region.id, signal),
      ]);

      if (signal.aborted) return;

      const incidents = incRes.status === 'fulfilled' ? incRes.value : [];
      const rainfall = rainRes.status === 'fulfilled' ? rainRes.value : [];
      const stations = stnRes.status === 'fulfilled' ? stnRes.value : [];
      const warnings = wrnRes.status === 'fulfilled' ? wrnRes.value : [];
      const rainfallSeries = seriesRes.status === 'fulfilled' ? seriesRes.value : [];

      setDetailData({
        region,
        incidents,
        rainfall,
        rainfallSeries,
        warnings,
        stations,
      });
      setIsLoadingDetails(false);
      setDetailsError(null);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return;
      }
      console.warn('Error fetching region details:', err);
      if (!signal.aborted) {
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
    clearSelection();
  }, [drawnPolygon, clearSelection]);

  return {
    selectedRegion,
    hoveredRegion,
    hoverPreviewRegion,
    detailData,
    isLoadingDetails,
    detailsError,
    isDrawingMode,
    drawnPolygon,
    selectRegion,
    clearSelection,
    handleRegionHoverEnter,
    handleRegionHoverLeave,
    commitDrawnRegion,
    clearDrawnRegion,
    setIsDrawingMode,
  };
}
