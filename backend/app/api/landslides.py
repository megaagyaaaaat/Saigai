"""
FastAPI Router for NER-LEWS Historical Landslides and Terrain Features.
Provides endpoints for map layers, tabular query filters, audit statistics,
and 1:1 frontend-compatible regional incident feeds.
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Query, HTTPException, Depends

from backend.app.schemas.landslide import (
    LandslideEventResponse,
    LandslideGeoJSONFeatureCollection,
    FrontendIncidentRecord,
    LandslideFilterParams,
    IncidentSeverity,
    IncidentTrigger,
    CoordinateQuality,
    StateCoverageStat,
    InventorySummaryReport,
)
from backend.app.services.landslide_inventory_service import LandslideInventoryService

router = APIRouter(prefix="/api/v1", tags=["Historical Landslides & Terrain"])

# Singleton service dependency
_service_instance: Optional[LandslideInventoryService] = None


def get_service() -> LandslideInventoryService:
    global _service_instance
    if _service_instance is None:
        _service_instance = LandslideInventoryService()
    return _service_instance


# ==============================================================================
# INVENTORY ENDPOINTS
# ==============================================================================

@router.get(
    "/landslides",
    response_model=List[LandslideEventResponse],
    summary="Query historical landslide events with multi-criteria filtering"
)
def get_landslides(
    state: Optional[str] = Query(None, description="Filter by Northeast state (e.g. Sikkim, Assam)"),
    region_id: Optional[str] = Query(None, description="Filter by monitoring corridor ID"),
    severity: Optional[IncidentSeverity] = Query(None, description="Severity rating"),
    trigger: Optional[IncidentTrigger] = Query(None, description="Trigger mechanism"),
    coordinate_quality: Optional[CoordinateQuality] = Query(None, description="Spatial accuracy level"),
    highway: Optional[str] = Query(None, description="Search highway (e.g. NH-6, NH-10)"),
    from_date: Optional[str] = Query(None, description="ISO date lower bound (YYYY-MM-DD)"),
    to_date: Optional[str] = Query(None, description="ISO date upper bound (YYYY-MM-DD)"),
    min_fatalities: Optional[int] = Query(None, ge=0, description="Minimum recorded casualties"),
    search: Optional[str] = Query(None, description="Free text search in location / description"),
    limit: int = Query(100, ge=1, le=1000, description="Page size limit"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    service: LandslideInventoryService = Depends(get_service)
):
    params = LandslideFilterParams(
        state=state,
        region_id=region_id,
        severity=severity,
        trigger=trigger,
        coordinate_quality=coordinate_quality,
        highway=highway,
        from_date=from_date,
        to_date=to_date,
        min_fatalities=min_fatalities,
        search=search,
        limit=limit,
        offset=offset
    )
    return service.get_events(params)


@router.get(
    "/landslides/geojson",
    response_model=LandslideGeoJSONFeatureCollection,
    summary="Retrieve map-compatible GeoJSON FeatureCollection of historical landslides"
)
def get_landslides_geojson(
    state: Optional[str] = Query(None, description="Filter by Northeast state"),
    region_id: Optional[str] = Query(None, description="Filter by monitoring corridor ID"),
    severity: Optional[IncidentSeverity] = Query(None, description="Filter by severity"),
    trigger: Optional[IncidentTrigger] = Query(None, description="Filter by trigger"),
    limit: int = Query(500, ge=1, le=2000, description="Max feature count"),
    service: LandslideInventoryService = Depends(get_service)
):
    params = LandslideFilterParams(
        state=state,
        region_id=region_id,
        severity=severity,
        trigger=trigger,
        limit=limit,
        offset=0
    )
    return service.get_geojson(params)


@router.get(
    "/landslides/summary",
    summary="Retrieve dataset provenance, collection coverage, and audit report"
)
def get_inventory_summary(service: LandslideInventoryService = Depends(get_service)):
    return service.get_summary_report()


@router.get(
    "/landslides/unlocated",
    summary="Retrieve quarantined records with missing or anomalous coordinates"
)
def get_unlocated_landslides(service: LandslideInventoryService = Depends(get_service)):
    return {
        "description": "Quarantined records with missing/anomalous coordinates. Preserved transparently without fabrication.",
        "count": len(service.get_unlocated_events()),
        "records": service.get_unlocated_events()
    }


@router.get(
    "/landslides/terrain",
    summary="Retrieve morphometric terrain samples along critical Northeast mountain corridors"
)
def get_terrain_features(service: LandslideInventoryService = Depends(get_service)):
    return service.get_terrain_corridor_features()


@router.get(
    "/landslides/{event_id}",
    response_model=LandslideEventResponse,
    summary="Get single historical landslide event details by ID"
)
def get_landslide_by_id(
    event_id: str,
    service: LandslideInventoryService = Depends(get_service)
):
    event = service.get_event_by_id(event_id)
    if not event:
        raise HTTPException(status_code=404, detail=f"Landslide event '{event_id}' not found.")
    return event


# ==============================================================================
# FRONTEND API CONTRACT PROPOSAL COMPATIBLE ROUTE
# (1:1 with Section 2.4 in docs/API_CONTRACT_PROPOSAL.md)
# ==============================================================================

@router.get(
    "/regions/{region_id}/incidents",
    response_model=List[FrontendIncidentRecord],
    summary="Frontend-compatible regional incident feed (matches Frontend IncidentRecord contract)"
)
def get_region_incidents(
    region_id: str,
    severity: Optional[str] = Query(None, description="Severity filter (minor, moderate, severe, catastrophic)"),
    from_date: Optional[str] = Query(None, alias="from", description="ISO start date"),
    to_date: Optional[str] = Query(None, alias="to", description="ISO end date"),
    service: LandslideInventoryService = Depends(get_service)
):
    return service.get_frontend_incidents(
        region_id=region_id,
        severity=severity,
        from_date=from_date,
        to_date=to_date
    )
