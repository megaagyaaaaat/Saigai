# NER-LEWS Setup & Quickstart Guide
**Northeast India Landslide Early Warning System — Cinematic Geospatial Frontend**

---

## 1. Introduction

Welcome to the **NER-LEWS** frontend repository. This project is a **region-based** (not state-based) geospatial early warning and monitoring platform designed specifically for the complex, landslide-prone topography of Northeast India.

The frontend is built using:
- **React 18 + TypeScript** with strict type verification.
- **Vite** for ultra-fast local development and production bundling.
- **Tailwind CSS** with a custom dark-themed command center palette.
- **MapLibre GL JS** for GPU-accelerated WebGL satellite map rendering.
- **Apache ECharts** for historical rainfall and hazard time-series analysis.
- **Turf.js** for client-side geometric calculations and point-in-polygon spatial queries.

---

## 2. Prerequisites

Ensure you have the following installed on your machine:
- **Node.js** (v18.x, v20.x, or v24.x LTS recommended)
- **npm** (v9+ or v11+) or **pnpm** / **yarn**
- A modern web browser with WebGL enabled (Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari)

---

## 3. Installation

Clone or open the repository workspace and install all dependencies:

```bash
# Navigate to the project root directory
cd Saigai

# Install dependencies
npm install
```

---

## 4. Environment Configuration

Create a `.env` file in the project root if you want to override default configurations. An example `.env.example` is provided:

```ini
# Base URL for future backend integration
VITE_API_BASE_URL=https://api.ner-lews.gov.in/v1

# Data Mode: 'demo' uses mock adapters; 'live' enables live API HTTP client
VITE_DATA_MODE=demo

# Optional: Custom Satellite Tile Endpoint
# VITE_SATELLITE_TILE_URL=https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}
```

---

## 5. Running the Application Locally

Start the Vite development server:

```bash
npm run dev
```

The application will be accessible at:
```
http://localhost:5173
```

Open your browser to explore the cinematic satellite map of Northeast India.

---

## 6. Running Tests

Run the Vitest test suite covering computational geometry, point-in-polygon queries, request cancellation, accessibility, and UI components:

```bash
# Run all unit and integration tests once
npm test

# Run tests in watch mode during development
npm run test:watch
```

---

## 7. Building for Production

Compile TypeScript and generate an optimized production bundle:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## 8. Key Workflows to Test

1. **Predefined Region Exploration**: Click on any marked landslide corridor (e.g., *Shillong Plateau & Southern Escarpment*, *Barail Mountain Range & Haflong Corridor*, *Teesta-Rangit Himalayan Basin*). Observe the smooth 550ms cinematic split view, displaying the authentic geometric silhouette on the left and live telemetry on the right.
2. **Arbitrary Polygon Drawing**: Click **"Draw Region"** in the top navigation bar. Click on the map to define polygon vertices across any state boundary, watershed, or highway pass. Click **"Complete"** to calculate the area in km² and isolate enclosed sensor stations and historical landslide events.
3. **Region Search & Navigation**: Use the top search bar to type "Barail", "Meghalaya", "NH-10", or "Assam". The map automatically frames the selected region.
4. **Layer Toggling**: Click the **Layers** button to toggle between High-Resolution Satellite imagery and Dark Canvas, or toggle State reference lines and sensor markers.
