# NER-LEWS Historical Landslide Inventory & Terrain Data

This directory contains the cleaned, standardized, and geomechanically enriched historical landslide inventory and digital terrain datasets for the **Northeast India Landslide Early Warning System (NER-LEWS)**.

---

## 1. Directory Structure

```
data/
├── README.md                          # Data dictionary, provenance, licensing, and audit documentation
├── raw/                               # Raw datasets (excluded from git tracking via .gitignore)
│   └── Global_Landslide_Catalog_Export.csv # NASA GLC legacy export (4.02 MB)
└── processed/                         # Standardized, map-ready, and lightweight outputs (<500 KB each)
    ├── ner_landslides.geojson         # Map-compatible GeoJSON FeatureCollection (411 events)
    ├── ner_landslides_clean.csv       # Clean tabular dataset with terrain attributes (411 events)
    ├── ner_landslides_unlocated.csv   # Transparently quarantined events with missing/uncertain coordinates (42 events)
    ├── ner_terrain_features.geojson   # Morphometric terrain sample points along 8 critical corridors (40 points)
    ├── ner_terrain_features.csv       # Tabular terrain dataset (elevation, Horn slope, aspect, TRI)
    └── data_summary_report.json       # Machine-readable audit report with state-level statistics
```

---

## 2. Authoritative Data Provenance & Licensing

All historical events and geospatial layers originate from verified scientific, governmental, and open geospatial authorities.

