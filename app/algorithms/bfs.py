import time
from collections import deque
from .common import check_nodes, rebuild, result

def bfs(adj, src, dst):
    """Unweighted: fewest HOPS, not shortest distance. Cost = hop count."""
    check_nodes(adj, src, dst)
    t0 = time.perf_counter()
    prev, order, q = {src: None}, [], deque([src])
    while q:
        u = q.popleft(); order.append(u)
        if u == dst:
            break
        for v, _ in adj[u]:
            if v not in prev:
                prev[v] = u; q.append(v)
    path = rebuild(prev, src, dst) if dst in prev else []
    return result("bfs", path, len(path) - 1, order, t0, time.perf_counter())
