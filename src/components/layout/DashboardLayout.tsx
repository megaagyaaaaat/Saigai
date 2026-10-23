import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RegionalMap } from '../map/RegionalMap';
import { MapControls, type MapLayerVisibility } from '../map/MapControls';
import { MapLegend } from '../map/MapLegend';
import { RegionPreview } from '../regions/RegionPreview';
import { RegionDetailsPanel } from '../regions/RegionDetailsPanel';
import { LoadingState } from '../ui/LoadingState';
import { ErrorState } from '../ui/ErrorState';
import { LayersModal } from './LayersModal';
import { AboutModal } from './AboutModal';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import type { useRegionSelection } from '../../hooks/useRegionSelection';
import type { IncidentRecord } from '../../features/incidents/incident.types';
import type { MonitoringStation } from '../../features/stations/station.types';
import type { Waypoint } from '../../features/waypoints/waypoint.types';

interface DashboardLayoutProps {
  regionState: ReturnType<typeof useRegionSelection>;
  incidents: IncidentRecord[];
  stations: MonitoringStation[];
  waypoints: Waypoint[];
  isLayersModalOpen: boolean;
  isAboutModalOpen: boolean;
  onCloseLayersModal: () => void;
  onCloseAboutModal: () => void;
  onResetCamera: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  regionState,
  incidents,
  stations,
  waypoints,
  isLayersModalOpen,
  isAboutModalOpen,
  onCloseLayersModal,
  onCloseAboutModal,
  onResetCamera,
}) => {
  const prefersReducedMotion = useReducedMotion();

  const [layers, setLayers] = useState<MapLayerVisibility>({
    showSatellite: true,
    showStateBoundaries: true,
    showRegions: true,
    showIncidents: true,
    showStations: true,
    showWarnings: true,
    showWaypoints: true,
  });

  const [isPitchActive, setIsPitchActive] = useState(false);

  const toggleLayer = (key: keyof MapLayerVisibility) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const {
    selectedRegion,
    hoveredRegion,
    detailData,
    isLoadingDetails,
    detailsError,
    isDrawingMode,
    selectRegion,
    clearSelection,
    handleRegionHoverEnter,
    handleRegionHoverLeave,
    commitDrawnRegion,
  } = regionState;

  // Cinematic spring / easing config
  const transitionConfig = prefersReducedMotion
    ? { duration: 0 }
    : { type: 'spring', damping: 28, stiffness: 220, duration: 0.55 };

  return (
    <main className="relative flex-1 w-full h-[calc(100vh-4rem)] overflow-hidden flex bg-ner-bg select-none">
      {/* 1. Map Workspace (Dominant Element) */}
      <div className="relative flex-1 h-full min-w-0 overflow-hidden">
        <RegionalMap
          selectedRegion={selectedRegion}
          hoveredRegion={hoveredRegion}
          onSelectRegion={selectRegion}
          onHoverRegionEnter={handleRegionHoverEnter}
          onHoverRegionLeave={handleRegionHoverLeave}
          isDrawingMode={isDrawingMode}
          onCommitDrawnRegion={commitDrawnRegion}
          layers={layers}
          incidents={incidents}
          stations={stations}
          waypoints={waypoints}
        />

        {/* Map Controls */}
        <MapControls
          onZoomIn={() => {
            const btn = document.querySelector('.maplibregl-ctrl-zoom-in') as HTMLButtonElement;
            btn?.click();
          }}
          onZoomOut={() => {
            const btn = document.querySelector('.maplibregl-ctrl-zoom-out') as HTMLButtonElement;
            btn?.click();
          }}
          onResetNorth={() => {
            const btn = document.querySelector('.maplibregl-ctrl-compass') as HTMLButtonElement;
            btn?.click();
          }}
          onTogglePitch={() => setIsPitchActive(!isPitchActive)}
          isPitchActive={isPitchActive}
          layers={layers}
          onToggleLayer={toggleLayer}
          onResetCamera={onResetCamera}
        />

        {/* Geospatial Map Legend */}
        {!selectedRegion && <MapLegend />}
      </div>

      {/* 2. Cinematic Split-View Detail Panel (Appears on committed selection) */}
      <AnimatePresence>
        {selectedRegion && (
          <motion.div
            key="split-detail-container"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={transitionConfig}
            className="absolute lg:relative right-0 top-0 bottom-0 w-full lg:w-[680px] xl:w-[820px] 2xl:w-[960px] z-30 flex flex-col lg:flex-row shadow-2xl border-l border-ner-border bg-ner-panel"
          >
            {/* Left side: Selected Region Geometry Preview */}
            <RegionPreview region={selectedRegion} onClose={clearSelection} />

            {/* Right side: Telemetry, History, Charts, and Records */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {isLoadingDetails && (
                <div className="p-8 flex items-center justify-center h-full">
                  <LoadingState
                    message={`Retrieving telemetry for ${selectedRegion.name}...`}
                    subtext="Synchronizing Doppler radars, piezometer logs, and historical archives"
                  />
                </div>
              )}

              {detailsError && !isLoadingDetails && (
                <div className="p-6">
                  <ErrorState
                    title="Geospatial Telemetry Notice"
                    message={detailsError}
                    onRetry={() => selectRegion(selectedRegion)}
                  />
                </div>
              )}

              {detailData && !isLoadingDetails && !detailsError && (
                <RegionDetailsPanel data={detailData} onClose={clearSelection} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <LayersModal
        isOpen={isLayersModalOpen}
        onClose={onCloseLayersModal}
        layers={layers}
        onToggleLayer={toggleLayer}
      />

      <AboutModal isOpen={isAboutModalOpen} onClose={onCloseAboutModal} />
    </main>
  );
};
