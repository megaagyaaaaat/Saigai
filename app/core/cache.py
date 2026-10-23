"""Thread-safe in-memory TTL Cache with stale-data fallback for weather responses."""
import time
from threading import Lock
from typing import Any, Dict, Optional, Tuple


class CacheEntry:
    __slots__ = ("value", "created_at", "expires_at")

    def __init__(self, value: Any, ttl_seconds: float):
        now = time.time()
        self.value = value
        self.created_at = now
        self.expires_at = now + ttl_seconds

    @property
    def is_expired(self) -> bool:
        return time.time() > self.expires_at

    @property
    def age_seconds(self) -> float:
        return round(time.time() - self.created_at, 1)


class WeatherCache:
    """Thread-safe in-memory TTL Cache tailored for spatial coordinates."""

    def __init__(self, default_ttl_seconds: float = 600.0, max_entries: int = 1000):
        self._cache: Dict[str, CacheEntry] = {}
        self._lock = Lock()
        self._default_ttl = default_ttl_seconds
        self._max_entries = max_entries
        self._hits = 0
        self._misses = 0

    @staticmethod
    def make_coordinate_key(lat: float, lon: float, precision: int = 3) -> str:
        """Normalize coordinates to a spatial grid key (~100m at precision 3)."""
        return f"{round(lat, precision):.{precision}f}_{round(lon, precision):.{precision}f}"

    def get(self, key: str) -> Optional[Tuple[Any, float]]:
        """Retrieve cached value and its age if present and not expired."""
        with self._lock:
            entry = self._cache.get(key)
            if entry and not entry.is_expired:
                self._hits += 1
                return entry.value, entry.age_seconds
            self._misses += 1
            return None

    def get_stale(self, key: str) -> Optional[Tuple[Any, float]]:
        """Retrieve entry even if expired (used as graceful fallback when upstream fails)."""
        with self._lock:
            entry = self._cache.get(key)
            if entry:
                return entry.value, entry.age_seconds
            return None

    def set(self, key: str, value: Any, ttl_seconds: Optional[float] = None) -> None:
        """Store value with specified or default TTL."""
        ttl = ttl_seconds if ttl_seconds is not None else self._default_ttl
        with self._lock:
            if len(self._cache) >= self._max_entries:
                self._prune_expired_locked()
            self._cache[key] = CacheEntry(value, ttl)

    def _prune_expired_locked(self) -> None:
        """Remove expired entries to keep memory bounded."""
        now = time.time()
        expired_keys = [k for k, v in self._cache.items() if now > v.expires_at]
        for k in expired_keys:
            del self._cache[k]
        # If still full, remove oldest 20%
        if len(self._cache) >= self._max_entries:
            sorted_keys = sorted(self._cache.keys(), key=lambda k: self._cache[k].created_at)
            for k in sorted_keys[: len(sorted_keys) // 5]:
                del self._cache[k]

    def clear(self) -> None:
        """Clear all entries and reset stats."""
        with self._lock:
            self._cache.clear()
            self._hits = 0
            self._misses = 0

    @property
    def stats(self) -> Dict[str, Any]:
        """Return cache health metrics."""
        with self._lock:
            total = self._hits + self._misses
            hit_ratio = round((self._hits / total) * 100, 1) if total > 0 else 0.0
            return {
                "size": len(self._cache),
                "hits": self._hits,
                "misses": self._misses,
                "hit_ratio_percent": hit_ratio,
            }


# Singleton cache instance for weather service
weather_cache = WeatherCache()
