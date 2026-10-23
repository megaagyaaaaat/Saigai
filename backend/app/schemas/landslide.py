"""
Pydantic schemas for the NER-LEWS Landslide Inventory and Terrain Module.
Aligned with the NER-LEWS Architecture Specification and Frontend Incident Record Contract.
"""

from enum import Enum
from typing import List, Optional, Tuple, Dict, Any, Union
from pydantic import BaseModel, Field, ConfigDict, field_validator


class CoordinateQuality(str, Enum):
    """Quality / spatial confidence level of landslide event coordinates."""
    EXACT_GPS = "exact_gps"                # Sub-100m, surveyed or high-accuracy GPS
    KNOWN_WITHIN_1KM = "known_within_1km"   # Town/village level or milepost marker
    KNOWN_WITHIN_5KM = "known_within_5km"   # District subdivision or valley reach
    KNOWN_WITHIN_10KM = "known_within_10km" # General administrative circle
    KNOWN_WITHIN_25KM = "known_within_25km" # Regional report without precise landmark
    REGIONAL_APPROX = "regional_approximate"# State/district centroid (uncertain)
    UNRESOLVED = "unresolved"              # Missing / invalid coordinates (quarantined)


class IncidentSeverity(str, Enum):
    """Severity classification matching NER-LEWS incident taxonomy."""
    MINOR = "minor"                 # Localized sloughing, no major blockage or casualty
    MODERATE = "moderate"           # Partial road/track blockage, infrastructure impact
    SEVERE = "severe"               # Full corridor severance, structural damage, 1-4 casualties
    CATASTROPHIC = "catastrophic"   # Mass casualties (>=5), village evacuation, multi-day cutoff


class IncidentTrigger(str, Enum):
    """Standardized landslide initiation triggers."""
    MONSOON_RAINFALL = "monsoon_rainfall"
    CLOUDBURST = "cloudburst"
    SLOPE_CUT_CONSTRUCTION = "slope_cut_construction"
    EARTHQUAKE_INDUCED = "earthquake_induced"
    RIVER_BANK_EROSION = "river_bank_erosion"
    CONTINUOUS_RAIN = "continuous_rain"
    UNKNOWN = "unknown"


class NortheastState(str, Enum):
    """The 8 official states of Northeast India."""
    ASSAM = "Assam"
    ARUNACHAL_PRADESH = "Arunachal Pradesh"
    MANIPUR = "Manipur"
    MEGHALAYA = "Meghalaya"
    MIZORAM = "Mizoram"
    NAGALAND = "Nagaland"
    SIKKIM = "Sikkim"
    TRIPURA = "Tripura"


# ==============================================================================
# LANDSLIDE EVENT SCHEMAS
# ==============================================================================

class LandslideEventBase(BaseModel):
    """Core attributes of a historical landslide event."""
    event_id: str = Field(..., description="Unique immutable event identifier (e.g., 'GLC-1061', 'GSI-AS-2022-01')")
    event_date: str = Field(..., description="ISO 8601 UTC date string (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ)")
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0, description="WGS 84 latitude in decimal degrees")
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0, description="WGS 84 longitude in decimal degrees")
    state: str = Field(..., description="Northeast India State name")
    location_name: str = Field(..., description="Cleaned geographical location or landmark description")
    source: str = Field(..., description="Authoritative origin organization (e.g. NASA GLC, GSI Bhusanket, ASDMA)")
    source_url: Optional[str] = Field(None, description="Direct provenance URL or catalog citation")
    severity_or_impact: IncidentSeverity = Field(IncidentSeverity.MODERATE, description="Standardized severity level")
    coordinate_quality: CoordinateQuality = Field(CoordinateQuality.KNOWN_WITHIN_5KM, description="Spatial accuracy rating")
    
    # Extended Geomechanical and Impact Attributes
    trigger: IncidentTrigger = Field(IncidentTrigger.MONSOON_RAINFALL, description="Primary trigger mechanism")
    fatalities: Optional[int] = Field(0, ge=0, description="Recorded casualty count")
    injuries: Optional[int] = Field(0, ge=0, description="Recorded injury count")
    landslide_size: Optional[str] = Field("medium", description="Reported volume/extent: small, medium, large, very_large")
    landslide_type: Optional[str] = Field("debris_flow", description="Geomorphological type: debris_flow, mudslide, rockfall, etc.")
    highway_affected: Optional[str] = Field(None, description="Highway or rail corridor severed (e.g. NH-6, NH-10, NH-2)")
    region_id: Optional[str] = Field(None, description="Predefined NER-LEWS hazard region identifier")
    region_name: Optional[str] = Field(None, description="Hazard region name (e.g. Shillong Plateau & Southern Escarpment)")
    
    # Terrain Attributes Derived from Digital Elevation Models
    elevation_m: Optional[float] = Field(None, description="Elevation above mean sea level in meters (Copernicus DEM 30m)")
    slope_deg: Optional[float] = Field(None, ge=0.0, le=90.0, description="Terrain slope angle in degrees (Horn's algorithm)")
    aspect_deg: Optional[float] = Field(None, ge=0.0, le=360.0, description="Slope aspect in compass degrees (0=North)")
    terrain_ruggedness: Optional[float] = Field(None, description="Terrain Ruggedness Index (TRI) value")

    verified: bool = Field(True, description="Whether event has been cross-validated by official reports")
    is_duplicate: bool = Field(False, description="Flag indicating potential multi-source duplicate record")
    notes: Optional[str] = Field(None, description="Additional context or provenance comments")

    model_config = ConfigDict(populate_by_name=True, extra="ignore")


