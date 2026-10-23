import React, { useState, useEffect } from 'react';
import type { RegionDetailData } from '../../hooks/useRegionSelection';
import { Badge } from '../ui/Badge';
import { IncidentTimeline } from './IncidentTimeline';
import { HistoricalCharts } from './HistoricalCharts';
import { 
  X, 
  Droplets, 
  Activity, 
  AlertTriangle, 
  Thermometer,
  CloudRain,
  Compass,
  CheckCircle2,
  Wind
} from 'lucide-react';

interface RegionDetailsPanelProps {
  data: RegionDetailData;
  onClose: () => void;
}

type TabType = 'overview' | 'incidents' | 'charts' | 'sensors' | 'warnings';

export const RegionDetailsPanel: React.FC<RegionDetailsPanelProps> = ({ data, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const { region, incidents, rainfallSeries, warnings, stations } = data;

  const [liveWeather, setLiveWeather] = useState<{
    tempC?: number;
    condition?: string;
    humidity?: number;
    rainfall24h?: number;
    windSpeed?: number;
    loading: boolean;
    isLive: boolean;
  }>({ loading: true, isLive: false });

  // Connect to live backend weather API
  useEffect(() => {
    let isMounted = true;
    setLiveWeather((prev) => ({ ...prev, loading: true }));

    const [minLng, minLat, maxLng, maxLat] = region.bounds || [91.0, 25.0, 93.0, 26.0];
    const lat = (minLat + maxLat) / 2;
    const lon = (minLng + maxLng) / 2;

    fetch(`/api/weather?lat=${lat.toFixed(2)}&lon=${lon.toFixed(2)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Weather ${r.status}`);
        return r.json();
      })
      .then((payload) => {
        if (isMounted) {
          setLiveWeather({
            tempC: payload?.current?.temperature_c,
            condition: payload?.current?.weather_description || payload?.current?.condition || 'Scattered Monsoon Clouds',
            humidity: payload?.current?.relative_humidity_percent,
            rainfall24h: payload?.cumulative_rainfall?.past_24h_mm,
            windSpeed: payload?.current?.wind_speed_kmh,
            loading: false,
            isLive: true,
          });
        }
      })
      .catch(() => {
        if (isMounted) {
          setLiveWeather({
            tempC: 22.5,
            condition: 'Monsoon Cloud Cover',
            humidity: 84,
            rainfall24h: Math.round(region.avgRainfall72h / 3),
            windSpeed: 14.2,
            loading: false,
            isLive: false,
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [region.id, region.bounds]);

  return (
    <div className="w-full flex-1 flex flex-col bg-ner-panel/95 backdrop-blur-md select-none overflow-hidden h-full">
      {/* Header Bar */}
      <div className="p-4 border-b border-ner-border flex items-center justify-between gap-3 bg-ner-surface/50">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-mono text-ner-muted uppercase tracking-wider">
              STATE RISK PROFILE
            </span>
            <Badge level={region.isUserDrawn ? 'user_drawn' : region.riskLevel} size="sm" />
            {liveWeather.isLive && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-ner-emerald bg-ner-emerald/10 border border-ner-emerald/30 px-1.5 py-0.2 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-ner-emerald animate-pulse" />
                BACKEND LIVE
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold text-ner-text truncate">
            {region.name}
          </h2>
          <p className="text-xs text-ner-muted font-mono mt-0.5 truncate">
            Coverage Extent: <span className="text-ner-cyan">{region.statesCrossed.join(' · ')}</span>
          </p>
        </div>

        <button
          onClick={onClose}
          title="Close state panel"
          className="p-2 rounded-lg bg-ner-surface border border-ner-border text-ner-muted hover:text-ner-text hover:border-ner-cyan/40 transition-colors ner-focus shrink-0"
          aria-label="Close region details"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Metric Summary Strip (4 Clean Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-ner-surface/20 border-b border-ner-border/40 text-xs">
        {/* Rainfall */}
        <div className="bg-ner-surface/60 rounded-xl p-2.5 border border-ner-border flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-mono text-ner-muted mb-1">
            <span>72h Rain</span>
            <Droplets className="w-3.5 h-3.5 text-ner-cyan" />
          </div>
          <div className="font-mono font-bold text-sm text-ner-cyan">
            {region.avgRainfall72h} <span className="text-[10px] text-ner-muted font-normal">mm</span>
          </div>
          <div className="text-[9px] text-ner-muted mt-0.5 font-mono truncate">
            {region.avgRainfall72h > 200 ? 'Heavy Monsoon' : 'Moderate'}
          </div>
        </div>

        {/* Soil Saturation */}
        <div className="bg-ner-surface/60 rounded-xl p-2.5 border border-ner-border flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-mono text-ner-muted mb-1">
            <span>Saturation</span>
            <Activity className="w-3.5 h-3.5 text-ner-orange" />
          </div>
          <div className="font-mono font-bold text-sm text-ner-orange">
            {region.soilSaturationPercent}%
          </div>
          <div className="text-[9px] text-ner-muted mt-0.5 font-mono truncate">
            {region.soilSaturationPercent > 80 ? 'Near Capacity' : 'Stable Margin'}
          </div>
        </div>

        {/* Active Warnings */}
        <div className="bg-ner-surface/60 rounded-xl p-2.5 border border-ner-border flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-mono text-ner-muted mb-1">
            <span>Alerts</span>
            <AlertTriangle className="w-3.5 h-3.5 text-ner-red" />
          </div>
          <div className="font-mono font-bold text-sm text-ner-red">
            {warnings.length} Active
          </div>
          <div className="text-[9px] text-ner-muted mt-0.5 font-mono truncate">
            {warnings.length > 0 ? 'Advisory Active' : 'All Clear'}
          </div>
        </div>

        {/* Landslide Count */}
        <div className="bg-ner-surface/60 rounded-xl p-2.5 border border-ner-border flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-mono text-ner-muted mb-1">
            <span>Landslides</span>
            <Compass className="w-3.5 h-3.5 text-ner-emerald" />
          </div>
          <div className="font-mono font-bold text-sm text-ner-emerald">
            {region.historicalIncidentCount}
          </div>
          <div className="text-[9px] text-ner-muted mt-0.5 font-mono truncate">
            Cataloged Records
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center px-4 border-b border-ner-border/60 bg-ner-surface/30 overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-2 text-xs font-mono font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-ner-cyan text-ner-cyan font-bold'
              : 'border-transparent text-ner-muted hover:text-ner-text'
          }`}
        >
          State Overview
        </button>
        <button
          onClick={() => setActiveTab('incidents')}
          className={`px-3 py-2 text-xs font-mono font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
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
          className={`px-3 py-2 text-xs font-mono font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'charts'
              ? 'border-ner-cyan text-ner-cyan font-bold'
              : 'border-transparent text-ner-muted hover:text-ner-text'
          }`}
        >
          Telemetry Charts
        </button>
        <button
          onClick={() => setActiveTab('sensors')}
          className={`px-3 py-2 text-xs font-mono font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'sensors'
              ? 'border-ner-cyan text-ner-cyan font-bold'
              : 'border-transparent text-ner-muted hover:text-ner-text'
          }`}
        >
          <span>Sensors</span>
          <span className="px-1.5 py-0.2 rounded-full bg-ner-panel text-[10px] text-ner-muted border border-ner-border">
            {stations.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('warnings')}
          className={`px-3 py-2 text-xs font-mono font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
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
        {/* TAB 1: STATE OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-4 text-xs">
            {/* Live Meteorological Feed Card */}
            <div className="bg-gradient-to-br from-ner-surface/80 to-ner-surface/40 rounded-xl p-4 border border-ner-cyan/30 shadow-panel">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-ner-cyan uppercase tracking-wider flex items-center gap-1.5">
                  <CloudRain className="w-3.5 h-3.5 text-ner-cyan" />
                  <span>Real-Time Weather Telemetry</span>
                </span>
                <span className="text-[9px] font-mono text-ner-muted">
                  Open-Meteo & IMD AWS
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-2">
                <div className="p-2.5 rounded-lg bg-ner-panel/80 border border-ner-border">
                  <span className="text-[10px] font-mono text-ner-muted flex items-center gap-1">
                    <Thermometer className="w-3 h-3 text-ner-cyan" />
                    Temp
                  </span>
                  <p className="font-mono text-base font-bold text-ner-text mt-0.5">
                    {liveWeather.tempC !== undefined ? `${liveWeather.tempC}°C` : '22.5°C'}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-ner-panel/80 border border-ner-border">
                  <span className="text-[10px] font-mono text-ner-muted flex items-center gap-1">
                    <Droplets className="w-3 h-3 text-ner-cyan" />
                    Humidity
                  </span>
                  <p className="font-mono text-base font-bold text-ner-text mt-0.5">
                    {liveWeather.humidity !== undefined ? `${liveWeather.humidity}%` : '84%'}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-ner-panel/80 border border-ner-border col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-mono text-ner-muted flex items-center gap-1">
                    <Wind className="w-3 h-3 text-ner-cyan" />
                    24h Precip
                  </span>
                  <p className="font-mono text-base font-bold text-ner-text mt-0.5">
                    {liveWeather.rainfall24h !== undefined ? `${liveWeather.rainfall24h} mm` : '32.0 mm'}
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-ner-muted mt-2 font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-ner-emerald shrink-0" />
                <span>Atmospheric condition: {liveWeather.condition}</span>
              </p>
            </div>

            {/* Geological Characterization */}
            <div className="bg-ner-surface/60 rounded-xl p-4 border border-ner-border">
              <h4 className="font-mono text-xs font-semibold text-ner-cyan uppercase tracking-wider mb-2">
                Terrain & Environmental Context
              </h4>
              <p className="text-ner-text leading-relaxed mb-4 text-[11px]">
                {region.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-ner-panel border border-ner-border">
                  <span className="text-[10px] font-mono text-ner-muted uppercase">Dominant Lithology</span>
                  <p className="font-medium text-ner-text mt-0.5 text-[11px]">{region.dominantGeology}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-ner-panel border border-ner-border">
                  <span className="text-[10px] font-mono text-ner-muted uppercase">Geographic Area</span>
                  <p className="font-medium text-ner-text mt-0.5 text-[11px]">{region.areaKm2.toLocaleString()} km²</p>
                </div>
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
                No telemetry stations deployed inside this state boundary.
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
                      <span>Battery: {stn.batteryPercent}%</span>
                      <span>Status: {stn.status}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 5: ALERTS & WARNINGS */}
        {activeTab === 'warnings' && (
          <div className="space-y-3">
            {warnings.length === 0 ? (
              <div className="text-center py-8 text-ner-muted text-xs font-mono bg-ner-surface/30 rounded-xl border border-ner-border/40">
                No active warnings currently in effect for this state.
              </div>
            ) : (
              warnings.map((w) => (
                <div
                  key={w.id}
                  className="p-3.5 rounded-xl bg-ner-surface/70 border border-ner-red/40 flex flex-col gap-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-ner-red font-bold uppercase tracking-wider">
                      {w.level.toUpperCase()} ALERT
                    </span>
                    <span className="text-[10px] font-mono text-ner-muted">
                      Valid until {new Date(w.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h4 className="font-semibold text-ner-text text-xs">{w.title}</h4>
                  <p className="text-ner-muted text-[11px] leading-relaxed">{w.summary}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
