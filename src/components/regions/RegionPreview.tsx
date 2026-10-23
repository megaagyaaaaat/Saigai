import React from 'react';
import type { RegionEntity } from '../../features/regions/region.types';
import { Badge } from '../ui/Badge';
import { formatCoordinates } from '../../lib/geo';
import { Compass, Layers } from 'lucide-react';

interface RegionPreviewProps {
  region: RegionEntity;
  onClose?: () => void;
}

export const RegionPreview: React.FC<RegionPreviewProps> = ({ region }) => {
  const [minLng, minLat, maxLng, maxLat] = region.bounds;
  const lngRange = maxLng - minLng || 0.01;
  const latRange = maxLat - minLat || 0.01;

  // Transform GeoJSON polygon coordinates into SVG viewBox (300 x 240)
  const renderSvgPolygons = () => {
    const coordsList =
      region.geometry.type === 'Polygon'
        ? [region.geometry.coordinates]
        : region.geometry.coordinates;

    return coordsList.map((polygonRings, polyIdx) => {
      const outerRing = polygonRings[0];
      const pointsString = outerRing
        .map(([lng, lat]) => {
          // Invert lat for SVG Y axis (SVG 0,0 is top-left)
          const x = ((lng - minLng) / lngRange) * 240 + 30;
          const y = (1 - (lat - minLat) / latRange) * 180 + 30;
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ');

      return (
        <g key={polyIdx}>
          <polygon
            points={pointsString}
            fill="url(#regionGlow)"
            stroke="#64E2E8"
            strokeWidth="2.5"
            strokeLinejoin="round"
            className="filter drop-shadow-[0_0_12px_rgba(100,226,232,0.4)]"
          />
          {outerRing.map(([lng, lat], ptIdx) => {
            const x = ((lng - minLng) / lngRange) * 240 + 30;
            const y = (1 - (lat - minLat) / latRange) * 180 + 30;
            return (
              <circle
                key={ptIdx}
                cx={x}
                cy={y}
                r="3.5"
                fill="#080D14"
                stroke="#64E2E8"
                strokeWidth="1.5"
              />
            );
          })}
        </g>
      );
    });
  };

  return (
    <div className="w-full lg:w-96 flex flex-col bg-ner-panel/95 backdrop-blur-md border-r border-ner-border p-4 select-none overflow-y-auto">
      {/* Header Info */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-mono text-ner-cyan uppercase tracking-wider flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5" />
          <span>GEOMETRIC BOUNDARY SILHOUETTE</span>
        </span>
        <Badge level={region.isUserDrawn ? 'user_drawn' : region.riskLevel} />
      </div>

      <h2 className="text-base font-bold text-ner-text leading-tight mb-1">
        {region.name}
      </h2>

      <p className="text-xs text-ner-muted mb-4 font-mono">
        {region.statesCrossed.join(' · ')}
      </p>

      {/* Cinematic Geometric Silhouette Canvas */}
      <div className="relative w-full aspect-[4/3] rounded-xl bg-ner-surface/80 border border-ner-border overflow-hidden flex items-center justify-center mb-4 group shadow-panel">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              'linear-gradient(to right, #64E2E8 1px, transparent 1px), linear-gradient(to bottom, #64E2E8 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* SVG Projection */}
        <svg
          viewBox="0 0 300 240"
          className="w-full h-full relative z-10 transition-transform duration-500 group-hover:scale-105"
        >
          <defs>
            <radialGradient id="regionGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#64E2E8" stopOpacity="0.4" />
              <stop offset="70%" stopColor="#64A8FF" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#111C29" stopOpacity="0.8" />
            </radialGradient>
          </defs>
          {renderSvgPolygons()}
        </svg>

        {/* Cardinal Corner Overlays */}
        <div className="absolute top-2 left-2 text-[9px] font-mono text-ner-muted bg-ner-panel/80 px-1.5 py-0.5 rounded border border-ner-border/40">
          NW: {formatCoordinates(minLng, maxLat)}
        </div>
        <div className="absolute bottom-2 right-2 text-[9px] font-mono text-ner-muted bg-ner-panel/80 px-1.5 py-0.5 rounded border border-ner-border/40">
          SE: {formatCoordinates(maxLng, minLat)}
        </div>
      </div>

      {/* Geospatial Metrics Card */}
      <div className="space-y-3 bg-ner-surface/60 rounded-xl p-3 border border-ner-border text-xs mb-4">
        <div className="flex items-center justify-between">
          <span className="text-ner-muted font-mono text-[11px]">Enclosed Surface Area</span>
          <span className="font-mono font-bold text-ner-text">
            {region.areaKm2.toLocaleString()} km²
          </span>
        </div>
        <div className="h-px bg-ner-border/40" />
        <div className="flex items-center justify-between">
          <span className="text-ner-muted font-mono text-[11px]">Region Type</span>
          <span className="font-mono text-ner-cyan capitalize">
            {region.category.replace('_', ' ')}
          </span>
        </div>
        <div className="h-px bg-ner-border/40" />
        <div className="flex items-center justify-between">
          <span className="text-ner-muted font-mono text-[11px]">Dominant Geology</span>
          <span className="font-sans text-ner-text text-right truncate max-w-[170px]" title={region.dominantGeology}>
            {region.dominantGeology}
          </span>
        </div>
      </div>

      {/* Provenance and Data Freshness */}
      <div className="mt-auto pt-3 border-t border-ner-border/50 text-[10px] text-ner-muted leading-relaxed">
        <div className="flex items-center gap-1.5 font-mono text-ner-cyan mb-1">
          <Layers className="w-3 h-3" />
          <span>DATA PROVENANCE</span>
        </div>
        <p className="truncate" title={region.dataSource}>{region.dataSource}</p>
        <p className="font-mono text-ner-muted/70 mt-1">
          Last Synced: {new Date(region.lastUpdated).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};
