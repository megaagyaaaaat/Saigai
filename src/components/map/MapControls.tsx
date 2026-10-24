import React, { useRef, useState } from 'react';
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
  Activity, 
  Radio,
  Moon,
  Mountain
} from 'lucide-react';

export interface MapLayerVisibility {
  showSatellite: boolean;
  showStateBoundaries: boolean;
  showRegions: boolean;
  showIncidents: boolean;
  showStations: boolean;
  showWarnings: boolean;
  showWaypoints: boolean;
  showTerrain: boolean;
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
  onFadeOut?: () => void;
  /** the state details panel is open on the right: expanded panels slide left of it */
  shiftForDetailsPanel?: boolean;
  /** rendered in the bottom-left dock (the legend), above the minimized panels */
  children?: React.ReactNode;
}

/**
 * Lets a panel be dragged by a handle element (its header). A drag shorter than 4px is still a click,
 * and a real drag swallows the click so it doesn't also toggle the panel. Stays inside the window.
 */
function useDraggable() {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const moved = useRef(false);

  const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    const el = ref.current;
    if (e.button !== 0 || !el) return;

    const handle = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const start = { px: e.clientX, py: e.clientY, ox: offset.x, oy: offset.y };
    moved.current = false;
    handle.setPointerCapture(e.pointerId);

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - start.px;
      const dy = ev.clientY - start.py;
      if (!moved.current && Math.hypot(dx, dy) < 4) return;
      moved.current = true;
      setOffset({
        x: start.ox + Math.min(Math.max(dx, -rect.left), window.innerWidth - rect.right),
        y: start.oy + Math.min(Math.max(dy, -rect.top), window.innerHeight - rect.bottom),
      });
    };
    const onEnd = () => {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onEnd);
      handle.removeEventListener('pointercancel', onEnd);
    };
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onEnd);
    handle.addEventListener('pointercancel', onEnd);
  };

  const onClickCapture = (e: React.MouseEvent) => {
    if (moved.current) {
      e.preventDefault();
      e.stopPropagation();
      moved.current = false;
    }
  };

  const reset = () => setOffset({ x: 0, y: 0 });

  return {
    ref,
    reset,
    style: { transform: `translate(${offset.x}px, ${offset.y}px)` } as React.CSSProperties,
    handleProps: {
      onPointerDown,
      onClickCapture,
      style: { touchAction: 'none', cursor: 'grab' } as React.CSSProperties,
    },
  };
}

export const MapControls: React.FC<MapControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onResetNorth,
  onTogglePitch,
  isPitchActive,
  layers,
  onToggleLayer,
  onFadeOut,
  shiftForDetailsPanel = false,
  children,
}) => {
  const navDrag = useDraggable();
  const overlaysDrag = useDraggable();
  const [isNavOpen, setIsNavOpen] = useState(true);
  const [isOverlaysOpen, setIsOverlaysOpen] = useState(true);

  // Minimized panels dock at the bottom-left; expanded ones float at the top-right
  const toggleNav = () => {
    navDrag.reset();
    setIsNavOpen((o) => !o);
  };
  const toggleOverlays = () => {
    overlaysDrag.reset();
    setIsOverlaysOpen((o) => !o);
  };

  const navPanel = (
      <div key="nav" ref={navDrag.ref}
        style={navDrag.style}
        className="bg-ner-panel/95 border border-ner-border rounded-xl shadow-panel p-2 flex flex-col gap-1.5 w-48 text-xs">
        <button
          onClick={toggleNav}
          title="Drag to move"
          {...navDrag.handleProps}
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

        {isNavOpen && onFadeOut && (
          <button
            onClick={onFadeOut}
            title="Slowly zoom out and fade the screen to black"
            className="flex items-center justify-center gap-2 px-2 py-1.5 rounded-lg border border-ner-border text-ner-muted hover:text-ner-text hover:bg-ner-surface transition-colors ner-focus font-mono text-[11px]"
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Fade to black</span>
          </button>
        )}
      </div>
  );

  const overlaysPanel = (
      <div key="overlays" ref={overlaysDrag.ref}
        style={overlaysDrag.style}
        className="bg-ner-panel/95 border border-ner-border rounded-xl shadow-panel p-2 flex flex-col gap-1.5 w-48 text-xs">
        <button
          onClick={toggleOverlays}
          title="Drag to move"
          {...overlaysDrag.handleProps}
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

        {/* 3D relief: turn off on slower machines for smoother panning */}
        <button
          onClick={() => onToggleLayer('showTerrain')}
          title="3D terrain relief (turn off if the map feels slow)"
          className={`flex items-center justify-between px-2 py-1.5 rounded-lg transition-colors ${
            layers.showTerrain
              ? 'bg-ner-surface text-ner-cyan border border-ner-cyan/30'
              : 'text-ner-muted hover:bg-ner-surface/60'
          }`}
        >
          <span className="flex items-center gap-2">
            <Mountain className="w-3.5 h-3.5" />
            <span>3D Terrain</span>
          </span>
          {layers.showTerrain ? (
            <Eye className="w-3 h-3 text-ner-cyan" />
          ) : (
            <EyeOff className="w-3 h-3 text-ner-muted" />
          )}
        </button>
          </>
        )}
      </div>
  );

  return (
    <>
      {/* Expanded panels: top-right (slide left when the state panel is open) */}
      <div
        className={`absolute top-20 z-20 flex flex-col gap-3 select-none transition-[right] duration-300 ease-out ${
          shiftForDetailsPanel ? 'right-6 sm:right-[472px] md:right-[512px] lg:right-[532px]' : 'right-6'
        }`}
      >
        {isNavOpen && navPanel}
        {isOverlaysOpen && overlaysPanel}
      </div>

      {/* Bottom-left dock: legend plus any minimized panels */}
      <div className="absolute bottom-6 left-6 z-20 flex flex-col items-start gap-2 select-none">
        {children}
        {(!isNavOpen || !isOverlaysOpen) && (
          <div className="flex flex-wrap items-end gap-2">
            {!isNavOpen && navPanel}
            {!isOverlaysOpen && overlaysPanel}
          </div>
        )}
      </div>
    </>
  );
};
