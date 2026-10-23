# NER-LEWS Technical Architecture
**Geospatial Early Warning System — Architectural Specification**

---

## 1. Architectural Philosophy: Region-Centric GIS

Standard administrative dashboards slice disaster data strictly by state or district lines. In reality, geological hazards like rainfall-triggered debris flows, pore water pressure build-up, and riverine toe cuts respect **watershed basins, tectonic thrust belts, and mountain ranges**, not state borders.

NER-LEWS enforces a **Region-Based** architectural model:
- **Primary Entity**: The `RegionEntity`, defined by an authoritative GeoJSON `Polygon` or `MultiPolygon` geometry, geographic bounding box, lithology, and active sensor arrays.
- **Cross-State Corridors**: Predefined regions span multiple state boundaries (e.g. Shillong Plateau across Meghalaya and Assam; Barail Range across Assam, Nagaland, and Manipur; Teesta-Rangit across Sikkim and West Bengal).
- **State Boundaries**: Rendered purely as an optional, dashed contextual reference layer (`/data/ne_states_reference.geojson`). State borders are non-selectable and do not constrain region selection or query logic.

```
                           +------------------------+
                           |  NER-LEWS App Header   |
                           +-----------+------------+
                                       |
                   +-------------------+-------------------+
                   |                                       |
         +---------v----------+                  +---------v----------+
         |    RegionalMap     |                  | Split Detail View  |
         |  (MapLibre WebGL)  |<=== Selection ===|  - RegionPreview   |
         |  - Satellite Layer |      State       |  - History/Charts  |
         |  - Vector Regions  |                  |  - Telemetry/AWS   |
         |  - Spatial Drawing |                  +--------------------+
         +--------------------+
```

---

## 2. Component Hierarchy

```
src/
├── app/
│   └── App.tsx                    # Root orchestrator & global data bootstrap
├── components/
│   ├── layout/
│   │   ├── AppHeader.tsx          # Brand, live telemetry badge, search & draw toggle
│   │   ├── DashboardLayout.tsx    # Responsive split layout & framer-motion container
│   │   ├── AboutModal.tsx         # Architecture and mission disclosure modal
│   │   └── LayersModal.tsx        # Layer visibility & basemap manager
│   ├── map/
│   │   ├── RegionalMap.tsx        # MapLibre GL JS GPU-accelerated map component
│   │   ├── MapControls.tsx        # Zoom, 2D/3D perspective toggle, compass reset
│   │   ├── MapLegend.tsx          # Hazard classification & symbol legend
│   │   └── RegionDrawingTools.tsx # Floating interactive polygon vertex toolbar
│   ├── regions/
│   │   ├── RegionPreview.tsx      # SVG silhouette projection & bounds card
│   │   ├── RegionDetailsPanel.tsx # 5-tab telemetry, incidents, and warnings panel
│   │   ├── HistoricalCharts.tsx   # Apache ECharts rainfall series & severity pie
│   │   └── IncidentTimeline.tsx   # Chronological filterable landslide records
│   └── ui/
│       ├── Badge.tsx              # Glow-coded hazard badges (Critical, High, etc.)
│       ├── LoadingState.tsx       # Radar sweep & skeleton loader
│       ├── ErrorState.tsx         # Ingestion alert with retry triggers
│       └── Tooltip.tsx            # Accessible micro-tooltips
```

---

## 3. High-Performance Map Engine & Feature-State

To maintain a strict **60 FPS** rendering budget:
1. **GPU Native Feature-State**: Instead of tearing down and rebuilding GeoJSON sources on mouse movement, NER-LEWS utilizes `map.setFeatureState({ source, id }, { hover: true/false, selected: true/false })`. Paints and stroke transitions run directly on the GPU rasterizer.
2. **Debounced Hover Preview**: Hovering over a region triggers a 150ms debounce timer before initiating preview overlays, avoiding frame drops during rapid panning.
3. **Interruptible Transitions**: Click selection smoothly pans and pads the camera while animating the split drawer over 550ms using spring physics.

---

## 4. Client-Side Computational Geometry (`src/lib/geo.ts`)

When a user engages **"Draw Region"**:
1. Points placed on the map are converted into a closed GeoJSON `Polygon`.
2. `@turf/area` calculates the exact geodesic surface area in square kilometers ($km^2$).
3. Bounding box coordinates $[minLng, minLat, maxLng, maxLat]$ are derived.
4. Ray-casting point-in-polygon checks (`@turf/boolean-point-in-polygon`) filter global incidents, rainfall stations, and waypoints to only those lying within the custom boundary.

---

## 5. Backend Isolation Boundary

The UI is decoupled from the live backend via `src/api/dataProvider.ts`.
Components depend only on high-level contracts (`dataProvider.regions`, `dataProvider.incidents`).
Switching between simulated mock data and production endpoints requires changing only `VITE_DATA_MODE=live` without modifying UI components.
Request cancellation is enforced via native `AbortController` signals to eliminate race conditions when users switch regions rapidly.
