// Registro unico de la consola. Antes los comandos vivian en cuatro sitios (la
// cadena de ifs de App.jsx, el texto de help, las pistas de autocompletado de
// TerminalDialog y `commands` en site.js) y se habian desincronizado: `scan`
// seguia anunciando proyectos retirados y los comandos de admin salian en el
// autocompletado publico. Ahora help, el autocompletado y la ejecucion leen
// todos de esta lista.
//
// Cada comando recibe { input, args, arg, ctx } y puede devolver el texto de
// salida. `ctx` lo arma App.jsx con lo que necesita el estado del armario.

import { navItems, now, profile, projects } from "../data/site.js";
import { projectStories } from "../data/projectStories.js";
import { buddyDiagnosticEvent } from "../../shared/buddy-diagnostics.mjs";
import { dailyChallenge, PLAYER_GAMES } from "../../shared/player-catalog.mjs";
import { VISITS_STORAGE_KEY } from "../../shared/buddy-visits.mjs";
import { getCabinetSignal } from "./cabinetSignals.js";
import { CABINET_WEATHER_LINES, formatTemperature, weatherCondition } from "./buddyContext.js";
import { compareBuilds, DEV_BUILD } from "../../shared/build-stamp.mjs";
import { currentBuild, fetchLatestBuild } from "./buildUpdate.js";
import { SKY_COVERS } from "./footerSky.js";

const NODE_ALIASES = { patch: "patchlog", comments: "contact", guestbook: "contact", carts: "builds", projects: "builds" };
const NODES = navItems.map(([label, href]) => ({ id: href.slice(1), label }));

const GAMES = [
  { id: "tower-block", aliases: ["tower", "towerblock", "blocks"], ranked: true, unit: "blocks" },
  { id: "cross-road", aliases: ["cross", "crossroad", "road"], ranked: true, unit: "road" },
  { id: "space-cadet-pinball", aliases: ["pinball", "spacecadet", "space-cadet", "cadet"], ranked: true, unit: "points" },
  { id: "madrace", aliases: ["drivemad", "drive-mad", "mad"], ranked: true, unit: "level" },
  { id: "rubiks-cube", aliases: ["cube", "rubiks", "rubik"], ranked: false }
].map((game) => ({ ...game, name: PLAYER_GAMES.find((entry) => entry.id === game.id)?.name || game.id }));

const PROJECTS = projects
  .map((project) => ({ title: project.title, slug: projectStories[project.title]?.slug, meta: project.meta }))
  .filter((project) => project.slug);

const RANK_BOARDS = [
  { id: "level", aliases: ["xp", "levels"], key: "level", title: "PLAYER LEVEL", value: (entry) => `LVL ${entry.level} // ${entry.totalXp.toLocaleString("en-US")} XP` },
  { id: "streak", aliases: ["streaks"], key: "streak", title: "BEST DAILY STREAK", value: (entry) => `${entry.bestStreak} days (now ${entry.currentStreak})` },
  { id: "wins", aliases: ["daily", "completions"], key: "completions", title: "DAILY COMPLETIONS", value: (entry) => `${entry.challengeCount.toLocaleString("en-US")} cleared` }
];

const DIAGNOSTIC_MESSAGES = {
  "signed-out": "ACCESS DENIED // Sign in through Discord with an admin account to use this command.",
  denied: "ACCESS DENIED // This command requires a Discord admin account.",
  offline: "AUTH BUS OFFLINE // Admin session could not be verified. No event started.",
  busy: "BUDDY BUSY // Let the current encounter or landing finish, then try again.",
  "reduced-motion": "Event paused // These sequences require motion. Enable animations before trying again.",
  unavailable: "BUDDY OFFLINE // The event could not start. Try again once Buddy is ready."
};

const SEASON_ALIASES = {
  april: "april-fools",
  aprilfools: "april-fools",
  "april-fools": "april-fools",
  birthday: "birthday",
  anniversary: "anniversary",
  halloween: "halloween",
  winter: "winter"
};

