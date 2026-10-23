"""Automated test suite for NER-LEWS Weather Service and API."""
from typing import Any, Dict
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
import httpx

from app.core.cache import WeatherCache
from app.main import app
from app.services.weather_service import WeatherService


def generate_mock_open_meteo_payload(
    base_time: str = "2026-10-23T19:00",
    precip_val: float = 1.5,
) -> Dict[str, Any]:
    """Generate realistic Open-Meteo mock payload for testing."""
    # 7 past days (168h) + today/forecast (72h) = 240 hours
    hourly_times = []
    hourly_precip = []
    hourly_sm_surface = []
    hourly_sm_root = []

    for day in range(16, 26):
        for hr in range(24):
            time_str = f"2026-10-{day:02d}T{hr:02d}:00"
            hourly_times.append(time_str)
            # Give constant or predictable precipitation
            hourly_precip.append(precip_val)
            hourly_sm_surface.append(0.32)
            hourly_sm_root.append(0.40)

    daily_times = [f"2026-10-{day:02d}" for day in range(16, 26)]
    daily_precip_sum = [precip_val * 24] * len(daily_times)
    daily_codes = [61] * len(daily_times)

    return {
        "latitude": 23.7271,
        "longitude": 92.7176,
        "elevation": 950.0,
        "generationtime_ms": 0.42,
        "utc_offset_seconds": 19800,
        "timezone": "Asia/Kolkata",
        "current": {
            "time": base_time,
            "temperature_2m": 22.4,
            "relative_humidity_2m": 88,
            "precipitation": 2.0,
            "weather_code": 63,  # Moderate rain
        },
        "hourly": {
            "time": hourly_times,
            "precipitation": hourly_precip,
            "soil_moisture_0_to_1cm": hourly_sm_surface,
            "soil_moisture_27_to_81cm": hourly_sm_root,
        },
        "daily": {
            "time": daily_times,
            "precipitation_sum": daily_precip_sum,
            "rain_sum": daily_precip_sum,
            "precipitation_hours": [6.0] * len(daily_times),
            "weather_code": daily_codes,
        },
    }


@pytest.fixture
def isolated_cache():
    return WeatherCache(default_ttl_seconds=60.0)


@pytest.mark.asyncio
async def test_weather_service_parsing_and_metrics(isolated_cache):
    """Test successful data acquisition, cumulative rainfall, and model estimate labeling."""
    mock_payload = generate_mock_open_meteo_payload(precip_val=2.0)

    # Mock HTTP transport
    transport = httpx.MockTransport(
        lambda request: httpx.Response(200, json=mock_payload)
    )
    async with httpx.AsyncClient(transport=transport) as client:
        service = WeatherService(
            cache=isolated_cache,
            http_client=client,
        )

        res = await service.get_weather(23.7271, 92.7176)

        # 1. Location & Region
        assert res.location.latitude == 23.7271
        assert res.location.longitude == 92.7176
        assert res.location.elevation_m == 950.0
        assert res.location.state == "Mizoram"
        assert res.location.in_ner is True

        # 2. Current conditions
        assert res.current.temperature_c == 22.4
        assert res.current.relative_humidity_percent == 88
        assert res.current.precipitation_mm == 2.0
        assert res.current.weather_code == 63
        assert res.current.weather_description == "Moderate rain"
        assert res.current.data_category == "model_analysis"

        # 3. Cumulative rainfall: 24h = 24 * 2.0 = 48.0, 72h = 72 * 2.0 = 144.0, 7d = 168 * 2.0 = 336.0
        assert res.cumulative_rainfall.rainfall_24h_mm == 48.0
        assert res.cumulative_rainfall.rainfall_72h_mm == 144.0
        assert res.cumulative_rainfall.rainfall_7d_mm == 336.0
        assert res.cumulative_rainfall.data_category == "historical_model_reanalysis"

        # 4. Soil moisture: MUST be flagged as model estimate, NOT observation
        assert res.soil_moisture.is_model_estimate is True
        assert res.soil_moisture.measurement_type == "numerical_land_surface_model_estimate"
        assert "ECMWF" in res.soil_moisture.model_source
        assert res.soil_moisture.surface_moisture_m3_m3 == 0.32
        assert res.soil_moisture.root_zone_moisture_m3_m3 == 0.40
        assert res.soil_moisture.saturation_status == "saturated"

        # 5. Metadata and units
        assert res.metadata.source_name == "Open-Meteo Weather API"
        assert res.metadata.cached is False
        assert res.metadata.data_status == "fresh"
        assert res.metadata.units["precipitation"] == "mm"
        assert res.metadata.units["temperature"] == "°C"


