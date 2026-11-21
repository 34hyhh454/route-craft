import heapq, time
from .common import check_nodes, rebuild, result

def dijkstra(adj, src, dst):
    check_nodes(adj, src, dst)
    t0 = time.perf_counter()
    dist, prev, visited, order = {src: 0.0}, {src: None}, set(), []
    pq = [(0.0, src)]
    while pq:
        d, u = heapq.heappop(pq)
        if u in visited:
            continue
        visited.add(u); order.append(u)
        if u == dst:
            break
        for v, w in adj[u]:
            nd = d + w
            if v not in visited and nd < dist.get(v, float("inf")):
                dist[v], prev[v] = nd, u
                heapq.heappush(pq, (nd, v))
    path = rebuild(prev, src, dst) if dst in visited else []
    return result("dijkstra", path, dist.get(dst), order, t0, time.perf_counter())