function matches(item, value) {
  const key = String(value || "").toLowerCase();
  return item.id === key || item.aliases?.includes(key);
}

function resolveNode(value) {
  const key = String(value || "").toLowerCase().replace(/^#/, "");
  return NODES.find((node) => node.id === key)?.id || NODE_ALIASES[key] || null;
}

function resolveGame(value) {
  const key = String(value || "").toLowerCase();
  if (["daily", "challenge", "today"].includes(key)) return GAMES.find((game) => game.id === dailyChallenge().game);
  return GAMES.find((game) => matches(game, key)) || null;
}

function resolveProject(value) {
  const key = String(value || "").toLowerCase();
  return PROJECTS.find((project) => project.slug === key || project.title.toLowerCase() === key) || null;
}

function duration(ms) {
  const seconds = Math.max(0, Math.floor(Number(ms || 0) / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function table(rows) {
  return rows.map(([place, name, value]) => `  ${String(place).padStart(2, "0")}  ${String(name).slice(0, 18).padEnd(18)} ${value}`).join("\n");
}

async function fetchJson(url) {
  const response = await fetch(url, { credentials: "include", cache: "no-store", headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function verifyAdmin({ input, ctx }, label, unchanged) {
  let operator;
  try {
    operator = (await fetchJson("/api/comments/me"))?.user || null;
  } catch {
    ctx.print(input, `AUTH BUS OFFLINE // Discord admin session could not be verified.\n${unchanged}`);
    return null;
  }
  if (!operator) {
    ctx.print(input, `ACCESS DENIED // Sign in through Discord with an admin account before using ${label}.\n${unchanged}`);
    return null;
  }
  if (!operator.isAdmin) {
    ctx.print(input, `ACCESS DENIED // Discord operator ${operator.username || operator.id} is not an admin.\n${unchanged}`);
    return null;
  }
  return operator;
}

// Encuentros del buddy con permiso de admin: el receptor revalida la sesion y
// contesta por `reply` si arranco o por que no.
async function runBuddyDiagnostic({ input, ctx }, name) {
  const result = await new Promise((resolve) => {
    const timeout = window.setTimeout(() => resolve("unavailable"), 6500);
    window.dispatchEvent(new CustomEvent(buddyDiagnosticEvent(name), {
      detail: { reply: (status) => { window.clearTimeout(timeout); resolve(status); } }
    }));
  });
  if (result !== "started") return DIAGNOSTIC_MESSAGES[result] || DIAGNOSTIC_MESSAGES.unavailable;
  ctx.close();
  window.requestAnimationFrame(() => document.querySelector(".app-footer-zone")?.scrollIntoView({ behavior: "smooth", block: "end" }));
  return ["leviathan", "kraken"].includes(name)
    ? `ADMIN // ${name.toUpperCase()}_OVERRIDE accepted.\nWatch the water by Buddy // sighting guaranteed.`
    : "ADMIN // BREAKER_OVERRIDE accepted.\nPower outage started // flashlight crew notified.";
}

function visitsEnabled() {
  try {
    return window.localStorage.getItem(VISITS_STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

function buddySignal(eventName, response) {
  return () => {
    window.dispatchEvent(new CustomEvent(eventName));
    return response;
  };
}

// group: cabinet | profile | shell (publicos) · diagnostic | admin (solo en
// `help --all`, y en el autocompletado solo para admins con sesion).
export const TERMINAL_COMMANDS = [
  {
    name: "help",
    usage: "help [command|--all]",
    summary: "command directory",
    group: "shell",
    complete: () => [{ value: "--all", detail: "diagnostics + admin" }, ...publicCommands().map((command) => ({ value: command.name, detail: command.summary }))],
    run: ({ args }) => helpText(args[0])
  },
  {
    name: "status",
    usage: "status",
    summary: "cabinet telemetry",
    group: "cabinet",
    run: ({ ctx }) => {
      const status = ctx.status();
      const player = status.player?.progression
        ? `LVL ${status.player.progression.level} // ${status.player.progression.totalXp.toLocaleString("en-US")} XP`
        : "guest // sign in from Player";
      return [
        "CABINET TELEMETRY",
        `  dai.exe       ${status.hasRun ? "ONLINE" : status.isLaunching ? "BOOTING" : "OFFLINE"}`,
        `  theme         ${status.theme.toUpperCase()}`,
        `  player        ${player}`,
        `  in_arcade     ${status.online ?? "unknown"}`,
        `  fps           ${status.fps}`,
        `  active_node   ${status.activeSection}`,
        `  buddy_level   ${String(status.buddyLevel).padStart(2, "0")}`,
        `  power_bus     ${status.powerOutage || "nominal"}`,
        "status complete // all readable systems polled"
      ].join("\n");
    }
  },
  {
    name: "ls",
    usage: "ls",
    summary: "list page nodes",
    group: "cabinet",
    run: () => `~/daivr nodes\n  ${NODES.map((node) => `${node.id}/`).join("  ")}\nUsage: goto <node>`
  },
  {
    name: "goto",
    aliases: ["cd"],
    usage: "goto <node>",
    summary: "jump to a section",
    group: "cabinet",
    complete: () => NODES.map((node) => ({ value: node.id, detail: node.label })),
    run: ({ arg }) => {
      const nodeId = resolveNode(arg);
      const node = nodeId ? document.getElementById(nodeId) : null;
      if (!node) return `Node not found: ${arg || "(missing)"}\nRun ls to list valid cabinet nodes.`;
      node.scrollIntoView({ behavior: "smooth", block: "start" });
      return `Mounted #${nodeId} // viewport routing accepted.`;
    }
  },
  {
    name: "open",
    usage: "open <project>",
    summary: "open a project file",
    group: "cabinet",
    complete: () => PROJECTS.map((project) => ({ value: project.slug, detail: project.title })),
    run: ({ arg, ctx }) => {
      const project = resolveProject(arg);
      if (!project) return `Project not found: ${arg || "(missing)"}\nAvailable: ${PROJECTS.map((entry) => entry.slug).join(", ")}`;
      ctx.close();
      ctx.openProject(project.slug);
      return `Opening ${project.title} // ${project.meta}`;
    }
  },
  {
    name: "play",
    usage: "play [game|daily]",
    summary: "insert a game cartridge",
    group: "cabinet",
    complete: () => [{ value: "daily", detail: "today's challenge" }, ...GAMES.map((game) => ({ value: game.id, detail: game.name }))],
    run: ({ arg, ctx }) => {
      if (!arg) {
        const daily = dailyChallenge();
        return [
          "CARTRIDGE BAY",
          ...GAMES.map((game) => `  ${game.id.padEnd(21)}${game.name}${game.id === daily.game ? "  << daily challenge" : ""}`),
          "Usage: play <game> or play daily"
        ].join("\n");
      }
      const game = resolveGame(arg);
      if (!game) return `No cartridge called ${arg}.\nRun play to list the bay.`;
      ctx.close();
      ctx.openGame(game.id);
      return `Inserting ${game.name} // cartridge seated.`;
    }
  },
  {
    name: "passport",
    usage: "passport",
    summary: "open your player passport",
    group: "cabinet",
    run: ({ ctx }) => {
      const player = ctx.status().player;
      ctx.close();
      ctx.openPassport();
      return player?.progression
        ? `Opening passport // ${player.user.username} // LVL ${player.progression.level}, ${player.progression.remainingXp.toLocaleString("en-US")} XP to go.`
        : "Opening passport // connect Discord there to start earning XP.";
    }
  },
  {
    name: "rank",
    aliases: ["ranks", "leaderboard"],
    usage: "rank [level|streak|wins|game]",
    summary: "print a leaderboard",
    group: "cabinet",
    complete: () => [
      ...RANK_BOARDS.map((board) => ({ value: board.id, detail: board.title.toLowerCase() })),
      ...GAMES.filter((game) => game.ranked).map((game) => ({ value: game.id, detail: `${game.name} top 5` }))
    ],
    run: async ({ arg }) => {
      const game = arg ? GAMES.find((entry) => matches(entry, arg)) : null;
      if (game) {
        if (!game.ranked) return `${game.name} keeps no leaderboard.`;
        try {
          const { leaderboard = [] } = await fetchJson(`/api/${game.id}/leaderboard?limit=5`);
          if (!leaderboard.length) return `${game.name.toUpperCase()} // TOP 5\n  No runs recorded yet.`;
          return `${game.name.toUpperCase()} // TOP 5\n${table(leaderboard.map((entry) => [entry.rank, entry.username,
            game.id === "madrace" ? `level ${entry.highestLevel} // ${duration(entry.bestTimeMs)}` : `${Number(entry.bestScore).toLocaleString("en-US")} ${game.unit} // ${duration(entry.bestDurationMs)}`]))}`;
        } catch {
          return "RANKING LINK OFFLINE // Try again shortly.";
        }
      }
      const board = arg ? RANK_BOARDS.find((entry) => matches(entry, arg)) : RANK_BOARDS[0];
      if (!board) return `Unknown board: ${arg}\nTry rank level, rank streak, rank wins, or rank <game>.`;
      try {
        const { rankings } = await fetchJson("/api/player?view=rankings");
        const entries = rankings?.[board.key] || [];
        if (!entries.length) return `${board.title} // TOP 5\n  Nobody has claimed this board yet.`;
        return `${board.title} // TOP 5\n${table(entries.map((entry) => [entry.rank, entry.user.username, board.value(entry)]))}\nTip: rank streak, rank wins, or rank <game>.`;
      } catch {
        return "RANKING LINK OFFLINE // Try again shortly.";
      }
    }
  },
  {
    name: "theme",
    usage: "theme [crt|glitch|toggle]",
    summary: "set or toggle the palette",
    group: "cabinet",
    complete: () => [
      { value: "crt", detail: "phosphor green" },
      { value: "glitch", detail: "magenta glitch" },
      { value: "toggle", detail: "switch palette" }
    ],
    run: ({ args, ctx }) => {
      const requested = args[0]?.toLowerCase();
      if (requested && !["crt", "glitch", "toggle"].includes(requested)) return "Usage: theme [crt|glitch|toggle]";
      const current = ctx.status().theme;
      const nextTheme = requested && requested !== "toggle" ? requested : current === "crt" ? "glitch" : "crt";
      ctx.setTheme(nextTheme);
      return `Theme set: ${nextTheme.toUpperCase()} // palette bus synchronized.`;
    }
  },
  {
    name: "weather",
    aliases: ["forecast"],
    usage: "weather",
    summary: "what it's like outside",
    group: "cabinet",
    run: async () => {
      let weather = null;
      try {
        weather = await fetchJson("/api/weather");
      } catch {
        weather = null;
      }
      // Buddy lo comenta en el footer con el mismo dato.
      window.dispatchEvent(new CustomEvent("daivr-buddy-weather", { detail: { weather, announce: true } }));
      if (!weather?.available) {
        return `OUTSIDE // no window in this cabinet.\nCabinet forecast: ${CABINET_WEATHER_LINES[Math.floor(Math.random() * CABINET_WEATHER_LINES.length)]}`;
      }
      const condition = weatherCondition(weather.code) || "mixed";
      const sky = weather.isDay === false && condition === "clear" ? "clear night" : condition;
      return `OUTSIDE // ${formatTemperature(weather.temperature, navigator.language)}, ${sky}, wind ${weather.wind} km/h\nApproximate, from your connection. Buddy has thoughts.`;
    }
  },
  {
    name: "version",
    aliases: ["update", "build"],
    usage: "version",
    summary: "check for a newer build",
    group: "cabinet",
    run: async () => {
      const current = currentBuild();
      const label = [current.version || "unknown", current.codename].filter(Boolean).join(" ");
      if (!current.build || current.build === DEV_BUILD) {
        return `BUILD // ${label} (dev server)\nLive reload is on here; update checks only run on the published site.`;
      }
      let latest = null;
      try {
        latest = await fetchLatestBuild();
      } catch {
        return `BUILD // ${label} (${current.build})\nCould not reach the server to check for updates.`;
      }
      const update = compareBuilds(current, latest);
      if (!update) return `BUILD // ${label} (${current.build})\nUp to date. This is the newest version of the cabinet.`;
      // Abre el aviso (UpdateNotice) con su boton de recargar.
      window.dispatchEvent(new CustomEvent("daivr-update-found", { detail: update }));
      return [
        `BUILD // ${label} (${current.build})`,
        `NEW BUILD LIVE // ${update.newRelease ? [update.version, update.codename].filter(Boolean).join(" ") : "same version, fresh fixes"} (${update.build})`,
        "Reload the page to update. Your Buddy, catches and progress are saved."
      ].join("\n");
    }
  },
  {
    name: "visits",
    aliases: ["visitors"],
    usage: "visits [on|off|status]",
    summary: "buddy visits from other players",
    group: "cabinet",
    complete: () => [
      { value: "status", detail: "who could drop by" },
      { value: "on", detail: "open the door (shows your Discord name)" },
      { value: "off", detail: "no visits either way" }
    ],
    run: ({ args }) => {
      const requested = (args[0] || "status").toLowerCase();
      if (!["on", "off", "status"].includes(requested)) return "Usage: visits [on|off|status]";
      if (requested !== "status") {
        window.dispatchEvent(new CustomEvent("daivr-buddy-visits", { detail: { enabled: requested === "on" } }));
        return requested === "on"
          ? "BUDDY VISITS // door open.\nYour Buddy can drop by other players' footers and theirs can visit yours.\nSigned-in players show their Discord name on their Buddy."
          : "BUDDY VISITS // door closed.\nYour Buddy stays home and nobody drops by. Run visits on to reopen.";
      }
      const online = (getCabinetSignal("visitRoster") || []).length;
      return [
        "BUDDY VISITS",
        `  door         ${visitsEnabled() ? "open" : "closed"}`,
        `  online       ${online} other ${online === 1 ? "buddy" : "buddies"}`,
        "  rules        up to 2 visitors at a time, each stays at least a minute",
        "Usage: visits [on|off]"
      ].join("\n");
    }
  },
  {
    name: "run",
    usage: "run",
    summary: "boot Dai.exe",
    group: "cabinet",
    run: ({ ctx }) => ctx.runBuild()
  },
  {
    name: "attract",
    aliases: ["demo"],
    usage: "attract",
    summary: "start arcade demo mode",
    group: "cabinet",
    run: ({ ctx }) => {
      ctx.close();
      window.dispatchEvent(new CustomEvent("daivr-attract-request"));
      return "ATTRACT.MODE requested.\nHanding controls to the coin slot...";
    }
  },
  {
    name: "whoami",
    usage: "whoami",
    summary: "operator profile",
    group: "profile",
    run: () => `${profile.name} // ${profile.tags[0]} dev // ${profile.location}\n${profile.headline}`
  },
  {
    name: "now",
    usage: "now",
    summary: "current save-state",
    group: "profile",
    run: () => now.map((entry) => `${entry.label.toUpperCase().padEnd(20)}${entry.title}`).join("\n")
  },
  {
    name: "scan",
    usage: "scan",
    summary: "index project cartridges",
    group: "profile",
    run: () => `Cartridges indexed: ${projects.length}\n${projects.map((project) => `  ${project.title.padEnd(12)}${project.meta}`).join("\n")}\nUsage: open <project>`
  },
  {
    name: "discord",
    usage: "discord",
    summary: "presence link",
    group: "profile",
    run: () => "Lanyard sync active: avatar, status, decoration, profile frame, and activity are pulled from Discord."
  },
  {
    name: "contact",
    usage: "contact",
    summary: "open channel",
    group: "profile",
    run: () => `Open channel: ${profile.email}`
  },
  {
    name: "date",
    aliases: ["time"],
    usage: "date",
    summary: "local clock",
    group: "shell",
    run: () => `${new Date().toLocaleString()}\nlocal cabinet clock synchronized.`
  },
  {
    name: "echo",
    usage: "echo <text>",
    summary: "repeat text",
    group: "shell",
    run: ({ arg }) => arg || "Usage: echo <text>"
  },
  {
    name: "clear",
    usage: "clear",
    summary: "clear output",
    group: "shell",
    run: ({ ctx }) => {
      ctx.clear();
    }
  },
  {
    name: "exit",
    aliases: ["close"],
    usage: "exit",
    summary: "close terminal",
    group: "shell",
    run: ({ ctx }) => {
      ctx.close();
      return "Session detached. Press / to reconnect.";
    }
  },
  // Diagnosticos publicos pero fuera de `help`: son huevos de pascua del buddy.
  { name: "fish", usage: "fish", summary: "buddy fishing diagnostic", group: "diagnostic", run: buddySignal("daivr-buddy-fish", "Buddy fishing diagnostic queued.") },
  { name: "forage", usage: "forage", summary: "footer loot scanner", group: "diagnostic", run: buddySignal("daivr-buddy-find", "Footer loot scanner pulsed.") },
  { name: "wildlife", usage: "wildlife", summary: "environmental creature ping", group: "diagnostic", run: buddySignal("daivr-buddy-creature", "Environmental creature ping sent.") },
  { name: "debugbug", usage: "debugbug", summary: "hostile bug simulation", group: "diagnostic", run: buddySignal("daivr-buddy-enemy", "Hostile bug simulation started.") },
  {
    name: "visit",
    usage: "visit",
    summary: "summon a test visitor buddy",
    group: "diagnostic",
    run: ({ ctx }) => {
      window.dispatchEvent(new CustomEvent("daivr-buddy-visit-test"));
      ctx.close();
      window.requestAnimationFrame(() => document.querySelector(".app-footer-zone")?.scrollIntoView({ behavior: "smooth", block: "end" }));
      return "Test visitor dispatched to the footer.";
    }
  },
  {
    name: "sky",
    usage: "sky [hour] [weather|auto]",
    summary: "preview the footer sky at any hour",
    group: "diagnostic",
    complete: () => [
      ...["06:45", "12:00", "19:30", "23:00"].map((value) => ({ value, detail: "hour" })),
      ...SKY_COVERS.map((value) => ({ value, detail: "weather" })),
      { value: "auto", detail: "back to the real clock and weather" }
    ],
    run: ({ args, ctx }) => {
      const detail = {};
      for (const arg of args.map((value) => value.toLowerCase())) {
        const time = /^(\d{1,2})(?::(\d{2}))?$/.exec(arg);
        if (time && Number(time[1]) < 24 && Number(time[2] || 0) < 60) detail.minutes = Number(time[1]) * 60 + Number(time[2] || 0);
        else if (SKY_COVERS.includes(arg)) detail.cover = arg;
        else if (["auto", "reset", "off"].includes(arg)) detail.reset = true;
        else return `Usage: sky [hour] [weather|auto]\nWeather: ${SKY_COVERS.join(", ")}`;
      }
      if (!args.length) detail.reset = true;
      window.dispatchEvent(new CustomEvent("daivr-sky-test", { detail }));
      ctx.close();
      window.requestAnimationFrame(() => document.querySelector(".app-footer-zone")?.scrollIntoView({ behavior: "smooth", block: "end" }));
      if (detail.reset) return "SKY // back to the real clock and weather.";
      const hour = detail.minutes != null ? `${String(Math.floor(detail.minutes / 60)).padStart(2, "0")}:${String(detail.minutes % 60).padStart(2, "0")}` : "";
      return `SKY // preview${hour ? ` at ${hour}` : ""}${detail.cover ? `, ${detail.cover}` : ""}. Run sky auto to go back.`;
    }
  },
  { name: "leviathan", usage: "leviathan", summary: "guaranteed Leviathan sighting", group: "admin", run: (call) => runBuddyDiagnostic(call, "leviathan") },
  { name: "kraken", usage: "kraken", summary: "guaranteed Kraken sighting", group: "admin", run: (call) => runBuddyDiagnostic(call, "kraken") },
  { name: "blackout", aliases: ["powerout", "power-out"], usage: "blackout", summary: "power outage sequence", group: "admin", run: (call) => runBuddyDiagnostic(call, call.name) },
  {
    name: "season",
    aliases: ["event"],
    usage: "season [event]",
    summary: "mount a seasonal cartridge",
    group: "admin",
    complete: () => ["status", "auto", "off", "halloween", "winter", "birthday", "anniversary", "april-fools"].map((value) => ({ value, detail: "seasonal cartridge" })),
    run: async (call) => {
      const { args, ctx } = call;
      if (!(await verifyAdmin(call, "season", "No seasonal settings were changed."))) return undefined;
      const requested = (args[0] || "status").toLowerCase();
      const season = ctx.season();
      if (requested === "status") {
        return [
          "SEASONAL EVENT BUS",
          `  active       ${season.current || "none"}`,
          `  scheduler    ${season.manual ? "manual" : "automatic"}`,
          "Usage: season <halloween|winter|birthday|anniversary|april-fools|auto|off>"
        ].join("\n");
      }
      if (requested === "auto") {
        const scheduled = season.restore();
        return `Season scheduler restored // ${scheduled || "no event scheduled today"}.`;
      }
      if (["off", "none", "clear"].includes(requested)) {
        season.suspend();
        return "Seasonal effects suspended for this session.";
      }
      const nextSeason = SEASON_ALIASES[requested];
      if (!nextSeason) return "Unknown seasonal cartridge.\nAvailable: halloween, winter, birthday, anniversary, april-fools, auto, off";
      season.mount(nextSeason);
      ctx.achievement(`Seasonal event activated: ${nextSeason}`, 3000);
      return `Seasonal cartridge mounted: ${nextSeason.toUpperCase()} // environment reskin online.`;
    }
  },
  {
    name: "unlockall",
    aliases: ["unlock-all", "unlockcosmetics"],
    usage: "unlockall [off]",
    summary: "unlock all buddy cosmetics",
    group: "admin",
    complete: () => [{ value: "off", detail: "back to earned unlocks" }],
    run: async (call) => {
      const { args, ctx } = call;
      if (!(await verifyAdmin(call, "unlockall", "No buddy gear was changed."))) return undefined;
      const disable = ["off", "lock", "reset", "clear", "false", "0"].includes((args[0] || "").toLowerCase());
      window.dispatchEvent(new CustomEvent("daivr-buddy-admin-unlock", { detail: { value: !disable } }));
      if (!disable) ctx.achievement("Admin override: all buddy cosmetics unlocked", 3200);
      return disable
        ? "ADMIN // cosmetic override cleared.\nBuddy loadout back to earned unlocks."
        : "ADMIN // GEAR_OVERRIDE accepted.\nAll buddy cosmetics unlocked // open the buddy inventory to equip.";
    }
  }
];

const HIDDEN_GROUPS = new Set(["diagnostic", "admin"]);
const GROUP_TITLES = { cabinet: "CABINET", profile: "PROFILE", shell: "SHELL", diagnostic: "DIAGNOSTIC BUS // use responsibly", admin: "ADMIN // Discord admin session required" };

function publicCommands() {
  return TERMINAL_COMMANDS.filter((command) => !HIDDEN_GROUPS.has(command.group));
}

export function findTerminalCommand(name) {
  const key = String(name || "").toLowerCase();
  return TERMINAL_COMMANDS.find((command) => command.name === key || command.aliases?.includes(key)) || null;
}

export function commandSummary(name) {
  return findTerminalCommand(name)?.summary || "";
}

function helpText(topic) {
  const all = ["--all", "-a", "advanced"].includes(String(topic || "").toLowerCase());
  if (topic && !all) {
    const command = findTerminalCommand(topic);
    if (!command) return `No help entry for ${topic}.\nRun help to list commands.`;
    const options = command.complete && !HIDDEN_GROUPS.has(command.group) ? command.complete().map((option) => option.value) : [];
    return [
      command.usage.toUpperCase(),
      `  ${command.summary}`,
      command.aliases?.length ? `  aliases: ${command.aliases.join(", ")}` : "",
      options.length ? `  options: ${options.join(", ")}` : ""
    ].filter(Boolean).join("\n");
  }
  const groups = all ? ["cabinet", "profile", "shell", "diagnostic", "admin"] : ["cabinet", "profile", "shell"];
  const sections = groups.map((group) => {
    const lines = TERMINAL_COMMANDS.filter((command) => command.group === group)
      .map((command) => `  ${command.usage.padEnd(19)}${command.summary}${all && command.aliases?.length ? ` (${command.aliases.join(", ")})` : ""}`);
    return `${GROUP_TITLES[group]}\n${lines.join("\n")}`;
  });
  return `COMMAND INDEX${all ? " // ALL" : ""}\n\n${sections.join("\n\n")}\n\n${all ? "Tip: help <command> shows usage and options." : "Hint: help <command> for details, help --all for diagnostics and admin."}`;
}

function editDistance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const current = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = current;
    }
  }
  return row[b.length];
}

// Autocompletado: nombres de comando y, tras un espacio, los argumentos que
// declara cada comando. Diagnosticos y admin solo aparecen para admins.
export function terminalSuggestions(value, { admin = false } = {}) {
  const text = String(value || "").replace(/^\s+/, "");
  if (!text) return [];
  const visible = (command) => admin || !HIDDEN_GROUPS.has(command.group);
  const [head, ...rest] = text.split(/\s+/);
  if (!/\s/.test(text)) {
    const query = head.toLowerCase();
    return TERMINAL_COMMANDS.filter((command) => visible(command) && command.name.startsWith(query) && command.name !== query)
      .slice(0, 4)
      // Con espacio al final si el comando admite argumentos: Tab salta directo
      // a sus opciones.
      .map((command) => ({ value: command.complete ? `${command.name} ` : command.name, label: command.name, detail: command.summary }));
  }
  const command = findTerminalCommand(head);
  if (!command?.complete || !visible(command) || rest.length > 1) return [];
  const query = (rest[0] || "").toLowerCase();
  return command.complete()
    .filter((option) => option.value.startsWith(query) && option.value !== query)
    .slice(0, 4)
    .map((option) => ({ value: `${head} ${option.value}`, label: option.value, detail: option.detail }));
}

export async function runTerminalCommand(rawInput, ctx) {
  const input = String(rawInput || "").trim();
  if (!input) return;
  const [rawName, ...args] = input.split(/\s+/);
  const name = rawName.toLowerCase();
  const command = findTerminalCommand(name);
  if (!command) {
    const close = publicCommands().map((entry) => ({ entry, distance: editDistance(name, entry.name) }))
      .filter(({ distance }) => distance <= 2)
      .sort((a, b) => a.distance - b.distance)[0];
    ctx.print(input, `Command not found: ${input}\n${close ? `Did you mean ${close.entry.name}? ` : ""}Tip: run help, use Tab completion, or try ls.`);
    return;
  }
  const output = await command.run({ input, name, args, arg: args.join(" ").trim(), ctx });
  if (typeof output === "string") ctx.print(input, output);
}
