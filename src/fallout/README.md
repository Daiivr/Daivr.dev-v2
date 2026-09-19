# Dai's Fallout terminal

`/fallout` is an independent lazy React entry selected in `src/main.jsx`. The
portfolio keeps its existing hash navigation; a logo-only button beside Terminal links to this page.
The Fallout UI uses local `fo-` CSS, the existing font families and Lucide icons,
and original vault/silo SVG artwork. `field-station.css` supplies the worn blue
enamel housing, inset green CRT, paper merchant dossier, and blue research file. At the user's request, Minerva and axolotl
files use real game imagery, with provenance recorded in
`public/fallout/CREDITS.md`. These are foreground reference images, not page
backgrounds. No sound or additional image libraries ship to visitors.

## Run and deploy

- `pnpm dev` serves the page and `/api/fallout` through the existing Vite middleware.
- `pnpm build` creates both `dist/index.html` and `dist/fallout/index.html`.
- `pnpm start` runs the existing Node server. `/fallout` and `/fallout/` serve
  the dedicated HTML with HTTP 200, title, description, canonical and OG metadata.
- `node --test scripts/test-fallout.mjs` tests parsing, DST, validity boundaries,
  source outages, partial failures, request coalescing and stale-cache behavior.

The existing Node deployment requires no additional packages or environment
variables. Static-only hosting can serve `dist/fallout/index.html`, but needs
the Node `/api/fallout` endpoint forwarded; without it, designed offline states
appear. This change does not publish a deployment itself.

## Data contract and sources

JSDoc interfaces live in `data/contracts.js`. `services/useFalloutIntel.js` only
fetches the site's own API. `server/fallout-source.mjs` adapts the public English
Nuka Knights pages; `server/fallout.mjs` handles timeouts and caching. The source
has no authenticated dependency. Its public pages were accessible during review
on 2026-09-13; its robots policy allows these page paths. No undocumented private
API is used. Provider attribution is retained here and in the data contract;
the visible interface shows report timestamps without provider links.

The server fetches three pages at most once every 15 minutes per process, merges
concurrent requests, limits responses to 1.5 MB, and times out requests after
8 seconds. On failure it waits at least a minute before retrying. Successful
sections survive failures of other sections. Stale copies last at most 24 hours,
retain their original fetch timestamps, and never enable launch-code copying.
Expired/future code windows fail closed. Server memory is a convenience cache,
not an authoritative database, and resets on deployment.

The adapter is intentionally narrow: changed markup or missing validity dates
must produce an unavailable report instead of guessed data. The English public
source displays US Eastern dates. `Intl` converts them using America/New_York,
including daylight saving time. Counts and statuses are recomputed from actual
source dates in the browser. “Source checked” means retrieval time, not the time
the publisher originally updated its data or independent in-game verification.

Minerva's inventory is joined by the exact event URL from the homepage's merchant
report. Other dates can have a schedule without an item manifest; the UI says so
without inventing a manifest. It never substitutes a different week's inventory.

A.X.O.L.O.T.L. is a presentation label, not a claimed official acronym. It covers
the monthly fishing rotation. The adapter includes the matching specimen image
from the source's fixed `/img/axolotl/` directory; an unknown or broken image
gets a readable placeholder. Shadow Axolotl uses an optimized local copy.
`data/sources.js` also contains separately reviewed
Bethesda reward bulletins with explicit start/end dates and citations. Update
these only after checking a new official bulletin. Rewards expire automatically;
they are not labeled as a live API feed. General event data comes from the source
homepage, with explicit unknown end times where applicable.

## Field guides

Channel 05 opens `/fallout/guides`; the mask guide has its own address at
`/fallout/guides/pint-sized-slasher-masks`. Both routes have generated static
HTML metadata and explicit Node-server handling for direct visits and reloads.
The library and guide are independent of the four live intelligence feeds.

The guide prose and map interface are original. The map uses Leaflet CRS.Simple
with Bethesda’s in-game Appalachia artwork, locally compressed to WebP. All 108 mask records were
extracted from the Mappalachia 2.0.5.2 database (game 1.7.26.13), with 59 search
areas computed from nearest map landmarks. These are landmark groups, not
hand-verified walking routes. Mask pins use world coordinates; bearings use the map icon as
their reference, not fast-travel arrival positions. Regions follow the game
subregion polygons; three points in boundary gaps use the nearest polygon.
The source release is https://github.com/AHeroicLlama/Mappalachia/releases/tag/2.0.5.2.

