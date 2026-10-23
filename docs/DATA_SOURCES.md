# NER-LEWS Data Sources & Licensing
**Geospatial Data Provenance, Satellite Tile Licensing & Attribution**

---

## 1. High-Resolution Satellite Imagery Provider

The map renders authentic, high-resolution satellite imagery covering Northeast India:

- **Primary Tile Source**: Esri World Imagery Raster Tile Service
  - **URL Template**: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`
  - **Tile Dimensions**: 256 x 256 pixels
  - **Supported Zoom Levels**: 0 to 19 (sub-meter resolution in urban corridors and major highway passes; 15m optical imagery in remote mountain ridges).
  - **Verified License & Attribution**:
    > *"Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"*
  - **Permissible Use**: Free for public display, research, competition prototypes, and educational GIS platforms with mandatory attribution.

- **Secondary Vector / Dark Canvas Fallback**: CartoDB Dark Matter
  - **URL Template**: `https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png`
  - **Attribution**: `© OpenStreetMap contributors, © CARTO`
  - **Permissible Use**: OpenStreetMap open database license (ODbL) with CARTO free tier for analytical mapping.

---

## 2. Northeast India Regional Hazard Corridors

The predefined monitoring regions represent authentic geomechanical and topographical hazard belts across Northeast India:

1. **Shillong Plateau & Southern Escarpment** (Meghalaya – Assam border):
   - *Lithology*: Archaean Gneissic Complex, Cretaceous-Tertiary sandstones.
   - *Hazard Profile*: Extreme orographic rainfall (>10,000mm/yr), deep debris slides on NH-6 (Sonapur) and NH-40 (GS Road).
2. **Barail Mountain Range & Haflong Corridor** (Assam – Nagaland – Manipur):
   - *Lithology*: Disang Group splintery shales, Barail arenaceous sandstones.
   - *Hazard Profile*: High slope instability, rotational slumps, chronic rail track washouts on the Lumding-Badarpur hill track.
3. **Teesta-Rangit Himalayan Basin** (Sikkim – North Bengal):
   - *Lithology*: Daling Group phyllites, mica-schists, High Himalayan Gneiss.
   - *Hazard Profile*: Intense riverine toe cuts on NH-10, post-monsoon GLOF residual slips, rockfall chutes.
4. **Kameng & Subansiri Himalayan Foothills** (Arunachal Pradesh – Assam):
   - *Lithology*: Main Boundary Thrust (MBT) zone, fragile Siwalik sedimentaries.
   - *Hazard Profile*: NH-13 Trans-Arunachal highway blockades, debris avalanches.
5. **Naga Hills & Kohima-Dimapur Pass** (Nagaland – Manipur):
   - *Lithology*: Sheared tertiary mudstones and splintery clay shales.
   - *Hazard Profile*: NH-2 active sinking zones (Pagla Pahar, Zubza, Phesama).
6. **Mizo Hills Ridge & Tuirial Basin** (Mizoram – Assam):
   - *Lithology*: Surma Group alternating turbidite sandstones and siltstones.
   - *Hazard Profile*: Steep parallel strike ridges; NH-306 lifeline slips.
7. **Siang Canyon & Dibang Escarpment** (Upper Arunachal Pradesh – Assam):
   - *Lithology*: Eastern Himalayan Syntaxis gneisses, Abor volcanics.
   - *Hazard Profile*: Seismically triggered rock avalanches, high relief canyon slips.
8. **Surma-Barak Piedmont & Jaintia Slopes** (Meghalaya – Assam):
   - *Lithology*: Jaintia Group nummulitic limestones and tertiary shales.
   - *Hazard Profile*: Karst subsidence and river embankment collapse.

---

## 3. Simulated vs. Production Telemetry Disclosure

In accordance with strict system standards:
- **Current Mode**: All real-time telemetry (rainfall gauges, borehole inclinometers, piezometer water tables, and Doppler radar sweeps) is loaded from the **Simulated Mock Data Adapter** (`src/data/`).
- **Telemetry UI Labeling**: The header explicitly displays `[DEMO MOCK ADAPTER]` to prevent confusing demonstration telemetry with certified civil defense alerts.
- **Production Transition**: When the backend team deploys the live ingestion microservices, changing `VITE_DATA_MODE=live` connects the typed `HttpRegionService` to verified sensor telemetry.
