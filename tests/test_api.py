import pytest
from fastapi.testclient import TestClient
from app.main import app, frontend_dist
c = TestClient(app)
B = {"source": "Chandigarh", "destination": "Shimla"}

def test_health(): assert c.get("/api/health").json() == {"status": "ok"}

@pytest.mark.skipif(not frontend_dist.is_dir(), reason="Frontend production build is unavailable")
def test_frontend_routes_serve_spa_without_hiding_unknown_api_routes():
    home = c.get("/")
    deep_link = c.get("/visualizer")
    assert home.status_code == 200 and "Route Craft" in home.text
    assert deep_link.status_code == 200 and "Route Craft" in deep_link.text
    assert c.get("/api/not-a-route").status_code == 404
    assert c.get("/assets/not-a-file.js").status_code == 404

def test_dijkstra_endpoint_and_history_persisted():
    r = c.post("/api/algorithms/dijkstra", json=B).json()
    assert r["found"] and r["distance_km"] == 108 and "offline" in r["source_of_result"]
    assert c.get("/api/history").json()[0]["algorithm"] == "dijkstra"

def test_compare():
    r = c.post("/api/algorithms/compare", json={**B, "weight": "time"}).json()["results"]
    assert [x["algorithm"] for x in r] == ["dijkstra", "astar", "bfs", "dfs"]
    assert abs(r[0]["cost"] - r[1]["cost"]) < 1e-9

def test_errors():
    assert c.post("/api/algorithms/dijkstra", json={**B, "source": "Atlantis"}).status_code == 404
    assert c.post("/api/algorithms/dijkstra", json={"source": ""}).status_code == 422
    assert c.post("/api/algorithms/dijkstra", json={**B, "weight": "bad"}).status_code == 422

def test_history_limit_must_be_positive():
    assert c.get("/api/history?limit=0").status_code == 422
    assert c.get("/api/history?limit=-1").status_code == 422

def test_favorites_crud():
    f = c.post("/api/favorites", json={"name": "Hill trip", **B}).json()
    assert any(x["id"] == f["id"] for x in c.get("/api/favorites").json())
    assert c.delete(f"/api/favorites/{f['id']}").status_code == 200
    assert c.delete(f"/api/favorites/{f['id']}").status_code == 404

def test_favorite_fields_are_length_limited():
    assert c.post("/api/favorites", json={"name": "x" * 121, **B}).status_code == 422
    assert c.post("/api/favorites", json={
        "name": "Long source", "source": "x" * 81, "destination": B["destination"],
    }).status_code == 422
