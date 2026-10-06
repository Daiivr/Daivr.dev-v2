# NZ:P QuakeC for daivr.dev

`public/nzp/progs/{menu,csprogs,qwprogs}.dat` are compiled from [Nazi Zombies: Portable's QuakeC](https://github.com/nzp-team/quakec) (GPL-2.0, © NZ:P Team) at the commit pinned in `build.mjs`, plus `daivr.patch`. Under the GPL, the patch and that upstream commit are the corresponding source for those files.

The engine (`ftewebgl.js`/`.wasm`) and the game data (`nzp/game.pk3`) still load from `https://nzp.gay/`. Only the programs come from here, so the menu, client and server always come from the same source.

## What the patch changes

- **Main menu:** no Credits entry, build number or social badges. Arrow keys skip the hidden web-only Quit.
- **Cooperative → Create Game:** session name (defaults to "<player name> co-op"), optional password, NZ:P's own max players slider (1–8, starts at 4), map. The port row is gone.
- **Cooperative → Join Game:** opens the session list directly. A padlock marks password sessions, and picking one asks for the password; open sessions join straight away. Single-player games are hidden. When nobody is hosting, the list says so.
- **Solo / map lists:** `weapon_test`, a developer test map in `game.pk3`, is left out of User Maps and Random.
- **Game over:** the server no longer fades out and restarts on its own. The client keeps GAME OVER and the scoreboard up and, 2.5 s later, shows TRY AGAIN (`restart`, host only, since it restarts the map for everyone; guests see "Waiting for host") and RETURN TO MENU (`disconnect`) under the scoreboard, on the menus' own UI kit (mouse, keyboard and gamepad). The pause menu stays closed during game over, and the scoreboard no longer shows the build number.
- **Game Settings:** any setting changed from the defaults that picking a map resets to keeps the game out of the rankings and the daily goal. The server publishes that as the `daivr_custom` serverinfo key. Hovering GAME SETTINGS in the pre-game menu, or any option inside it, adds a pulsing, glowing note under the description (`Menu_DrawRankNote`).
- **Own explosives fix:** `LastStand_Begin` restores `self` on its game-ending early returns. Without that, going down to your own rocket or grenade ended in "cannot free player entities" and a server error back to the main menu (an upstream bug).
- **Client (CSQC):** on every round change and at game over, prints `[daivr] nzp-stats <phase> <round> <kills> <headshots> <total score> <map> <custom>`. `public/nzp/shell.js` reads that from the console, and the cartridge saves it to the rankings and the daily challenge.
- **Own session list:** before every co-op list refresh, host or join, the menu sets `com_protocolname NZP-DAIVR` (`Daivr_UseOwnSessions`). Sessions hosted here register on Frag-Net under that name, so Join Game lists only daivr.dev sessions and they stay out of NZ:P's public browser. A launch argument doesn't work for this, because NZ:P's startup resets the cvar to `NZP-REBOOT-WEB`.

## Rebuilding

```bash
corepack pnpm build:nzp-progs
```

The script downloads the pinned commit, applies the patch, generates `source/server/hash_table.qc` (a Node port of upstream's Python generator), and runs the FTEQCC binary that ships in that commit (`bin/fteqcc-cli-*`). It then copies the three `.dat` files into `public/nzp/progs/`. You need network access, `tar` and `git`.

To change the QuakeC, extract the pinned commit and `git apply` the patch. Edit, then regenerate the patch with `git diff > tools/nzp-qc/daivr.patch` and rebuild.

To follow a new nzp.gay release, move `UPSTREAM_COMMIT` to the QuakeC commit that release was built from, re-apply the patch (fix any conflicts), and rebuild. Then check solo play and a co-op session.