| Data Source | Governing Body / Custodian | Role in NER-LEWS | License & Terms of Use | Direct Link / Citation |
| :--- | :--- | :--- | :--- | :--- |
| **Global Landslide Catalog (GLC) / COOLR** | NASA Goddard Space Flight Center (GSFC) | Base historical event catalog (2007–2016) with coordinates, triggers, and impacts. | **Public Domain** (Creative Commons Zero / US Gov Open Data). Free for research and competition systems. | [NASA Open Data Portal](https://data.nasa.gov/dataset/Global-Landslide-Catalog-Export) |
| **GSI Bhusanket & Bhukosh** | Geological Survey of India, Ministry of Mines | Benchmark catastrophic event validation (Haflong 2022, Tupul 2022, Sonapur 2023, Sikkim 2023). | **Open Government Data (OGD)** under India National Data Sharing and Accessibility Policy (NDSAP). | [GSI Bhukosh](https://bhukosh.gsi.gov.in/) & [Bhusanket](https://bhusanket.gsi.gov.in/) |
| **NER-DRR Node** | North Eastern Space Applications Centre (NESAC), ISRO Department of Space | High-relief spatial hazard verification and disaster bulletins. | Government scientific open bulletin. Attribution required. | [NER-DRR Portal](https://nerdrr.gov.in/) |
| **State Disaster Records** | ASDMA (Assam), SSDMA (Sikkim), NSDMA (Nagaland), MSDMA (Meghalaya), DMR (Mizoram) | Ground-truth verification of highway closures (NH-6, NH-10, NH-2, NH-306). | State Disaster Management Authority public situational bulletins. | State emergency operations portals |
| **Copernicus DEM GLO-30** | European Space Agency (ESA) & EU Copernicus Programme | Digital Elevation Model (30m grid) for elevation and Horn's slope derivation. | **Copernicus Open Access** free tier for scientific, educational, and public display use. | [Copernicus Space Data](https://spacedata.copernicus.eu/) |

---

## 3. Data Dictionary

### 3.1 Landslide Event Record (`ner_landslides_clean.csv` & `ner_landslides.geojson`)

| Field Name | Type | Allowed Values / Format | Description & Example |
| :--- | :--- | :--- | :--- |
| `event_id` | String | `GLC-\d+` or `GSI-[A-Z]{2}-\d{4}-\d{2}` | Unique, immutable identifier (e.g., `GLC-1061`, `GSI-AS-2022-01`). |
| `event_date` | String | ISO 8601 UTC (`YYYY-MM-DDTHH:mm:ssZ`) | Standardized UTC timestamp of event initiation (e.g., `2022-05-16T11:00:00Z`). |
| `latitude` | Float | `21.5` to `30.5` | WGS 84 latitude in decimal degrees (e.g., `25.1800`). |
| `longitude` | Float | `87.5` to `97.8` | WGS 84 longitude in decimal degrees (e.g., `93.0200`). |
| `state` | String | 8 NE States (Assam, Arunachal Pradesh, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, Tripura) | Standardized official state name. Encoding artifacts (mojibake) fully repaired. |
| `location_name` | String | Text | Cleaned geographical landmark or village name (e.g., `New Haflong Railway Station`). |
| `source` | String | Text | Authoritative source organization (e.g., `NASA Global Landslide Catalog`). |
| `source_url` | String | URI string | Direct provenance link or official document URL. |
| `severity_or_impact`| String | `minor`, `moderate`, `severe`, `catastrophic` | Standardized severity level based on casualty count and physical disruption. |
| `coordinate_quality`| String | `exact_gps`, `known_within_1km`, `known_within_5km`, `known_within_10km`, `regional_approximate` | Explicit spatial confidence tier. No coordinate is guessed or fabricated. |
| `trigger` | String | `monsoon_rainfall`, `cloudburst`, `slope_cut_construction`, `earthquake_induced`, `river_bank_erosion`, `continuous_rain`, `unknown` | Dominant initiating trigger mechanism. |
| `fatalities` | Integer | $\ge 0$ | Verified count of deceased individuals. |
| `injuries` | Integer | $\ge 0$ | Verified count of injured individuals. |
| `landslide_size` | String | `small`, `medium`, `large`, `very_large` | Volumetric footprint class from field reports. |
| `landslide_type` | String | `debris_flow`, `mudslide`, `rockfall`, `translational_slide`, `rotational_slump`, `complex` | Geomorphological slope movement classification. |
| `highway_affected` | String | Text or `null` | Highway corridor impacted (e.g., `NH-6 (East Jaintia - Silchar Lifeline)`). |
| `region_id` | String | Predefined region ID | NER-LEWS monitoring polygon ID (e.g., `reg-shillong-escarpment`). |
| `region_name` | String | Text | Full title of the NER-LEWS monitoring corridor. |
| `elevation_m` | Float | Meters above sea level | Elevation from Copernicus DEM GLO-30 (e.g., `426.0`). |
| `slope_deg` | Float | `0.0` to `90.0` degrees | Terrain inclination angle calculated via Horn's 8-direction algorithm (e.g., `24.98`). |
| `aspect_deg` | Float | `0.0` to `360.0` degrees | Downslope face direction clockwise from true North (e.g., `112.7`). |
| `terrain_ruggedness`| Float | RMS meters difference | Terrain Ruggedness Index (TRI - Riley et al. 1999). |
| `verified` | Boolean | `true` or `false` | Cross-validated against official records. |
| `is_duplicate` | Boolean | `true` or `false` | True if event coincides spatially and temporally with another recorded slip. |
| `notes` | String | Text | Operational observations, railway track severance, or village evacuation notes. |

---

### 3.2 Terrain Feature Record (`ner_terrain_features.geojson` & `ner_terrain_features.csv`)

| Field Name | Type | Units | Description |
| :--- | :--- | :--- | :--- |
| `point_id` | String | None | Unique station or sample point ID (e.g., `TP-nh-6-shillong-silchar-01`). |
| `corridor_id` | String | None | Associated hazard corridor identifier. |
| `corridor_name` | String | None | Official lifeline name (e.g., `NH-6 Sonapur Tunnel - Lumshnong - Ratacherra Corridor`). |
| `state` | String | None | State where the terrain transect point is located. |
| `elevation_m` | Float | Meters | Altitude above mean sea level from 30m DEM. |
| `slope_deg` | Float | Degrees ($^\circ$) | Local gradient calculated via Horn (1981) finite difference method. |
| `aspect_deg` | Float | Degrees ($^\circ$) | Compass azimuth of slope face ($0^\circ = \text{North}, 90^\circ = \text{East}$). |
| `aspect_cardinal`| String | None | 8-point compass direction (`N`, `NE`, `E`, `SE`, `S`, `SW`, `W`, `NW`, or `Flat`). |
| `terrain_ruggedness_index` | Float | RMS meters | Heterogeneity metric measuring elevation divergence across neighboring 30m cells. |
| `morphology_class` | String | None | Landform classification (e.g., `Steep Mountain Slope`, `Very Steep Escarpment`). |
| `spatial_resolution_m` | Float | Meters | Effective grid sampling resolution ($30.0\text{ m}$). |

---

## 4. Coverage Breakdown by State

All 8 states of Northeast India have verified historical event records:

| State | Located Events | Quarantined Records | Total Fatalities | Earliest Recorded | Latest Recorded | Peak Monsoon Month | Critical Lifelines Tracked |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Assam** | 84 | 0 | 103 | 2007-06-19 | 2022-05-16 | July | Haflong hill rail corridor, NH-54E, NH-27, Barak Valley cuts |
| **Arunachal Pradesh**| 46 | 0 | 117 | 2007-08-01 | 2024-06-25 | July | NH-13 Trans-Arunachal, Bhalukpong-Bomdila pass, Pasighat |
| **Manipur** | 58 | 0 | 70 | 2007-07-28 | 2022-06-30 | July | NH-37 Jiribam-Imphal, Tupul railway yard, NH-2 Senapati |
| **Meghalaya** | 30 | 0 | 42 | 2007-07-26 | 2023-06-16 | June | NH-6 Sonapur tunnel mouth, NH-40 GS Road, Sohra escarpment |
| **Mizoram** | 28 | 0 | 56 | 2007-07-30 | 2024-05-28 | May / June | NH-306 Silchar-Aizawl lifeline, Melthum quarry, Kolasib |
| **Nagaland** | 79 | 0 | 7 | 2007-07-19 | 2024-07-02 | July | NH-2 / NH-29 Pagla Pahar, Zubza sinking zone, Phesama |
| **Sikkim** | 82 | 0 | 155 | 2007-04-11 | 2023-10-04 | July / Sept | NH-10 Teesta river gorge, Sevoke-Rangpo, Singtam, Chungthang |
| **Tripura** | 4 | 0 | 16 | 2011-06-18 | 2024-08-21 | August | NH-8 Assam-Agartala lifeline, Jampui Hills ridge slips |
| **Total** | **411** | **42** | **566** | **2007-04-11**| **2024-08-21** | **July** | **All 8 regional mountain corridors** |

---

## 5. Handling Data Quality & The Quarantined Dataset

In strict compliance with geoscientific standards:
1. **Zero Data Fabrication**: Missing coordinates are never filled with guesses, town centroids, or synthetic values.
2. **Transparent Quarantine**: All 42 records that lacked valid decimal degree coordinates, had $(0,0)$, or fell in the sub-Himalayan plains outside the 8 states are preserved in `data/processed/ner_landslides_unlocated.csv` with the explicit reason documented (e.g. `quarantine_reason: Missing or out-of-bounds coordinates`).
3. **Encoding Repair**: Raw catalog entries contained character corruption caused by legacy CP1252 to UTF-8 transcoding (e.g., `NƒÅgƒÅland` $\rightarrow$ `Nagaland`, `ArunƒÅchal Pradesh` $\rightarrow$ `Arunachal Pradesh`, `MeghƒÅlaya` $\rightarrow$ `Meghalaya`, `¬†` $\rightarrow$ ` `). These have been cleaned deterministically.
4. **Duplicate Detection**: Consecutive reporting of the same event by multiple media agencies on the same day within a 1.5 km radius is marked with `is_duplicate = True`.

---

## 6. Known Gaps & Scientific Limitations

1. **Reporting Bias**: Historical landslide inventories exhibit strong infrastructure bias; slides impacting national highways, railway alignments, and district headquarters are consistently recorded, whereas slips in uninhabited high-altitude forests (e.g. Upper Dibang Valley, Anjaw) are rarely logged.
2. **Pre-2010 Spatial Resolution**: Events logged prior to widespread smartphone GPS adoption rely on milestone descriptions (e.g. "13 km north of Gangtok") with coordinate accuracy estimated between $1\text{ km}$ and $5\text{ km}$.
3. **Absence vs. Safety**: **Absence of a recorded landslide in a tract is NOT proof that no landslide occurred, nor is it proof that the slope is stable.** Steep slopes across Northeast India with adverse bedding dip remain susceptible to rainfall-triggered failure regardless of catalog presence.

---

## 7. How to Reproduce the Processing Pipeline

### Prerequisites
```bash
pip install pandas numpy geopandas shapely requests rasterio pydantic
```

### Step 1: Preprocess Historical Landslides
```bash
python scripts/process_landslide_inventory.py
```
Options:
- `--raw-csv`: Custom path to raw catalog (default: `data/raw/Global_Landslide_Catalog_Export.csv`).
- `--output-dir`: Output destination (default: `data/processed`).
- `--skip-terrain`: Skip Copernicus DEM lookup for quick dry runs.

### Step 2: Generate Terrain Transects & Corridors
```bash
python scripts/process_terrain.py --mode corridors
```
To calculate terrain attributes for a single point:
```bash
python scripts/process_terrain.py --mode point --lat 25.12 --lon 92.35
```
To calculate slope and aspect GeoTIFF arrays from a local DEM GeoTIFF:
```bash
python scripts/process_terrain.py --mode raster --raster path/to/elevation.tif
```
