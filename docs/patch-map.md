# The developer's desk

PATCH.LOG is a compact, interactive desk rather than a release list. Six keyboard- and touch-accessible illustrated objects open a discovery dialog: the monitor, notebook, cartridges, Buddy, radio, and first-save disk. Each shares personal context from the existing profile or Now.log and a curated path of three or four real releases. One release is visible at a time. The full archive is available through Find a release, with search, a version selector, and previous/next controls.

`src/data/patchDesk.js` owns the object labels, contextual copy, and related versions. `src/components/PatchDeskObject.jsx` renders lightweight vector furniture; it does not introduce a canvas, animation loop, image dependency, or extra package. Desktop objects sit on a small desk scene. On phones they form a compact, labeled two-column arrangement.

The scene uses layered wood grain, a stitched desk mat, frame hardware, and material shading. SVG gradients and small repeating patterns provide paper, molded plastic, brushed metal, screen glass, and speaker mesh without raster textures or filter effects. The page bird and seasonal decorations anchor to `.patch-desk-scene`, the actual frame; birds hide while discovery or gallery dialogs are open.

Discoveries persist locally under `daivr:patch-desk:discoveries:v1`; malformed or blocked storage is tolerated. Surprise me prioritizes undiscovered objects. Discovery state does not grant XP or change the account's collection.

`src/data/site.js` remains the release source. Optional editorial commentary and image metadata live in `src/data/patchStories.js`. Notes explain decisions supported by release entries; personal context comes from existing site copy. Feature snapshots are labeled as the October 2026 build, not historical screenshots. Galleries declare `src`, `alt`, `caption`, `label`, and `kind`.

Opening a discovery or choosing another release writes `?release=<version>#patchlog`, preserving unrelated parameters. Direct links open that exact release in the archive after the entrance gate closes. Back and Forward restore the relevant release. Closing the discovery removes the release parameter. Copy link has a selectable-input fallback.

The existing Radix dialogs handle focus containment and Escape. Closing a discovery returns focus to the object or archive button; closing the nested gallery returns focus to its image. CRT and Glitch tokens are passed into both portals. Reduced motion disables object hover movement and content transitions. The archive is always manually browsed, with no autoplay or infinite feed.

Tests verify search intersections, archive ordering, legacy dates, version resolution, media references, and short valid discovery paths. Browser verification covers opening desk objects, changing releases and content panes, nested galleries, history, archive search, discovery progress, and desktop/mobile layouts.
