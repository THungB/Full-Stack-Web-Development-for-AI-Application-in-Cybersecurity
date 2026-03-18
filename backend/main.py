from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database.database import Base, SessionLocal, engine
from routes import history, scan, stats
from services.demo_seed import seed_demo_data_if_empty


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_demo_data_if_empty(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Spam Detection API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_origin_regex=r"^https?://localhost(:\d+)?$|^https?://127\.0\.0\.1(:\d+)?$|^chrome-extension://.*$|^moz-extension://.*$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scan.router, tags=["scan"])
app.include_router(history.router, tags=["history"])
app.include_router(stats.router, tags=["stats"])


@app.get("/health")
def health_check():
    return {"status": "ok"}
