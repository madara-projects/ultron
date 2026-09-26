"""Local-server hardening: security headers and cross-site write protection."""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from urllib.parse import urlsplit

from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse

SAFE_METHODS = frozenset({"GET", "HEAD", "OPTIONS"})

# The UI is served from this origin with no third-party scripts, styles, or fonts.
CONTENT_SECURITY_POLICY = "; ".join(
    [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'none'",
        "form-action 'self'",
        "frame-ancestors 'none'",
    ]
)


def install_security_middleware(app: FastAPI, allowed_hosts: tuple[str, ...]) -> None:
    allowed = frozenset(host.lower() for host in allowed_hosts)

    @app.middleware("http")
    async def reject_cross_site_writes(
        request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        # Any future state-changing route inherits this guard. Requests without
        # Origin/Sec-Fetch-Site headers come from non-browser clients, which
        # cannot be driven by another website.
        if request.method not in SAFE_METHODS:
            fetch_site = request.headers.get("sec-fetch-site")
            origin = request.headers.get("origin")
            origin_host = (urlsplit(origin).hostname or "").lower() if origin else None
            if fetch_site not in (None, "same-origin", "none") or (
                origin_host is not None and origin_host not in allowed
            ):
                return JSONResponse(
                    {"error": {"code": "cross_site_request", "message": "Cross-site requests are not allowed."}},
                    status_code=403,
                )
        return await call_next(request)

    @app.middleware("http")
    async def security_headers(
        request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        response = await call_next(request)
        response.headers.setdefault("Content-Security-Policy", CONTENT_SECURITY_POLICY)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("Referrer-Policy", "no-referrer")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Cross-Origin-Opener-Policy", "same-origin")
        if request.url.path.startswith("/api/"):
            response.headers["Cache-Control"] = "no-store"
        return response
