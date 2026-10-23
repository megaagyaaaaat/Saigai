import React, { useState, useRef, useEffect } from 'react';
import { 
  Radar, 
  Search, 
  PenTool, 
  Layers, 
  AlertOctagon, 
  Info, 
  X,
  Compass,
  MapPin
} from 'lucide-react';
import type { RegionEntity } from '../../features/regions/region.types';
import { MOCK_REGIONS } from '../../data/mockRegions';
import { APP_CONFIG } from '../../api/apiConfig';

interface AppHeaderProps {
  onSelectRegion: (region: RegionEntity) => void;
  onResetCamera: () => void;
  isDrawingMode: boolean;
  onToggleDrawingMode: () => void;
  onToggleLayersModal: () => void;
  onOpenAboutModal: () => void;
  selectedRegion?: RegionEntity | null;
  activeWarningCount: number;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onSelectRegion,
  onResetCamera,
  isDrawingMode,
  onToggleDrawingMode,
  onToggleLayersModal,
  onOpenAboutModal,
  selectedRegion,
  activeWarningCount,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<RegionEntity[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    const matches = MOCK_REGIONS.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.statesCrossed.some((s) => s.toLowerCase().includes(q)) ||
        r.category.toLowerCase().includes(q) ||
        r.dominantGeology.toLowerCase().includes(q)
    );
    setSearchResults(matches);
  }, [searchQuery]);

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSearchResult = (region: RegionEntity) => {
    onSelectRegion(region);
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  return (
    <header className="h-16 bg-ner-panel/90 backdrop-blur-md border-b border-ner-border px-4 lg:px-6 flex items-center justify-between z-30 select-none relative">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-ner-surface border border-ner-border shadow-panel">
          <Radar className="w-5 h-5 text-ner-cyan animate-pulse" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-ner-cyan animate-ping opacity-75" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-ner-cyan" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-mono text-base font-bold tracking-wider text-ner-text">
              NER-LEWS
            </h1>
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-ner-cyan/15 text-ner-cyan border border-ner-cyan/30">
              v1.0-RC
            </span>
            {selectedRegion ? (
              <span className="hidden lg:inline-flex text-[10px] font-mono px-2 py-0.5 rounded bg-ner-cyan/10 border border-ner-cyan/30 text-ner-cyan truncate max-w-[200px]">
                AOI: {selectedRegion.name}
              </span>
            ) : (
              <span className="hidden md:inline-flex text-[10px] font-mono px-1.5 py-0.5 rounded bg-ner-surface border border-ner-border text-ner-muted">
                REGION-BASED GIS
              </span>
            )}
          </div>
          <p className="text-[11px] text-ner-muted hidden sm:block">
            Northeast India Landslide Early Warning System
          </p>
        </div>
      </div>

      {/* Center: Search & Region Navigation (Mode 3: Search and Navigate) */}
      <div className="flex-1 max-w-md mx-4 relative" ref={searchRef}>
        <div className="relative">
          <Search className="w-4 h-4 text-ner-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            placeholder="Search regions, mountain corridors, basins, highways..."
            className="w-full bg-ner-surface/80 border border-ner-border rounded-lg pl-9 pr-8 py-1.5 text-xs text-ner-text placeholder-ner-muted/60 ner-focus transition-all duration-200"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setIsSearchOpen(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ner-muted hover:text-ner-text"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {isSearchOpen && searchResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-ner-panel border border-ner-border rounded-xl shadow-panel overflow-hidden z-50 max-h-80 overflow-y-auto">
            <div className="p-2 border-b border-ner-border/50 text-[10px] font-mono text-ner-muted uppercase tracking-wider flex justify-between items-center">
              <span>Geographic Regions Found ({searchResults.length})</span>
              <span className="text-ner-cyan">Cross-State Aware</span>
            </div>
            {searchResults.map((region) => (
              <button
                key={region.id}
                onClick={() => handleSelectSearchResult(region)}
                className="w-full text-left p-3 hover:bg-ner-surface/90 border-b border-ner-border/30 last:border-none transition-colors flex items-start gap-3 group"
              >
                <MapPin className="w-4 h-4 text-ner-cyan mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-xs text-ner-text truncate">
                      {region.name}
                    </span>
                    <span className="text-[10px] font-mono text-ner-muted shrink-0">
                      {region.statesCrossed.join(' · ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-ner-muted truncate mt-0.5">
                    {region.dominantGeology}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Action Controls */}
      <div className="flex items-center gap-2">
        {/* Draw Custom Polygon Mode Toggle */}
        <button
          onClick={onToggleDrawingMode}
          title={isDrawingMode ? 'Cancel Region Drawing' : 'Draw Custom Geographic Polygon'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition-all ner-focus ${
            isDrawingMode
              ? 'bg-ner-cyan text-ner-bg border-ner-cyan shadow-glow-cyan font-bold'
              : 'bg-ner-surface border-ner-border text-ner-cyan hover:bg-ner-surface/80 hover:border-ner-cyan/40'
          }`}
        >
          <PenTool className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {isDrawingMode ? 'Drawing Active' : 'Draw Region'}
          </span>
        </button>

        {/* Reset Camera Viewport */}
        <button
          onClick={onResetCamera}
          title="Reset Viewport to Northeast India Extent"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-ner-surface border border-ner-border text-xs text-ner-muted hover:text-ner-text hover:border-ner-border-light transition-colors ner-focus"
        >
          <Compass className="w-3.5 h-3.5" />
          <span className="hidden lg:inline font-mono">Reset Frame</span>
        </button>

        {/* Map Layers Toggle */}
        <button
          onClick={onToggleLayersModal}
          title="Map Layer Controls"
          className="p-1.5 rounded-lg bg-ner-surface border border-ner-border text-ner-muted hover:text-ner-text hover:border-ner-border-light transition-colors ner-focus relative"
        >
          <Layers className="w-4 h-4" />
        </button>

        {/* Active Warning Badge */}
        {activeWarningCount > 0 && (
          <div
            title={`${activeWarningCount} Active Landslide Warnings across Northeast India`}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-ner-red/15 border border-ner-red/40 text-ner-red text-xs font-mono animate-pulse-subtle"
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span className="font-bold">{activeWarningCount}</span>
            <span className="hidden xl:inline text-[11px]">ALERTS</span>
          </div>
        )}

        {/* Telemetry Status Indicator */}
        <div className="hidden 2xl:flex items-center gap-1.5 px-2 py-1 rounded-md bg-ner-surface border border-ner-border text-[11px] font-mono text-ner-muted">
          <span className="w-2 h-2 rounded-full bg-ner-emerald animate-pulse" />
          <span>{APP_CONFIG.dataMode === 'demo' ? 'DEMO MOCK ADAPTER' : 'LIVE TELEMETRY'}</span>
        </div>

        {/* About & System Info */}
        <button
          onClick={onOpenAboutModal}
          title="NER-LEWS System Architecture & Metadata"
          className="p-1.5 rounded-lg bg-ner-surface border border-ner-border text-ner-muted hover:text-ner-text hover:border-ner-border-light transition-colors ner-focus"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