@pytest.mark.asyncio
async def test_backend_caching_and_hit(isolated_cache):
    """Test that repeated requests for identical coordinates hit cache without external HTTP call."""
    mock_payload = generate_mock_open_meteo_payload()
    call_count = 0

    def mock_handler(_request):
        nonlocal call_count
        call_count += 1
        return httpx.Response(200, json=mock_payload)

    transport = httpx.MockTransport(mock_handler)
    async with httpx.AsyncClient(transport=transport) as client:
        service = WeatherService(cache=isolated_cache, http_client=client)

        # First call: cache miss
        res1 = await service.get_weather(25.5788, 91.8933)
        assert res1.location.state == "Meghalaya"
        assert res1.metadata.cached is False
        assert call_count == 1

        # Second call (same coords): cache hit
        res2 = await service.get_weather(25.5788, 91.8933)
        assert res2.metadata.cached is True
        assert res2.metadata.data_status == "cached"
        assert call_count == 1  # No extra HTTP call!

        # Coordinate normalization hit (slight float precision difference rounds to same key)
        res3 = await service.get_weather(25.5788001, 91.8933002)
        assert res3.metadata.cached is True
        assert call_count == 1


@pytest.mark.asyncio
async def test_invalid_coordinates(isolated_cache):
    """Test that coordinates outside [-90, 90] and [-180, 180] raise HTTP 400."""
    service = WeatherService(cache=isolated_cache)

    with pytest.raises(HTTPException) as exc1:
        await service.get_weather(95.0, 92.0)
    assert exc1.value.status_code == 400
    assert "Invalid latitude" in exc1.value.detail

    with pytest.raises(HTTPException) as exc2:
        await service.get_weather(25.0, 195.0)
    assert exc2.value.status_code == 400
    assert "Invalid longitude" in exc2.value.detail


@pytest.mark.asyncio
async def test_missing_values_sanitization(isolated_cache):
    """Test that missing or None precipitation / soil moisture values are gracefully sanitized."""
    mock_payload = generate_mock_open_meteo_payload()
    # Inject None values in hourly precipitation
    mock_payload["hourly"]["precipitation"] = [None] * len(mock_payload["hourly"]["time"])
    mock_payload["hourly"]["soil_moisture_27_to_81cm"] = [None] * len(mock_payload["hourly"]["time"])
    mock_payload["hourly"]["soil_moisture_0_to_1cm"] = [None] * len(mock_payload["hourly"]["time"])

    transport = httpx.MockTransport(lambda req: httpx.Response(200, json=mock_payload))
    async with httpx.AsyncClient(transport=transport) as client:
        service = WeatherService(cache=isolated_cache, http_client=client)
        res = await service.get_weather(27.3314, 88.6138)

        assert res.location.state == "Sikkim"
        assert res.cumulative_rainfall.rainfall_24h_mm == 0.0
        assert res.cumulative_rainfall.rainfall_72h_mm == 0.0
        assert res.cumulative_rainfall.rainfall_7d_mm == 0.0
        assert res.soil_moisture.saturation_status == "unknown"


@pytest.mark.asyncio
async def test_error_resilience_and_stale_cache_fallback(isolated_cache):
    """Test handling of timeouts and fallback to stale cached data when upstream fails."""
    mock_payload = generate_mock_open_meteo_payload()

    # Seed cache with an entry
    key = isolated_cache.make_coordinate_key(26.1445, 91.7362)
    isolated_cache.set(key, mock_payload, ttl_seconds=-10)  # Expired entry

    # Mock timeout transport
    def timeout_handler(_request):
        raise httpx.ReadTimeout("Connection timed out")

    transport = httpx.MockTransport(timeout_handler)
    async with httpx.AsyncClient(transport=transport) as client:
        service = WeatherService(cache=isolated_cache, http_client=client)

        # Fallback to stale cached data during upstream failure
        res = await service.get_weather(26.1445, 91.7362)
        assert res.metadata.data_status == "degraded_stale_cache"
        assert res.metadata.cached is True

        # When no stale cache exists for a different location, raises 504
        with pytest.raises(HTTPException) as exc:
            await service.get_weather(28.0, 95.0)
        assert exc.value.status_code == 504


@pytest.mark.asyncio
async def test_rate_limit_handling(isolated_cache):
    """Test that HTTP 429 from Open-Meteo raises HTTP 429 with informative detail."""
    transport = httpx.MockTransport(lambda req: httpx.Response(429, text="Rate limit exceeded"))
    async with httpx.AsyncClient(transport=transport) as client:
        service = WeatherService(cache=isolated_cache, http_client=client)
        with pytest.raises(HTTPException) as exc:
            await service.get_weather(24.8170, 93.9368)
        assert exc.value.status_code == 429
        assert "rate limit exceeded" in exc.value.detail.lower()


def test_fastapi_endpoints():
    """Integration test for FastAPI endpoint /api/weather and /health."""
    client = TestClient(app)

    # Health check
    health_res = client.get("/health")
    assert health_res.status_code == 200
    assert health_res.json()["status"] == "healthy"

    # Missing parameters
    err_res = client.get("/api/weather")
    assert err_res.status_code == 400

    # Invalid latitude
    bad_lat = client.get("/api/weather?lat=95.0&lon=92.0")
    assert bad_lat.status_code == 400

    # Cache stats
    stats_res = client.get("/api/weather/cache-stats")
    assert stats_res.status_code == 200
    assert "hits" in stats_res.json()
