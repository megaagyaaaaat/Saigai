import React, { useState } from 'react';
import type { RegionDetailData } from '../../hooks/useRegionSelection';
import { Badge } from '../ui/Badge';
import { IncidentTimeline } from './IncidentTimeline';
import { HistoricalCharts } from './HistoricalCharts';
import { 
  X, 
  Droplets, 
  Activity, 
  AlertTriangle, 
  Radio, 
  Battery, 
  ShieldAlert
} from 'lucide-react';

interface RegionDetailsPanelProps {
  data: RegionDetailData;
  onClose: () => void;
}

type TabType = 'overview' | 'incidents' | 'charts' | 'sensors' | 'warnings';

export const RegionDetailsPanel: React.FC<RegionDetailsPanelProps> = ({ data, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const { region, incidents, rainfallSeries, warnings, stations } = data;

  return (
    <div className="w-full flex-1 flex flex-col bg-ner-panel/95 backdrop-blur-md select-none overflow-hidden h-full">
      {/* Header Bar */}
      <div className="p-4 border-b border-ner-border flex items-center justify-between gap-4 bg-ner-surface/40">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono text-ner-muted uppercase tracking-wider">
              Selected Geographic Region
            </span>
            <Badge level={region.isUserDrawn ? 'user_drawn' : region.riskLevel} size="sm" />
          </div>
          <h2 className="text-base font-bold text-ner-text flex items-center gap-2">
            <span>{region.name}</span>
          </h2>
          <p className="text-xs text-ner-muted font-mono mt-0.5">
            Cross-State Extent: <span className="text-ner-cyan">{region.statesCrossed.join(' · ')}</span>
          </p>
        </div>

        <button
          onClick={onClose}
          title="Deselect region and return to regional overview"
          className="p-2 rounded-lg bg-ner-surface border border-ner-border text-ner-muted hover:text-ner-text hover:border-ner-border-light transition-colors ner-focus"
          aria-label="Close region details"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Metric Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4 bg-ner-surface/20 border-b border-ner-border/40 text-xs">
        {/* Rainfall */}
        <div className="bg-ner-surface/60 rounded-xl p-2.5 border border-ner-border">
          <div className="flex items-center justify-between text-[11px] font-mono text-ner-muted mb-1">
            <span>72h Rain</span>
            <Droplets className="w-3.5 h-3.5 text-ner-cyan" />
          </div>
          <div className="font-mono font-bold text-sm text-ner-cyan">
            {region.avgRainfall72h} <span className="text-[10px] text-ner-muted">mm</span>
          </div>
          <div className="text-[9px] text-ner-muted mt-0.5 font-mono">
            {region.avgRainfall72h > 200 ? 'Threshold Exceeded' : 'Normal Range'}
          </div>
        </div>

        {/* Soil Saturation */}
        <div className="bg-ner-surface/60 rounded-xl p-2.5 border border-ner-border">
          <div className="flex items-center justify-between text-[11px] font-mono text-ner-muted mb-1">
            <span>Saturation</span>
            <Activity className="w-3.5 h-3.5 text-ner-orange" />
          </div>
          <div className="font-mono font-bold text-sm text-ner-orange">
            {region.soilSaturationPercent}%
          </div>
          <div className="text-[9px] text-ner-muted mt-0.5 font-mono">
            Pore Pressure High
          </div>
        </div>

        {/* Active Warnings */}
        <div className="bg-ner-surface/60 rounded-xl p-2.5 border border-ner-border">
          <div className="flex items-center justify-between text-[11px] font-mono text-ner-muted mb-1">
            <span>Warnings</span>
            <AlertTriangle className="w-3.5 h-3.5 text-ner-red" />
          </div>
          <div className="font-mono font-bold text-sm text-ner-red">
            {warnings.length} Active
          </div>
          <div className="text-[9px] text-ner-muted mt-0.5 font-mono">
            {warnings.some((w) => w.level === 'emergency') ? 'Red Alert Issued' : 'Monitoring'}
          </div>
        </div>

        {/* Stations Online */}
        <div className="bg-ner-surface/60 rounded-xl p-2.5 border border-ner-border">
          <div className="flex items-center justify-between text-[11px] font-mono text-ner-muted mb-1">
            <span>Sensors</span>
            <Radio className="w-3.5 h-3.5 text-ner-emerald" />
          </div>
          <div className="font-mono font-bold text-sm text-ner-emerald">
            {stations.length} Array
          </div>
          <div className="text-[9px] text-ner-muted mt-0.5 font-mono">
            Telemetry Synced
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center px-4 border-b border-ner-border/60 bg-ner-surface/30 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-2.5 text-xs font-mono font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-ner-cyan text-ner-cyan font-bold'
              : 'border-transparent text-ner-muted hover:text-ner-text'
          }`}
        >
          Regional Profile
        </button>
        <button
          onClick={() => setActiveTab('incidents')}
          className={`px-3 py-2.5 text-xs font-mono font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'incidents'
              ? 'border-ner-cyan text-ner-cyan font-bold'
              : 'border-transparent text-ner-muted hover:text-ner-text'
          }`}
        >
          <span>Incidents</span>
          <span className="px-1.5 py-0.2 rounded-full bg-ner-panel text-[10px] text-ner-muted border border-ner-border">
            {incidents.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('charts')}
          className={`px-3 py-2.5 text-xs font-mono font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'charts'
              ? 'border-ner-cyan text-ner-cyan font-bold'
              : 'border-transparent text-ner-muted hover:text-ner-text'
          }`}
        >
          Telemetry Charts
        </button>
        <button
          onClick={() => setActiveTab('sensors')}
          className={`px-3 py-2.5 text-xs font-mono font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'sensors'
              ? 'border-ner-cyan text-ner-cyan font-bold'
              : 'border-transparent text-ner-muted hover:text-ner-text'
          }`}
        >
          <span>Sensor Stations</span>
          <span className="px-1.5 py-0.2 rounded-full bg-ner-panel text-[10px] text-ner-muted border border-ner-border">
            {stations.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('warnings')}
          className={`px-3 py-2.5 text-xs font-mono font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'warnings'
              ? 'border-ner-red text-ner-red font-bold'
              : 'border-transparent text-ner-muted hover:text-ner-text'
          }`}
        >
          <span>Alerts & Warnings</span>
          {warnings.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-ner-red/20 text-[10px] text-ner-red border border-ner-red/40 animate-pulse">
              {warnings.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-4 text-xs">
            <div className="bg-ner-surface/60 rounded-xl p-4 border border-ner-border">
              <h4 className="font-mono text-xs font-semibold text-ner-cyan uppercase tracking-wider mb-2">
                Geological & Environmental Characterization
              </h4>
              <p className="text-ner-text leading-relaxed mb-4">
                {region.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-ner-panel border border-ner-border">
                  <span className="text-[10px] font-mono text-ner-muted uppercase">Lithology & Rock Formation</span>
                  <p className="font-medium text-ner-text mt-0.5">{region.dominantGeology}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-ner-panel border border-ner-border">
                  <span className="text-[10px] font-mono text-ner-muted uppercase">Surface Area</span>
                  <p className="font-medium text-ner-text mt-0.5">{region.areaKm2.toLocaleString()} km²</p>
                </div>
              </div>
            </div>

            {/* Regional Hazard Classification Context */}
            <div className="bg-ner-surface/60 rounded-xl p-4 border border-ner-border">
              <h4 className="font-mono text-xs font-semibold text-ner-cyan uppercase tracking-wider mb-2">
                Early Warning Decision Framework
              </h4>
              <p className="text-ner-muted leading-relaxed mb-3">
                Early warning thresholds for this zone are calibrated dynamically based on antecedent rainfall accumulation, soil matric suction data, and borehole inclinometer displacement.
              </p>
              <div className="flex items-center gap-2 text-[11px] font-mono text-ner-cyan bg-ner-panel/80 p-2.5 rounded-lg border border-ner-border">
                <ShieldAlert className="w-4 h-4 text-ner-cyan shrink-0" />
                <span>Authoritative Warning Dissemination Engine Ready for Backend Hook</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INCIDENTS */}
        {activeTab === 'incidents' && <IncidentTimeline incidents={incidents} />}

        {/* TAB 3: CHARTS */}
        {activeTab === 'charts' && (
          <HistoricalCharts rainfallSeries={rainfallSeries} incidents={incidents} />
        )}

        {/* TAB 4: SENSORS */}
        {activeTab === 'sensors' && (
          <div className="space-y-3">
            {stations.length === 0 ? (
              <div className="text-center py-8 text-ner-muted text-xs font-mono bg-ner-surface/30 rounded-xl border border-ner-border/40">
                No telemetry stations deployed inside this boundary.
              </div>
            ) : (
              stations.map((stn) => (
                <div
                  key={stn.id}
                  className="bg-ner-surface/60 rounded-xl p-3.5 border border-ner-border flex items-start justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-ner-text">{stn.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-ner-panel border border-ner-border text-ner-cyan">
                        {stn.type}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-ner-muted space-x-2">
                      <span>Elev: {stn.elevationM}m</span>
                      <span>•</span>
                      <span>Active Sensors: {stn.sensorsActive.join(', ')}</span>
                    </div>
                    <div className="text-[10px] text-ner-muted/80 mt-1 font-mono">
                      Last Ping: {new Date(stn.lastTransmission).toLocaleTimeString()}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <Badge level={stn.status} size="sm" />
                    <span className="text-[11px] font-mono text-ner-muted flex items-center gap-1">
                      <Battery className="w-3.5 h-3.5 text-ner-emerald" />
                      {stn.batteryPercent}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 5: WARNINGS */}
        {activeTab === 'warnings' && (
          <div className="space-y-3">
            {warnings.length === 0 ? (
              <div className="text-center py-8 text-ner-emerald text-xs font-mono bg-ner-surface/30 rounded-xl border border-ner-emerald/20">
                ✓ No active hazard advisories currently in effect for this region.
              </div>
            ) : (
              warnings.map((wrn) => (
                <div
                  key={wrn.id}
                  className={`rounded-xl p-4 border text-xs ${
                    wrn.level === 'emergency'
                      ? 'bg-ner-red/10 border-ner-red/40'
                      : 'bg-ner-orange/10 border-ner-orange/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-bold text-sm text-ner-text">{wrn.title}</h4>
                    <Badge level={wrn.level === 'emergency' ? 'critical' : 'high'} size="sm" />
                  </div>
                  <p className="text-ner-muted mb-3 leading-relaxed">{wrn.summary}</p>

                  <div className="bg-ner-panel/80 p-3 rounded-lg border border-ner-border mb-2">
                    <span className="text-[10px] font-mono text-ner-cyan uppercase tracking-wider block mb-1">
                      Recommended Mitigation Directive
                    </span>
                    <p className="text-ner-text font-medium">{wrn.recommendedAction}</p>
                  </div>

                  <div className="text-[10px] font-mono text-ner-muted flex items-center justify-between pt-2 border-t border-ner-border/30">
                    <span>Issued By: {wrn.sourceAuthority}</span>
                    <span>Valid until: {new Date(wrn.expiresAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
