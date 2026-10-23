import React from 'react';
import ReactECharts from 'echarts-for-react';
import type { RainfallTimeSeriesPoint } from '../../features/rainfall/rainfall.types';
import type { IncidentRecord } from '../../features/incidents/incident.types';

interface HistoricalChartsProps {
  rainfallSeries: RainfallTimeSeriesPoint[];
  incidents: IncidentRecord[];
}

export const HistoricalCharts: React.FC<HistoricalChartsProps> = ({
  rainfallSeries,
  incidents,
}) => {
  // Option 1: Rainfall Trend vs Warning Threshold
  const rainfallChartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#111C29',
      borderColor: '#253443',
      textStyle: { color: '#EDF4FA', fontSize: 12, fontFamily: 'Inter' },
    },
    legend: {
      data: ['Observed Rainfall (mm)', 'Threshold Limit (mm)'],
      textStyle: { color: '#96A8BA', fontSize: 11 },
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
      axisLine: { lineStyle: { color: '#253443' } },
      axisLabel: { color: '#96A8BA', fontSize: 10, fontFamily: 'monospace' },
    },
    yAxis: {
      type: 'value',
      name: 'Precipitation (mm)',
      nameTextStyle: { color: '#96A8BA', fontSize: 10 },
      splitLine: { lineStyle: { color: '#1B2735', type: 'dashed' } },
      axisLabel: { color: '#96A8BA', fontSize: 10, fontFamily: 'monospace' },
    },
    series: [
      {
        name: 'Observed Rainfall (mm)',
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
        name: 'Threshold Limit (mm)',
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
      backgroundColor: '#111C29',
      borderColor: '#253443',
      textStyle: { color: '#EDF4FA', fontSize: 12 },
    },
    legend: {
      bottom: 0,
      textStyle: { color: '#96A8BA', fontSize: 11 },
    },
    series: [
      {
        name: 'Severity Classification',
        type: 'pie',
        radius: ['45%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#111C29',
          borderWidth: 2,
        },
        label: { show: false },
        emphasis: {
          label: {
            show: true,
            fontSize: 12,
            fontWeight: 'bold',
            color: '#EDF4FA',
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

  return (
    <div className="space-y-6">
      {/* Rainfall vs Threshold Chart */}
      <div className="bg-ner-surface/60 rounded-xl p-4 border border-ner-border">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-mono text-xs font-semibold text-ner-cyan uppercase tracking-wider">
            7-Day Cumulative Rainfall vs Slope Failure Threshold
          </h4>
          <span className="text-[10px] font-mono text-ner-muted">IMD / AWS TELEMETRY</span>
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
      <div className="bg-ner-surface/60 rounded-xl p-4 border border-ner-border">
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
    </div>
  );
};
