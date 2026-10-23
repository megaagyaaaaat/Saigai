# NER-LEWS Weather Analytics and Acquisition API

Backend meteorological data acquisition and weather analytics module engineered for **NER-LEWS (Northeast India Landslide Early Warning System)**.

---

## 1. Overview & Architecture

This module fetches real-time meteorological analyses, precipitation forecasts, antecedent cumulative rainfall, and land-surface soil moisture from Open-Meteo APIs (ECMWF IFS NWP & ERA5-Land reanalysis models) across the eight northeastern states of India:
- **Arunachal Pradesh**
- **Assam**
- **Manipur**
- **Meghalaya**
- **Mizoram**
- **Nagaland**
- **Sikkim**
- **Tripura**

### File Ownership & Structure
- [`app/services/weather_service.py`](file:///c:/Users/Divyansh/Documents/Hackathon/Saigai/app/services/weather_service.py): Core weather acquisition service, cumulative rainfall calculators, error recovery, and caching layer integration.
- [`app/schemas/weather.py`](file:///c:/Users/Divyansh/Documents/Hackathon/Saigai/app/schemas/weather.py): Pydantic data schemas enforcing strict typing, units, WMO code interpretation, and scientific metadata.
- [`app/core/cache.py`](file:///c:/Users/Divyansh/Documents/Hackathon/Saigai/app/core/cache.py): Thread-safe in-memory spatial TTL cache with coordinate normalization and stale-cache fallback.
- [`app/core/config.py`](file:///c:/Users/Divyansh/Documents/Hackathon/Saigai/app/core/config.py): Configuration, timeouts, bounding boxes, and Northeast Indian state spatial detection.
- [`app/api/weather.py`](file:///c:/Users/Divyansh/Documents/Hackathon/Saigai/app/api/weather.py): FastAPI routing for `GET /api/weather` and cache metrics.
- [`app/main.py`](file:///c:/Users/Divyansh/Documents/Hackathon/Saigai/app/main.py): FastAPI application entrypoint with CORS, health endpoints, and unified JSON error handling.
- [`tests/test_weather_service.py`](file:///c:/Users/Divyansh/Documents/Hackathon/Saigai/tests/test_weather_service.py): Automated test suite with mocked external responses, caching verification, coordinate validation, and fault injection.
- [`sample_weather_response.json`](file:///c:/Users/Divyansh/Documents/Hackathon/Saigai/sample_weather_response.json): Real sample JSON payload.
- [`requirements.txt`](file:///c:/Users/Divyansh/Documents/Hackathon/Saigai/requirements.txt): Python dependencies.

---

## 2. API Contract

### Primary Endpoint
```http
GET /api/weather?lat=23.7271&lon=92.7176
```

#### Query Parameters
| Parameter | Type | Required | Description |
|:---|:---|:---|:---|
| `lat` / `latitude` | `float` | Yes | Latitude in WGS 84 (`-90.0` to `90.0`) |
| `lon` / `longitude` | `float` | Yes | Longitude in WGS 84 (`-180.0` to `180.0`) |

### Example Request
```bash
curl -X GET "http://localhost:8000/api/weather?lat=23.7271&lon=92.7176"
```

### Response Schema Summary
```json
{
  "location": {
    "latitude": 23.7271,
    "longitude": 92.7176,
    "elevation_m": 1069.0,
    "state": "Mizoram",
    "in_ner": true
  },
  "current": {
    "timestamp": "2026-10-23T19:45",
    "temperature_c": 20.5,
    "relative_humidity_percent": 89.0,
    "precipitation_mm": 0.0,
    "weather_code": 0,
    "weather_description": "Clear sky",
    "data_category": "model_analysis"
  },
  "cumulative_rainfall": {
    "rainfall_24h_mm": 1.1,
    "rainfall_72h_mm": 3.4,
    "rainfall_7d_mm": 3.6,
    "calculation_method": "sum_of_hourly_open_meteo_analysis",
    "data_category": "historical_model_reanalysis"
  },
  "soil_moisture": {
    "surface_moisture_m3_m3": 0.157,
    "root_zone_moisture_m3_m3": 0.29,
    "saturation_status": "wet",
    "is_model_estimate": true,
    "measurement_type": "numerical_land_surface_model_estimate",
    "model_source": "ECMWF Land-Surface Model (IFS / ERA5-Land)",
    "disclaimer": "Estimated via numerical land-surface simulation, not direct in-situ piezometer observation."
  },
  "daily_forecast": [
    {
      "date": "2026-10-23",
      "precipitation_sum_mm": 1.1,
      "rain_sum_mm": 0.5,
      "precipitation_hours": 4.0,
      "weather_code": 53,
      "weather_description": "Moderate drizzle"
    }
  ],
  "hourly_series": [
    {
      "time": "2026-10-23T19:00",
      "precipitation_mm": 0.0,
      "is_forecast": false
    }
  ],
  "metadata": {
    "source_name": "Open-Meteo Weather API",
    "underlying_models": "ECMWF IFS (forecasts) & ERA5-Land (historical reanalysis)",
    "retrieval_timestamp": "2026-10-23T14:16:34.116075+00:00",
    "freshness_seconds": 0.0,
    "cached": false,
    "data_status": "fresh",
    "units": {
      "temperature": "°C",
      "precipitation": "mm",
      "cumulative_rainfall": "mm",
      "soil_moisture": "m³/m³",
      "relative_humidity": "%",
      "elevation": "meters"
    }
  }
}
```

---

## 3. Variables & Units

| Variable | Unit | Type / Source | Description |
|:---|:---|:---|:---|
| `temperature_c` | °C | Model Analysis (ECMWF) | 2-meter air temperature |
| `relative_humidity_percent` | % | Model Analysis (ECMWF) | Relative humidity percentage |
| `precipitation_mm` | mm | Model Analysis (ECMWF) | Current hourly precipitation rate |
| `rainfall_24h_mm` | mm | Calculated Historical (ERA5/IFS) | Antecedent rainfall over past 24 hours |
| `rainfall_72h_mm` | mm | Calculated Historical (ERA5/IFS) | Antecedent rainfall over past 72 hours |
| `rainfall_7d_mm` | mm | Calculated Historical (ERA5/IFS) | Antecedent rainfall over past 7 days |
| `surface_moisture_m3_m3` | $m^3/m^3$ | Land-Surface Model | Volumetric water content at 0–1 cm depth |
| `root_zone_moisture_m3_m3` | $m^3/m^3$ | Land-Surface Model | Volumetric water content at 27–81 cm depth |
| `elevation_m` | meters | Digital Elevation Model (DEM) | Ground elevation at coordinates |

---

## 4. Scientific Transparency & Model vs Observation Distinctions

> [!IMPORTANT]
> To preserve scientific integrity, **no synthetic or fabricated weather observations are generated**.
> - **Observations**: Physical in-situ stations (e.g. IMD automatic weather stations, borehole piezometers, slope inclinometers) are distinct from this service.
> - **Model Estimates**: All soil moisture variables are explicitly flagged with `is_model_estimate: true` and `measurement_type: "numerical_land_surface_model_estimate"`. They are calculated by ECMWF Land-Surface simulation (IFS/ERA5-Land) and must not be confused with physical sensor readings.
> - **Historical Estimates**: 24h, 72h, and 7d rainfall totals are categorized as `historical_model_reanalysis` from merged ERA5 reanalysis and assimilation runs.

---

## 5. Caching & Resilience

1. **Thread-Safe In-Memory Cache**:
   - Cache key is normalized to a 3-decimal grid (~100m ground resolution): `round(lat, 3)` and `round(lon, 3)`.
   - Prevents duplicate external API calls from nearby queries or UI polling.
   - Configurable TTL (default: 10 minutes / 600 seconds).

2. **Graceful Fallback & Stale Cache**:
   - If Open-Meteo experiences timeouts, rate limits (HTTP 429), or network dropouts, the service automatically checks for existing cached data (even if expired).
   - If available, it serves the stale data with `data_status: "degraded_stale_cache"` and reports the exact `freshness_seconds`, ensuring high availability for critical landslide dashboards.

3. **Input Validation**:
   - Rejects non-WGS84 latitudes (`<-90` or `>90`) and longitudes (`<-180` or `>180`) with `HTTP 400 Bad Request`.
   - Automatically detects whether the location falls within the eight Northeast Indian states.

---

## 6. Setup & Execution

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run the Automated Test Suite
```bash
pytest tests -v
```

### 3. Start the FastAPI Development Server
```bash
uvicorn app.main:app --reload --port 8000
```
- API Base URL: `http://localhost:8000`
- Interactive Swagger UI: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`
- Weather Endpoint: `http://localhost:8000/api/weather?lat=23.7271&lon=92.7176`
- Cache Stats: `http://localhost:8000/api/weather/cache-stats`
