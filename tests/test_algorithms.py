import pytest
from app.algorithms.dijkstra import dijkstra
from app.algorithms.astar import astar
from app.algorithms.bfs import bfs
from app.algorithms.dfs import dfs
from app.utils.distance import haversine
from app.utils.graph_builder import COORDS, MAX_SPEED, build_graph

def A(w="distance"): return build_graph(w, extra_nodes=("Island",))
def h(dst, w="distance"):
    s = 1 if w == "distance" else 1 / MAX_SPEED
    return lambda n: haversine(COORDS[n], COORDS[dst]) * s if n in COORDS else 0

def test_dijkstra_known_path():
    r = dijkstra(A(), "Chandigarh", "Shimla")
    assert r["path"] == ["Chandigarh", "Kalka", "Solan", "Shimla"] and r["cost"] == 108

def test_astar_matches_dijkstra_both_weights():
    for w in ("distance", "time"):
        for s, d in [("Chandigarh", "Manali"), ("Delhi", "Shimla"), ("Kharar", "Delhi")]:
            a, b = A(w), A(w)
            assert astar(a, s, d, h(d, w))["cost"] == pytest.approx(dijkstra(b, s, d)["cost"])

def test_astar_explores_no_more_than_dijkstra_here():
    assert astar(A(), "Chandigarh", "Shimla", h("Shimla"))["nodes_explored"] <= \
           dijkstra(A(), "Chandigarh", "Shimla")["nodes_explored"]

def test_zero_distance():
    for f in (dijkstra, bfs, dfs):
        r = f(A(), "Delhi", "Delhi"); assert r["path"] == ["Delhi"] and r["cost"] in (0, 0.0)

def test_unreachable():
    for r in (dijkstra(A(), "Delhi", "Island"), bfs(A(), "Delhi", "Island"), dfs(A(), "Delhi", "Island"),
              astar(A(), "Delhi", "Island", lambda n: 0)):
        assert not r["found"] and r["path"] == []

def test_invalid_node():
    for f in (dijkstra, bfs, dfs):
        with pytest.raises(KeyError): f(A(), "Nowhere", "Delhi")

def test_bfs_dfs_find_valid_paths_and_bfs_fewest_hops():
    b, d = bfs(A(), "Chandigarh", "Delhi"), dfs(A(), "Chandigarh", "Delhi")
    g = dict((n, {v for v, _ in e}) for n, e in A().items())
    for p in (b["path"], d["path"]):
        assert p[0] == "Chandigarh" and p[-1] == "Delhi" and all(y in g[x] for x, y in zip(p, p[1:]))
    assert len(b["path"]) <= len(d["path"])

def test_haversine():
    assert haversine(COORDS["Delhi"], COORDS["Delhi"]) == 0
    assert 230 < haversine(COORDS["Delhi"], COORDS["Chandigarh"]) < 250
