import React from 'react';
import ReactECharts from 'echarts-for-react';
import type { RainfallTimeSeriesPoint } from '../../features/rainfall/rainfall.types';
import type { IncidentRecord } from '../../features/incidents/incident.types';

interface HistoricalChartsProps {
  rainfallSeries: RainfallTimeSeriesPoint[];
  /** true when rainfallSeries is real recent history rather than the offline sample */
  rainfallIsLive?: boolean;
  incidents: IncidentRecord[];
}


const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SLOPE_BINS = ['0-10', '10-20', '20-30', '30-40', '40+'];

const TRIGGER_LABELS: Record<string, string> = {
  cloudburst: 'Cloudburst',
  monsoon_rainfall: 'Monsoon rainfall',
  continuous_rain: 'Continuous rain',
  slope_cut_construction: 'Slope cutting',
  earthquake_induced: 'Earthquake',
  river_bank_erosion: 'River erosion',
  unknown: 'Unknown',
};

const tooltipStyle = {
  backgroundColor: '#171719',
  borderColor: '#2b2b30',
  textStyle: { color: '#f4f4f5', fontSize: 12, fontFamily: 'Inter' },
};
const axisText = { color: '#a1a1aa', fontSize: 10, fontFamily: 'monospace' };
const gridBase = { left: '3%', right: '4%', bottom: '4%', top: '12%', containLabel: true };
const yAxisBase = {
  type: 'value' as const,
  minInterval: 1,
  splitLine: { lineStyle: { color: '#1f1f23', type: 'dashed' as const } },
  axisLabel: axisText,
};

const barSeries = (data: number[], color: string) => ({
  type: 'bar' as const,
  barWidth: '55%',
  itemStyle: { color, borderRadius: [4, 4, 0, 0] },
  data,
});

/** Aggregates the real incident inventory into the series the charts below draw. */
function summarizeIncidents(incidents: IncidentRecord[]) {
  const byYear = new Map<number, number>();
  const byMonth = new Array(12).fill(0) as number[];
  const byTrigger = new Map<string, number>();
  const bySlope = new Array(SLOPE_BINS.length).fill(0) as number[];
  let slopeSamples = 0;

  incidents.forEach((inc) => {
    const d = new Date(inc.date);
    if (!Number.isNaN(d.getTime())) {
      byYear.set(d.getUTCFullYear(), (byYear.get(d.getUTCFullYear()) ?? 0) + 1);
      byMonth[d.getUTCMonth()] += 1;
    }
    byTrigger.set(inc.trigger, (byTrigger.get(inc.trigger) ?? 0) + 1);
    if (typeof inc.slopeDeg === 'number') {
      bySlope[Math.min(Math.floor(inc.slopeDeg / 10), SLOPE_BINS.length - 1)] += 1;
      slopeSamples += 1;
    }
  });

  // Continuous year range so gaps in the record show as empty bars instead of disappearing
  const recorded = [...byYear.keys()];
  const years =
    recorded.length > 0
      ? Array.from({ length: Math.max(...recorded) - Math.min(...recorded) + 1 }, (_, i) => Math.min(...recorded) + i)
      : [];
  const triggers = [...byTrigger.entries()].sort((a, b) => a[1] - b[1]);
  return { years, byYear, byMonth, triggers, bySlope, slopeSamples };
}

const ChartCard = ({ title, tag, option, height = 'h-52' }: { title: string; tag: string; option: object; height?: string }) => (
  <div className="bg-[#18181b] rounded-xl p-4 border border-ner-border">
    <div className="flex items-center justify-between mb-2 gap-2">
      <h4 className="font-mono text-xs font-semibold text-ner-cyan uppercase tracking-wider">{title}</h4>
      <span className="text-[10px] font-mono text-ner-muted shrink-0">{tag}</span>
    </div>
    <div className={height}>
      <ReactECharts option={option} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'canvas' }} />
    </div>
  </div>
);

