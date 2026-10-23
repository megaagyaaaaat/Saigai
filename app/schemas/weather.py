"""Pydantic schemas for the NER-LEWS Weather Module."""
from datetime import datetime, timezone
from typing import Dict, List, Optional
from pydantic import BaseModel, Field

# WMO Weather code mapping helper
WMO_CODE_MAP: Dict[int, str] = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
}


def decode_weather_code(code: Optional[int]) -> str:
    """Translate WMO code into human-readable description."""
    if code is None:
        return "Unknown"
    return WMO_CODE_MAP.get(code, f"Code {code}")


class LocationInfo(BaseModel):
    """Geographic coordinates, resolved elevation, and region classification."""

    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude in WGS 84")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude in WGS 84")
    elevation_m: Optional[float] = Field(None, description="Grid terrain elevation in meters above sea level")
    state: str = Field(..., description="Matched Northeast Indian state or outside boundary")
    in_ner: bool = Field(..., description="Flag indicating if coordinate is inside Northeast India corridor")


class CurrentWeather(BaseModel):
    """Current or latest analyzed atmospheric conditions."""

    timestamp: str = Field(..., description="ISO 8601 timestamp of the latest reading")
    temperature_c: Optional[float] = Field(None, description="Air temperature at 2m above ground in Celsius")
    relative_humidity_percent: Optional[float] = Field(None, description="Relative humidity percentage")
    precipitation_mm: Optional[float] = Field(None, description="Current precipitation rate in mm")
    weather_code: Optional[int] = Field(None, description="WMO numerical weather code")
    weather_description: str = Field(..., description="Human-readable weather condition")
    data_category: str = Field(
        default="model_analysis",
        description="Identifies that this is numerical model analysis, not in-situ station gauge",
    )


class CumulativeRainfall(BaseModel):
    """Calculated antecedent precipitation critical for landslide trigger thresholds."""

    rainfall_24h_mm: float = Field(..., description="Cumulative precipitation in previous 24 hours")
    rainfall_72h_mm: float = Field(..., description="Cumulative precipitation in previous 72 hours")
    rainfall_7d_mm: float = Field(..., description="Cumulative precipitation in previous 7 days")
    calculation_method: str = Field(
        default="sum_of_hourly_open_meteo_analysis",
        description="Aggregation method across previous hourly series",
    )
    data_category: str = Field(
        default="historical_model_reanalysis",
        description="Distinguishes calculated historical estimate from real-time physical gauge",
    )


class SoilMoisture(BaseModel):
    """Soil moisture content explicitly flagged as numerical land-surface model estimates."""

    surface_moisture_m3_m3: Optional[float] = Field(
        None, description="Surface layer (0-1 cm) volumetric water content in m³/m³"
    )
    root_zone_moisture_m3_m3: Optional[float] = Field(
        None, description="Root-zone layer (27-81 cm) volumetric water content in m³/m³"
    )
    saturation_status: str = Field(
        ..., description="Qualitative landslide saturation status: dry, moderate, wet, saturated"
    )
    is_model_estimate: bool = Field(
        default=True,
        description="CRITICAL: True indicates value is a model estimate, NOT a physical piezometer or in-situ observation",
    )
    measurement_type: str = Field(
        default="numerical_land_surface_model_estimate",
        description="Data type classification",
    )
    model_source: str = Field(
        default="ECMWF Land-Surface Model (IFS / ERA5-Land)",
        description="Underlying numerical assimilation model",
    )
    disclaimer: str = Field(
        default="Estimated via land-surface simulation; not a direct borehole piezometer or sensor observation.",
        description="Scientific usage disclaimer",
    )


class HourlyRainfallPoint(BaseModel):
    """Hourly precipitation data point for time-series charts."""

    time: str = Field(..., description="ISO 8601 hour timestamp")
    precipitation_mm: float = Field(..., description="Precipitation in mm during this hour")
    is_forecast: bool = Field(..., description="True if future forecast hour; False if past historical hour")


class DailyRainfallForecast(BaseModel):
    """Daily forecast precipitation for future hazard projection."""

    date: str = Field(..., description="Calendar date YYYY-MM-DD")
    precipitation_sum_mm: float = Field(..., description="Total forecasted precipitation for the day in mm")
    rain_sum_mm: Optional[float] = Field(None, description="Total forecasted rain for the day in mm")
    precipitation_hours: Optional[float] = Field(None, description="Number of hours with precipitation")
    weather_code: Optional[int] = Field(None, description="WMO weather code")
    weather_description: str = Field(..., description="Weather condition description")


class Metadata(BaseModel):
    """Source, attribution, freshness, and quality assurance metadata."""

    source_name: str = Field(
        default="Open-Meteo Weather API",
        description="External meteorological data provider",
    )
    underlying_models: str = Field(
        default="ECMWF IFS (forecasts) & ERA5-Land (historical reanalysis)",
        description="Physical models providing data",
    )
    retrieval_timestamp: str = Field(..., description="UTC ISO 8601 timestamp when data was fetched or served")
    freshness_seconds: float = Field(..., description="Age of data in seconds relative to current time")
    cached: bool = Field(..., description="True if response was served from backend cache")
    data_status: str = Field(
        ..., description="Data status: 'fresh', 'cached', 'degraded_stale_cache'"
    )
    units: Dict[str, str] = Field(
        default_factory=lambda: {
            "temperature": "°C",
            "precipitation": "mm",
            "cumulative_rainfall": "mm",
            "soil_moisture": "m³/m³",
            "relative_humidity": "%",
            "elevation": "meters",
        }
    )


class WeatherResponse(BaseModel):
    """Structured response payload for GET /api/weather."""

    location: LocationInfo
    current: CurrentWeather
    cumulative_rainfall: CumulativeRainfall
    soil_moisture: SoilMoisture
    daily_forecast: List[DailyRainfallForecast]
    hourly_series: List[HourlyRainfallPoint]
    metadata: Metadata


class ErrorDetail(BaseModel):
    """Standardized error details."""

    code: str
    message: str
    detail: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ErrorResponse(BaseModel):
    """Standardized top-level error response."""

    error: ErrorDetail
