"""Loads the trained model and preprocessor once per process.

Design decisions:

- **Loaded lazily, cached at module level** (not eagerly at import time):
  importing `app.ml.registry` must never fail even if the model files are
  missing — `MLRecommendationService` needs to be constructible and fall
  back to the rule engine gracefully, not crash the whole app at import
  time just because RECOMMENDATION_ENGINE happens to be unset to "ml" in
  an environment where the .joblib files haven't been pulled (e.g. Git LFS
  not installed — see docs/ML_INTEGRATION.md).

- **Model and preprocessor are two separate files, not bundled** — this
  matches how they were actually exported in `ml/notebooks/train_model.ipynb`
  (see `ml/ML_TRAINING.md` §6). `docs/ML_ARCHITECTURE.md` §5.6 originally
  recommended bundling them into one `.joblib` specifically to prevent the
  two from silently drifting apart; that hasn't been done yet, so this
  module loads them as a matched pair from the same registry call and never
  exposes one without the other, which is the practical mitigation for the
  same risk until they're re-bundled.

- **No retry-on-every-request** — if loading fails, `get_model_and_preprocessor()`
  raises once, is caught by the caller (`MLRecommendationService`), and the
  failure is remembered by `_load_error` so subsequent calls don't repeatedly
  hit the filesystem/deserialize a broken file on every single recommendation
  request — they fail fast instead.
"""

from pathlib import Path
from typing import Any

import joblib

from app.core.config import get_settings
from app.core.logging_config import get_logger

logger = get_logger(__name__)

_model: Any = None
_preprocessor: Any = None
_load_error: Exception | None = None
_load_attempted = False


class ModelLoadError(Exception):
    """Raised when the model or preprocessor can't be loaded. Callers
    (MLRecommendationService) catch this and fall back to the rule engine —
    it should never propagate out to an API response."""


def _resolve_path(configured_path: str) -> Path:
    """Paths in config are relative to the backend/ working directory
    (matching how the app is normally started — `uvicorn app.main:app` from
    inside backend/). Resolved to an absolute path here so the error message
    on a missing file is unambiguous about where it actually looked."""
    return (Path.cwd() / configured_path).resolve()


def _looks_like_lfs_pointer(path: Path) -> bool:
    """Git LFS pointer files are small plain-text files with a recognisable
    first line — this is what's actually sitting at `ml/models/*.joblib` in
    a fresh `git clone` if Git LFS isn't installed, or `git lfs pull` was
    never run (only the ~130-byte pointer gets checked out, not the real
    binary). Without this check, `joblib.load()` on a pointer file fails
    with an opaque `KeyError` from deep inside pickle's opcode parsing —
    genuinely happened during this integration's own development, logged as
    just `"118"` with no indication of the real, common, fixable cause. See
    docs/ML_INTEGRATION.md's troubleshooting section.
    """
    try:
        with open(path, "rb") as f:
            first_bytes = f.read(200)
        return first_bytes.startswith(b"version https://git-lfs.github.com/spec/v1")
    except OSError:
        return False


def _load() -> None:
    global _model, _preprocessor, _load_error, _load_attempted

    _load_attempted = True
    settings = get_settings()

    model_path = _resolve_path(settings.ML_MODEL_PATH)
    preprocessor_path = _resolve_path(settings.ML_PREPROCESSOR_PATH)

    try:
        if not model_path.exists():
            raise FileNotFoundError(f"Model file not found at {model_path}")
        if not preprocessor_path.exists():
            raise FileNotFoundError(f"Preprocessor file not found at {preprocessor_path}")

        if _looks_like_lfs_pointer(model_path) or _looks_like_lfs_pointer(preprocessor_path):
            raise ModelLoadError(
                f"{model_path} (or its preprocessor) is a Git LFS pointer file, not the "
                "real model — Git LFS isn't installed or `git lfs pull` was never run. "
                "See docs/ML_INTEGRATION.md's troubleshooting section."
            )

        _model = joblib.load(model_path)
        _preprocessor = joblib.load(preprocessor_path)
        _load_error = None
        logger.info(
            "ML model loaded successfully: model=%s preprocessor=%s",
            model_path,
            preprocessor_path,
        )
    except Exception as exc:  # noqa: BLE001 — deliberately broad: any load
        # failure (missing file, corrupted pickle, version mismatch between
        # the sklearn that trained it and the one installed here, an
        # un-pulled Git LFS pointer) must be caught and remembered, never
        # raised past this module.
        _model = None
        _preprocessor = None
        _load_error = exc
        logger.warning("ML model failed to load: %s", exc)


def get_model_and_preprocessor() -> tuple[Any, Any]:
    """Returns (model, preprocessor), loading them on first call.

    Raises `ModelLoadError` if loading failed (either just now, or on a
    previous call — the failure is cached, not retried per-request).
    Callers must catch this; it is never allowed to reach an API response.
    """
    if not _load_attempted:
        _load()

    if _load_error is not None:
        raise ModelLoadError(str(_load_error))

    assert _model is not None and _preprocessor is not None  # guaranteed by _load()
    return _model, _preprocessor


def reset_for_testing() -> None:
    """Clears the module-level cache. Only ever called from tests — lets a
    test simulate "the model hasn't loaded yet" or reload after monkeypatching
    settings, without needing a fresh Python process."""
    global _model, _preprocessor, _load_error, _load_attempted
    _model = None
    _preprocessor = None
    _load_error = None
    _load_attempted = False