`scripts/import-slasher-spawns.py` reproduces `data/slasher-spawns.json` from a
local database. `data/guides.js` contains lightweight card totals and reward
stages; tests keep these in sync. Only numerical game facts and landmark names
are extracted. No third-party guide text or Mappalachia application code is
incorporated. Game-map artwork provenance is in `public/fallout/CREDITS.md`. Reference links appear in the guide's survey notes. There is no
collection tracking or completion storage.

## Adding a provider

Add a parser that returns the documented contract, fetch its fixed public URL on
the server, validate dates and eight-digit code strings, and retain source URL
and retrieval time. Keep HTML outside React; all source text renders escaped.
Do not extend a validity window or derive “current” status from a retrieval alone.

## Startup readiness

The CRT boot screen tracks actual interface, initial report, rendered image decode,
and font readiness. Images are eager so the terminal opens with its field photos
already decoded. Completed checks drive progress; this is not a download percentage.
The full bar holds for 750 ms before a 320 ms fade. Returning visits omit the first
visit minimum; reduced motion disables animation and shortens the completion hold.
The request timeout and bounded asset/font waits lead to labeled offline/fallback
checks instead of an endless boot. Escape remains an explicit manual skip.

## Guide game map

`data/gameMap.js` maps game X/Y into the 4096px artwork using the worldspace
center (-500, 135) and full range 582550. North remains positive Y in Leaflet;
the browser handles the image-axis inversion. Pins, landmark centers, and
zoom bounds all use this same transform. The illustrated map does not provide
floor-level detail. Area selection fits its masks; individual selection centers
a pin and opens its popup. Overview restores filtered areas after panning.
Mouse drag, touch drag/pinch, keyboard arrows and +/− controls are supported.
Wheel zoom is enabled while the pointer is over the map. Resize observers
and the Leaflet instance are disposed when the component unmounts.

The illustrated texture is now the native 4096 × 4096 `papermap_city_d.dds`
from the installed game, delivered as 85 lossless WebP tiles (512px, levels
0–3). The offset Simple CRS produces standard top-left XYZ tile addresses;
world coordinates remain unchanged. Native Leaflet zoom 0 is 1:1; automatic
area framing allows zoom 1.5 to separate nearby mask pins, and manual zoom goes
up to level 2. The artwork scales beyond its native resolution at these close
views; the SVG icons remain sharp. Tiles load on demand. Overview fits and
centers the complete artwork with equal padding, rather than the off-center
mask distribution. Resizing preserves the geographic center.

`data/world-locations.json` contains all 458 Appalachia MapMarker records from
the same Mappalachia database. Their 85 original blue SVG game icons occupy
a separate pane below the mask pins, with hover, keyboard and touch names.
The world-location toggle affects only that layer. Offscreen icons are removed
from the keyboard tab order. Only landmarks within the viewport plus a 15%
buffer are attached to the DOM; cached markers are reused on subsequent pans.
Viewport updates are batched per animation frame, icon zoom animation and tile
fading are disabled, and tiles refresh after zoom/pan settles. Ordinary world
icons use their built-in outlines without a CSS filter per marker.
Rebuild the tiles, icons and records with
`python scripts/build-fallout-map.py MAPPALACHIA.db papermap_city_d.dds`
(requires Pillow); the source game files are only read.

## Mask location photographs

`data/slasher-photos.json` associates each stable mask FormID with one local AVIF
under `public/fallout/mask-locations/`. The user-requested source guide has a
different route order; its spawn array must not be zipped with our map IDs.
Photo associations were checked by registering the paired map screenshots to
our game map and comparing the player position with mask coordinates, assigning
one photo per point in each landmark group. The Camden boat photo belongs to
mask 037 (008F83BD), not 035. Rapidan photo 1 is assigned by elimination after
matching photos 2 and 3; Makeout Point has only one mask. Per-image sources and
matching notes live in `scripts/slasher-photo-provenance.json`.

Leaflet creates photo content only when a popup opens. Its thumbnail reserves
space while loading, and an error leaves the pin information usable. Clicking
the photo opens a native modal dialog with Escape, a close button, focus trapping,
and focus restoration. Images remain unmodified. No completion state is stored.
