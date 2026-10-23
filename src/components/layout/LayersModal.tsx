import React from 'react';
import { X, Layers, Globe2, Check } from 'lucide-react';
import type { MapLayerVisibility } from '../map/MapControls';

interface LayersModalProps {
  isOpen: boolean;
  onClose: () => void;
  layers: MapLayerVisibility;
  onToggleLayer: (key: keyof MapLayerVisibility) => void;
}

export const LayersModal: React.FC<LayersModalProps> = ({
  isOpen,
  onClose,
  layers,
  onToggleLayer,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-ner-panel border border-ner-border rounded-2xl shadow-panel overflow-hidden text-ner-text flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-ner-border flex items-center justify-between bg-ner-surface/60">
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-ner-cyan" />
            <h3 className="font-bold text-sm text-ner-text">Geospatial Layer Manager</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-ner-muted hover:text-ner-text hover:bg-ner-surface transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Layer Toggles */}
        <div className="p-4 space-y-3 text-xs">
          {/* Base Layer */}
          <div className="p-3 rounded-xl bg-ner-surface/70 border border-ner-border space-y-2">
            <span className="text-[10px] font-mono text-ner-muted uppercase">Base Raster Tile Provider</span>
            <div className="flex gap-2">
              <button
                onClick={() => onToggleLayer('showSatellite')}
                className={`flex-1 p-2 rounded-lg border font-mono text-xs flex items-center justify-center gap-2 transition-all ${
                  layers.showSatellite
                    ? 'bg-ner-cyan/20 border-ner-cyan text-ner-cyan font-bold shadow-glow-cyan'
                    : 'bg-ner-panel border-ner-border text-ner-muted hover:text-ner-text'
                }`}
              >
                <Globe2 className="w-3.5 h-3.5" />
                <span>Satellite Imagery</span>
              </button>
              <button
                onClick={() => onToggleLayer('showSatellite')}
                className={`flex-1 p-2 rounded-lg border font-mono text-xs flex items-center justify-center gap-2 transition-all ${
                  !layers.showSatellite
                    ? 'bg-ner-blue/20 border-ner-blue text-ner-blue font-bold shadow-glow-blue'
                    : 'bg-ner-panel border-ner-border text-ner-muted hover:text-ner-text'
                }`}
              >
                <span>Dark Canvas</span>
              </button>
            </div>
          </div>

          {/* Regional Vector Layers */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-ner-muted uppercase">Geographic Vector Overlays</span>

            {/* Predefined Hazard Regions */}
            <div
              onClick={() => onToggleLayer('showRegions')}
              className="p-3 rounded-xl bg-ner-surface/60 border border-ner-border flex items-center justify-between cursor-pointer hover:border-ner-cyan/40 transition-colors"
            >
              <div>
                <span className="font-semibold text-ner-text block">Regional Hazard Corridors</span>
                <span className="text-[11px] text-ner-muted">Predefined transboundary landslide polygons</span>
              </div>
              <div
                className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                  layers.showRegions
                    ? 'bg-ner-cyan border-ner-cyan text-ner-bg'
                    : 'border-ner-border bg-ner-panel'
                }`}
              >
                {layers.showRegions && <Check className="w-3.5 h-3.5" />}
              </div>
            </div>

            {/* Contextual State Boundaries */}
            <div
              onClick={() => onToggleLayer('showStateBoundaries')}
              className="p-3 rounded-xl bg-ner-surface/60 border border-ner-border flex items-center justify-between cursor-pointer hover:border-ner-cyan/40 transition-colors"
            >
              <div>
                <span className="font-semibold text-ner-text block">State Reference Lines (Context Only)</span>
                <span className="text-[11px] text-ner-muted">Dashed boundaries — non-restrictive visual guide</span>
              </div>
              <div
                className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                  layers.showStateBoundaries
                    ? 'bg-ner-cyan border-ner-cyan text-ner-bg'
                    : 'border-ner-border bg-ner-panel'
                }`}
              >
                {layers.showStateBoundaries && <Check className="w-3.5 h-3.5" />}
              </div>
            </div>

            {/* Landslide Incidents */}
            <div
              onClick={() => onToggleLayer('showIncidents')}
              className="p-3 rounded-xl bg-ner-surface/60 border border-ner-border flex items-center justify-between cursor-pointer hover:border-ner-red/40 transition-colors"
            >
              <div>
                <span className="font-semibold text-ner-text block">Historical Landslide Markers</span>
                <span className="text-[11px] text-ner-muted">GSI & state disaster management recorded events</span>
              </div>
              <div
                className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                  layers.showIncidents
                    ? 'bg-ner-red border-ner-red text-white'
                    : 'border-ner-border bg-ner-panel'
                }`}
              >
                {layers.showIncidents && <Check className="w-3.5 h-3.5" />}
              </div>
            </div>

            {/* Stations */}
            <div
              onClick={() => onToggleLayer('showStations')}
              className="p-3 rounded-xl bg-ner-surface/60 border border-ner-border flex items-center justify-between cursor-pointer hover:border-ner-cyan/40 transition-colors"
            >
              <div>
                <span className="font-semibold text-ner-text block">Sensor & AWS Telemetry Stations</span>
                <span className="text-[11px] text-ner-muted">Rain gauges, piezometers, inclinometers, radars</span>
              </div>
              <div
                className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                  layers.showStations
                    ? 'bg-ner-cyan border-ner-cyan text-ner-bg'
                    : 'border-ner-border bg-ner-panel'
                }`}
              >
                {layers.showStations && <Check className="w-3.5 h-3.5" />}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-ner-border bg-ner-surface/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-ner-surface border border-ner-border text-xs font-mono text-ner-text hover:bg-ner-panel transition-colors"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
