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
import type { WarningRecord } from '../../features/warnings/warning.types';

interface AppHeaderProps {
  onSelectRegion: (region: RegionEntity) => void;
  onResetCamera: () => void;
  isDrawingMode: boolean;
  onToggleDrawingMode: () => void;
  onToggleLayersModal: () => void;
  onOpenAboutModal: () => void;
  selectedRegion?: RegionEntity | null;
  warnings: WarningRecord[];
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
  warnings,
}) => {
  const activeWarningCount = warnings.length;
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const alertsRef = useRef<HTMLDivElement>(null);
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
      if (alertsRef.current && !alertsRef.current.contains(e.target as Node)) {
        setIsAlertsOpen(false);
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
    <header className="bg-ner-bg border-b border-ner-border/60 px-4 lg:px-6 py-2 flex items-center justify-between gap-4 z-30 select-none relative min-h-[3.25rem]">
      {/* Brand Identity */}
      <div className="flex items-center gap-2.5 shrink-0">
        <Radar className="w-5 h-5 text-ner-cyan" />
        <h1 className="font-mono text-sm font-semibold tracking-widest text-ner-text">NER-LEWS</h1>
      </div>

      {/* Center: Search & Quick State Selection */}
      <div className="flex-1 max-w-xl flex flex-col gap-1.5" ref={searchRef}>
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
            placeholder="Search states"
            className="w-full bg-ner-surface border border-transparent hover:border-ner-border rounded-lg pl-9 pr-8 py-1.5 text-xs text-ner-text placeholder-ner-muted/60 ner-focus transition-all duration-200"
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
        <div className="hidden md:flex items-center gap-1 overflow-x-auto text-[11px] font-mono">
          {NE_STATES.map((st) => {
            const isSelected = selectedRegion?.name.toLowerCase() === st.name.toLowerCase() || selectedRegion?.id === st.id;
            return (
              <button
                key={st.code}
                onClick={() => {
                  const match = MOCK_REGIONS.find((r) => r.id === st.id || r.name.toLowerCase().includes(st.name.toLowerCase()));
                  if (match) onSelectRegion(match);
                }}
                className={`px-2 py-0.5 rounded-md transition-colors shrink-0 ${
                  isSelected
                    ? 'bg-ner-cyan/15 text-ner-cyan font-semibold'
                    : 'text-ner-muted hover:text-ner-text'
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
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onToggleDrawingMode}
          title={isDrawingMode ? 'Cancel Region Drawing' : 'Draw Region'}
          aria-label="Draw region"
          className={`p-2 rounded-lg transition-colors ner-focus ${
            isDrawingMode
              ? 'bg-ner-cyan text-ner-bg'
              : 'text-ner-muted hover:text-ner-text hover:bg-ner-surface'
          }`}
        >
          <PenTool className="w-4 h-4" />
        </button>

        <button
          onClick={onResetCamera}
          title="Reset Frame"
          aria-label="Reset frame"
          className="p-2 rounded-lg text-ner-muted hover:text-ner-text hover:bg-ner-surface transition-colors ner-focus"
        >
          <Compass className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleLayersModal}
          title="Layers"
          aria-label="Layers"
          className="p-2 rounded-lg text-ner-muted hover:text-ner-text hover:bg-ner-surface transition-colors ner-focus"
        >
          <Layers className="w-4 h-4" />
        </button>

        {activeWarningCount > 0 && (
          <div className="relative" ref={alertsRef}>
            <button
              onClick={() => setIsAlertsOpen((o) => !o)}
              title="Active alerts"
              aria-label="Active alerts"
              aria-expanded={isAlertsOpen}
              className="flex items-center gap-1.5 ml-1 px-2 py-1.5 rounded-lg bg-ner-red/10 hover:bg-ner-red/20 text-ner-red text-xs font-mono transition-colors ner-focus"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span className="font-semibold">{activeWarningCount}</span>
            </button>

            {isAlertsOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-ner-panel border border-ner-border rounded-xl shadow-panel z-50">
                <div className="px-3 py-2 border-b border-ner-border/60 text-[10px] font-mono text-ner-muted uppercase tracking-wider">
                  Active alerts ({activeWarningCount})
                </div>
                {warnings.map((w) => {
                  // backend ids look like "state-meghalaya"; the app's own ids differ for a couple of states
                  const tail = w.regionId.replace(/^state-/, '');
                  const region = MOCK_REGIONS.find(
                    (r) => r.id === w.regionId || r.name.toLowerCase().replace(/\s+/g, '-') === tail
                  );
                  return (
                    <button
                      key={w.id}
                      disabled={!region}
                      onClick={() => {
                        if (region) {
                          onSelectRegion(region);
                          setIsAlertsOpen(false);
                        }
                      }}
                      className="w-full text-left px-3 py-2.5 border-b border-ner-border/30 last:border-none hover:bg-ner-surface disabled:hover:bg-transparent disabled:cursor-default transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase text-ner-red">{w.level}</span>
                        <span className="text-[10px] font-mono text-ner-muted truncate">
                          {region ? region.name : w.affectedCorridor}
                        </span>
                      </div>
                      <p className="text-xs text-ner-text mt-0.5 leading-snug">{w.title}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <button
          onClick={onOpenAboutModal}
          title="About"
          aria-label="About platform"
          className="p-2 rounded-lg text-ner-muted hover:text-ner-text hover:bg-ner-surface transition-colors ner-focus"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
