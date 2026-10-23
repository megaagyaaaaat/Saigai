"""
NER-LEWS Backend FastAPI Application.
Hosts geospatial endpoints for landslide inventory, terrain features, and regional telemetry.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api.landslides import router as landslides_router

app = FastAPI(
    title="NER-LEWS Geospatial & Landslide Inventory API",
    description="Backend microservice providing historical landslide events, terrain features, and monitoring corridor feeds for Northeast India.",
    version="1.0.0"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(landslides_router)


@app.get("/api/v1/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "service": "NER-LEWS Geospatial & Terrain Service",
        "version": "1.0.0"
    }
