# Mobile performance measurement — October 1, 2026

The live site currently scores **33–38/100** in two Lighthouse mobile navigation runs. Loading and main-thread work need improvement; visual layout stability is good. Buddy's new room is not deployed to the live site by this change.

## Method

- Lighthouse 12.8.2, headless Microsoft Edge, 412 × 823 mobile viewport at 1.75 device scale.
- Simulated mobile throttling: 150 ms RTT, 1,638.4 Kbps throughput, 4× CPU slowdown.
- Production builds only; the Vite development server was not scored.
- Fresh navigation to the entry gate. The audit does not enter the site or open the room.
- These are lab measurements on this workstation, not real visitor percentiles or physical-phone benchmarks. External content and CPU load varied between runs. Do not interpret score changes as a measured optimization gain.

| Measurement | Local before room | Local with textured room | Live run 1 | Live run 2 |
| --- | ---: | ---: | ---: | ---: |
| Performance | 32 | 40 | 33 | 38 |
| First Contentful Paint | 9.47 s | 9.46 s | 4.12 s | 4.04 s |
| Largest Contentful Paint | 18.13 s | 17.73 s | 8.10 s | 8.61 s |
| Total Blocking Time | 1,099 ms | 624 ms | 1,422 ms | 904 ms |
| Cumulative Layout Shift | 0.0009 | 0.0013 | 0.0013 | 0.0013 |
| Total transferred | 6.22 MB | 6.22 MB | 20.52 MB | 20.52 MB |

The local Node server serves uncompressed JS/CSS, while the live deployment compresses them. Local guestbook fixtures also have fewer media attachments. This explains why local loading time is worse while live transfer volume is larger; compare like environments rather than directly comparing their scores.

The LCP element in these runs is the entry-gate door texture (`.entry-gate-door-texture`). On the baseline local run, about 11.3 seconds of the simulated LCP was render delay and 6.3 seconds was resource load delay. Investigate startup rendering and competing requests before assuming the small gate texture itself is the large download.

## Largest observed live downloads

| Resource | Transferred |
| --- | ---: |
| Largest guestbook GIF | 11.00 MB |
| Second guestbook GIF | 3.17 MB |
| Project archive PNG | 1.40 MB |
| Discord avatar decoration | 0.67 MB |
| Another guestbook GIF | 0.48 MB |
| Discord avatar | 0.42 MB |
| Local profile PNG | 0.40 MB |

The two largest GIFs alone are roughly 69% of the live navigation transfer. Priority follow-ups:

1. Defer guestbook media until its section is near the viewport. Prefer small previews and load original animation on request.
2. Convert the project archive background to an appropriately sized WebP/AVIF and avoid fetching it behind the entry gate.
3. Defer offscreen animated Discord decoration and load avatars sized to their display.
4. Profile initial rendering, split noncritical CSS/features, and reduce main-thread work around the gate. The shared stylesheet is currently about 934 KB uncompressed / 154 KB gzip; the main app chunk is about 759 KB / 246 KB gzip.

These are measured follow-up candidates, not performance fixes included in the room implementation.

## Cost and interaction checks for Buddy's room

**Later update (v2.51.0):** the room renderer and styles now load with the cabinet, rather than as a separate room chunk. This prevents an already-open tab from failing when a rebuild replaces that deferred file; a room error boundary also keeps rendering failures inside the dialog. The deferred-loading figures below describe the earlier audited builds. Lighthouse has not been rerun for this loading change, and those scores are not measurements of the current build.

The final room chunk is **29.43 KB JS + 11.88 KB CSS**, approximately **13.42 KB combined gzip**, fetched only when Room is opened. It downloads no texture images. Neither room chunk appears in the final navigation audit's network log. The last tiny save-ownership guard and Patch.log text update were built and tested after that audit; they do not change its scenery or eager-loading behavior.

The subsequent room polish (illustrated controls, curtains, framed art, corrected furniture layering, richer trees, shooting stars, and the animated sleeping dog) increased the deferred room bundle to approximately **18.4 KB gzip**. The figures above describe the earlier audited build; these additions were checked in the browser on desktop/mobile and still use the same lazy-loading boundary. No new Lighthouse score is claimed for the later visual revisions.

Desktop and 390 × 844 browser checks showed the room, collection editor, and save controls rendering without page errors or horizontal overflow. Guest reloads and isolated account saves were verified. CSS transforms were sampled across time to confirm cloud drift, tree sway, and fish movement; reduced motion yielded zero running scene animations. These checks establish behavior, not a room-open INP or FPS score. Lighthouse navigation TBT is not INP; field INP still needs real-user measurement.

## Reproduce

Build with `npm run build`. Start `node server.mjs` with a local port, a test session secret, and isolated data directories; do not point validation at real player saves. Set `CHROME_PATH` to the browser executable, then run:

```powershell
npx --yes lighthouse@12.8.2 http://127.0.0.1:4179 --only-categories=performance --output=json --output=html --output-path=mobile-audit --chrome-flags='--headless --disable-gpu'
```

Run the same command against `https://daivr.dev` to measure production. Repeat when content, caching, or deployment changes; do not compare a single run as proof of improvement.

Raw HTML/JSON reports and screenshots from this session are saved under `C:/Users/ohits/AppData/Local/Temp/daivr-room-audit-20261001/`: `baseline`, `after`, `final-textures`, `live-mobile`, and `live-mobile-repeat` report pairs. This directory is temporary; this document retains the key results in the repository.
