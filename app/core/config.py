"""Core configuration and settings for NER-LEWS Weather Module."""
from typing import Dict, Tuple

OPEN_METEO_BASE_URL: str = "https://api.open-meteo.com/v1/forecast"
DEFAULT_CACHE_TTL_SECONDS: int = 600  # 10 minutes
DEFAULT_HTTP_TIMEOUT_SECONDS: float = 8.0
MAX_CACHE_ENTRIES: int = 1000

# Geographic bounds for Northeast India states (min_lat, max_lat, min_lon, max_lon)
NER_BOUNDS: Tuple[float, float, float, float] = (21.5, 29.5, 88.0, 97.5)

NER_STATES: Dict[str, Tuple[float, float, float, float]] = {
    "Sikkim": (27.05, 28.15, 88.00, 88.95),
    "Meghalaya": (25.00, 26.15, 89.80, 92.85),
    "Tripura": (22.90, 24.55, 91.15, 92.40),
    "Mizoram": (21.95, 24.55, 92.25, 93.45),
    "Manipur": (23.80, 25.70, 92.95, 94.80),
    "Nagaland": (25.10, 27.05, 93.30, 95.25),
    "Arunachal Pradesh": (26.65, 29.50, 91.50, 97.45),
    "Assam": (24.15, 28.00, 89.70, 96.05),
}


def detect_ner_state(lat: float, lon: float) -> str:
    """Return the matched Northeast Indian state name if within approximate bounds, else return 'Outside NER'."""
    for state, (min_lat, max_lat, min_lon, max_lon) in NER_STATES.items():
        if min_lat <= lat <= max_lat and min_lon <= lon <= max_lon:
            return state
    # General NER bounding box fallback
    if NER_BOUNDS[0] <= lat <= NER_BOUNDS[1] and NER_BOUNDS[2] <= lon <= NER_BOUNDS[3]:
        return "Northeast India (Transboundary)"
    return "Outside Northeast India"
