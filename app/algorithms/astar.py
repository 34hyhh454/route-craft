import heapq, time
from .common import check_nodes, rebuild, result

def astar(adj, src, dst, h):
    """h(node) -> admissible estimate of remaining cost to dst."""
    check_nodes(adj, src, dst)
    t0 = time.perf_counter()
    g, prev, closed, order = {src: 0.0}, {src: None}, set(), []
    pq = [(h(src), 0.0, src)]
    while pq:
        _, gu, u = heapq.heappop(pq)
        if u in closed:
            continue
        closed.add(u); order.append(u)
        if u == dst:
            break
        for v, w in adj[u]:
            ng = gu + w
            if v not in closed and ng < g.get(v, float("inf")):
                g[v], prev[v] = ng, u
                heapq.heappush(pq, (ng + h(v), ng, v))
    path = rebuild(prev, src, dst) if dst in closed else []
    return result("astar", path, g.get(dst), order, t0, time.perf_counter())
