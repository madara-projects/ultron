"""FastAPI application factory: JSON API plus the built single-page UI."""

from __future__ import annotations

from collections.abc import Callable
from datetime import UTC, datetime
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import FileResponse, JSONResponse, PlainTextResponse, Response
from fastapi.staticfiles import StaticFiles

from backend import __version__
from backend.routes import Context, router
from backend.security import install_security_middleware
from backend.settings import Settings
from backend.sources.base import ReadOnlySource, SourceUnavailable
from backend.sources.fixture import FixtureSource


def utc_now() -> datetime:
    return datetime.now(UTC)


def create_app(
    settings: Settings | None = None,
    source: ReadOnlySource | None = None,
    clock: Callable[[], datetime] = utc_now,
) -> FastAPI:
    settings = settings or Settings.from_env()
    source = source or FixtureSource(clock=clock)

    # Interactive docs are disabled: they load assets from a CDN. The schema
    # stays available for generating typed clients.
    app = FastAPI(
        title="Ultron",
        version=__version__,
        docs_url=None,
        redoc_url=None,
        openapi_url="/api/openapi.json",
    )
    app.state.context = Context(settings=settings, source=source, clock=clock)

    install_security_middleware(app, settings.allowed_hosts)
    # Rejects requests whose Host header is not local (DNS-rebinding defence).
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=list(settings.allowed_hosts))

    @app.exception_handler(SourceUnavailable)
    async def source_unavailable(_: Request, error: SourceUnavailable) -> JSONResponse:
        return JSONResponse(
            {"error": {"code": "source_unavailable", "message": str(error)}},
            status_code=503,
        )

    app.include_router(router)
    _mount_frontend(app, settings.frontend_dist)
    return app


def _mount_frontend(app: FastAPI, dist: Path) -> None:
    dist = dist.resolve()
    index = dist / "index.html"
    if (dist / "assets").is_dir():
        app.mount("/assets", StaticFiles(directory=dist / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    async def spa(path: str) -> Response:
        if path == "api" or path.startswith("api/"):
            raise HTTPException(status_code=404)
        if not index.is_file():
            return PlainTextResponse(
                "The web UI has not been built. Run `npm run build` in frontend/, or use `docker compose up --build`.",
                status_code=503,
            )
        candidate = (dist / path).resolve()
        if path and candidate.is_file() and candidate.is_relative_to(dist):
            return FileResponse(candidate)
        return FileResponse(index, headers={"Cache-Control": "no-cache"})
