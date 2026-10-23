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

const NE_STATES = [
  { code: 'AS', name: 'Assam', id: 'state-assam' },
  { code: 'SK', name: 'Sikkim', id: 'reg-teesta-rangit' },
  { code: 'ML', name: 'Meghalaya', id: 'reg-shillong-escarpment' },
  { code: 'AR', name: 'Arunachal', id: 'state-arunachal-pradesh' },
  { code: 'NL', name: 'Nagaland', id: 'state-nagaland' },
  { code: 'MN', name: 'Manipur', id: 'state-manipur' },
  { code: 'MZ', name: 'Mizoram', id: 'state-mizoram' },
  { code: 'TR', name: 'Tripura', id: 'state-tripura' },
];

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
    <header className="bg-ner-panel/90 backdrop-blur-md border-b border-ner-border px-4 lg:px-6 py-2.5 flex items-center justify-between z-30 select-none relative min-h-[4rem]">
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
                STATE: {selectedRegion.name}
              </span>
            ) : (
              <span className="hidden md:inline-flex text-[10px] font-mono px-1.5 py-0.5 rounded bg-ner-surface border border-ner-border text-ner-muted">
                8 STATES GIS
              </span>
            )}
          </div>
          <p className="text-[11px] text-ner-muted hidden sm:block">
            Northeast India Landslide Early Warning System
          </p>
        </div>
      </div>

      {/* Center: Search & Quick State Selection */}
      <div className="flex-1 max-w-xl mx-4 flex flex-col gap-1.5" ref={searchRef}>
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
            placeholder="Search 8 Northeast States (Assam, Sikkim, Meghalaya...)"
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

        {/* Quick State Pills */}
        <div className="hidden md:flex items-center gap-1.5 overflow-x-auto text-[10px] font-mono py-0.5">
          <span className="text-ner-muted uppercase tracking-wider text-[9px] mr-1 shrink-0">States:</span>
          {NE_STATES.map((st) => {
            const isSelected = selectedRegion?.name.toLowerCase() === st.name.toLowerCase() || selectedRegion?.id === st.id;
            return (
              <button
                key={st.code}
                onClick={() => {
                  const match = MOCK_REGIONS.find((r) => r.id === st.id || r.name.toLowerCase().includes(st.name.toLowerCase()));
                  if (match) onSelectRegion(match);
                }}
                className={`px-2 py-0.5 rounded transition-all shrink-0 border ${
                  isSelected
                    ? 'bg-ner-cyan text-ner-bg border-ner-cyan font-bold shadow-glow-cyan'
                    : 'bg-ner-surface/70 text-ner-muted hover:text-ner-cyan hover:border-ner-cyan/40 border-ner-border/60'
                }`}
              >
                {st.name}
              </button>
            );
          })}
        </div>

        {/* Search Results Dropdown */}
        {isSearchOpen && searchResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-ner-panel border border-ner-border rounded-xl shadow-panel overflow-hidden z-50 max-h-80 overflow-y-auto">
            <div className="p-2 border-b border-ner-border/50 text-[10px] font-mono text-ner-muted uppercase tracking-wider flex justify-between items-center">
              <span>Geographic States & Regions Found ({searchResults.length})</span>
              <span className="text-ner-cyan">All 8 Northeast States</span>
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
          title="Configure Map Overlays and Imagery"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-ner-surface border border-ner-border text-xs text-ner-muted hover:text-ner-text hover:border-ner-border-light transition-colors ner-focus"
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden lg:inline font-mono">Layers</span>
        </button>

        {/* Active Emergency Warnings Badge */}
        {activeWarningCount > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-ner-red/15 border border-ner-red/30 text-ner-red text-xs font-mono animate-pulse">
            <AlertOctagon className="w-3.5 h-3.5 text-ner-red" />
            <span className="font-bold">{activeWarningCount}</span>
            <span className="hidden xl:inline">Alerts</span>
          </div>
        )}

        {/* About System Modal Trigger */}
        <button
          onClick={onOpenAboutModal}
          title="About NER-LEWS Platform & Methodology"
          className="p-1.5 rounded-lg bg-ner-surface border border-ner-border text-ner-muted hover:text-ner-text hover:border-ner-border-light transition-colors ner-focus"
          aria-label="About platform"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
