def check_nodes(adj, src, dst):
    for n in (src, dst):
        if n not in adj:
            raise KeyError(f"Unknown node: {n}")

def rebuild(prev, src, dst):
    path, cur = [], dst
    while cur is not None:
        path.append(cur); cur = prev.get(cur)
    path.reverse()
    return path if path and path[0] == src else []

def result(name, path, cost, order, t0, now):
    return {"algorithm": name, "found": bool(path), "path": path,
            "cost": cost if path else None, "visited_order": order,
            "nodes_explored": len(order), "exec_ms": (now - t0) * 1000}
