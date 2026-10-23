"""
FastAPI Integration Tests for NER-LEWS Landslide Inventory & Terrain Endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


def test_get_landslides_endpoint():
    response = client.get("/api/v1/landslides?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 10
    first = data[0]
    assert "event_id" in first
    assert "latitude" in first
    assert "longitude" in first
    assert "elevation_m" in first
    assert "slope_deg" in first


def test_get_landslides_filter_by_state():
    response = client.get("/api/v1/landslides?state=Meghalaya&limit=5")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    for item in data:
        assert item["state"] == "Meghalaya"


def test_get_landslides_geojson_endpoint():
    response = client.get("/api/v1/landslides/geojson?limit=15")
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) == 15
    feat = data["features"][0]
    assert feat["type"] == "Feature"
    assert feat["geometry"]["type"] == "Point"


def test_get_landslide_by_id_endpoint():
    # GLC-57 is a valid event
    response = client.get("/api/v1/landslides/GLC-57")
    assert response.status_code == 200
    data = response.json()
    assert data["event_id"] == "GLC-57"
    assert data["state"] == "Sikkim"

    # Non-existent event
    response = client.get("/api/v1/landslides/NONEXISTENT-999")
    assert response.status_code == 404


def test_get_inventory_summary_endpoint():
    response = client.get("/api/v1/landslides/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_valid_located_events" in data
    assert "state_statistics" in data


def test_get_unlocated_landslides_endpoint():
    response = client.get("/api/v1/landslides/unlocated")
    assert response.status_code == 200
    data = response.json()
    assert "records" in data
    assert data["count"] > 0


def test_get_terrain_features_endpoint():
    response = client.get("/api/v1/landslides/terrain")
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) > 0


def test_frontend_compatible_region_incidents_endpoint():
    """Test 1:1 compatibility with Section 2.4 of docs/API_CONTRACT_PROPOSAL.md."""
    response = client.get("/api/v1/regions/reg-shillong-escarpment/incidents")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        first = data[0]
        assert "id" in first
        assert "regionId" in first
        assert "title" in first
        assert "date" in first
        assert "coordinates" in first
        assert "severity" in first
        assert "trigger" in first
        assert "casualties" in first
        assert "damageDescription" in first
        assert "status" in first
        assert "verified" in first
        assert "dataSource" in first
