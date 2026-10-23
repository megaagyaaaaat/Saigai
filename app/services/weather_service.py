"""Weather acquisition and analytics service for NER-LEWS."""
from datetime import datetime, timezone
import logging
from typing import Any, Dict, List, Optional, Tuple

import httpx
from fastapi import HTTPException, status

from app.core.cache import WeatherCache, weather_cache
from app.core.config import (
    DEFAULT_CACHE_TTL_SECONDS,
    DEFAULT_HTTP_TIMEOUT_SECONDS,
    NER_BOUNDS,
    OPEN_METEO_BASE_URL,
    detect_ner_state,
)
from app.schemas.weather import (
    CumulativeRainfall,
    CurrentWeather,
    DailyRainfallForecast,
    HourlyRainfallPoint,
    LocationInfo,
    Metadata,
    SoilMoisture,
    WeatherResponse,
    decode_weather_code,
)

logger = logging.getLogger(__name__)


class WeatherService:
    """Acquires, caches, and calculates weather analytics from Open-Meteo APIs."""

    def __init__(
        self,
        base_url: str = OPEN_METEO_BASE_URL,
        cache: WeatherCache = weather_cache,
        cache_ttl_seconds: int = DEFAULT_CACHE_TTL_SECONDS,
        timeout_seconds: float = DEFAULT_HTTP_TIMEOUT_SECONDS,
        http_client: Optional[httpx.AsyncClient] = None,
    ):
        self.base_url = base_url
        self.cache = cache
        self.cache_ttl = cache_ttl_seconds
        self.timeout = timeout_seconds
        self._http_client = http_client

    def validate_coordinates(self, lat: float, lon: float) -> None:
        """Validate geographic bounds for WGS 84 coordinates."""
        if not (-90.0 <= lat <= 90.0):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid latitude {lat}. Latitude must be between -90.0 and 90.0 degrees.",
            )
        if not (-180.0 <= lon <= 180.0):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid longitude {lon}. Longitude must be between -180.0 and 180.0 degrees.",
            )

    def _determine_current_hour_index(
        self, hourly_times: List[str], current_time_str: str
    ) -> int:
        """Find the index corresponding to the current hour in the hourly array."""
        if not hourly_times:
            return 0
        current_prefix = current_time_str[:13]  # "YYYY-MM-DDTHH"
        for i, t in enumerate(hourly_times):
            if t.startswith(current_prefix):
                return i
        # Fallback to the point where time transitions to future, or middle of 7 past days (index 168)
        if len(hourly_times) >= 168:
            return 167
        return len(hourly_times) - 1

    def _calculate_cumulative_rainfall(
        self, precipitation_series: List[Optional[float]], current_idx: int
    ) -> Tuple[float, float, float]:
        """
        Calculate cumulative precipitation over the preceding 24h, 72h, and 7 days (168h).
        Missing or None values are treated safely as 0.0.
        """
        cleaned_series = [p if p is not None else 0.0 for p in precipitation_series]
        
        # 24h cumulative: current hour and previous 23 hours
        start_24h = max(0, current_idx - 23)
        rain_24h = sum(cleaned_series[start_24h : current_idx + 1])

        # 72h cumulative: current hour and previous 71 hours
        start_72h = max(0, current_idx - 71)
        rain_72h = sum(cleaned_series[start_72h : current_idx + 1])

        # 7d (168h) cumulative: current hour and previous 167 hours
        start_7d = max(0, current_idx - 167)
        rain_7d = sum(cleaned_series[start_7d : current_idx + 1])

        return round(rain_24h, 2), round(rain_72h, 2), round(rain_7d, 2)

    def _evaluate_saturation_status(
        self, surface_m: Optional[float], root_m: Optional[float]
    ) -> str:
        """
        Derive soil landslide trigger saturation status from volumetric water content (m³/m³).
        Typical clay/loam thresholds:
        - > 0.38 m³/m³: Saturated (pore-water pressure buildup)
        - > 0.28 m³/m³: Wet (elevated landslide risk)
        - > 0.18 m³/m³: Moderate (standard moisture)
        - <= 0.18 m³/m³: Dry (low pore pressure)
        """
        val = root_m if root_m is not None else surface_m
        if val is None:
            return "unknown"
        if val >= 0.38:
            return "saturated"
        if val >= 0.28:
            return "wet"
        if val >= 0.18:
            return "moderate"
        return "dry"

    async def _fetch_external_weather(self, lat: float, lon: float) -> Dict[str, Any]:
        """Fetch raw weather data from Open-Meteo with past history and forecast."""
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": "temperature_2m,relative_humidity_2m,precipitation,weather_code",
            "hourly": "precipitation,soil_moisture_0_to_1cm,soil_moisture_27_to_81cm",
            "daily": "precipitation_sum,rain_sum,precipitation_hours,weather_code",
            "past_days": 7,
            "forecast_days": 7,
            "timezone": "auto",
        }

        should_close_client = False
        client = self._http_client
        if client is None:
            client = httpx.AsyncClient(timeout=self.timeout)
            should_close_client = True

        try:
            response = await client.get(self.base_url, params=params)
            if response.status_code == 429:
                logger.warning("Open-Meteo rate limit reached (HTTP 429).")
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Open-Meteo weather API rate limit exceeded. Please try again later.",
                )
            response.raise_for_status()
            return response.json()
        except httpx.TimeoutException as exc:
            logger.error("Open-Meteo API timed out for coords (%s, %s): %s", lat, lon, exc)
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="Upstream Open-Meteo weather service timed out after 8 seconds.",
            ) from exc
        except httpx.HTTPStatusError as exc:
            logger.error("Open-Meteo returned error status: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Open-Meteo service responded with HTTP error {exc.response.status_code}.",
            ) from exc
        except httpx.RequestError as exc:
            logger.error("Failed to connect to Open-Meteo: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Could not connect to external weather service: {str(exc)}",
            ) from exc
        finally:
            if should_close_client:
                await client.aclose()

    def _parse_weather_payload(
        self,
        raw: Dict[str, Any],
        lat: float,
        lon: float,
        cached: bool = False,
        freshness_seconds: float = 0.0,
        data_status: str = "fresh",
    ) -> WeatherResponse:
        """Parse raw Open-Meteo payload into strongly-typed WeatherResponse."""
        elevation = raw.get("elevation")
        state = detect_ner_state(lat, lon)
        in_ner = (
            NER_BOUNDS[0] <= lat <= NER_BOUNDS[1] and NER_BOUNDS[2] <= lon <= NER_BOUNDS[3]
        )

        location = LocationInfo(
            latitude=lat,
            longitude=lon,
            elevation_m=elevation,
            state=state,
            in_ner=in_ner,
        )

        # Current weather
        current_data = raw.get("current", {})
        current_time = current_data.get("time", datetime.now(timezone.utc).isoformat())
        current_code = current_data.get("weather_code")
        current_weather = CurrentWeather(
            timestamp=current_time,
            temperature_c=current_data.get("temperature_2m"),
            relative_humidity_percent=current_data.get("relative_humidity_2m"),
            precipitation_mm=current_data.get("precipitation"),
            weather_code=current_code,
            weather_description=decode_weather_code(current_code),
            data_category="model_analysis",
        )

        # Hourly data and cumulative rainfall calculations
        hourly = raw.get("hourly", {})
        hourly_times: List[str] = hourly.get("time", [])
        hourly_precip: List[Optional[float]] = hourly.get("precipitation", [])
        hourly_sm_surface: List[Optional[float]] = hourly.get("soil_moisture_0_to_1cm", [])
        hourly_sm_root: List[Optional[float]] = hourly.get("soil_moisture_27_to_81cm", [])

        current_idx = self._determine_current_hour_index(hourly_times, current_time)

        rain_24h, rain_72h, rain_7d = self._calculate_cumulative_rainfall(
            hourly_precip, current_idx
        )
        cumulative = CumulativeRainfall(
            rainfall_24h_mm=rain_24h,
            rainfall_72h_mm=rain_72h,
            rainfall_7d_mm=rain_7d,
            calculation_method="sum_of_hourly_open_meteo_analysis",
            data_category="historical_model_reanalysis",
        )

        # Soil moisture (latest analyzed value at current_idx)
        surface_sm = (
            hourly_sm_surface[current_idx]
            if current_idx < len(hourly_sm_surface)
            else None
        )
        root_sm = (
            hourly_sm_root[current_idx] if current_idx < len(hourly_sm_root) else None
        )
        saturation_status = self._evaluate_saturation_status(surface_sm, root_sm)

        soil = SoilMoisture(
            surface_moisture_m3_m3=surface_sm,
            root_zone_moisture_m3_m3=root_sm,
            saturation_status=saturation_status,
            is_model_estimate=True,
            measurement_type="numerical_land_surface_model_estimate",
            model_source="ECMWF Land-Surface Model (IFS / ERA5-Land)",
            disclaimer="Estimated via numerical land-surface simulation, not direct in-situ piezometer observation.",
        )

        # Daily forecast: only keep today and future forecast days
        daily = raw.get("daily", {})
        daily_times: List[str] = daily.get("time", [])
        daily_precip_sums: List[Optional[float]] = daily.get("precipitation_sum", [])
        daily_rain_sums: List[Optional[float]] = daily.get("rain_sum", [])
        daily_hours: List[Optional[float]] = daily.get("precipitation_hours", [])
        daily_codes: List[Optional[int]] = daily.get("weather_code", [])

        daily_forecast: List[DailyRainfallForecast] = []
        today_date_str = current_time[:10]  # "YYYY-MM-DD"
        for i, d_date in enumerate(daily_times):
            # Include today and future days
            if d_date >= today_date_str:
                d_code = daily_codes[i] if i < len(daily_codes) else None
                d_p_sum = daily_precip_sums[i] if i < len(daily_precip_sums) else 0.0
                d_r_sum = daily_rain_sums[i] if i < len(daily_rain_sums) else 0.0
                d_hrs = daily_hours[i] if i < len(daily_hours) else 0.0
                daily_forecast.append(
                    DailyRainfallForecast(
                        date=d_date,
                        precipitation_sum_mm=d_p_sum if d_p_sum is not None else 0.0,
                        rain_sum_mm=d_r_sum if d_r_sum is not None else 0.0,
                        precipitation_hours=d_hrs if d_hrs is not None else 0.0,
                        weather_code=d_code,
                        weather_description=decode_weather_code(d_code),
                    )
                )

        # Hourly series: past 24 hours + next 48 hours for compact dashboard series
        hourly_series: List[HourlyRainfallPoint] = []
        window_start = max(0, current_idx - 24)
        window_end = min(len(hourly_times), current_idx + 49)
        for idx in range(window_start, window_end):
            t_str = hourly_times[idx]
            p_val = hourly_precip[idx] if idx < len(hourly_precip) else 0.0
            hourly_series.append(
                HourlyRainfallPoint(
                    time=t_str,
                    precipitation_mm=p_val if p_val is not None else 0.0,
                    is_forecast=(idx > current_idx),
                )
            )

        metadata = Metadata(
            source_name="Open-Meteo Weather API",
            underlying_models="ECMWF IFS (forecasts) & ERA5-Land (historical reanalysis)",
            retrieval_timestamp=datetime.now(timezone.utc).isoformat(),
            freshness_seconds=freshness_seconds,
            cached=cached,
            data_status=data_status,
        )

        return WeatherResponse(
            location=location,
            current=current_weather,
            cumulative_rainfall=cumulative,
            soil_moisture=soil,
            daily_forecast=daily_forecast,
            hourly_series=hourly_series,
            metadata=metadata,
        )

    async def get_weather(self, lat: float, lon: float) -> WeatherResponse:
        """
        Public entrypoint: validates coordinates, checks cache, fetches external data,
        and provides graceful fallback to stale cache on upstream outages.
        """
        self.validate_coordinates(lat, lon)
        cache_key = self.cache.make_coordinate_key(lat, lon)

        # 1. Check cache hit
        cached_result = self.cache.get(cache_key)
        if cached_result is not None:
            raw_payload, age_seconds = cached_result
            return self._parse_weather_payload(
                raw=raw_payload,
                lat=lat,
                lon=lon,
                cached=True,
                freshness_seconds=age_seconds,
                data_status="cached",
            )

        # 2. Fetch fresh external data
        try:
            raw_payload = await self._fetch_external_weather(lat, lon)
            # Store in cache
            self.cache.set(cache_key, raw_payload, ttl_seconds=self.cache_ttl)
            return self._parse_weather_payload(
                raw=raw_payload,
                lat=lat,
                lon=lon,
                cached=False,
                freshness_seconds=0.0,
                data_status="fresh",
            )
        except HTTPException as exc:
            # Check if we have stale cached data to serve gracefully during degradation
            stale_result = self.cache.get_stale(cache_key)
            if stale_result is not None:
                stale_payload, stale_age = stale_result
                logger.warning(
                    "Serving stale cache (age %ss) for (%s, %s) due to upstream error: %s",
                    stale_age,
                    lat,
                    lon,
                    exc.detail,
                )
                return self._parse_weather_payload(
                    raw=stale_payload,
                    lat=lat,
                    lon=lon,
                    cached=True,
                    freshness_seconds=stale_age,
                    data_status="degraded_stale_cache",
                )
            # Re-raise if no stale fallback available
            raise exc


# Singleton weather service instance
weather_service = WeatherService()
