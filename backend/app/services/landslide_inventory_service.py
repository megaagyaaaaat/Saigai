"""
NER-LEWS Landslide Inventory Service.
Provides high-performance query, spatial filtering, GeoJSON generation,
and frontend-compatible IncidentRecord projection for Northeast India.
"""

import json
from pathlib import Path
from typing import List, Dict, Optional, Any, Tuple
from datetime import datetime
import pandas as pd

from backend.app.schemas.landslide import (
    LandslideEventResponse,
    LandslideGeoJSONFeature,
    LandslideGeoJSONFeatureCollection,
    PointGeometry,
    FrontendIncidentRecord,
    IncidentSeverity,
    IncidentTrigger,
    CoordinateQuality,
    LandslideFilterParams,
    StateCoverageStat,
    InventorySummaryReport,
)


class LandslideInventoryService:
    """Service layer managing the Northeast India Historical Landslide Inventory."""

    def __init__(
        self,
        clean_csv_path: Optional[Path] = None,
        unlocated_csv_path: Optional[Path] = None,
        summary_report_path: Optional[Path] = None,
        terrain_geojson_path: Optional[Path] = None,
    ):
        base_data_dir = Path(__file__).resolve().parent.parent.parent.parent / "data" / "processed"
        self.clean_csv_path = clean_csv_path or (base_data_dir / "ner_landslides_clean.csv")
        self.unlocated_csv_path = unlocated_csv_path or (base_data_dir / "ner_landslides_unlocated.csv")
        self.summary_report_path = summary_report_path or (base_data_dir / "data_summary_report.json")
        self.terrain_geojson_path = terrain_geojson_path or (base_data_dir / "ner_terrain_features.geojson")

        self._df: pd.DataFrame = pd.DataFrame()
        self._unlocated_df: pd.DataFrame = pd.DataFrame()
        self._summary_data: Dict[str, Any] = {}
        self._terrain_data: Dict[str, Any] = {}

        self.reload_data()

    def reload_data(self):
        """Loads and indexes datasets into memory."""
        if self.clean_csv_path.exists():
            self._df = pd.read_csv(self.clean_csv_path)
            # Ensure proper types
            self._df["latitude"] = pd.to_numeric(self._df["latitude"], errors="coerce")
            self._df["longitude"] = pd.to_numeric(self._df["longitude"], errors="coerce")
            self._df["fatalities"] = pd.to_numeric(self._df["fatalities"], errors="coerce").fillna(0).astype(int)
            self._df["injuries"] = pd.to_numeric(self._df["injuries"], errors="coerce").fillna(0).astype(int)
            self._df["elevation_m"] = pd.to_numeric(self._df["elevation_m"], errors="coerce")
            self._df["slope_deg"] = pd.to_numeric(self._df["slope_deg"], errors="coerce")
            self._df["aspect_deg"] = pd.to_numeric(self._df["aspect_deg"], errors="coerce")
            self._df["terrain_ruggedness"] = pd.to_numeric(self._df["terrain_ruggedness"], errors="coerce")
        else:
            self._df = pd.DataFrame()

        if self.unlocated_csv_path.exists():
            self._unlocated_df = pd.read_csv(self.unlocated_csv_path)
        else:
            self._unlocated_df = pd.DataFrame()

        if self.summary_report_path.exists():
            with open(self.summary_report_path, "r", encoding="utf-8") as f:
                self._summary_data = json.load(f)
        else:
            self._summary_data = {}

        if self.terrain_geojson_path.exists():
            with open(self.terrain_geojson_path, "r", encoding="utf-8") as f:
                self._terrain_data = json.load(f)
        else:
            self._terrain_data = {}

    def _apply_filters(self, df: pd.DataFrame, params: LandslideFilterParams) -> pd.DataFrame:
        """Applies query filters across inventory columns."""
        filtered = df.copy()

        if params.state:
            filtered = filtered[filtered["state"].str.lower() == params.state.lower()]

        if params.region_id:
            filtered = filtered[filtered["region_id"] == params.region_id]

        if params.severity:
            filtered = filtered[filtered["severity_or_impact"] == params.severity.value]

        if params.trigger:
            filtered = filtered[filtered["trigger"] == params.trigger.value]

        if params.coordinate_quality:
            filtered = filtered[filtered["coordinate_quality"] == params.coordinate_quality.value]

        if params.highway:
            filtered = filtered[
                filtered["highway_affected"].str.contains(params.highway, case=False, na=False)
            ]

        if params.min_fatalities is not None:
            filtered = filtered[filtered["fatalities"] >= params.min_fatalities]

        if params.from_date:
            filtered = filtered[filtered["event_date"] >= params.from_date]

        if params.to_date:
            filtered = filtered[filtered["event_date"] <= params.to_date]

        if params.search:
            term = params.search.lower()
            mask = (
                filtered["location_name"].str.lower().str.contains(term, na=False) |
                filtered["notes"].str.lower().str.contains(term, na=False) |
                filtered["source"].str.lower().str.contains(term, na=False) |
                filtered["event_id"].str.lower().str.contains(term, na=False)
            )
            filtered = filtered[mask]

        return filtered

    def get_events(self, params: Optional[LandslideFilterParams] = None) -> List[LandslideEventResponse]:
        """Returns filtered list of landslide event records with pagination."""
        if self._df.empty:
            return []

        df = self._df
        if params:
            df = self._apply_filters(df, params)
            df = df.iloc[params.offset:params.offset + params.limit]

        events = []
        for _, row in df.iterrows():
            d = row.to_dict()
            # Clean NaN to None
            cleaned = {k: (None if pd.isna(v) else v) for k, v in d.items()}
            events.append(LandslideEventResponse(**cleaned))
        return events

    def get_event_by_id(self, event_id: str) -> Optional[LandslideEventResponse]:
        """Look up single landslide event by ID."""
        if self._df.empty:
            return None
        match = self._df[self._df["event_id"] == event_id]
        if match.empty:
            return None
        d = match.iloc[0].to_dict()
        cleaned = {k: (None if pd.isna(v) else v) for k, v in d.items()}
        return LandslideEventResponse(**cleaned)

    def get_geojson(self, params: Optional[LandslideFilterParams] = None) -> LandslideGeoJSONFeatureCollection:
        """Returns map-ready GeoJSON FeatureCollection."""
        if self._df.empty:
            return LandslideGeoJSONFeatureCollection(features=[])

        df = self._df
        if params:
            df = self._apply_filters(df, params)
            df = df.iloc[params.offset:params.offset + params.limit]

        features = []
        for _, row in df.iterrows():
            d = row.to_dict()
            props = {k: (None if pd.isna(v) else v) for k, v in d.items() if k not in ("latitude", "longitude")}
            feat = LandslideGeoJSONFeature(
                id=str(row["event_id"]),
                geometry=PointGeometry(coordinates=(float(row["longitude"]), float(row["latitude"]))),
                properties=props
            )
            features.append(feat)

        return LandslideGeoJSONFeatureCollection(
            features=features,
            metadata={
                "total_count": len(features),
                "query_applied": bool(params is not None)
            }
        )

    def get_frontend_incidents(
        self,
        region_id: Optional[str] = None,
        severity: Optional[str] = None,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
        limit: int = 500
    ) -> List[FrontendIncidentRecord]:
        """
        1:1 compatible projection for React frontend `/api/v1/regions/{regionId}/incidents`.
        Transforms raw inventory rows into typed FrontendIncidentRecord schemas.
        """
        if self._df.empty:
            return []

        df = self._df
        if region_id:
            df = df[df["region_id"] == region_id]
        if severity:
            df = df[df["severity_or_impact"] == severity]
        if from_date:
            df = df[df["event_date"] >= from_date]
        if to_date:
            df = df[df["event_date"] <= to_date]

        df = df.head(limit)

        incidents = []
        for _, row in df.iterrows():
            event_id = str(row["event_id"])
            reg_id = str(row["region_id"]) if pd.notna(row["region_id"]) else "reg-ner-broad-hills"
            loc = str(row["location_name"]) if pd.notna(row["location_name"]) else "Slope Failure"
            l_type = str(row["landslide_type"]).replace("_", " ").title() if pd.notna(row["landslide_type"]) else "Landslide"
            
            title = f"{loc} - {l_type}"
            fatalities = int(row["fatalities"]) if pd.notna(row["fatalities"]) else 0
            injuries = int(row["injuries"]) if pd.notna(row["injuries"]) else 0
            casualties = fatalities + injuries

            notes = str(row.get("notes", "")) if pd.notna(row.get("notes")) else ""
            desc = f"{l_type} reported in {row['state']}. Casualties: {fatalities} fatalities, {injuries} injuries."
            if notes:
                desc += f" {notes}"

            highway = str(row["highway_affected"]) if pd.notna(row["highway_affected"]) else None

            incidents.append(FrontendIncidentRecord(
                id=event_id,
                regionId=reg_id,
                title=title,
                date=str(row["event_date"]),
                coordinates=(float(row["longitude"]), float(row["latitude"])),
                severity=IncidentSeverity(row["severity_or_impact"]),
                trigger=IncidentTrigger(row["trigger"]),
                casualties=casualties,
                damageDescription=desc,
                highwayAffected=highway,
                status="debris_cleared" if fatalities == 0 else "resolved",
                verified=bool(row.get("verified", True)),
                dataSource=str(row["source"])
            ))

        return incidents

    def get_state_statistics(self) -> List[StateCoverageStat]:
        """Returns state-by-state analytical breakdown."""
        raw_stats = self._summary_data.get("state_statistics", [])
        return [StateCoverageStat(**s) for s in raw_stats]

    def get_summary_report(self) -> Dict[str, Any]:
        """Returns complete catalog audit and provenance disclosure."""
        return self._summary_data

    def get_unlocated_events(self) -> List[Dict[str, Any]]:
        """Returns quarantined records with missing or anomalous coordinates."""
        if self._unlocated_df.empty:
            return []
        records = self._unlocated_df.to_dict(orient="records")
        return [
            {k: (None if pd.isna(v) else v) for k, v in r.items()}
            for r in records
        ]

    def get_terrain_corridor_features(self) -> Dict[str, Any]:
        """Returns precomputed terrain profiles across critical corridors."""
        return self._terrain_data
