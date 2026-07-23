from __future__ import annotations

from typing import Any

from app.modules.data_models.schemas import Diagnostic, DiagnosticSeverity


SAFE_FALLBACK_MESSAGE = "Data model operation failed."


def diagnostic(severity: DiagnosticSeverity, code: str, message: str, *, stale: bool = False, **location: Any) -> Diagnostic:
    return Diagnostic(severity=severity, code=code, message=message, location=location or None, stale=stale)


def error(code: str, message: str, *, stale: bool = False, **location: Any) -> Diagnostic:
    return diagnostic("error", code, message, stale=stale, **location)


def warning(code: str, message: str, *, stale: bool = False, **location: Any) -> Diagnostic:
    return diagnostic("warning", code, message, stale=stale, **location)


def mark_stale(items: list[Diagnostic]) -> list[Diagnostic]:
    return [item.model_copy(update={"stale": True}) for item in items]


def safe_error_message(_exc: Exception) -> str:
    return SAFE_FALLBACK_MESSAGE
