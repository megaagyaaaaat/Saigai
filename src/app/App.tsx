import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppHeader } from '../components/layout/AppHeader';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import type { RegionalMapHandle } from '../components/map/RegionalMap';
import { useRegionSelection } from '../hooks/useRegionSelection';
import { dataProvider } from '../api/dataProvider';
import type { IncidentRecord } from '../features/incidents/incident.types';
import type { MonitoringStation } from '../features/stations/station.types';
import type { Waypoint } from '../features/waypoints/waypoint.types';
import type { WarningRecord } from '../features/warnings/warning.types';

export const App: React.FC = () => {
  const regionState = useRegionSelection();
  const mapHandleRef = useRef<RegionalMapHandle>(null);

  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [stations, setStations] = useState<MonitoringStation[]>([]);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [activeWarnings, setActiveWarnings] = useState<WarningRecord[]>([]);

  const [isLayersModalOpen, setIsLayersModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  // Load initial global records on mount
  useEffect(() => {
    let isMounted = true;
    const loadGlobalData = async () => {
      try {
        const [allInc, allStn, allWpt, allWrn] = await Promise.all([
          dataProvider.incidents.getAllIncidents(),
          dataProvider.stations.getAllStations(),
          dataProvider.stations.getWaypoints(),
          dataProvider.warnings.getActiveWarnings(),
        ]);

        if (isMounted) {
          setIncidents(allInc);
          setStations(allStn);
          setWaypoints(allWpt);
          setActiveWarnings(allWrn);
        }
      } catch (err) {
        console.error('Failed to load global data:', err);
      }
    };

    loadGlobalData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleResetCamera = useCallback(() => {
    // If a region was selected, clear it and return to the overview
    if (regionState.selectedRegion) {
      regionState.clearSelection();
    }
    // Fly the camera back to the opening view of the Northeast
    mapHandleRef.current?.resetView();
  }, [regionState]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-ner-bg text-ner-text select-none">
      {/* Top Application Header */}
      <AppHeader
        onSelectRegion={regionState.selectRegion}
        onResetCamera={handleResetCamera}
        isDrawingMode={regionState.isDrawingMode}
        onToggleDrawingMode={() => regionState.setIsDrawingMode(!regionState.isDrawingMode)}
        onToggleLayersModal={() => setIsLayersModalOpen(true)}
        onOpenAboutModal={() => setIsAboutModalOpen(true)}
        selectedRegion={regionState.selectedRegion}
        warnings={activeWarnings}
      />

      {/* Main Geospatial Command Center Layout */}
      <DashboardLayout
        regionState={regionState}
        incidents={incidents}
        stations={stations}
        waypoints={waypoints}
        isLayersModalOpen={isLayersModalOpen}
        isAboutModalOpen={isAboutModalOpen}
        onCloseLayersModal={() => setIsLayersModalOpen(false)}
        onCloseAboutModal={() => setIsAboutModalOpen(false)}
        onResetCamera={handleResetCamera}
        mapHandleRef={mapHandleRef}
      />
    </div>
  );
};

export default App;
