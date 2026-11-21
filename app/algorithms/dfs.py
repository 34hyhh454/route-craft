import time
from .common import check_nodes, rebuild, result

def dfs(adj, src, dst):
    """Unweighted: finds A path, not necessarily the shortest. Cost = hop count."""
    check_nodes(adj, src, dst)
    t0 = time.perf_counter()
    prev, seen, order, stack = {}, set(), [], [(src, None)]
    while stack:
        u, p = stack.pop()
        if u in seen:
            continue
        seen.add(u); prev[u] = p; order.append(u)
        if u == dst:
            break
        for v, _ in reversed(adj[u]):
            if v not in seen:
                stack.append((v, u))
    path = rebuild(prev, src, dst) if dst in seen else []
    return result("dfs", path, len(path) - 1, order, t0, time.perf_counter())
