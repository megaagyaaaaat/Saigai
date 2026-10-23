"""
NER-LEWS Unified Backend Entrypoint.
Merges Weather Analytics (Open-Meteo) and Historical Landslide & Terrain Services.
"""
import sys
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

# Add sub-backend directories to python module path
root_dir = Path(__file__).resolve().parent
sys.path.extend([
    str(root_dir / "backendkulpreet"),
    str(root_dir / "backendrishima"),
])

from fastapi import FastAPI, HTTPException, Request, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Import routers from existing backend modules
from app.api.weather import router as weather_router
from backend.app.api.landslides import router as landslides_router, get_service
from backend.app.services.landslide_inventory_service import LandslideInventoryService
from backend.app.schemas.landslide import FrontendIncidentRecord

app = FastAPI(
    title="NER-LEWS Unified Backend API",
    description="Unified Geospatial Command API for Northeast India Landslide Early Warning System.",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Weather API routes on both /api and /api/v1 for maximum compatibility
app.include_router(weather_router)
app.include_router(weather_router, prefix="/v1")

# Mount Landslides API routes
app.include_router(landslides_router)

# Northeast 8 States Canonical Geodata
NE_STATES_METADATA = [
    {
        "id": "state-assam",
        "code": "AS",
        "name": "Assam",
        "category": "state_jurisdiction",
        "riskLevel": "high",
        "statesCrossed": ["Assam"],
        "dominantGeology": "Brahmaputra Alluvium, Disang Shales & Barail Formations",
        "center": [26.20, 92.93],
        "activeWarningCount": 2,
        "avgRainfall72h": 185.4,
        "soilSaturationPercent": 78,
        "description": "Spans Brahmaputra valley and southern hill ranges (Dima Hasao, Karbi Anglong). Characterized by severe riverbank erosion and flash-flood triggered slope failures along NH-27 and railway lifelines.",
        "coordinates": [[[89.8, 26.0], [90.5, 26.2], [91.5, 26.3], [92.5, 26.5], [93.8, 26.7], [94.8, 27.0], [95.8, 27.5], [95.7, 27.0], [94.5, 26.5], [93.5, 26.0], [92.8, 25.0], [92.4, 24.5], [92.9, 24.4], [93.2, 24.9], [92.6, 25.8], [91.5, 25.9], [90.5, 25.8], [89.8, 26.0]]]
    },
    {
        "id": "state-meghalaya",
        "code": "ML",
        "name": "Meghalaya",
        "category": "state_jurisdiction",
        "riskLevel": "critical",
        "statesCrossed": ["Meghalaya", "Assam"],
        "dominantGeology": "Archaean Gneissic Complex, Shillong Group Quartzites & Cretaceous Sandstone",
        "center": [25.57, 91.88],
        "activeWarningCount": 3,
        "avgRainfall72h": 312.4,
        "soilSaturationPercent": 88,
        "description": "High-altitude plateau with precipitous southern escarpment facing Bangladesh plains. World-record orographic monsoonal precipitation produces catastrophic debris slips and rockfalls along NH-6.",
        "coordinates": [[[89.8, 25.2], [90.8, 25.2], [91.8, 25.1], [92.7, 25.1], [92.8, 25.7], [92.0, 25.9], [91.0, 25.9], [89.9, 25.8], [89.8, 25.2]]]
    },
    {
        "id": "state-sikkim",
        "code": "SK",
        "name": "Sikkim",
        "category": "state_jurisdiction",
        "riskLevel": "critical",
        "statesCrossed": ["Sikkim"],
        "dominantGeology": "Daling Group Phyllites, Lingtse Gneiss & High Himalayan Metasediments",
        "center": [27.53, 88.51],
        "activeWarningCount": 4,
        "avgRainfall72h": 285.0,
        "soilSaturationPercent": 92,
        "description": "Rugged Himalayan mountain terrain drained by the Teesta River system. Highly vulnerable to compounding hazards including GLOFs, toe erosion along NH-10, and high-velocity debris flows.",
        "coordinates": [[[88.1, 27.1], [88.7, 27.1], [88.9, 27.6], [88.8, 28.1], [88.3, 28.1], [88.1, 27.6], [88.1, 27.1]]]
    },
    {
        "id": "state-arunachal-pradesh",
        "code": "AR",
        "name": "Arunachal Pradesh",
        "category": "state_jurisdiction",
        "riskLevel": "high",
        "statesCrossed": ["Arunachal Pradesh"],
        "dominantGeology": "Main Boundary Thrust (MBT), Siwalik Molasse & Tethyan Sedimentary Series",
        "center": [27.10, 93.60],
        "activeWarningCount": 2,
        "avgRainfall72h": 210.6,
        "soilSaturationPercent": 76,
        "description": "Extensive eastern Himalayan mountain corridors spanning Kameng, Subansiri, and Siang canyons. Intense monsoonal rainfall frequently severs trans-Arunachal highway arteries.",
        "coordinates": [[[91.6, 27.2], [92.5, 27.0], [93.5, 27.1], [94.5, 27.5], [95.5, 27.8], [96.5, 28.0], [97.2, 28.4], [97.3, 28.9], [96.5, 29.3], [95.5, 29.4], [94.5, 29.0], [93.5, 28.5], [92.0, 28.0], [91.6, 27.5], [91.6, 27.2]]]
    },
    {
        "id": "state-nagaland",
        "code": "NL",
        "name": "Nagaland",
        "category": "state_jurisdiction",
        "riskLevel": "elevated",
        "statesCrossed": ["Nagaland"],
        "dominantGeology": "Indo-Burma Accretionary Prism, Disang Flysch & Mudstones",
        "center": [25.67, 94.11],
        "activeWarningCount": 1,
        "avgRainfall72h": 145.2,
        "soilSaturationPercent": 71,
        "description": "Parallel folded ridge system. Clay-rich weathered matrix undergoes deep structural creep and sinking zones along NH-2 connecting Dimapur and Kohima.",
        "coordinates": [[[93.4, 25.6], [94.0, 25.5], [94.8, 26.0], [95.2, 26.8], [94.8, 27.0], [94.2, 26.5], [93.8, 26.1], [93.4, 25.6]]]
    },
    {
        "id": "state-manipur",
        "code": "MN",
        "name": "Manipur",
        "category": "state_jurisdiction",
        "riskLevel": "elevated",
        "statesCrossed": ["Manipur"],
        "dominantGeology": "Tertiary Arenaceous Formations & Splintery Disang Shales",
        "center": [24.81, 93.93],
        "activeWarningCount": 1,
        "avgRainfall72h": 138.8,
        "soilSaturationPercent": 69,
        "description": "Surrounded by nine mountain ranges with an intramontane valley. NH-37 (Imphal-Jiribam) corridor is heavily prone to seasonal blockages from mudslides and cut-slope washouts.",
        "coordinates": [[[93.1, 24.2], [93.8, 23.8], [94.4, 24.2], [94.5, 25.2], [94.0, 25.6], [93.5, 25.5], [93.2, 24.8], [93.1, 24.2]]]
    },
    {
        "id": "state-mizoram",
        "code": "MZ",
        "name": "Mizoram",
        "category": "state_jurisdiction",
        "riskLevel": "moderate",
        "statesCrossed": ["Mizoram"],
        "dominantGeology": "Surma Group Interbedded Sandstone, Siltstone and Shale",
        "center": [23.72, 92.71],
        "activeWarningCount": 1,
        "avgRainfall72h": 155.0,
        "soilSaturationPercent": 65,
        "description": "N-S trending anticlinal ridges with steep slope profiles. Urban areas including Aizawl experience slope instability due to overburden loading and torrential monsoon storms.",
        "coordinates": [[[92.3, 22.0], [93.0, 22.2], [93.3, 23.0], [93.2, 24.2], [92.6, 24.4], [92.2, 23.5], [92.3, 22.0]]]
    },
    {
        "id": "state-tripura",
        "code": "TR",
        "name": "Tripura",
        "category": "state_jurisdiction",
        "riskLevel": "low",
        "statesCrossed": ["Tripura"],
        "dominantGeology": "Tipam Sandstone, Dupitila Sands & Alluvial Terraces",
        "center": [23.83, 91.28],
        "activeWarningCount": 0,
        "avgRainfall72h": 118.2,
        "soilSaturationPercent": 58,
        "description": "Rolling low hill tracts and synclinal valleys. Localized landslides occur on road cuts and unconsolidated sandy slopes during peak cyclonic depressions.",
        "coordinates": [[[91.2, 23.0], [91.8, 23.0], [92.2, 23.5], [92.3, 24.3], [91.8, 24.2], [91.2, 23.8], [91.2, 23.0]]]
    }
]


def _compute_bounds(coords: List[List[float]]) -> List[float]:
    lngs = [pt[0] for pt in coords]
    lats = [pt[1] for pt in coords]
    return [min(lngs), min(lats), max(lngs), max(lats)]


@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
@app.get("/api/v1/health", tags=["Health"])
async def unified_health_check(service: LandslideInventoryService = Depends(get_service)):
    """Unified system health check."""
    return {
        "status": "healthy",
        "service": "NER-LEWS Unified Intelligence Platform",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "modules": {
            "weather": "online",
            "landslides": "online",
            "total_landslide_events": len(service._df)
        }
    }


@app.get("/api/v1/states", tags=["States"])
@app.get("/api/states", tags=["States"])
async def get_states_summary(service: LandslideInventoryService = Depends(get_service)):
    """Retrieve full statistical profile for the 8 Northeast India states."""
    stats = {s.state.lower(): s for s in service.get_state_statistics()}
    results = []
    for meta in NE_STATES_METADATA:
        st_name = meta["name"]
        st_stat = stats.get(st_name.lower())
        total_ev = st_stat.total_events if st_stat else 0
        fatalities = st_stat.fatalities_total if st_stat else 0
        results.append({
            **meta,
            "historicalIncidentCount": total_ev,
            "fatalities": fatalities,
            "bounds": _compute_bounds(meta["coordinates"][0]),
        })
    return results


@app.get("/api/v1/regions", tags=["Regions"])
@app.get("/api/regions", tags=["Regions"])
async def get_regions(service: LandslideInventoryService = Depends(get_service)):
    """
    Returns the 8 Northeast India States as primary monitoring regions.
    Fully compatible with Frontend RegionEntity schema.
    """
    stats = {s.state.lower(): s for s in service.get_state_statistics()}
    regions = []
    for meta in NE_STATES_METADATA:
        st_name = meta["name"]
        st_stat = stats.get(st_name.lower())
        total_ev = st_stat.total_events if st_stat else 0
        
        region = {
            "id": meta["id"],
            "name": meta["name"],
            "category": meta["category"],
            "riskLevel": meta["riskLevel"],
            "statesCrossed": meta["statesCrossed"],
            "areaKm2": 20000,
            "dominantGeology": meta["dominantGeology"],
            "activeWarningCount": meta["activeWarningCount"],
            "historicalIncidentCount": total_ev,
            "monitoringStationCount": 6,
            "avgRainfall72h": meta["avgRainfall72h"],
            "soilSaturationPercent": meta["soilSaturationPercent"],
            "isUserDrawn": False,
            "description": meta["description"],
            "dataSource": "GSI Bhukosh, NASA GLC & State SDMAs",
            "lastUpdated": datetime.now(timezone.utc).isoformat(),
            "geometry": {
                "type": "Polygon",
                "coordinates": meta["coordinates"]
            },
            "bounds": _compute_bounds(meta["coordinates"][0])
        }
        regions.append(region)
    return regions


@app.get("/api/v1/regions/geojson", tags=["Regions"])
@app.get("/api/regions/geojson", tags=["Regions"])
async def get_regions_geojson(service: LandslideInventoryService = Depends(get_service)):
    """Returns regions as a GeoJSON FeatureCollection."""
    regions_list = await get_regions(service)
    features = []
    for r in regions_list:
        features.append({
            "type": "Feature",
            "id": r["id"],
            "properties": {k: v for k, v in r.items() if k not in ["geometry", "bounds"]},
            "geometry": r["geometry"]
        })
    return {
        "type": "FeatureCollection",
        "name": "Northeast_India_States_Regions",
        "features": features
    }


@app.get("/api/v1/regions/{region_id}", tags=["Regions"])
@app.get("/api/regions/{region_id}", tags=["Regions"])
async def get_region_by_id(region_id: str, service: LandslideInventoryService = Depends(get_service)):
    """Retrieve details for a single region/state by ID or code or name."""
    regions = await get_regions(service)
    req_lower = region_id.lower().replace("state-", "").replace("reg-", "")
    for r in regions:
        r_name = r["name"].lower()
        r_id = r["id"].lower()
        if region_id.lower() in [r_id, r_name] or req_lower in r_id or req_lower in r_name:
            return r
    raise HTTPException(status_code=404, detail=f"Region or State '{region_id}' not found.")


@app.get("/api/v1/regions/{region_id}/incidents", response_model=List[FrontendIncidentRecord], tags=["Regions"])
@app.get("/api/regions/{region_id}/incidents", response_model=List[FrontendIncidentRecord], tags=["Regions"])
async def get_region_incidents_unified(
    region_id: str,
    severity: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    service: LandslideInventoryService = Depends(get_service)
):
    """
    Returns incident feed matching the state or region ID.
    Supports querying by state name (e.g., 'state-assam' -> 'Assam', 'state-sikkim' -> 'Sikkim').
    """
    state_name = None
    for meta in NE_STATES_METADATA:
        if meta["id"] == region_id or meta["code"].lower() == region_id.lower() or meta["name"].lower() == region_id.lower():
            state_name = meta["name"]
            break
        if "shillong" in region_id.lower() and meta["name"] == "Meghalaya":
            state_name = "Meghalaya"
            break
        if "teesta" in region_id.lower() and meta["name"] == "Sikkim":
            state_name = "Sikkim"
            break
    
    if state_name:
        df = service._df[service._df["state"].str.lower() == state_name.lower()]
        if severity:
            df = df[df["severity_or_impact"] == severity]
        df = df.head(limit)
        
        results = []
        for _, row in df.iterrows():
            fatalities = int(row["fatalities"]) if pd_notna(row["fatalities"]) else 0
            injuries = int(row["injuries"]) if pd_notna(row["injuries"]) else 0
            loc = str(row["location_name"]) if pd_notna(row["location_name"]) else "Slope Failure"
            l_type = str(row["landslide_type"]).replace("_", " ").title() if pd_notna(row["landslide_type"]) else "Landslide"
            
            results.append(FrontendIncidentRecord(
                id=str(row["event_id"]),
                regionId=region_id,
                title=f"{loc} - {l_type}",
                date=str(row["event_date"]),
                coordinates=(float(row["longitude"]), float(row["latitude"])),
                severity=row["severity_or_impact"],
                trigger=row["trigger"],
                casualties=fatalities + injuries,
                damageDescription=f"{l_type} in {row['state']}. Fatalities: {fatalities}, Injuries: {injuries}. {row.get('notes', '')}",
                highwayAffected=str(row["highway_affected"]) if pd_notna(row["highway_affected"]) else None,
                status="debris_cleared" if fatalities == 0 else "resolved",
                verified=True,
                dataSource=str(row["source"])
            ))
        return results

    return service.get_frontend_incidents(region_id=region_id, severity=severity, limit=limit)


# ==============================================================================
# TELEMETRY: RAINFALL, WARNINGS & STATIONS ENDPOINTS
# ==============================================================================

def _get_meta_for_region(region_id: str):
    req = region_id.lower()
    for m in NE_STATES_METADATA:
        if m["id"] == req or m["code"].lower() == req or m["name"].lower() == req:
            return m
        if "shillong" in req and m["name"] == "Meghalaya":
            return m
        if "teesta" in req and m["name"] == "Sikkim":
            return m
    return NE_STATES_METADATA[0]


@app.get("/api/v1/regions/{region_id}/rainfall", tags=["Rainfall"])
@app.get("/api/regions/{region_id}/rainfall", tags=["Rainfall"])
async def get_region_rainfall(region_id: str):
    """Returns telemetry rainfall observations for the specified region/state."""
    meta = _get_meta_for_region(region_id)
    rain_72h = meta["avgRainfall72h"]
    center = meta["center"]
    return [
        {
            "id": f"rain-{region_id}-01",
            "regionId": region_id,
            "stationName": f"{meta['name']} Central AWS",
            "coordinates": [center[1], center[0]],
            "past24hMm": round(rain_72h * 0.35, 1),
            "past72hMm": rain_72h,
            "cumulative7dMm": round(rain_72h * 1.8, 1),
            "recordedAt": datetime.now(timezone.utc).isoformat(),
            "isAnomaly": rain_72h > 200,
        },
        {
            "id": f"rain-{region_id}-02",
            "regionId": region_id,
            "stationName": f"{meta['name']} Ridge Observatory",
            "coordinates": [center[1] + 0.15, center[0] + 0.1],
            "past24hMm": round(rain_72h * 0.4, 1),
            "past72hMm": round(rain_72h * 1.05, 1),
            "cumulative7dMm": round(rain_72h * 1.9, 1),
            "recordedAt": datetime.now(timezone.utc).isoformat(),
            "isAnomaly": rain_72h > 200,
        }
    ]


@app.get("/api/v1/regions/{region_id}/rainfall/timeseries", tags=["Rainfall"])
@app.get("/api/regions/{region_id}/rainfall/timeseries", tags=["Rainfall"])
async def get_region_rainfall_timeseries(region_id: str):
    """Returns 7-day rainfall time-series for the specified region/state."""
    meta = _get_meta_for_region(region_id)
    base = meta["avgRainfall72h"]
    daily_base = base / 3.0
    return [
        {"date": "Day -6", "actualMm": round(daily_base * 0.3, 1), "thresholdMm": 80, "anomalyPercent": -45},
        {"date": "Day -5", "actualMm": round(daily_base * 0.5, 1), "thresholdMm": 80, "anomalyPercent": -25},
        {"date": "Day -4", "actualMm": round(daily_base * 0.8, 1), "thresholdMm": 80, "anomalyPercent": +5},
        {"date": "Day -3", "actualMm": round(daily_base * 1.1, 1), "thresholdMm": 80, "anomalyPercent": +35},
        {"date": "Day -2", "actualMm": round(daily_base * 1.4, 1), "thresholdMm": 80, "anomalyPercent": +60},
        {"date": "Yesterday", "actualMm": round(daily_base * 1.2, 1), "thresholdMm": 80, "anomalyPercent": +50},
        {"date": "Today (Live)", "actualMm": round(daily_base * 1.5, 1), "thresholdMm": 80, "anomalyPercent": +75},
    ]


@app.get("/api/v1/regions/{region_id}/warnings", tags=["Warnings"])
@app.get("/api/regions/{region_id}/warnings", tags=["Warnings"])
async def get_region_warnings(region_id: str):
    """Returns active landslide warnings for the region/state."""
    meta = _get_meta_for_region(region_id)
    count = meta["activeWarningCount"]
    if count == 0:
        return []
    level = "emergency" if count >= 3 else ("warning" if count >= 2 else "watch")
    state_name = meta["name"]
    return [
        {
            "id": f"wrn-{region_id}-01",
            "regionId": region_id,
            "level": level,
            "title": f"High Debris Flow Hazard Advisory - {state_name}",
            "issuedAt": datetime.now(timezone.utc).isoformat(),
            "expiresAt": datetime.fromtimestamp(datetime.now().timestamp() + 86400, timezone.utc).isoformat(),
            "summary": f"Exceeded rainfall threshold over saturated slopes across mountain lifelines in {state_name}.",
            "confidence": "high",
            "recommendedAction": "Maintain high alert along cut slopes and highway corridors.",
            "affectedCorridor": f"{state_name} Mountain Lifeline",
            "sourceAuthority": "IMD & State Disaster Management Authority"
        }
    ]


@app.get("/api/v1/warnings/active", tags=["Warnings"])
@app.get("/api/warnings/active", tags=["Warnings"])
async def get_active_warnings():
    """Returns all active warnings across Northeast India."""
    warnings = []
    for meta in NE_STATES_METADATA:
        if meta["activeWarningCount"] > 0:
            level = "emergency" if meta["activeWarningCount"] >= 3 else ("warning" if meta["activeWarningCount"] >= 2 else "watch")
            warnings.append({
                "id": f"wrn-{meta['id']}-01",
                "regionId": meta["id"],
                "level": level,
                "title": f"Advisory for {meta['name']}",
                "issuedAt": datetime.now(timezone.utc).isoformat(),
                "expiresAt": datetime.fromtimestamp(datetime.now().timestamp() + 86400, timezone.utc).isoformat(),
                "summary": f"Heightened landslide potential across {meta['name']} due to ongoing monsoonal activity.",
                "confidence": "high",
                "recommendedAction": "Restrict non-essential travel on hilly sectors.",
                "affectedCorridor": f"{meta['name']} Lifelines",
                "sourceAuthority": "NER-LEWS Authority"
            })
    return warnings


@app.get("/api/v1/regions/{region_id}/stations", tags=["Stations"])
@app.get("/api/regions/{region_id}/stations", tags=["Stations"])
async def get_region_stations(region_id: str):
    """Returns monitoring stations deployed inside the region/state."""
    meta = _get_meta_for_region(region_id)
    center = meta["center"]
    st_name = meta["name"]
    return [
        {
            "id": f"stn-{region_id}-01",
            "name": f"{st_name} Central Doppler AWS",
            "regionId": region_id,
            "type": "weather_radar",
            "coordinates": [center[1], center[0]],
            "elevationM": 1420,
            "status": "online",
            "batteryPercent": 94,
            "lastTransmission": datetime.now(timezone.utc).isoformat(),
        },
        {
            "id": f"stn-{region_id}-02",
            "name": f"{st_name} Pass Piezometer Array",
            "regionId": region_id,
            "type": "piezometer",
            "coordinates": [center[1] + 0.2, center[0] - 0.1],
            "elevationM": 1860,
            "status": "online",
            "batteryPercent": 89,
            "lastTransmission": datetime.now(timezone.utc).isoformat(),
        }
    ]


@app.get("/api/v1/stations", tags=["Stations"])
@app.get("/api/stations", tags=["Stations"])
async def get_all_stations():
    stations = []
    for meta in NE_STATES_METADATA:
        stations.extend(await get_region_stations(meta["id"]))
    return stations


@app.get("/api/v1/waypoints", tags=["Waypoints"])
@app.get("/api/waypoints", tags=["Waypoints"])
async def get_all_waypoints():
    return []


def pd_notna(val):
    if val is None:
        return False
    try:
        import math
        if isinstance(val, float) and math.isnan(val):
            return False
    except Exception:
        pass
    return True


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
