// Small material details remain legible in both the journal and room shelves.
const details = {
  "old-boot": [
    ["M13 5h19v3H13m2 2h14v2H15", "#35473b"],
    ["M16 8h12v1H16M11 31h9v1h-9m24 0h9v1h-9", "#c8ceb0"],
    ["M16 21h8v8h-8z", "#839478"],
    ["M17 22h2v1h-2m3-1h2v1h-2m-5 5h2v1h-2m3-1h2v1h-2M25 14h5v1h-5m0 3h5v1h-5m0 3h5v1h-5", "#dbcd9f"],
    ["M12 36h5v1h-5m8-1h5v1h-5m8-1h5v1h-5m8-1h5v1h-5M35 29h3v1h-3", "#50664e"],
  ],
  "soggy-disk": [
    ["M9 31h2v3h3v2h-5M39 9h3v3h3v2h-2v-2h-4z", "#396c5d"],
    ["M17 7h1v9h-1m17-8h2v5h-2M16 24h21v1H16", "#ebefce"],
    ["M18 32h3v1h-3m2 1h7v1h-7m-6-6h2v1h-2", "#a3b49a"],
    ["M11 18h2v5h-2m27 9h2v2h-2M29 37h1v2h-1", "#99e0d1"],
    ["M39 29h2v3h-1v1h-1m-23-1h2v2h-2", "#365d4e"],
  ],
  "cracked-controller": [
    ["M15 13h10v1H15m15 0h9v1h-9M7 25h1v4H7m35-4h3v1h-3", "#e4ead0"],
    ["M27 15h1v3h3v2h-1v1h-3v3h-1v-4h3v-1h-2z", "#173a34"],
    ["M37 17h3v1h-3m7 5h3v1h-3M12 18h1v3h-1", "#f2d4cf"],
    ["M24 23h2v1h-2m6-1h2v1h-2M11 30h3v1h-3m28-1h3v1h-3", "#52796a"],
    ["M20 3h1v2h-1m2 2h3v1h-3", "#94b3a0"],
  ],
  "rusty-can": [
    ["M17 8h22v1H17M17 34h23v1H17m2-24h1v4h-1m-1 8h1v7h-1", "#e0d6b1"],
    ["M16 21h4v2h-2v4h-2M37 16h3v2h-1v5h-2", "#6e4735"],
    ["M16 16h1v2h-1m3 10h2v1h-2m16-14h2v1h-2m1 15h2v1h-2", "#e2a066"],
    ["M24 6h9v2h-9z", "#425b52"],
    ["M26 6h5v1h-5m-3 27h12v1H23", "#a3b6a1"],
  ],
  "wet-keyboard": [
    ["M8 13h37v1H8M5 32h43v1H5", "#c5d7b8"],
    ["M11 17h2v1h-2m6-1h2v1h-2m6-1h2v1h-2m12-1h2v1h-2m6-1h2v1h-2M10 24h3v1h-3m29-1h3v1h-3", "#e0e5c4"],
    ["M10 20h3v1h-3m6-1h3v1h-3m6-1h3v1h-3m12-1h3v1h-3m-16 8h14v1H20", "#7d9a87"],
    ["M26 19h2v2h-2m8 9h2v3h-2m-24-7h2v4h-2", "#8fd7cb"],
    ["M40 30h5v1h-5M28 18h3v2h-3", "#18362e"],
  ],
  "token-chest": [
    ["M20 8h2v8h-2m11-8h2v8h-2M21 24h2v7h-2m10-4h2v5h-2", "#9c642e"],
    ["M10 26h3v1h-3m8 2h5v1h-5m12-3h4v1h-4m6 3h5v1h-5", "#c18843"],
    ["M14 12h2v2h-2m23-2h2v2h-2m-25 17h2v2h-2m23-2h2v2h-2", "#fff0b1"],
    ["M27 18h5v1h-5m-1 0h1v6h-1m-18 10h39v1H8", "#fff0b1"],
    ["M46 30h2v3h-2M11 20h1v12h-1", "#5c3d26"],
  ],
  "floppy-disk": [
    ["M16 7h1v9h-1m17-8h2v6h-2M16 24h21v1H16", "#d4e8da"],
    ["M11 18h1v12h-1M40 14h3v18h-3", "#63b4b8"],
    ["M20 25h2v1h-2m2 0h3v1h-3m2-1h2v1h-2m1 0h4v1h-4", "#d5bad3"],
    ["M18 32h9v1h-9m-6 3h2v1h-2m29-1h2v1h-2", "#416c6e"],
  ],
  "arcade-coin": [
    ["M21 8h13v1H21m-5 5h1v13h-1m5 8h12v1H21m8-22h1v14h-1", "#f4d482"],
    ["M9 16h2v1H9m0 4h2v1H9m0 4h2v1H9m32-11h2v1h-2m0 4h2v1h-2m0 4h2v1h-2M20 36h1v2h-1m4-2h1v2h-1m4-2h1v2h-1m4-2h1v2h-1", "#966b32"],
    ["M19 10h2v2h-2m15 19h2v2h-2M14 16h1v6h-1", "#ffedb8"],
  ],
  "battery": [
    ["M24 4h7v1h-7M18 9h19v1H18M18 34h19v1H18", "#e1e6c5"],
    ["M18 15h2v13h-2M35 14h2v17h-2", "#85af8c"],
    ["M28 17h2v1h-2m-4 11h1v1h-1M22 10h4v1h-4m-3-1v3h-1v-3", "#fff0bb"],
    ["M32 31h3v1h-3M18 35h19v1H18", "#597b62"],
  ],
  "lost-bug": [
    ["M19 17h3v3h-3m12-3h3v3h-3M20 29h5v1h-5m6-1h3v1h-3", "#f7bed0"],
    ["M23 17h1v11h-1m9-11h1v11h-1", "#d587af"],
    ["M18 23h2v3h-2m17-3h2v3h-2m-11 4h1v3h-1", "#9b5c87"],
    ["M21 8h2v1h-2m7-1h2v1h-2M10 20h3v1h-3m30-1h3v1h-3", "#b2d0b3"],
  ],
  "mini-cartridge": [
    ["M13 9h2v17h-2M19 14h15v1H19", "#d4cde7"],
    ["M39 8h3v20h-3M17 29h20v1H17", "#606385"],
    ["M18 6h18v1H18m1 1h16v1H19", "#9f9abb"],
    ["M23 31h1v5h-1m5-5h1v5h-1m4-5h1v5h-1", "#ffe4a3"],
    ["M21 16h2v1h-2m11 4h2v1h-2m-11 6h12v1H21", "#a4cbbd"],
  ],
};

export function BuddyRelicDetails({ id }) {
  return details[id] ? <g shapeRendering="crispEdges">{details[id].map(([d, fill], index) => <path key={index} d={d} fill={fill} />)}</g> : null;
}
