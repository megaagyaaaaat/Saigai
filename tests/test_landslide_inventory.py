"""
Unit and Integration Tests for NER-LEWS Historical Landslide Inventory and Terrain Module.
Validates data integrity, coordinate bounding boxes, schema conformance,
zero fabrication, Horn's slope mathematics, and frontend API compatibility.
"""

import json
import math
from pathlib import Path
import pytest
import pandas as pd
import numpy as np

from backend.app.schemas.landslide import (
    LandslideEventResponse,
    LandslideGeoJSONFeatureCollection,
    FrontendIncidentRecord,
    CoordinateQuality,
    IncidentSeverity,
    IncidentTrigger,
    NortheastState,
    LandslideFilterParams,
)
from backend.app.services.landslide_inventory_service import LandslideInventoryService
from scripts.process_terrain import (
    calculate_horn_slope_and_aspect,
    aspect_to_cardinal,
    classify_morphology,
)


BASE_DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "processed"
CLEAN_CSV_PATH = BASE_DATA_DIR / "ner_landslides_clean.csv"
GEOJSON_PATH = BASE_DATA_DIR / "ner_landslides.geojson"
UNLOCATED_CSV_PATH = BASE_DATA_DIR / "ner_landslides_unlocated.csv"
SUMMARY_REPORT_PATH = BASE_DATA_DIR / "data_summary_report.json"
TERRAIN_GEOJSON_PATH = BASE_DATA_DIR / "ner_terrain_features.geojson"

EXPECTED_NE_STATES = {
    "Assam",
    "Arunachal Pradesh",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Sikkim",
    "Tripura"
}


# ==============================================================================
# DATASET FILE INTEGRITY TESTS
# ==============================================================================

def test_processed_files_exist():
    """Verify all required processed outputs have been generated and are non-empty."""
    assert CLEAN_CSV_PATH.exists(), f"Missing {CLEAN_CSV_PATH}"
    assert GEOJSON_PATH.exists(), f"Missing {GEOJSON_PATH}"
    assert UNLOCATED_CSV_PATH.exists(), f"Missing {UNLOCATED_CSV_PATH}"
    assert SUMMARY_REPORT_PATH.exists(), f"Missing {SUMMARY_REPORT_PATH}"
    assert TERRAIN_GEOJSON_PATH.exists(), f"Missing {TERRAIN_GEOJSON_PATH}"

    assert CLEAN_CSV_PATH.stat().st_size > 10000, "Clean CSV is unexpectedly small"
    assert GEOJSON_PATH.stat().st_size > 50000, "GeoJSON is unexpectedly small"


def test_states_standardization_and_cleanliness():
    """Assert all states strictly match the 8 official NE states with zero mojibake."""
    df = pd.read_csv(CLEAN_CSV_PATH)
    unique_states = set(df["state"].unique())
    assert unique_states.issubset(EXPECTED_NE_STATES), f"Unrecognized states found: {unique_states - EXPECTED_NE_STATES}"

    # Verify no encoding corruption artifacts exist in state names
    for st in df["state"]:
        assert "ƒ" not in st, f"Mojibake artifact found in state: {st}"
        assert "?" not in st, f"Encoding question mark found in state: {st}"


def test_coordinates_within_northeast_india_bounds():
    """Assert all located points fall within authentic Northeast India bounding box."""
    df = pd.read_csv(CLEAN_CSV_PATH)
    assert not df["latitude"].isna().any(), "Found NaN latitude in clean dataset"
    assert not df["longitude"].isna().any(), "Found NaN longitude in clean dataset"

    # Latitude range for Northeast India: ~21.5°N to 30.5°N
    assert (df["latitude"] >= 21.5).all(), "Found latitude below 21.5°N"
    assert (df["latitude"] <= 30.5).all(), "Found latitude above 30.5°N"

    # Longitude range for Northeast India: ~87.5°E to 97.8°E
    assert (df["longitude"] >= 87.5).all(), "Found longitude west of 87.5°E"
    assert (df["longitude"] <= 97.8).all(), "Found longitude east of 97.8°E"


def test_dates_iso8601_format():
    """Assert all event dates are valid ISO 8601 UTC strings."""
    df = pd.read_csv(CLEAN_CSV_PATH)
    assert not df["event_date"].isna().any(), "Found NaN event_date"

    for dt_str in df["event_date"]:
        assert "T" in dt_str and dt_str.endswith("Z"), f"Date not formatted as ISO UTC: {dt_str}"
        # Validate that pandas / python datetime can parse it
        parsed = pd.to_datetime(dt_str)
        assert pd.notna(parsed), f"Failed to parse date: {dt_str}"


def test_coordinate_quality_ratings():
    """Assert every located event has a valid coordinate quality rating."""
    df = pd.read_csv(CLEAN_CSV_PATH)
    valid_qualities = {q.value for q in CoordinateQuality}

    for cq in df["coordinate_quality"]:
        assert cq in valid_qualities, f"Invalid coordinate quality: {cq}"


def test_unlocated_records_quarantined_without_fabrication():
    """Verify missing/anomalous coordinates were quarantined with documented reasons, not invented."""
    df_unloc = pd.read_csv(UNLOCATED_CSV_PATH)
    assert len(df_unloc) > 0, "Expected quarantined records in unlocated dataset"
    assert "quarantine_reason" in df_unloc.columns, "Missing quarantine_reason column"

    for _, row in df_unloc.iterrows():
        assert pd.notna(row["quarantine_reason"]), "Quarantine reason must be specified"


