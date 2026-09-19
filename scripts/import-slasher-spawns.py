"""Build the original guide's survey data from a local Mappalachia database.

Usage: py -3 scripts/import-slasher-spawns.py path/to/mappalachia.db
Only numeric game records and landmark names are exported; no guide prose,
third-party artwork, or Mappalachia application code is incorporated.
"""
import collections
import json
import math
import pathlib
import re
import sqlite3
import sys

REGIONS = {
    "Forest": "Forest", "ToxicValley": "Toxic Valley",
    "MountainRemoval": "Ash Heap", "Mountain": "Savage Divide",
    "Cranberry": "Cranberry Bog", "Swamp": "The Mire",
    "Storm": "Skyline Valley", "BurningSprings": "Burning Springs",
}


def contains(x, y, polygon):
    inside = False
    previous = polygon[-1]
    for current in polygon:
        xi, yi = current
        xj, yj = previous
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            inside = not inside
        previous = current
    return inside


def edge_distance(x, y, polygon):
    distances = []
    for index, (ax, ay) in enumerate(polygon):
        bx, by = polygon[(index + 1) % len(polygon)]
        dx, dy = bx - ax, by - ay
        length = dx * dx + dy * dy
        t = max(0, min(1, ((x - ax) * dx + (y - ay) * dy) / length)) if length else 0
        distances.append((x - ax - t * dx) ** 2 + (y - ay - t * dy) ** 2)
    return min(distances)


def slug(value):
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def main():
    connection = sqlite3.connect(f"{pathlib.Path(sys.argv[1]).resolve().as_uri()}?mode=ro", uri=True)
    connection.row_factory = sqlite3.Row
    entity = connection.execute("SELECT entityFormID FROM Entity WHERE editorID='SDOW_SlasherClue'").fetchone()
    spawns = list(connection.execute("SELECT * FROM Position WHERE referenceFormID=?", (entity[0],)))
    assert len(spawns) == 108, "Review a changed spawn set before publishing"
    assert {point["spaceFormID"] for point in spawns} == {2480661}
    markers = list(connection.execute("SELECT * FROM MapMarker WHERE spaceFormID=2480661"))
    polygons = []
    pattern = r"(" + "|".join(REGIONS) + r")SubRegion\d+"
    for region in connection.execute("SELECT * FROM Region"):
        match = re.fullmatch(pattern, region["regionEditorID"])
        if not match:
            continue
        parts = collections.defaultdict(list)
        for point in connection.execute("SELECT * FROM RegionPoints WHERE regionFormID=? ORDER BY subRegionIndex,coordIndex", (region["regionFormID"],)):
            parts[point["subRegionIndex"]].append((point["x"], point["y"]))
        for points in parts.values():
            polygons.append((REGIONS[match[1]], points))

    groups = {}
    border_assignments = []
    for point in spawns:
        x, y = point["x"], point["y"]
        matches = {name for name, polygon in polygons if contains(x, y, polygon)}
        assert len(matches) <= 1, "Overlapping region definitions need review"
        if matches:
            region = matches.pop()
        else:
            # Three border points fall into narrow gaps between subregions.
            region = min(polygons, key=lambda item: edge_distance(x, y, item[1]))[0]
            border_assignments.append(point["instanceFormID"])
        marker = min(markers, key=lambda item: (x - item["x"]) ** 2 + (y - item["y"]) ** 2)
        key = (region, marker["label"])
        group = groups.setdefault(key, {
            "id": slug(region + "-" + marker["label"]), "region": region,
            "name": marker["label"], "icon": marker["icon"],
            "marker": [round(marker["x"], 2), round(marker["y"], 2)], "spawns": [],
        })
        angle = math.atan2(x - marker["x"], y - marker["y"])
        bearing = ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"][int(math.floor(angle / (math.pi / 4) + .5)) % 8]
        group["spawns"].append({"id": f"{point['instanceFormID']:08X}", "number": int(point["label"].rsplit("_", 1)[1]), "x": round(x, 2), "y": round(y, 2), "z": round(point["z"], 2), "bearing": bearing})
    locations = sorted(groups.values(), key=lambda item: (item["region"], item["name"]))
    for location in locations:
        location["spawns"].sort(key=lambda point: point["number"])
    counts = collections.Counter()
    for location in locations:
        counts[location["region"]] += len(location["spawns"])
    assert dict(counts) == {"Ash Heap": 7, "Burning Springs": 11, "Cranberry Bog": 1, "Forest": 24, "Savage Divide": 33, "Skyline Valley": 8, "The Mire": 13, "Toxic Valley": 11}
    output = {
        "gameVersion": connection.execute("SELECT value FROM Meta WHERE key='GameVersion'").fetchone()[0],
        "sourceRelease": "2.0.5.2", "reviewedAt": "2026-09-17",
        "borderAssignments": border_assignments,
        "regions": [{"name": name, "spawns": count} for name, count in sorted(counts.items())],
        "locations": locations,
    }
    target = pathlib.Path(__file__).resolve().parents[1] / "src/fallout/data/slasher-spawns.json"
    target.write_text(json.dumps(output, indent=2) + "\n", encoding="utf-8")
    print(f"Exported {len(spawns)} points / {len(locations)} landmark areas / {len(counts)} regions to {target}")


if __name__ == "__main__":
    main()