export const HistoricalCharts: React.FC<HistoricalChartsProps> = ({
  rainfallSeries,
  rainfallIsLive = false,
  incidents,
}) => {
  // Option 1: Rainfall Trend vs Warning Threshold
  const rainfallChartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#171719',
      borderColor: '#2b2b30',
      textStyle: { color: '#f4f4f5', fontSize: 12, fontFamily: 'Inter' },
    },
    legend: {
      data: ['Daily Rainfall (mm)', 'Heavy-Rain Mark (mm)'],
      textStyle: { color: '#a1a1aa', fontSize: 11 },
      top: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '18%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: rainfallSeries.map((p) => p.date),
      axisLine: { lineStyle: { color: '#2b2b30' } },
      axisLabel: { color: '#a1a1aa', fontSize: 10, fontFamily: 'monospace' },
    },
    yAxis: {
      type: 'value',
      name: 'Precipitation (mm)',
      nameTextStyle: { color: '#a1a1aa', fontSize: 10 },
      splitLine: { lineStyle: { color: '#1f1f23', type: 'dashed' } },
      axisLabel: { color: '#a1a1aa', fontSize: 10, fontFamily: 'monospace' },
    },
    series: [
      {
        name: 'Daily Rainfall (mm)',
        type: 'bar',
        barWidth: '35%',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#64E2E8' },
              { offset: 1, color: '#113547' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
        data: rainfallSeries.map((p) => p.actualMm),
      },
      {
        name: 'Heavy-Rain Mark (mm)',
        type: 'line',
        itemStyle: { color: '#EF4444' },
        lineStyle: { width: 2, type: 'dashed', color: '#EF4444' },
        symbol: 'circle',
        symbolSize: 6,
        data: rainfallSeries.map((p) => p.thresholdMm),
      },
    ],
  };

  // Severity count calculation
  const severityCounts: Record<string, number> = {
    catastrophic: 0,
    severe: 0,
    moderate: 0,
    minor: 0,
  };
  incidents.forEach((inc) => {
    severityCounts[inc.severity] = (severityCounts[inc.severity] || 0) + 1;
  });

  const severityPieOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: '#171719',
      borderColor: '#2b2b30',
      textStyle: { color: '#f4f4f5', fontSize: 12 },
    },
    legend: {
      bottom: 0,
      textStyle: { color: '#a1a1aa', fontSize: 11 },
    },
    series: [
      {
        name: 'Severity Classification',
        type: 'pie',
        radius: ['45%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#171719',
          borderWidth: 2,
        },
        label: { show: false },
        emphasis: {
          label: {
            show: true,
            fontSize: 12,
            fontWeight: 'bold',
            color: '#f4f4f5',
          },
        },
        data: [
          { value: severityCounts.catastrophic, name: 'Catastrophic', itemStyle: { color: '#EF4444' } },
          { value: severityCounts.severe, name: 'Severe', itemStyle: { color: '#F97316' } },
          { value: severityCounts.moderate, name: 'Moderate', itemStyle: { color: '#F59E0B' } },
          { value: severityCounts.minor, name: 'Minor', itemStyle: { color: '#64A8FF' } },
        ],
      },
    ],
  };

  const stats = summarizeIncidents(incidents);

  const yearlyOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', ...tooltipStyle },
    grid: gridBase,
    xAxis: { type: 'category', data: stats.years.map(String), axisLabel: axisText, axisLine: { lineStyle: { color: '#2b2b30' } } },
    yAxis: yAxisBase,
    series: [{ name: 'Landslides', ...barSeries(stats.years.map((y) => stats.byYear.get(y) ?? 0), '#64E2E8') }],
  };

  const seasonalityOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', ...tooltipStyle },
    grid: gridBase,
    xAxis: { type: 'category', data: MONTHS, axisLabel: axisText, axisLine: { lineStyle: { color: '#2b2b30' } } },
    yAxis: yAxisBase,
    series: [{ name: 'Landslides', ...barSeries(stats.byMonth, '#F59E0B') }],
  };

  const triggerOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...tooltipStyle },
    grid: { ...gridBase, left: '3%' },
    xAxis: { ...yAxisBase },
    yAxis: {
      type: 'category',
      data: stats.triggers.map(([t]) => TRIGGER_LABELS[t] ?? t),
      axisLabel: axisText,
      axisLine: { lineStyle: { color: '#2b2b30' } },
    },
    series: [
      {
        name: 'Landslides',
        type: 'bar',
        barWidth: '55%',
        itemStyle: { color: '#64A8FF', borderRadius: [0, 4, 4, 0] },
        data: stats.triggers.map(([, n]) => n),
      },
    ],
  };

  const slopeOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', ...tooltipStyle },
    grid: gridBase,
    xAxis: {
      type: 'category',
      data: SLOPE_BINS.map((b) => `${b}°`),
      axisLabel: axisText,
      axisLine: { lineStyle: { color: '#2b2b30' } },
    },
    yAxis: yAxisBase,
    series: [{ name: 'Landslides', ...barSeries(stats.bySlope, '#F97316') }],
  };


  return (
    <div className="space-y-6">
      {/* Rainfall vs Threshold Chart */}
      <div className="bg-[#18181b] rounded-xl p-4 border border-ner-border">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-mono text-xs font-semibold text-ner-cyan uppercase tracking-wider">
            {rainfallIsLive
              ? `Daily Rainfall, Past ${rainfallSeries.length} Days vs IMD Heavy-Rain Mark`
              : 'Sample Rainfall vs Slope Failure Threshold'}
          </h4>
          <span className="text-[10px] font-mono text-ner-muted">
            {rainfallIsLive ? 'OPEN-METEO · LIVE' : 'OFFLINE SAMPLE'}
          </span>
        </div>
        <div className="h-56">
          <ReactECharts
            option={rainfallChartOption}
            style={{ height: '100%', width: '100%' }}
            opts={{ renderer: 'canvas' }}
          />
        </div>
      </div>

      {/* Severity Classification Pie */}
      <div className="bg-[#18181b] rounded-xl p-4 border border-ner-border">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-mono text-xs font-semibold text-ner-cyan uppercase tracking-wider">
            Historical Incident Severity Breakdown
          </h4>
          <span className="text-[10px] font-mono text-ner-muted">
            {incidents.length} RECORDS
          </span>
        </div>
        <div className="h-52">
          <ReactECharts
            option={severityPieOption}
            style={{ height: '100%', width: '100%' }}
            opts={{ renderer: 'canvas' }}
          />
        </div>
      </div>

      {incidents.length > 0 && (
        <>
          <ChartCard title="Landslides per Year" tag={`${incidents.length} RECORDS`} option={yearlyOption} />
          <ChartCard title="Seasonality: Landslides by Month" tag="MONSOON PEAK" option={seasonalityOption} />
          <ChartCard
            title="Primary Trigger"
            tag="CAUSE"
            option={triggerOption}
            height={stats.triggers.length > 4 ? 'h-60' : 'h-44'}
          />
          {stats.slopeSamples > 0 && (
            <ChartCard
              title="Terrain Slope at Failure Sites"
              tag={`${stats.slopeSamples} SITES / DEM 30m`}
              option={slopeOption}
            />
          )}
        </>
      )}
    </div>
  );
};
