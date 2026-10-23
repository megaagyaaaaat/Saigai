"""FastAPI endpoints for weather data acquisition and analytics."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.schemas.weather import ErrorResponse, WeatherResponse
from app.services.weather_service import WeatherService, weather_service

router = APIRouter(prefix="/api", tags=["Weather Analytics"])


def get_weather_service() -> WeatherService:
    return weather_service


@router.get(
    "/weather",
    response_model=WeatherResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid Coordinates or Parameters"},
        429: {"model": ErrorResponse, "description": "Upstream Rate Limit Exceeded"},
        502: {"model": ErrorResponse, "description": "Weather Service Provider Error"},
        504: {"model": ErrorResponse, "description": "Weather Service Provider Timeout"},
    },
    summary="Get Weather Analytics & Rainfall Accumulation",
    description="""
    Acquires real-time weather analytics and precipitation forecasting from Open-Meteo for any location,
    specifically calibrated for the eight states of Northeast India (NER).
    
    Includes:
    - Current atmospheric conditions
    - 24-hour, 72-hour, and 7-day cumulative rainfall calculations
    - Surface and root-zone soil moisture (flagged as ECMWF numerical land-surface model estimates)
    - 7-day daily precipitation forecast
    - Hourly precipitation series (past 24h + next 48h)
    - Full metadata, units, data freshness, and cache tracking
    """,
)
async def get_weather(
    lat: Optional[float] = Query(None, description="Latitude in WGS 84 (-90.0 to 90.0)"),
    lon: Optional[float] = Query(None, description="Longitude in WGS 84 (-180.0 to 180.0)"),
    latitude: Optional[float] = Query(None, description="Alternative alias for lat"),
    longitude: Optional[float] = Query(None, description="Alternative alias for lon"),
    service: WeatherService = Depends(get_weather_service),
) -> WeatherResponse:
    # Resolve coordinate parameters (supports lat/lon as well as latitude/longitude)
    resolved_lat = lat if lat is not None else latitude
    resolved_lon = lon if lon is not None else longitude

    if resolved_lat is None or resolved_lon is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both latitude ('lat' or 'latitude') and longitude ('lon' or 'longitude') are required query parameters.",
        )

    return await service.get_weather(resolved_lat, resolved_lon)


@router.get("/weather/cache-stats", summary="Get Backend Cache Metrics")
async def get_cache_stats(service: WeatherService = Depends(get_weather_service)):
    """Retrieve operational metrics of the in-memory weather cache."""
    return service.cache.stats
