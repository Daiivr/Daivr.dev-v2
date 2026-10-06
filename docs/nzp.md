# NZ:P journal reward

NZ:P appears as cartridge 06 in the desktop Konami library only when every entry in both the catch catalogue and patrol finds is discovered, including fishing junk and treasure. It is hidden in the mobile layout (760px or narrower), matching the site's mobile CSS; touch input alone does not hide the desktop cartridge. Resizing to mobile closes the game and returns to the library. Encounter counters (Leviathan/Kraken sightings) are not collectible journal entries. The shared catalogue checks known IDs rather than totals. The desktop journal shows the requirement and completion reward.

## Playing

Opening the cartridge powers on the TV and boots NZ:P straight into its own main menu; there is no website launcher or overlay.

- **Solo** starts a single-player game. It doesn't register with Frag-Net.
- **Game over** keeps GAME OVER and the scoreboard up. 2.5 s later, **Try again** (restarts the map) and **Return to menu** fade in under the scoreboard; nothing restarts on its own. In co-op only the host gets Try again, since it restarts the map for everyone, and guests see "Waiting for host".
- User Maps and Random leave out `weapon_test`, a developer test map that ships in `game.pk3`.
- **Game Settings** changed from their defaults (mode, difficulty, start round past 1, magic, headshots only, horde size, fast rounds) keep the game out of the rankings and the daily challenge. Picking a map resets them, so a default game always ranks. Hovering GAME SETTINGS in the pre-game menu, or any option inside it, adds a glowing note saying so under its description.
- **Own explosives:** going down to your own rocket or grenade in a way that ends the game no longer drops you to the main menu. Upstream's `LastStand_Begin` left `self` pointing at the player on those early returns, so the projectile's cleanup tried to delete the player ("cannot free player entities"), and that server error kicked you out.
- **Cooperative → Create Game** hosts a session: name (defaults to "<player name> co-op"), optional password, max players (1–8, starts at 4), then a map.
- **Cooperative → Join Game** opens the session list directly. It shows only sessions hosted from daivr.dev, with a padlock on password ones. Picking a locked session asks for its password; open ones join straight away.
- Signed-in Discord players get their display name as the in-game name.
- The trophy button opens three rankings: **Round** (highest round in one game), **Kills** (total zombies killed) and **Money** (total points earned).
- The TV panel's **Full Screen** key fullscreens the game frame and hands the keyboard back to it.

## How it's built

