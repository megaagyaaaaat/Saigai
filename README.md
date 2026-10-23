# NER-LEWS (Saigai)
**Team Blades Of Chaos — JU Techfest Hack-a-thon Project**
### Cinematic, Region-Based Landslide Early Warning System for Northeast India

---

## 🛰️ Project Overview

**NER-LEWS** (Northeast India Landslide Early Warning System) is a dark-themed, cinematic geospatial command center engineered for the high-hazard mountain corridors of Northeast India (Arunachal Pradesh, Assam, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, and Tripura).

Unlike traditional administrative dashboards that restrict interaction to individual states, NER-LEWS is strictly **region-based**. It models geological hazard zones, mountain ranges, watershed basins, and transboundary corridors as authentic geographic polygon geometries regardless of political state borders.

---

## 🌟 Key Features

1. **GPU-Accelerated Satellite Map**:
   - High-resolution satellite raster tiles via Esri World Imagery with verified licensing and attribution.
   - Dark Canvas alternative basemap for high-contrast analytical views.
   - 2D / 3D perspective pitch tilt and compass controls.
   - State boundaries rendered purely as faint, non-restrictive reference lines.

2. **Region-Centric Interaction (3 Modes)**:
   - **Mode 1: Predefined Geohazard Corridors**: Explore authentic transboundary hazard zones (Shillong Escarpment, Barail Range, Teesta Gorge, Siang Canyon, etc.).
   - **Mode 2: Arbitrary Polygon Drawing Tool**: Click "Draw Region" to place vertices across any area; calculates area in $km^2$ and bounds in real-time.
   - **Mode 3: Search & Navigate**: Search by region name, highway corridor (NH-6, NH-10, NH-2, NH-13), or geological formation with auto camera framing.

3. **Cinematic Split-View Transition**:
   - Committing a selection triggers an interruptible 550ms hardware-accelerated split-view transition.
   - **Left Panel**: Authentic geometric SVG silhouette projection, cardinal coordinate bounds, surface area, and geology.
   - **Right Panel**: 5 structured tabs featuring historical timelines, Apache ECharts rainfall series vs threshold, sensor telemetry (AWS, inclinometers, piezometers, seismometers), and active emergency bulletins.

4. **Client-Side Spatial Point-in-Polygon Engine**:
   - Uses `@turf/boolean-point-in-polygon` to dynamically filter markers and incidents located inside any user-drawn polygon.

5. **Future Backend Integration Ready**:
   - Decoupled `dataProvider` architecture with typed interfaces (`RegionService`, `IncidentService`, `RainfallService`, `WarningService`, `StationService`).
   - Placeholder contracts documented in `docs/API_CONTRACT_PROPOSAL.md`.
   - Simulated mock data clearly labeled in the UI with a toggle to live backend endpoints.

6. **Accessibility & Reduced Motion**:
   - Fully accessible focus states, keyboard navigation, and automatic detection of `prefers-reduced-motion: reduce`.

---

## 🚀 Quickstart Commands

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Run automated test suite (Vitest + React Testing Library)
npm test

# 4. Build for production (TypeScript check + Vite bundler)
npm run build
```

---

## 📚 Technical Documentation

- [Setup Guide](docs/SETUP.md)
- [System Architecture](docs/ARCHITECTURE.md)
- [API Contract Proposal](docs/API_CONTRACT_PROPOSAL.md)
- [Data Sources & Licensing](docs/DATA_SOURCES.md)
- [Performance & Frame Budget](docs/PERFORMANCE.md)
