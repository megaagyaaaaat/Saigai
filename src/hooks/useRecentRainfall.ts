import { useEffect, useState } from 'react';
import type { RainfallTimeSeriesPoint } from '../features/rainfall/rainfall.types';

/** IMD "heavy rain" lower bound for a 24h period (64.5 mm), used as the reference line. */
export const IMD_HEAVY_RAIN_MM = 64.5;

const HISTORY_DAYS = 30;
const CACHE_TTL_MS = 10 * 60 * 1000;

export interface CurrentWeather {
  tempC: number;
  humidity: number;
  windKmh: number;
  condition: string;
  rain24hMm: number;
}

export interface RecentRainfall {
  loading: boolean;
  /** true only when the numbers came from the live API */
  live: boolean;
  series: RainfallTimeSeriesPoint[];
  last3DaysMm: number;
  last7DaysMm: number;
  last30DaysMm: number;
  peakDayMm: number;
  current?: CurrentWeather;
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

/** WMO weather interpretation codes -> short description */
function describeWeather(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code === 1) return 'Mainly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Fog';
  if (code >= 51 && code <= 57) return 'Drizzle';
  if (code >= 61 && code <= 67) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Rain showers';
  if (code === 85 || code === 86) return 'Snow showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Cloudy';
}

function parse(json: any): RecentRainfall {
  const dates: string[] = json?.daily?.time ?? [];
  const mm: number[] = (json?.daily?.precipitation_sum ?? []).map((v: number | null) => v ?? 0);
  if (dates.length === 0 || dates.length !== mm.length) throw new Error('Empty rainfall response');

  const series: RainfallTimeSeriesPoint[] = dates.map((d, i) => ({
    date: new Date(`${d}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    actualMm: round1(mm[i]),
    thresholdMm: IMD_HEAVY_RAIN_MM,
    anomalyPercent: Math.round(((mm[i] - IMD_HEAVY_RAIN_MM) / IMD_HEAVY_RAIN_MM) * 100),
  }));

  let current: CurrentWeather | undefined;
  const c = json?.current;
  if (c && typeof c.temperature_2m === 'number') {
    // rain over the 24 hours up to the current hour
    const hours: string[] = json?.hourly?.time ?? [];
    const hourly: (number | null)[] = json?.hourly?.precipitation ?? [];
    const nowIdx = hours.indexOf(String(c.time).slice(0, 13) + ':00');
    const rain24 =
      nowIdx >= 0 ? sum(hourly.slice(Math.max(0, nowIdx - 23), nowIdx + 1).map((v) => v ?? 0)) : 0;
    current = {
      tempC: round1(c.temperature_2m),
      humidity: Math.round(c.relative_humidity_2m),
      windKmh: round1(c.wind_speed_10m),
      condition: describeWeather(c.weather_code),
      rain24hMm: rain24,
    };
  }

  return {
    loading: false,
    live: true,
    series,
    last3DaysMm: sum(mm.slice(-3)),
    last7DaysMm: sum(mm.slice(-7)),
    last30DaysMm: sum(mm),
    peakDayMm: round1(Math.max(...mm)),
    current,
  };
}

// Re-selecting a state (or React dev double-mounting) reuses the same request instead of hitting the network again
const cache = new Map<string, { at: number; promise: Promise<RecentRainfall> }>();

function fetchRecent(lat: number, lon: number): Promise<RecentRainfall> {
  const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.promise;

  const url =
    'https://api.open-meteo.com/v1/forecast' +
    `?latitude=${lat.toFixed(3)}&longitude=${lon.toFixed(3)}` +
    '&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code' +
    '&hourly=precipitation' +
    '&daily=precipitation_sum' +
    `&past_days=${HISTORY_DAYS}&forecast_days=1&timezone=auto`;

  const promise = fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error(`Open-Meteo ${r.status}`);
      return r.json();
    })
    .then(parse);

  cache.set(key, { at: Date.now(), promise });
  promise.catch(() => cache.delete(key)); // never cache a failure
  return promise;
}

/**
 * Past daily rainfall plus current weather for a point (Open-Meteo, no API key, called straight from the browser).
 * Index 0 of `series` is the oldest day, the last entry is today.
 */
export function useRecentRainfall(lat: number, lon: number): RecentRainfall {
  const [state, setState] = useState<RecentRainfall>(EMPTY);

  useEffect(() => {
    let cancelled = false;
    setState(EMPTY);

    fetchRecent(lat, lon)
      .then((res) => {
        if (!cancelled) setState(res);
      })
      .catch(() => {
        if (!cancelled) setState({ ...EMPTY, loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, [lat, lon]);

  return state;
}