- **Engine and data:** a local `/nzp/index.html` canvas wrapper, mounted once the TV powers on. The engine (`ftewebgl.js`/`.wasm`) and `nzp/game.pk3` come from `https://nzp.gay/` (upstream enables CORS).
- **Programs:** the three programs (`menu.dat`, `csprogs.dat`, `qwprogs.dat`) are daivr.dev's own build in `public/nzp/progs/`. They are compiled from NZ:P's GPL-2 QuakeC at a pinned commit plus `tools/nzp-qc/daivr.patch`; see [tools/nzp-qc/README.md](../tools/nzp-qc/README.md) for what the patch changes and how to rebuild (`corepack pnpm build:nzp-progs`). The patch and the pinned commit are the corresponding source.
- **Following upstream:** when nzp.gay updates its engine or `game.pk3`, re-pin and rebuild so the programs stay in step.
- **Session list:** before every co-op list refresh, host or join, the menu sets `com_protocolname NZP-DAIVR`. That keeps daivr.dev sessions in their own Frag-Net list (`master.frag-net.com:27950/raw/NZP-DAIVR`), out of NZ:P's public browser, and NZ:P's public games out of ours. A launch argument can't do this because NZ:P's startup resets the cvar to `NZP-REBOOT-WEB`. The list is still public on master.frag-net.com under that name, so a session password is what keeps strangers out; the host's game enforces it.
- **Loading screen:** the wrapper downloads `game.pk3` (about 90 MB) and the three programs itself with streamed progress. It hands the engine a promise per file (FTE's `Module.files` accepts promises), so the engine starts while the archive streams in.
  - Progress shows as round tally marks chalked in by fifths, a percentage, an MB counter and rotating tips. The engine's own status text (`nzp/game.pk3 (…)`) is never shown.
  - Content-Length is the compressed size while bytes arrive decompressed, so each file is capped at its total. The bar holds at 92% until the archive finishes and 96% while the engine starts, then fades out. Without Content-Length it switches to an indeterminate sweep.
  - Buffers are trimmed with `ArrayBuffer.prototype.transfer` where available, to avoid a second 90 MB copy.
- **Player name:** the wrapper reads the same-origin `/api/comments/me` session (2.5s timeout) and passes `+set name <name>`, which FTE applies after the saved config. `public/nzp/player-name.mjs` folds accents to ASCII and keeps only letters, digits, spaces, `_`, `.` and `-` (never leading), so a name cannot inject console commands. Guests keep the name saved in NZ:P's own settings ("Unknown Soldier" by default).
- **Stats:** on every round change and at game over, the client program prints `[daivr] nzp-stats <round|end> <round> <kills> <headshots> <total score> <map> <custom>`. `custom` is 1 when the host changed any Game Setting; the server publishes it as the `daivr_custom` serverinfo key so co-op guests report it too. The wrapper parses it (`public/nzp/stats-line.mjs`) and posts `nzp:stats` to the cartridge; origin and source are checked.
  - FTE writes its console straight to `console.log` (`_emscriptenfte_print` in `ftewebgl.js`) and never calls `Module.print`, so the wrapper reads the lines by wrapping the game frame's `console.log`.
  - The cartridge saves one record per game, at game over (the `end` line). A game left early (back to the menu, or the cartridge closed) saves nothing; lower counters or another map just start tracking a new game. Games without a kill are skipped, and so are games with changed Game Settings (the cartridge says "CUSTOM GAME SETTINGS // NOT RANKED", it doesn't check the daily goal for them, and the server refuses them). The server also refuses `weapon_test`, and ignores a best round saved there before that (the record leaves the Round ranking until the next game; kill and point totals stay).
  - The total score is NZ:P's scoreboard score, including the 500 starting points.
- **Daily challenge:** NZ:P takes one day in four of the shared rotation (`shared/player-catalog.mjs`), with a goal that changes each time it comes round: survive to round 10, 40 headshots, 150 kills or 15,000 points in one game. Its rewards are the Survivor, Marksman, Exterminator and Tycoon accents.
  - **Fallback:** a player who hasn't unlocked NZ:P gets one of the regular challenges that day, so streaks never break over a locked game. On the server, unlocked means the server-saved Buddy journal is complete or the player has saved an NZ:P game (`server/nzp-unlock.mjs`). On the client, App announces the local journal state (`daivr-nzp-unlocked`) for Buddy's chatter and the terminal's `play daily`.
  - **Mobile:** NZ:P is desktop-only, so a player who unlocked it but is on a phone still gets the NZ:P goal.
  - **Progress:** it is keyed by `game:metric`, so unlocking NZ:P mid-day starts the NZ:P goal fresh instead of comparing kills against a Tower Block goal.
  - **Saving:** saved games count toward it, and `POST /api/nzp/challenge` checks it mid-game so the "challenge complete" notice appears while you play.
- **Rankings API:** `GET /api/nzp/leaderboard?board=round|kills|score`, `GET /api/nzp/me`, `POST /api/nzp/run` (run token) and `POST /api/nzp/game`.
  - Saving needs the Discord session and a run token armed when the cartridge opens. The game can't have lasted longer than the token has existed.
  - Validation limits: round 1–255 (a byte in the client), kills up to 65,535, at least 8 s per round, at most 10 kills per second, and points in proportion to kills and rounds.
  - Data lives in `nzp-leaderboard.json` (`NZP_DATA_DIR`/`GAME_DATA_DIR`). The client counts the stats, so this is plausibility checking, not anti-cheat.
- **CSP:** the wrapper has its own CSP allowing the upstream engine/assets, the Frag-Net relay WebSocket and Google Fonts (the loader uses the site's Orbitron/JetBrains Mono), without widening the rest of the site's policy.
- **Keyboard:** events are handled once at the document; the wrapper stops propagation to FTE's duplicate canvas listener without cancelling defaults or debouncing. Esc never closes the cartridge (it closes the rankings panel if open); use the close or back buttons.
- **Network:** the game and Frag-Net networking need internet access. Upstream P2P can fail behind restrictive NAT/firewalls. See [NZ:P networking documentation](https://docs.nzp.gay/server/server-setup).
- **Unlocking** follows the existing local Buddy save, for guests and signed-in players alike.

## Validation

`npm run test:nzp` covers:
- the unlock catalogue, the game frame's CSP and player-name sanitizing;
- the stats line parser and the QuakeC build's hash-table port;
- game validation, the three rankings, and the HTTP flow (session, origin, run token, pace limits).

`npm run build` verifies the lazy-loaded UI. Live co-op depends on the upstream engine and Frag-Net.
