"""Run the Ultron server: `python -m backend`."""

from __future__ import annotations

import uvicorn

from backend.main import create_app
from backend.settings import LOOPBACK_HOSTS, Settings


def main() -> None:
    settings = Settings.from_env()
    if settings.host not in LOOPBACK_HOSTS:
        print(
            f"Ultron is listening on {settings.host}. Outside a container this exposes it to your network; "
            "publish the port to 127.0.0.1 only."
        )
    uvicorn.run(create_app(settings), host=settings.host, port=settings.port, server_header=False)


if __name__ == "__main__":
    main()
