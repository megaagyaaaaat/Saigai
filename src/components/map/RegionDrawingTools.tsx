import React from 'react';
import { PenTool, Check, Trash2, X } from 'lucide-react';
import type { Position } from 'geojson';
import { calculateAreaKm2 } from '../../lib/geo';

interface RegionDrawingToolsProps {
  vertices: Position[];
  onFinishDrawing: () => void;
  onCancelDrawing: () => void;
  onClearVertices: () => void;
}

export const RegionDrawingTools: React.FC<RegionDrawingToolsProps> = ({
  vertices,
  onFinishDrawing,
  onCancelDrawing,
  onClearVertices,
}) => {
  const canFinish = vertices.length >= 3;

  // Approximate live area preview if 3 or more vertices
  let liveAreaKm2 = 0;
  if (canFinish) {
    const closedCoords = [...vertices, vertices[0]];
    liveAreaKm2 = calculateAreaKm2({
      type: 'Polygon',
      coordinates: [closedCoords],
    });
  }

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 select-none animate-in fade-in slide-in-from-top-4 duration-200">
      <div className="ner-glass rounded-xl p-3 shadow-panel border border-ner-cyan/40 flex items-center gap-4 text-xs">
        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-ner-cyan/20 border border-ner-cyan/50 flex items-center justify-center text-ner-cyan">
            <PenTool className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="font-mono font-semibold text-ner-cyan uppercase tracking-wider flex items-center gap-1.5">
              <span>Polygon Drawing Active</span>
              <span className="w-1.5 h-1.5 rounded-full bg-ner-cyan animate-ping" />
            </div>
            <p className="text-ner-muted text-[11px]">
              Click on the map to place vertices ({vertices.length} placed)
              {liveAreaKm2 > 0 && ` • Area: ~${liveAreaKm2.toLocaleString()} km²`}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 border-l border-ner-border pl-3">
          <button
            onClick={onFinishDrawing}
            disabled={!canFinish}
            title={canFinish ? 'Complete and analyze custom region' : 'Need at least 3 points to complete'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-bold transition-all ${
              canFinish
                ? 'bg-ner-cyan text-ner-bg shadow-glow-cyan hover:brightness-110 cursor-pointer'
                : 'bg-ner-surface text-ner-muted/50 border border-ner-border cursor-not-allowed'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>Complete ({vertices.length})</span>
          </button>

          {vertices.length > 0 && (
            <button
              onClick={onClearVertices}
              title="Reset drawn vertices"
              className="p-1.5 rounded-lg bg-ner-surface border border-ner-border text-ner-muted hover:text-ner-text transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onCancelDrawing}
            title="Exit drawing mode"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-ner-surface border border-ner-border text-ner-muted hover:text-ner-red hover:border-ner-red/40 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span className="font-mono text-[11px]">Cancel</span>
          </button>
        </div>
      </div>
    </div>
  );
};
