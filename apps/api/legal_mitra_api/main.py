from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from legal_mitra_api.api.routes import router


def create_app() -> FastAPI:
    app = FastAPI(
        title="Legal Mitra API",
        version="0.1.0",
        description="Public no-auth API for Legal Mitra (v1)",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(router)
    return app


app = create_app()