class LandslideEventCreate(LandslideEventBase):
    """Schema for creating a new landslide record."""
    pass


class LandslideEventResponse(LandslideEventBase):
    """Schema returned by landslide inventory APIs."""
    model_config = ConfigDict(from_attributes=True)


# ==============================================================================
# GEOJSON VECTOR SCHEMAS (MAP-COMPATIBLE)
# ==============================================================================

class PointGeometry(BaseModel):
    """GeoJSON Point geometry [longitude, latitude]."""
    type: str = "Point"
    coordinates: Tuple[float, float] = Field(..., description="[longitude, latitude] in EPSG:4326")


class LandslideGeoJSONFeature(BaseModel):
    """Single GeoJSON Feature representing a landslide point."""
    type: str = "Feature"
    id: str
    geometry: PointGeometry
    properties: Dict[str, Any]


class LandslideGeoJSONFeatureCollection(BaseModel):
    """Standard GeoJSON FeatureCollection for interactive web mapping."""
    type: str = "FeatureCollection"
    name: str = "NER_LEWS_Historical_Landslide_Inventory"
    crs: Dict[str, Any] = {
        "type": "name",
        "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}
    }
    features: List[LandslideGeoJSONFeature]
    metadata: Optional[Dict[str, Any]] = None


# ==============================================================================
# FRONTEND INCIDENT RECORD SCHEMAS (1:1 UI COMPATIBILITY)
# ==============================================================================

class FrontendIncidentRecord(BaseModel):
    """
    1:1 compatible with React frontend `IncidentRecord` in `src/features/incidents/incident.types.ts`.
    Enables zero-friction live backend connection for `/api/v1/regions/{regionId}/incidents`.
    """
    id: str
    regionId: str
    title: str
    date: str
    coordinates: Tuple[float, float] # [longitude, latitude]
    severity: IncidentSeverity
    trigger: IncidentTrigger
    casualties: int
    damageDescription: str = Field(..., alias="damageDescription")
    highwayAffected: Optional[str] = Field(None, alias="highwayAffected")
    status: str = "debris_cleared" # 'resolved' | 'monitoring' | 'debris_cleared'
    verified: bool = True
    dataSource: str = Field(..., alias="dataSource")

    model_config = ConfigDict(populate_by_name=True)


# ==============================================================================
# TERRAIN FEATURE SCHEMAS
# ==============================================================================

class TerrainFeaturePoint(BaseModel):
    """Topographical and morphometric feature record for early warning modeling."""
    point_id: str
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    region_id: Optional[str] = None
    state: str
    elevation_m: float = Field(..., description="Altitude in meters above sea level")
    slope_deg: float = Field(..., ge=0.0, le=90.0, description="Slope inclination in degrees")
    aspect_deg: float = Field(..., ge=0.0, le=360.0, description="Aspect / downslope direction (degrees)")
    aspect_cardinal: str = Field(..., description="Cardinal direction (N, NE, E, SE, S, SW, W, NW)")
    terrain_ruggedness_index: float = Field(..., description="TRI (Riley et al. 1999)")
    morphology_class: str = Field(..., description="e.g. Steep Cliff, Mountain Escarpment, Valley Floor")
    units: Dict[str, str] = {
        "elevation": "meters",
        "slope": "degrees",
        "aspect": "degrees_clockwise_from_north",
        "tri": "meters_elevation_difference"
    }
    source: str = "Copernicus DEM GLO-30 (ESA / Open-Meteo)"
    spatial_resolution_m: float = 30.0


class TerrainProfileResponse(BaseModel):
    """Highway or corridor elevation transect."""
    corridor_name: str
    length_km: float
    sampling_step_m: float
    points: List[TerrainFeaturePoint]
    min_elevation_m: float
    max_elevation_m: float
    mean_slope_deg: float
    max_slope_deg: float


# ==============================================================================
# QUERY AND SUMMARY SCHEMAS
# ==============================================================================

class LandslideFilterParams(BaseModel):
    """Query parameters for filtering landslide inventory."""
    state: Optional[str] = None
    region_id: Optional[str] = None
    severity: Optional[IncidentSeverity] = None
    trigger: Optional[IncidentTrigger] = None
    from_date: Optional[str] = None
    to_date: Optional[str] = None
    min_fatalities: Optional[int] = None
    highway: Optional[str] = None
    search: Optional[str] = None
    coordinate_quality: Optional[CoordinateQuality] = None
    limit: int = Field(100, ge=1, le=1000)
    offset: int = Field(0, ge=0)


class StateCoverageStat(BaseModel):
    """Statistical summary of historical data per Northeast state."""
    state: str
    total_events: int
    events_with_coordinates: int
    unlocated_events: int
    fatalities_total: int
    catastrophic_count: int
    severe_count: int
    moderate_count: int
    minor_count: int
    earliest_date: Optional[str]
    latest_date: Optional[str]
    peak_monsoon_month: Optional[str]


class InventorySummaryReport(BaseModel):
    """Complete catalog audit and provenance disclosure."""
    title: str = "NER-LEWS Historical Landslide Inventory Data Summary"
    timestamp_generated: str
    total_records_ingested: int
    total_valid_located_events: int
    total_unlocated_quarantined_events: int
    duplicate_events_flagged: int
    spatial_coverage_states: List[str]
    date_coverage_range: Tuple[str, str]
    data_sources: List[Dict[str, Any]]
    state_statistics: List[StateCoverageStat]
    region_statistics: Dict[str, int]
    known_limitations: List[str]
