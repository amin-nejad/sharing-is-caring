"""Convert JSON to GeoJSON for Google Maps display."""
import json 

with open('long-victor-304116-default-rtdb-export.json', 'r') as f:
    registrations = json.load(f)['registrations']

geojson = {
    "type": "FeatureCollection",
    "features": [
    {
        "type": "Feature",
        "geometry" : {
            "type": "Point",
            "coordinates": [float(d["gmapLong"]), float(d["gmapLat"])],
            },
        "properties" : {
            "businessName": d['businessName'],
            "businessWebsite": d['gmapWebsite'],
            "businessGmapURL": d['gmapURL'],
            "service": d['service'],
            "storeid": str(i),
        },
     } for i, (_, d) in enumerate(registrations.items()) if d['verified'] == "Y"]
}

with open('businesses.json', 'w') as f:
    json.dump(geojson, f,  indent=4, sort_keys=True)
