# Fallout reference images

- The Guides library plots numerical
  Fallout 76 position records and map-landmark names extracted from Mappalachia
  2.0.5.2 (game version 1.7.26.13). Location photographs are documented separately below.
  Data release: https://github.com/AHeroicLlama/Mappalachia/releases/tag/2.0.5.2
  Reviewed September 17, 2026. See `src/fallout/README.md` for extraction details.

Game imagery belongs to Bethesda Softworks. Used as reference images in this
unofficial Fallout 76 fan terminal at the user's request, not as page backgrounds.
Local WebP copies were resized/compressed for delivery; no generative edits.

- `minerva.webp`: Minerva portrait, The Fallout Wiki.
  Source page: https://fallout.wiki/wiki/Minerva
  Image: https://images.fallout.wiki/5/56/FO76SR_merchant_Minerva.png
- `shadow-axolotl.webp`: Shadow Axolotl render, Nuka Knights.
  Source page: https://nukaknights.com/articles/catch-axolotl-all-regions-and-months-incl-map.html
  Image: https://nukaknights.com/img/axolotl/tn_3_axolotl-shadow-20250405-08-48-13.png

Retrieved September 13, 2026. Other monthly axolotl images use the matching
public image URL supplied by the Nuka Knights monthly report.

- `appalachian-dusk.webp`: Original AI-generated Appalachian landscape, created
  for this fan site's surrounding backdrop and loading screen on September 13,
  2026. It is not a game screenshot. WebP encoding preserves the full composition.

- `fonts/fallout76-icon-tags.woff2`: Seven-glyph web subset of the user-supplied
  `Fallout76IconTags_v30_beta.ttf` (Fallout76IconTags 3.0 Beta). Includes U+F400,
  U+F716, U+E5A1, U+F232, and U+F24B–U+F24D; original glyph outlines are unchanged.

- `vault-boy.png`: Vault Boy thumbs-up artwork, Bethesda Softworks, hosted by
  FreePNGimg. Used as a decorative wall mural in the unofficial fan-site intro.
  Source: https://freepngimg.com/png/140272-pip-boy-fallout-free-hd-image
  Image: https://freepngimg.com/thumb/fallout/140272-pip-boy-fallout-free-hd-image.png
  Retrieved September 15, 2026. Original PNG preserved; faded pigment and chipped
  paint applied with CSS and an SVG opacity filter in the interface.

- `map-tiles/**/*.webp`: Fallout 76 in-game Appalachia map, © Bethesda.
  Extracted September 19, 2026 from the installed game's `SeventySix - Textures04.ba2`,
  `textures/interface/pip-boy/papermap_city_d.dds`, using fo76utils baunpack.
  Original 4096 × 4096 pixels preserved at the highest tile level; lower levels
  use Lanczos downsampling. All 85 tiles use lossless WebP. No generated detail.
  Coordinates use Appalachia worldspace center (-500, 135), range 582550.
- `map-icons/*.svg`: 85 original game marker icons, © Bethesda, distributed
  by Mappalachia. Only responsive SVG viewBox metadata was added.
  Source: https://github.com/AHeroicLlama/Mappalachia/tree/1e5144090d3555c7f35d34cce72b4e8ec4210fbf/Assets/img/mapmarker
  Retrieved September 19, 2026. All 458 world markers use the Mappalachia 2.0.5.2
  database coordinates; see `scripts/build-fallout-map.py` for reproduction.

- `mask-locations/*.avif`: 108 in-game location screenshots from the user-requested
  mask spawn guide: https://theduchessflame.com/df/collectables/pint-sized-slasher-masks/spawn-locations/
  Retrieved September 19, 2026. Original AVIF files preserved without cropping,
  watermark removal, or generated edits. Bethesda game imagery; photography
  belongs to its respective creator. Per-image URLs and mask associations are
  recorded in `scripts/slasher-photo-provenance.json`. No guide prose imported.

- `rewards/*.webp`: Ghost Boy, Laughing title preview, Pint-Sized Fishing Bobber,
  and Pint-Sized Radio images supplied by the user on September 19, 2026.
  Replaced the previous Nuka Knights reference images with `Firefly (4) (1).png`,
  `Firefly (3) (1).png`, `Firefly (2) (1).png`, and `Firefly (1) (1).png`,
  respectively. Full compositions and transparency preserved; encoded as WebP
  at up to 660px on the longest edge for delivery. Fallout imagery © Bethesda;
  user-supplied artwork is not represented as an unmodified game render.
