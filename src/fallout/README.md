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
