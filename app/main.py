import json
import os
from pathlib import Path
from typing import Literal
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from .database import Base, engine, get_db
from .models import SearchHistory, Favorite
from .algorithms.dijkstra import dijkstra
from .algorithms.astar import astar
from .algorithms.bfs import bfs
from .algorithms.dfs import dfs
from .utils.distance import haversine
from .utils.graph_builder import COORDS, MAX_SPEED, build_graph, edge_stats

Base.metadata.create_all(engine)
app = FastAPI(title="Route Craft API", version="0.1.0",
              description="Custom graph algorithms on a built-in offline road graph. "
                          "Results here are NOT from an external routing service.")
allowed_origins = {
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    *(origin.strip().rstrip("/") for origin in os.getenv("FRONTEND_ORIGINS", "").split(",") if origin.strip()),
}
app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(allowed_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Weight = Literal["distance", "time"]
class AlgoRequest(BaseModel):
    source: str = Field(min_length=1, max_length=80)
    destination: str = Field(min_length=1, max_length=80)
    weight: Weight = "distance"
class FavoriteIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    source: str = Field(min_length=1, max_length=80)
    destination: str = Field(min_length=1, max_length=80)
    weight: Weight = "distance"

def run(algo, req: AlgoRequest):
    adj = build_graph(req.weight)
    try:
        if algo == "astar":
            goal = COORDS.get(req.destination)
            scale = 1.0 if req.weight == "distance" else 1.0 / MAX_SPEED
            h = (lambda n: haversine(COORDS[n], goal) * scale) if goal else (lambda n: 0.0)
            r = astar(adj, req.source, req.destination, h)
        else:
            r = {"dijkstra": dijkstra, "bfs": bfs, "dfs": dfs}[algo](adj, req.source, req.destination)
    except KeyError as e:
        raise HTTPException(404, str(e.args[0]))
    km, h_ = edge_stats(r["path"]) if r["found"] else (None, None)
    r.update(distance_km=km, time_h=h_, weight=req.weight,
             source_of_result="custom-graph-algorithm (offline built-in dataset)")
    return r

def save(db, req, r):
    db.add(SearchHistory(source=req.source, destination=req.destination, algorithm=r["algorithm"],
        weight=req.weight, path=json.dumps(r["path"]), distance_km=r["distance_km"], time_h=r["time_h"],
        nodes_explored=r["nodes_explored"], exec_ms=r["exec_ms"], found=r["found"]))
    db.commit()

@app.get("/api/health")
def health(): return {"status": "ok"}

@app.get("/api/graph")
def graph():
    from .utils.graph_builder import EDGES
    return {"nodes": {k: {"lat": v[0], "lon": v[1]} for k, v in COORDS.items()},
            "edges": [{"u": u, "v": v, "km": km, "kmh": s} for u, v, km, s in EDGES]}

@app.post("/api/algorithms/compare")
def compare(req: AlgoRequest, db: Session = Depends(get_db)):
    out = [run(a, req) for a in ("dijkstra", "astar", "bfs", "dfs")]
    for r in out: save(db, req, r)
    return {"results": out}

@app.post("/api/algorithms/{algo}")
def algorithm(algo: Literal["dijkstra", "astar", "bfs", "dfs"], req: AlgoRequest, db: Session = Depends(get_db)):
    r = run(algo, req); save(db, req, r); return r

@app.get("/api/history")
def history(limit: int = Query(default=50, ge=1), db: Session = Depends(get_db)):
    rows = db.query(SearchHistory).order_by(SearchHistory.id.desc()).limit(min(limit, 200)).all()
    return [{**{c.name: getattr(x, c.name) for c in x.__table__.columns}, "path": json.loads(x.path)} for x in rows]

@app.post("/api/favorites", status_code=201)
def add_fav(f: FavoriteIn, db: Session = Depends(get_db)):
    for n in (f.source, f.destination):
        if n not in COORDS: raise HTTPException(404, f"Unknown node: {n}")
    row = Favorite(**f.model_dump()); db.add(row); db.commit(); db.refresh(row)
    return {"id": row.id, **f.model_dump()}

@app.get("/api/favorites")
def list_favs(db: Session = Depends(get_db)):
    return [{c.name: getattr(x, c.name) for c in x.__table__.columns} for x in db.query(Favorite).all()]

@app.delete("/api/favorites/{fid}")
def del_fav(fid: int, db: Session = Depends(get_db)):
    row = db.get(Favorite, fid)
    if not row: raise HTTPException(404, "Favorite not found")
    db.delete(row); db.commit(); return {"deleted": fid}

frontend_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if frontend_dist.is_dir():
    app.mount("/assets", StaticFiles(directory=frontend_dist / "assets"), name="frontend-assets")

    @app.get("/{frontend_path:path}", include_in_schema=False)
    def serve_frontend(frontend_path: str):
        if frontend_path == "api" or frontend_path.startswith("api/"):
            raise HTTPException(404, "Not found")
        requested_file = (frontend_dist / frontend_path).resolve()
        if requested_file != frontend_dist and frontend_dist not in requested_file.parents:
            raise HTTPException(404, "Not found")
        if requested_file.is_file():
            return FileResponse(requested_file)
        return FileResponse(frontend_dist / "index.html")
