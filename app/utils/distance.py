from math import radians, sin, cos, asin, sqrt

def haversine(a, b):
    """Great-circle distance in km between (lat, lon) points."""
    lat1, lon1, lat2, lon2 = map(radians, (*a, *b))
    h = sin((lat2-lat1)/2)**2 + cos(lat1)*cos(lat2)*sin((lon2-lon1)/2)**2
    return 2*6371.0088*asin(sqrt(h))
