import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Minus, 
  Navigation,
  Compass, 
  Layers, 
  Eye, 
  EyeOff, 
  Globe2, 
  Activity, 
  Radio
} from 'lucide-react';

export interface MapLayerVisibility {
  showSatellite: boolean;
  showStateBoundaries: boolean;
  showRegions: boolean;
  showIncidents: boolean;
  showStations: boolean;
  showWarnings: boolean;
  showWaypoints: boolean;
}

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetNorth: () => void;
  onTogglePitch: () => void;
  isPitchActive: boolean;
  layers: MapLayerVisibility;
  onToggleLayer: (key: keyof MapLayerVisibility) => void;
  onResetCamera?: () => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onResetNorth,
  onTogglePitch,
  isPitchActive,
  layers,
  onToggleLayer,
}) => {
  const [isNavOpen, setIsNavOpen] = useState(true);
  const [isOverlaysOpen, setIsOverlaysOpen] = useState(true);

  return (
    <div className="absolute top-20 right-6 z-20 flex flex-col gap-3 select-none">
      {/* Zoom and Navigation Controls */}
      <div className="bg-ner-panel/90 backdrop-blur-md border border-ner-border rounded-xl shadow-panel p-2 flex flex-col gap-1.5 w-48 text-xs">
        <button
          onClick={() => setIsNavOpen((o) => !o)}
          aria-expanded={isNavOpen}
          aria-label={isNavOpen ? 'Minimize navigation controls' : 'Expand navigation controls'}
          className={`w-full text-[10px] font-mono text-ner-muted hover:text-ner-text uppercase px-1 flex items-center justify-between transition-colors ${
            isNavOpen ? 'pb-1 border-b border-ner-border/40' : ''
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Navigation className="w-3 h-3 text-ner-cyan" />
            <span>Navigation</span>
          </span>
          {isNavOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {isNavOpen && (
          <div className="flex items-center justify-between gap-1">
            <button
              onClick={onZoomIn}
              title="Zoom In"
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-ner-surface text-ner-text hover:text-ner-cyan transition-colors ner-focus"
              aria-label="Zoom in"
            >
              <Plus className="w-4 h-4" />
            </button>

            <button
              onClick={onZoomOut}
              title="Zoom Out"
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-ner-surface text-ner-text hover:text-ner-cyan transition-colors ner-focus"
              aria-label="Zoom out"
            >
              <Minus className="w-4 h-4" />
            </button>

            <button
              onClick={onTogglePitch}
              title={isPitchActive ? 'Switch to 2D Top View' : 'Switch to 3D Angled View (45°)'}
              className={`w-9 h-9 flex items-center justify-center rounded-lg font-mono text-xs font-bold transition-colors ner-focus ${
                isPitchActive
                  ? 'bg-ner-cyan/20 text-ner-cyan border border-ner-cyan/40'
                  : 'hover:bg-ner-surface text-ner-muted hover:text-ner-text'
              }`}
              aria-label="Toggle 3D Perspective"
            >
              {isPitchActive ? '3D' : '2D'}
            </button>

            <button
              onClick={onResetNorth}
              title="Reset Orientation North"
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-ner-surface text-ner-muted hover:text-ner-text transition-colors ner-focus"
              aria-label="Reset North"
            >
              <Compass className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Quick Layer Switchers */}
      <div className="bg-ner-panel/90 backdrop-blur-md border border-ner-border rounded-xl shadow-panel p-2 flex flex-col gap-1.5 w-48 text-xs">
        <button
          onClick={() => setIsOverlaysOpen((o) => !o)}
          aria-expanded={isOverlaysOpen}
          aria-label={isOverlaysOpen ? 'Minimize map overlays' : 'Expand map overlays'}
          className={`w-full text-[10px] font-mono text-ner-muted hover:text-ner-text uppercase px-1 flex items-center justify-between transition-colors ${
            isOverlaysOpen ? 'pb-1 border-b border-ner-border/40' : ''
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-ner-cyan" />
            <span>Map Overlays</span>
          </span>
          {isOverlaysOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {isOverlaysOpen && (
          <>

        {/* Satellite Imagery Basemap Toggle */}
        <button
          onClick={() => onToggleLayer('showSatellite')}
          className={`flex items-center justify-between px-2 py-1.5 rounded-lg transition-colors ${
            layers.showSatellite
              ? 'bg-ner-surface text-ner-cyan border border-ner-cyan/30'
              : 'text-ner-muted hover:bg-ner-surface/60'
          }`}
        >
          <span className="flex items-center gap-2">
            <Globe2 className="w-3.5 h-3.5" />
            <span>Satellite Basemap</span>
          </span>
          {layers.showSatellite ? (
            <Eye className="w-3 h-3 text-ner-cyan" />
          ) : (
            <EyeOff className="w-3 h-3 text-ner-muted" />
          )}
        </button>

        {/* Predefined Regions */}
        <button
          onClick={() => onToggleLayer('showRegions')}
          className={`flex items-center justify-between px-2 py-1.5 rounded-lg transition-colors ${
            layers.showRegions
              ? 'bg-ner-surface text-ner-cyan border border-ner-cyan/30'
              : 'text-ner-muted hover:bg-ner-surface/60'
          }`}
        >
          <span className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5" />
            <span>Hazard Regions</span>
          </span>
          {layers.showRegions ? (
            <Eye className="w-3 h-3 text-ner-cyan" />
          ) : (
            <EyeOff className="w-3 h-3 text-ner-muted" />
          )}
        </button>

        {/* State Boundaries (Context Only) */}
        <button
          onClick={() => onToggleLayer('showStateBoundaries')}
          className={`flex items-center justify-between px-2 py-1.5 rounded-lg transition-colors ${
            layers.showStateBoundaries
              ? 'bg-ner-surface text-ner-text border border-ner-border'
              : 'text-ner-muted hover:bg-ner-surface/60'
          }`}
        >
          <span className="flex items-center gap-2">
            <span className="w-3.5 border-t border-dashed border-ner-muted" />
            <span>State Reference Lines</span>
          </span>
          {layers.showStateBoundaries ? (
            <Eye className="w-3 h-3 text-ner-cyan" />
          ) : (
            <EyeOff className="w-3 h-3 text-ner-muted" />
          )}
        </button>

        {/* Landslide Incidents */}
        <button
          onClick={() => onToggleLayer('showIncidents')}
          className={`flex items-center justify-between px-2 py-1.5 rounded-lg transition-colors ${
            layers.showIncidents
              ? 'bg-ner-surface text-ner-red border border-ner-red/30'
              : 'text-ner-muted hover:bg-ner-surface/60'
          }`}
        >
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-ner-red" />
            <span>Incident Markers</span>
          </span>
          {layers.showIncidents ? (
            <Eye className="w-3 h-3 text-ner-red" />
          ) : (
            <EyeOff className="w-3 h-3 text-ner-muted" />
          )}
        </button>

        {/* Weather & Sensor Stations */}
        <button
          onClick={() => onToggleLayer('showStations')}
          className={`flex items-center justify-between px-2 py-1.5 rounded-lg transition-colors ${
            layers.showStations
              ? 'bg-ner-surface text-ner-cyan border border-ner-cyan/30'
              : 'text-ner-muted hover:bg-ner-surface/60'
          }`}
        >
          <span className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5" />
            <span>Sensor Stations</span>
          </span>
          {layers.showStations ? (
            <Eye className="w-3 h-3 text-ner-cyan" />
          ) : (
            <EyeOff className="w-3 h-3 text-ner-muted" />
          )}
        </button>
          </>
        )}
      </div>
    </div>
  );
};
