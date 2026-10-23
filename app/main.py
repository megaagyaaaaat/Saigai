"""FastAPI application entrypoint for NER-LEWS Weather Backend."""
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.weather import router as weather_router

app = FastAPI(
    title="NER-LEWS Weather Analytics API",
    description="Meteorological acquisition, rainfall accumulation, and soil moisture analytics for Northeast India.",
    version="1.0.0",
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Weather API routes
app.include_router(weather_router)


@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
async def health_check():
    """Health check endpoint for container probes and uptime monitoring."""
    return {
        "status": "healthy",
        "service": "NER-LEWS Weather Analytics Module",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0",
    }


@app.exception_handler(HTTPException)
async def custom_http_exception_handler(_request: Request, exc: HTTPException):
    """Standardized JSON error envelope for HTTP exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": f"HTTP_{exc.status_code}",
                "message": exc.detail,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        },
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
