# NZ:P QuakeC for daivr.dev

`public/nzp/progs/{menu,csprogs,qwprogs}.dat` are compiled from [Nazi Zombies: Portable's QuakeC](https://github.com/nzp-team/quakec) (GPL-2.0, © NZ:P Team) at the commit pinned in `build.mjs`, plus `daivr.patch`. Under the GPL, the patch and that upstream commit are the corresponding source for those files.

The engine (`ftewebgl.js`/`.wasm`) and the game data (`nzp/game.pk3`) still load from `https://nzp.gay/`. Only the programs come from here, so the menu, client and server always come from the same source.

## What the patch changes

- **Main menu:** no Credits entry, build number or social badges. Arrow keys skip the hidden web-only Quit.
- **Cooperative → Create Game:** session name (defaults to "<player name> co-op"), optional password, NZ:P's own max players slider (1–8, starts at 4), map. The port row is gone.
- **Cooperative → Join Game:** opens the session list directly. A padlock marks password sessions, and picking one asks for the password; open sessions join straight away. Single-player games are hidden. When nobody is hosting, the list says so.
- **Client (CSQC):** on every round change and at game over, prints `[daivr] nzp-stats <phase> <round> <kills> <headshots> <total score> <map>`. `public/nzp/shell.js` reads that from the console, and the cartridge saves it to the rankings and the daily challenge.
- **Own session list:** before every co-op list refresh, host or join, the menu sets `com_protocolname NZP-DAIVR` (`Daivr_UseOwnSessions`). Sessions hosted here register on Frag-Net under that name, so Join Game lists only daivr.dev sessions and they stay out of NZ:P's public browser. A launch argument doesn't work for this, because NZ:P's startup resets the cvar to `NZP-REBOOT-WEB`.

## Rebuilding

```bash
corepack pnpm build:nzp-progs
```

The script downloads the pinned commit, applies the patch, generates `source/server/hash_table.qc` (a Node port of upstream's Python generator), and runs the FTEQCC binary that ships in that commit (`bin/fteqcc-cli-*`). It then copies the three `.dat` files into `public/nzp/progs/`. You need network access, `tar` and `git`.

To change the QuakeC, extract the pinned commit and `git apply` the patch. Edit, then regenerate the patch with `git diff > tools/nzp-qc/daivr.patch` and rebuild.

To follow a new nzp.gay release, move `UPSTREAM_COMMIT` to the QuakeC commit that release was built from, re-apply the patch (fix any conflicts), and rebuild. Then check solo play and a co-op session.
