# Bundled community maps

`py -3 tools/nzp-maps/import.py` (or `python3` on other platforms) downloads
the pinned releases, checks their SHA-256 sums, and writes FTE-compatible PK3s
and `public/nzp/custom-maps.mjs`. An optional directory argument reuses ZIPs
already downloaded. The catalogue records authors, discussion/download URLs,
source hashes and output hashes; treat upstream updates as reviewed changes.

These are community releases, with the original authors credited in the game
menu and catalogue. Bundling does not relicense their artwork or maps.

| Map | Author | Release |
| --- | --- | --- |
| Town | glitcheking | [#470](https://github.com/nzp-team/nzportable/discussions/470), August 2024 update, GitHub mirror |
| Isolation | TheLungy | [#882](https://github.com/nzp-team/nzportable/discussions/882), August 2024 archive |
| Pump | Naievil & oldschool125 | [#166](https://github.com/nzp-team/nzportable/discussions/166), archived legacy release |
| Freddy Fazbear's Pizza | Veemonster / panicmanic2410 | [#340](https://github.com/nzp-team/nzportable/discussions/340), PC package |
| Azure Purgatory | Blake Izayoi | [#898](https://github.com/nzp-team/nzportable/discussions/898), v1.1 archive |

Repackaging only normalizes map, waypoint and menu/loading image filenames to
lowercase and supplies the missing native menu descriptions for Isolation and
Pump. BSPs, waypoint contents, textures, custom models and sounds are preserved.
The optional global FNAF enemy replacement is not part of the map package.
Pump's legacy `progs/props/jeep.mdl` is included; the engine's existing legacy
asset compatibility remains in use. No community package replaces game programs
or configuration. The import was checked against the current upstream game.pk3
for file collisions (none).

All five packages add approximately 14.3 MiB to the first game download. Browser
HTTP caching applies normally. They mount before the game's own map discovery;
Solo and Cooperative both use the same installed content. Archive tests verify
checksums, required BSP/waypoint/menu data, thumbnails and cross-package paths.

Browser smoke tests cover menu discovery and reaching round one on all five
maps, not complete playthroughs or multiplayer sessions. Original map quirks
remain: Isolation's `func_ending` points at the incomplete path `models/props/`
and logs a missing-model warning; Pump logs missing additional player starts
for slots 6–8. The stock engine also logs an unprecached `demon/dland2.wav`
sound on several maps. These did not prevent the single-player smoke tests.
