"""Built-in offline road graph (approximate road km / average km/h)."""
COORDS = {
 "Chandigarh": (30.7333, 76.7794), "Kharar": (30.7460, 76.6469),
 "Ropar": (30.9660, 76.5331), "Kalka": (30.8390, 76.9380),
 "Solan": (30.9045, 77.0967), "Shimla": (31.1048, 77.1734),
 "Ambala": (30.3782, 76.7767), "Karnal": (29.6857, 76.9905),
 "Panipat": (29.3909, 76.9635), "Delhi": (28.6139, 77.2090),
 "Mandi": (31.7080, 76.9320), "Kullu": (31.9592, 77.1089),
 "Manali": (32.2432, 77.1892), "Bilaspur": (31.3300, 76.7600),
}
EDGES = [  # (u, v, km, kmh)
 ("Chandigarh","Kharar",15,45),("Chandigarh","Kalka",27,50),("Chandigarh","Ambala",47,70),
 ("Kharar","Ropar",35,50),("Ropar","Bilaspur",75,40),("Kalka","Solan",35,35),
 ("Solan","Shimla",46,35),("Ambala","Karnal",90,80),("Karnal","Panipat",45,80),
 ("Panipat","Delhi",90,75),("Shimla","Mandi",150,35),("Bilaspur","Mandi",90,40),
 ("Mandi","Kullu",60,40),("Kullu","Manali",40,35),("Chandigarh","Panipat",170,70),
]
MAX_SPEED = max(e[3] for e in EDGES)

def build_graph(weight="distance", extra_nodes=()):
    """Undirected adjacency {u: [(v, cost)]}. weight: 'distance' (km) or 'time' (hours)."""
    if weight not in ("distance", "time"):
        raise ValueError("weight must be 'distance' or 'time'")
    adj = {n: [] for n in COORDS}
    for n in extra_nodes:
        adj.setdefault(n, [])
    for u, v, km, kmh in EDGES:
        w = km if weight == "distance" else km / kmh
        adj[u].append((v, w)); adj[v].append((u, w))
    return adj

def edge_stats(path):
    """Real distance (km) and time (h) summed over the path's edges."""
    look = {}
    for u, v, km, kmh in EDGES:
        look[(u, v)] = look[(v, u)] = (km, km / kmh)
    return (sum(look[p][0] for p in zip(path, path[1:])),
            sum(look[p][1] for p in zip(path, path[1:])))
