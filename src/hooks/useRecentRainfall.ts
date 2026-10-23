import { useEffect, useState } from 'react';
import type { RainfallTimeSeriesPoint } from '../features/rainfall/rainfall.types';

/** IMD "heavy rain" lower bound for a 24h period (64.5 mm), used as the reference line. */
export const IMD_HEAVY_RAIN_MM = 64.5;

const HISTORY_DAYS = 30;

export interface RecentRainfall {
  loading: boolean;
  /** true only when the numbers came from the live API */
  live: boolean;
  series: RainfallTimeSeriesPoint[];
  last3DaysMm: number;
  last7DaysMm: number;
  last30DaysMm: number;
  peakDayMm: number;
}

const EMPTY: RecentRainfall = {
  loading: true,
  live: false,
  series: [],
  last3DaysMm: 0,
  last7DaysMm: 0,
  last30DaysMm: 0,
  peakDayMm: 0,
};

const round1 = (n: number) => Math.round(n * 10) / 10;
const sum = (xs: number[]) => round1(xs.reduce((a, b) => a + b, 0));

/**
 * Past daily rainfall for a point (Open-Meteo, no API key). Index 0 is the oldest day, the last entry is today.
 */
export function useRecentRainfall(lat: number, lon: number): RecentRainfall {
  const [state, setState] = useState<RecentRainfall>(EMPTY);

  useEffect(() => {
    const controller = new AbortController();
    setState(EMPTY);

    const url =
      'https://api.open-meteo.com/v1/forecast' +
      `?latitude=${lat.toFixed(3)}&longitude=${lon.toFixed(3)}` +
      `&daily=precipitation_sum&past_days=${HISTORY_DAYS}&forecast_days=1&timezone=auto`;

    fetch(url, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`Open-Meteo ${r.status}`);
        return r.json();
      })
      .then((json) => {
        const dates: string[] = json?.daily?.time ?? [];
        const mm: number[] = (json?.daily?.precipitation_sum ?? []).map((v: number | null) => v ?? 0);
        if (dates.length === 0 || dates.length !== mm.length) throw new Error('Empty rainfall response');

        const series: RainfallTimeSeriesPoint[] = dates.map((d, i) => ({
          date: new Date(`${d}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
          actualMm: round1(mm[i]),
          thresholdMm: IMD_HEAVY_RAIN_MM,
          anomalyPercent: Math.round(((mm[i] - IMD_HEAVY_RAIN_MM) / IMD_HEAVY_RAIN_MM) * 100),
        }));

        setState({
          loading: false,
          live: true,
          series,
          last3DaysMm: sum(mm.slice(-3)),
          last7DaysMm: sum(mm.slice(-7)),
          last30DaysMm: sum(mm),
          peakDayMm: round1(Math.max(...mm)),
        });
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        setState({ ...EMPTY, loading: false });
      });

    return () => controller.abort();
  }, [lat, lon]);

  return state;
}
