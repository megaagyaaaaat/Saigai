import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Layers } from 'lucide-react';

export const MapLegend: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="absolute bottom-6 left-6 z-20 w-64 bg-ner-panel/90 backdrop-blur-md border border-ner-border rounded-xl shadow-panel text-ner-text select-none text-xs">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2.5 flex items-center justify-between font-mono font-medium text-xs text-ner-muted hover:text-ner-text transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-ner-cyan" />
          <span>GEOSPATIAL LEGEND</span>
        </span>
        {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
      </button>

      {isOpen && (
        <div className="px-3.5 pb-3.5 pt-1 space-y-3 border-t border-ner-border/40">
          {/* Risk Level Polygons */}
          <div>
            <div className="text-[10px] font-mono text-ner-muted uppercase tracking-wider mb-1.5">
              Regional Hazard Classification
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-ner-red/40 border border-ner-red" />
                <span className="text-[11px] text-ner-text">Critical</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-ner-orange/40 border border-ner-orange" />
                <span className="text-[11px] text-ner-text">High</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-ner-amber/40 border border-ner-amber" />
                <span className="text-[11px] text-ner-text">Elevated</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-ner-emerald/40 border border-ner-emerald" />
                <span className="text-[11px] text-ner-text">Normal / Low</span>
              </div>
            </div>
          </div>

          {/* Marker Symbols */}
          <div>
            <div className="text-[10px] font-mono text-ner-muted uppercase tracking-wider mb-1.5">
              Active Telemetry & Records
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-ner-red border border-white" />
                <span className="text-[11px] text-ner-muted">Historical Landslide Incident</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-ner-cyan border border-white" />
                <span className="text-[11px] text-ner-muted">AWS Weather / Hydromet Station</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-ner-orange border border-white" />
                <span className="text-[11px] text-ner-muted">Inclinometer / Seismic Sensor</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded bg-ner-blue/70 border border-ner-blue" />
                <span className="text-[11px] text-ner-muted">Field Waypoint / Staging Point</span>
              </div>
            </div>
          </div>

          {/* Context Notice */}
          <div className="pt-2 border-t border-ner-border/40 text-[10px] text-ner-muted/80 leading-relaxed font-sans italic">
            State boundaries are shown as faint dashed lines for reference only. Selection is purely region-based.
          </div>
        </div>
      )}
    </div>
  );
};
