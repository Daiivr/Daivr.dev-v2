# Buddy's personal room

Open **Room** in the sidebar's Buddy card. On phones, open **Buddy**, then the **Room** tab.

The room supports three color palettes, three beds, three rug choices, and three tabletop decorations. Two shelves display discovered patrol finds, fishing junk, and fishing treasure; living fish stay in the aquarium. The shared catch catalog distinguishes actual fish from non-fish catches even though both use `fish:` journal keys. The same eligibility function drives the collection picker, rendering, guest storage, and account normalization. Existing saved shelf fish are cleared when the room is loaded, without removing them from the collection. The aquarium features a chosen fish and up to two other discovered fish species. Empty collections still get the furnished room and an empty planted tank. Displaying an item never consumes inventory or changes adventure progress.

The room uses tiled SVG patterns for wallpaper, wood grain, floorboards, quilted bedding, woven rugs, and paneling. The window contains shaded mountain and forest layers, clouds, passing birds, and seasonal effects: snow in winter, leaves in autumn/Halloween, and fireflies in spring/summer. Winter and Aurora rooms also show an aurora. The tank has layered water, driftwood, gravel, plants, glass reflections, bubbles, swimming paths, and moving fins. Reduced motion disables all scene animation.

The studio controls use miniature furniture previews, numbered groups, neon selection indicators, and a save-status panel drawn from the existing CRT/Glitch theme tokens. Curtains, a framed constellation print, and a warm reading-lamp glow finish the room. Floor textiles are painted before furniture and contact shadows so the aquarium cabinet's legs remain visible over the rug.

The window mixes irregular evergreen boughs with seasonal deciduous crowns and occasional shooting stars. Scene labels appear on hover or keyboard focus; the window caption also supports tap focus. Clicking Buddy toggles a nap and shows a speech bubble for four seconds; another click restarts that timer. A gray-and-white husky sleeps on a cushion beside the bed, breathing gently. Its fluffy tail has three overlapping joints that bend in sequence, with a delayed tip and gentle settling. The root stays fixed at the rump throughout each wag. Its three-quarter face has paired eye masks, a tapered white blaze, and a shaded muzzle. Its 34-second cycle includes a slow head lift, two glances, blinking, a small ear/tail twitch, and settling back to sleep. These details use CSS animations and no recurring JavaScript updates; reduced motion leaves the dog asleep and hides meteors.

## Saves

Changes are previews until **Save room** is pressed. **Undo** returns to the saved arrangement. Guests save locally in `daivr.buddyRoom.v1.guest`. Signed-in visitors save to the existing `/api/buddy` endpoint using `action: save-room`; their local fallback is keyed by account ID. Failed account saves retain a pending local copy and offer retry. Session changes are rejected by the server before writing another account's room. Closing the view discards unsaved previews.

`shared/buddy-room.mjs` bounds and normalizes the saved shape. The backend adds `room` and `hasRoom` to Buddy's existing payload, preserving friendship, gear, and adventure data. There is no migration requirement for old saves.

## Rendering and verification

`BuddyRoom.jsx` is lazy loaded from the existing Buddy dialog. Its scenery and aquarium are separate components; CSS comes with the room chunk. No downloaded texture images, new dependencies, canvas, or 3D engine are required. Window and fish motion use CSS transforms/opacity. UI controls support keyboard and touch; the existing dialog contains focus and returns it on Escape.

Validation: 24 automated tests passed and the production build succeeded. Room API tests cover guest rejection, cross-origin rejection, account changes, save round trips, normalization, and preservation of existing Buddy progress. Browser checks covered guest persistence after reload, an isolated signed-in account, actual collected fish and finds, desktop and 390px mobile layouts, save/undo controls, Escape focus restoration, and reduced motion. The test collection is isolated from real player data.

See `mobile-performance-2026-10-01.md` for the mobile loading audit and its limitations.
