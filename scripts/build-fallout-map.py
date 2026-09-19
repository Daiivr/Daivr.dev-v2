"""Build lossless map tiles and world landmarks from local game/Mappalachia assets.

Usage: python scripts/build-fallout-map.py MAPPALACHIA.db papermap_city_d.dds
Requires Pillow. Reads source assets without modifying them.
"""
import concurrent.futures
import json
from pathlib import Path
import re
import sqlite3
import sys
import urllib.request

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public/fallout"
ICON_SOURCE = "https://raw.githubusercontent.com/AHeroicLlama/Mappalachia/1e5144090d3555c7f35d34cce72b4e8ec4210fbf/Assets/img/mapmarker/"


def save_icon(name):
    assert re.fullmatch(r"[A-Za-z0-9_]+", name), name
    target = PUBLIC / "map-icons" / f"{name}.svg"
    if target.exists():
        return
    with urllib.request.urlopen(ICON_SOURCE + name + ".svg", timeout=30) as response:
        svg = response.read().decode("utf-8")
    # Keep the original blue game artwork and its dark outlines; make it scalable.
    width = re.search(r'width="([\d.]+)px"', svg)[1]
    height = re.search(r'height="([\d.]+)px"', svg)[1]
    svg = svg.replace("<svg ", f'<svg viewBox="0 0 {width} {height}" ', 1)
    target.write_text(svg, encoding="utf-8")


def main():
    database, texture = map(Path, sys.argv[1:3])
    with sqlite3.connect(database.resolve().as_uri() + "?mode=ro", uri=True) as db:
        rows = db.execute("SELECT label, icon, x, y FROM MapMarker WHERE spaceFormID = 2480661 ORDER BY label, x, y").fetchall()
    locations = [dict(name=name, icon=icon, x=x, y=y) for name, icon, x, y in rows]
    (ROOT / "src/fallout/data/world-locations.json").write_text(json.dumps(locations, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (PUBLIC / "map-icons").mkdir(parents=True, exist_ok=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        list(pool.map(save_icon, sorted({row[1] for row in rows})))
    with Image.open(texture) as source:
        assert source.size == (4096, 4096), source.size
        original = source.convert("RGB")
    for level in range(4):
        size = 512 * 2**level
        image = original if size == 4096 else original.resize((size, size), Image.Resampling.LANCZOS)
        for x in range(2**level):
            folder = PUBLIC / "map-tiles" / str(level) / str(x)
            folder.mkdir(parents=True, exist_ok=True)
            for y in range(2**level):
                image.crop((x*512, y*512, (x+1)*512, (y+1)*512)).save(folder / f"{y}.webp", lossless=True, method=6)
    print(f"Exported {len(rows)} world locations, {len(set(row[1] for row in rows))} icons, and 85 lossless tiles.")


if __name__ == "__main__":
    main()