# ==============================================================================
# GEOJSON VECTOR INTEGRITY TESTS
# ==============================================================================

def test_geojson_validity():
    """Assert ner_landslides.geojson adheres strictly to GeoJSON RFC 7946 specifications."""
    with open(GEOJSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert data["type"] == "FeatureCollection"
    assert "features" in data
    assert len(data["features"]) > 0

    for feat in data["features"][:50]:  # Sample check
        assert feat["type"] == "Feature"
        assert "geometry" in feat
        geom = feat["geometry"]
        assert geom["type"] == "Point"
        assert len(geom["coordinates"]) == 2
        lon, lat = geom["coordinates"]
        assert 87.5 <= lon <= 97.8
        assert 21.5 <= lat <= 30.5

        props = feat["properties"]
        assert "event_id" in props
        assert "state" in props
        assert "severity_or_impact" in props


# ==============================================================================
# HORN'S SLOPE & ASPECT MATHEMATICAL TESTS
# ==============================================================================

def test_horn_slope_flat_surface():
    """A perfectly flat 3x3 plane should yield exactly 0.0 degrees slope and 0.0 aspect."""
    flat_grid = np.full((3, 3), 500.0)
    dx_m = 30.0
    dy_m = 30.0
    slope, aspect, tri = calculate_horn_slope_and_aspect(flat_grid, dx_m, dy_m)

    assert slope == 0.0
    assert aspect == 0.0
    assert tri == 0.0
    assert aspect_to_cardinal(aspect, slope) == "Flat"
    assert classify_morphology(slope, 500.0) == "Valley Floor / Plain"


def test_horn_slope_45_degree_east_plane():
    """
    A plane sloping downward to the East at 45 degrees:
    For every 30m east, elevation increases by 30m.
    East column = 530m, center column = 500m, west column = 470m.
    rise/run = 30/30 = 1.0 -> arctan(1.0) = 45 degrees.
    """
    grid = np.array([
        [470.0, 500.0, 530.0],
        [470.0, 500.0, 530.0],
        [470.0, 500.0, 530.0]
    ])
    dx_m = 30.0
    dy_m = 30.0
    slope, aspect, tri = calculate_horn_slope_and_aspect(grid, dx_m, dy_m)

    assert math.isclose(slope, 45.0, abs_tol=0.5)
    # Slope faces West (elevation decreases to the West, so aspect = 270 degrees)
    assert math.isclose(aspect, 270.0, abs_tol=1.0)
    assert tri > 0.0


# ==============================================================================
# SERVICE LAYER & FILTERING TESTS
# ==============================================================================

def test_service_initialization_and_counts():
    """Verify service loads correctly and reports expected counts."""
    service = LandslideInventoryService()
    events = service.get_events()
    assert len(events) >= 400, f"Expected >= 400 clean events, got {len(events)}"


def test_service_state_filter():
    """Verify state filtering returns exclusively records from requested state."""
    service = LandslideInventoryService()
    sikkim_events = service.get_events(LandslideFilterParams(state="Sikkim", limit=100))
    assert len(sikkim_events) > 0
    for e in sikkim_events:
        assert e.state == "Sikkim"


def test_service_severity_filter():
    """Verify severity filtering returns only matching severity."""
    service = LandslideInventoryService()
    cat_events = service.get_events(LandslideFilterParams(severity=IncidentSeverity.CATASTROPHIC))
    assert len(cat_events) > 0
    for e in cat_events:
        assert e.severity_or_impact == IncidentSeverity.CATASTROPHIC


def test_service_frontend_incident_record_compatibility():
    """
    Verify get_frontend_incidents produces objects adhering 100% to
    FrontendIncidentRecord schema for seamless UI consumption.
    """
    service = LandslideInventoryService()
    incidents = service.get_frontend_incidents(limit=20)
    assert len(incidents) > 0

    for inc in incidents:
        assert isinstance(inc, FrontendIncidentRecord)
        assert isinstance(inc.id, str) and len(inc.id) > 0
        assert isinstance(inc.regionId, str) and len(inc.regionId) > 0
        assert isinstance(inc.title, str) and len(inc.title) > 0
        assert isinstance(inc.date, str) and "T" in inc.date
        assert len(inc.coordinates) == 2
        lon, lat = inc.coordinates
        assert 87.5 <= lon <= 97.8
        assert 21.5 <= lat <= 30.5
        assert isinstance(inc.severity, IncidentSeverity)
        assert isinstance(inc.trigger, IncidentTrigger)
        assert isinstance(inc.casualties, int) and inc.casualties >= 0
        assert isinstance(inc.damageDescription, str) and len(inc.damageDescription) > 0
        assert inc.status in ("resolved", "monitoring", "debris_cleared")
        assert isinstance(inc.verified, bool)
        assert isinstance(inc.dataSource, str) and len(inc.dataSource) > 0


def test_service_summary_report():
    """Verify data summary report conforms to expected structure and counts."""
    service = LandslideInventoryService()
    report = service.get_summary_report()
    assert "total_valid_located_events" in report
    assert report["total_valid_located_events"] >= 400
    assert len(report["state_statistics"]) == 8
    assert "known_limitations" in report
