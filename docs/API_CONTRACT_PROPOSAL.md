# NER-LEWS API Contract Proposal (Placeholder Only)
**Backend Integration Interface Specification — Draft v1.0**

> **IMPORTANT NOTICE:**  
> The routes, schemas, and payloads documented below represent **proposals and placeholder drafts** designed to align the frontend architecture with the forthcoming backend services.  
> They are **not confirmed production routes**. The final endpoints, authentication schemes, and pagination formats must be formally agreed upon by the backend engineering team before live integration.

---

## 1. Overview & General Conventions

- **Base URL**: Configurable via `VITE_API_BASE_URL` (e.g. `https://api.ner-lews.gov.in/v1`).
- **Data Exchange**: JSON (`application/json`) and GeoJSON (`application/geo+json`).
- **Coordinate Reference System (CRS)**: WGS 84 (`EPSG:4326`) as standard $[longitude, latitude]$.
- **Timestamps**: ISO 8601 UTC strings (`YYYY-MM-DDTHH:mm:ssZ`).
- **Pagination**: Default cursor or page/limit query parameters.

---

## 2. Proposed Endpoints

### 2.1 Health & Telemetry Ingestion Status
```http
GET /api/v1/health
```
**Response `200 OK`**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-10-23T15:45:00Z",
  "telemetry": {
    "activeSensors": 42,
    "lastRadarSync": "2026-10-23T15:40:00Z",
    "gsiFeedStatus": "connected"
  }
}
```

---

### 2.2 Predefined Geographic Monitoring Regions
```http
GET /api/v1/regions
```
**Response `200 OK`**:
```json
[
  {
    "id": "reg-shillong-escarpment",
    "name": "Shillong Plateau & Southern Escarpment",
    "category": "transboundary_zone",
    "riskLevel": "critical",
    "statesCrossed": ["Meghalaya", "Assam"],
    "areaKm2": 7420,
    "dominantGeology": "Archaean Gneissic Complex & Sandstone",
    "activeWarningCount": 3,
    "historicalIncidentCount": 84,
    "monitoringStationCount": 6,
    "avgRainfall72h": 312.4,
    "soilSaturationPercent": 88,
    "dataSource": "Geological Survey of India (GSI)",
    "lastUpdated": "2026-10-23T15:30:00Z"
  }
]
```

---

### 2.3 Individual Region Detail with GeoJSON Geometry
```http
GET /api/v1/regions/{regionId}
```
**Response `200 OK`**:
```json
{
  "id": "reg-shillong-escarpment",
  "name": "Shillong Plateau & Southern Escarpment",
  "category": "transboundary_zone",
  "riskLevel": "critical",
  "statesCrossed": ["Meghalaya", "Assam"],
  "areaKm2": 7420,
  "dominantGeology": "Archaean Gneissic Complex & Sandstone",
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[91.15, 25.1], [91.9, 25.08], [92.45, 25.18], [92.55, 25.55], [91.15, 25.1]]]
  },
  "bounds": [91.05, 25.08, 92.55, 25.80]
}
```

---

### 2.4 Region Landslide Incidents
```http
GET /api/v1/regions/{regionId}/incidents
```
**Query Parameters**:
- `severity`: optional string filter (`catastrophic`, `severe`, `moderate`, `minor`)
- `from`: optional ISO date string
- `to`: optional ISO date string

**Response `200 OK`**:
```json
[
  {
    "id": "inc-ml-01",
    "regionId": "reg-shillong-escarpment",
    "title": "Sonapur Tunnel Debris Slide & Flash Flood",
    "date": "2025-06-18T04:30:00Z",
    "coordinates": [92.35, 25.12],
    "severity": "catastrophic",
    "trigger": "monsoon_rainfall",
    "casualties": 2,
    "damageDescription": "Heavy mudslide blocked NH-6 at Sonapur tunnel mouth, severing vehicular connection for 48 hours.",
    "highwayAffected": "NH-6",
    "status": "debris_cleared",
    "verified": true,
    "dataSource": "NDRF 1st Battalion & Meghalaya Police"
  }
]
```

---

### 2.5 Historical Rainfall Telemetry & Time Series
```http
GET /api/v1/regions/{regionId}/rainfall
```
**Response `200 OK`**:
```json
{
  "regionId": "reg-shillong-escarpment",
  "currentObservations": [
    {
      "id": "rain-shillong-01",
      "stationName": "Mawsynram IMD Observatory",
      "stationId": "AWS-ML-01",
      "coordinates": [91.58, 25.30],
      "rainfall1h": 34.5,
      "rainfall24h": 182.0,
      "rainfall72h": 368.5,
      "threshold72h": 250.0,
      "thresholdExceeded": true,
      "trend": "rising"
    }
  ],
  "timeSeries": [
    { "date": "Day -6", "actualMm": 45, "thresholdMm": 120, "anomalyPercent": -15 },
    { "date": "Today (Live)", "actualMm": 312, "thresholdMm": 120, "anomalyPercent": 185 }
  ]
}
```

---

### 2.6 Active Regional Warnings & Alerts
```http
GET /api/v1/regions/{regionId}/warnings
```
**Response `200 OK`**:
```json
[
  {
    "id": "wrn-ml-01",
    "regionId": "reg-shillong-escarpment",
    "level": "emergency",
    "title": "RED ALERT: High Probability of Debris Flows along NH-6 Corridor",
    "issuedAt": "2026-10-23T14:45:00Z",
    "expiresAt": "2026-10-24T08:00:00Z",
    "summary": "Antecedent rainfall exceeding 300mm over 72h. Critical slope pore pressure detected.",
    "confidence": "high",
    "recommendedAction": "Suspend heavy vehicular movement on NH-6. Pre-position excavators at Lumshnong.",
    "affectedCorridor": "NH-6",
    "sourceAuthority": "Geological Survey of India & SDMA"
  }
]
```

---

### 2.7 Inclinometers, Piezometers, Seismometers & Weather Stations
```http
GET /api/v1/regions/{regionId}/stations
```
**Response `200 OK`**:
```json
[
  {
    "id": "stn-ml-01",
    "regionId": "reg-shillong-escarpment",
    "name": "Sohra Slope Inclinometer Array",
    "type": "INCLINOMETER",
    "coordinates": [91.73, 25.29],
    "status": "operational",
    "elevationM": 1430,
    "batteryPercent": 94,
    "lastTransmission": "2026-10-23T15:38:00Z",
    "sensorsActive": ["Borehole Tilt", "Pore Pressure", "Rain Gauge"]
  }
]
```

---

### 2.8 Spatial Query for User-Drawn Polygons (Client / Server Boundary)
```http
POST /api/v1/incidents/spatial-query
Content-Type: application/json
```
**Request Payload**:
```json
{
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[92.0, 25.0], [93.0, 25.0], [93.0, 26.0], [92.0, 26.0], [92.0, 25.0]]]
  }
}
```
**Response `200 OK`**:
Returns incidents and stations lying within the specified polygon boundary. In the current frontend prototype, this query is calculated instantly client-side using `@turf/boolean-point-in-polygon`.

---

## 3. Error Contract
Standardized error format across all endpoints:
```json
{
  "error": {
    "code": "REGION_NOT_FOUND",
    "message": "Geographic region 'reg-unknown' could not be resolved in the spatial registry.",
    "status": 404,
    "timestamp": "2026-10-23T15:46:00Z"
  }
}
```
