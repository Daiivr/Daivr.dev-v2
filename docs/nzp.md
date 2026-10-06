# NZ:P journal reward

NZ:P appears as cartridge 06 in the desktop Konami library only when every entry in both the catch catalogue and patrol finds is discovered, including fishing junk and treasure. It is hidden in the mobile layout (760px or narrower), matching the site's mobile CSS; touch input alone does not hide the desktop cartridge. Resizing to mobile closes the game and returns to the library. Encounter counters (Leviathan/Kraken sightings) are not collectible journal entries. The shared catalogue checks known IDs rather than totals. The desktop journal shows the requirement and completion reward.

## Playing

Opening the cartridge powers on the TV and boots NZ:P straight into its own main menu; there is no website launcher or lobby.

- **Solo** starts a single-player game.
- **Cooperative → Create Game** hosts: server name, optional password, max players, then a map. **Cooperative → Join Game** browses open games or connects directly to a room (`/668`) with its password.
- Signed-in Discord players get their display name as the in-game name.
- The TV panel's **Full Screen** push button fullscreens the game frame and hands the keyboard back to it.

Co-op runs on NZ:P's public Frag-Net network, so hosted games are listed in NZ:P's in-game server browser for every NZ:P player, not only visitors of this site. The browser build lists hosted games even with `sv_public 0`. A server password is enforced by the host's game.

## Runtime and limitations

- Uses a local `/nzp/index.html` canvas wrapper, mounted once the TV powers on, with the official engine/assets downloaded from `https://nzp.gay/` (upstream enables CORS). The canvas fills the iframe without scrollbars. No game binary/assets are copied into the repository.
- Loading screen: the wrapper downloads `nzp/progs.pk3` and `nzp/game.pk3` (about 90 MB) itself with streamed progress and hands the engine an `ArrayBuffer`/promise per file (FTE's `Module.files` accepts both), so the engine starts while the archive streams in. Progress is shown as round tally marks chalked in by fifths, a percentage, MB counter and rotating tips; the engine's own status text (`nzp/game.pk3 (…)`) is never shown. Content-Length is the compressed size while bytes arrive decompressed, so each file is capped at its total and the bar holds at 92% until the archive finishes, 96% while the engine starts, then fades out. Without Content-Length it switches to an indeterminate sweep. Buffers are trimmed with `ArrayBuffer.prototype.transfer` where available to avoid a second 90 MB copy.
- The program archive is unpacked in memory and the main menu is cleaned: `Menu_SocialBadge` and `Menu_GetBuildDate` return immediately (no social icons, hit areas or build number), the CREDITS button and its divider are skipped, and `menu_main_buttons` is reordered so arrow keys never land on the removed button. The wrapper fails with a retry message if the upstream menu format changes. `public/nzp/menu-cleanup.mjs` documents the equivalent QuakeC source changes and upstream source. The NZ:P team stays credited through the modal footer's NZ:P TEAM link.
- The wrapper reads the same-origin `/api/comments/me` session (2.5s timeout, in parallel with the downloads) and passes `+set name <name>`, which FTE applies after the saved `config.cfg`. `public/nzp/player-name.mjs` folds accents to ASCII and keeps only letters, digits, spaces, `_`, `.` and `-` (never leading), so a name cannot inject console commands. Guests, and names with no usable characters, keep the name saved in NZ:P's own settings ("Unknown Soldier" by default).
- The wrapper has its own CSP allowing the upstream engine/assets, the Frag-Net relay WebSocket and Google Fonts (the loader uses the site's Orbitron/JetBrains Mono), without widening the rest of the site's frame or script policy.
- Keyboard events are handled once at the document: the wrapper stops propagation to FTE's duplicate canvas listener. It does not cancel defaults or debounce events, so key releases and held-key repeats remain intact. Esc never closes the cartridge; use the close or back buttons.
- Internet access to the game and its Frag-Net networking is required. Upstream P2P can fail behind restrictive NAT/firewalls. See [NZ:P networking documentation](https://docs.nzp.gay/server/server-setup) and [official engine loader](https://github.com/nzp-team/nzp-team.github.io/blob/master/ftewebgl.js).
- Unlocking follows the existing local Buddy save, for guests and signed-in players alike.

## Validation

`npm run test:nzp` covers the unlock catalogue, the game frame's CSP, the menu cleanup patches and player-name sanitizing. `npm run build` verifies the lazy-loaded UI. Live gameplay and co-op depend on the upstream engine and network.
