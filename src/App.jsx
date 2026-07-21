import { useCallback, useEffect, useRef, useState } from "react";
import { commands, discord, games, profile, projects } from "./data/site";
import { preloadImages } from "./lib/preloadImages";
import { useBuddyAdventure } from "./hooks/useBuddyAdventure";
import { useBuddyFriendship } from "./hooks/useBuddyFriendship";
import { useBuddyLoadout } from "./hooks/useBuddyLoadout";
import { useCartridgeSwap } from "./hooks/useCartridgeSwap";
import { useClock } from "./hooks/useClock";
import { useFps } from "./hooks/useFps";
import { useRandomGlitchWords } from "./hooks/useRandomGlitchWords";
import { ArcadeBackground } from "./components/ArcadeBackground";
import { ArcadeEmbedModal } from "./components/ArcadeEmbedModal";
import { AttractMode } from "./components/AttractMode";
import { BuddyDrop } from "./components/BuddyDrop";
import { BuddyModal } from "./components/BuddyModal";
import { CommentsSection } from "./components/CommentsSection";
import { CursorTrail } from "./components/CursorTrail";
import { EntrySplash } from "./components/EntrySplash";
import { HeroStation } from "./components/HeroStation";
import { LaunchOverlay } from "./components/LaunchOverlay";
import { KonamiGameLibrary } from "./components/KonamiGameLibrary";
import { MadraceModal } from "./components/MadraceModal";
import { PerchedBirds } from "./components/PerchedBirds";
import { ProgramSections } from "./components/ProgramSections";
import { Sidebar } from "./components/Sidebar";
import { SiteFooter } from "./components/SiteFooter";
import { TerminalDialog } from "./components/TerminalDialog";
import { TowerBlockModal } from "./components/TowerBlockModal";
import { getSeasonalEvent, SeasonalEvent } from "./components/SeasonalEvent";

const TERMINAL_NODES = [
  ["home", "home"],
  ["now", "now"],
  ["builds", "builds"],
  ["room", "room"],
  ["games", "games"],
  ["toolbelt", "toolbelt"],
  ["patch", "patchlog"],
  ["patchlog", "patchlog"],
  ["comments", "contact"],
  ["contact", "contact"]
];

export default function App() {
  const [theme, setTheme] = useState("crt");
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [score, setScore] = useState(87);
  const [buildLog, setBuildLog] = useState("$ idle\nDai.exe offline\nnodes waiting for RUN command...");
  const [terminalLog, setTerminalLog] = useState("┌─ DAI.EXE COMMAND CONSOLE // v2.6\n│ cabinet shell mounted at ~/daivr\n│ history + completion modules online\n└─ Tip: type help, use Tab completion, or press ↑ for history.\n\n$ status\nshell ready // awaiting operator input");
  const [activeSection, setActiveSection] = useState("home");
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchPhase, setLaunchPhase] = useState(0);
  const [launchComplete, setLaunchComplete] = useState(false);
  const [launchClosing, setLaunchClosing] = useState(false);
  const [entrySplashOpen, setEntrySplashOpen] = useState(true);
  const [buddyDrop, setBuddyDrop] = useState(null);
  const [buddyModal, setBuddyModal] = useState(null);
  const [hasRun, setHasRun] = useState(false);
  const [achievement, setAchievement] = useState("");
  const [powerOutage, setPowerOutage] = useState("");
  const [konamiView, setKonamiView] = useState(null);
  const [seasonalEvent, setSeasonalEvent] = useState(() => getSeasonalEvent());
  const [seasonalOverride, setSeasonalOverride] = useState(null);
  const achievementTimerRef = useRef(0);
  const konamiIndexRef = useRef(0);
  const shellRef = useRef(null);
  const time = useClock();
  const fps = useFps();
  const friendship = useBuddyFriendship({ onMilestone: handleBuddyMilestone });
  const adventure = useBuddyAdventure({ onQuestComplete: handleBuddyQuestComplete });
  const loadout = useBuddyLoadout({ friendship, adventure });
  const cartPhase = useCartridgeSwap(shellRef);
  const buddy = { friendship, adventure, ...loadout };
  const closeKonami = useCallback(() => setKonamiView(null), []);
  const openKonamiLibrary = useCallback(() => setKonamiView("library"), []);
  const selectKonamiGame = useCallback((game) => setKonamiView(game), []);
  useRandomGlitchWords(theme === "glitch");

  useEffect(() => {
    const refreshSeason = () => {
      if (seasonalOverride === null) setSeasonalEvent(getSeasonalEvent());
    };
    const interval = window.setInterval(refreshSeason, 60 * 60 * 1000);
    window.addEventListener("popstate", refreshSeason);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("popstate", refreshSeason);
    };
  }, [seasonalOverride]);

  useEffect(() => {
    preloadImages([
      profile.avatar,
      discord.fallbackAvatar,
      ...games.flatMap((game) => [game.image, game.logo]),
      ...projects.flatMap((project) => [project.image, project.icon])
    ]);
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV || entrySplashOpen) return undefined;
    const event = new URLSearchParams(window.location.search).get("buddyEvent");
    const eventNames = {
      fish: "daivr-buddy-fish",
      forage: "daivr-buddy-find",
      wildlife: "daivr-buddy-creature",
      rain: "daivr-buddy-rain",
      enemy: "daivr-buddy-enemy",
      outage: "daivr-buddy-outage"
    };
    if (!eventNames[event]) return undefined;
    const params = new URLSearchParams(window.location.search);
    const weapon = params.get("buddyWeapon") || "";
    const creatureId = params.get("buddyCreature") || "";
    const forceCollision = params.get("buddyFishCollision") === "1";
    const timer = window.setTimeout(() => window.dispatchEvent(new CustomEvent(eventNames[event], {
      detail: weapon || creatureId || forceCollision ? { weapon, id: creatureId, forceCollision } : undefined
    })), 2800);
    return () => window.clearTimeout(timer);
  }, [entrySplashOpen]);

  useEffect(() => {
    let cancelled = false;

    async function loadThemePreference() {
      try {
        const response = await fetch("/api/comments/preferences", { credentials: "include" });
        if (!response.ok) return;
        const payload = await response.json();
        if (!cancelled && ["crt", "glitch"].includes(payload.theme)) {
          setTheme(payload.theme);
        }
      } catch {
        // Theme preferences are a convenience; keep the local default if the API is unavailable.
      }
    }

    loadThemePreference();

    return () => {
      cancelled = true;
    };
  }, []);

  function updateThemePreference(nextTheme) {
    if (!["crt", "glitch"].includes(nextTheme)) return;
    setTheme(nextTheme);
    window.dispatchEvent(new CustomEvent("daivr-theme", { detail: { theme: nextTheme } }));

    fetch("/api/comments/preferences", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: nextTheme })
    }).catch(() => {
      // Guests can still preview themes; logged-in users get persistence when the API accepts it.
    });
  }

  function showAchievement(message, duration = 3200) {
    window.clearTimeout(achievementTimerRef.current);
    setAchievement(message);
    achievementTimerRef.current = window.setTimeout(() => setAchievement(""), duration);
    window.dispatchEvent(new CustomEvent("daivr-achievement", { detail: { message } }));
  }

  const buddyPettedRef = useRef(false);

  function handleBuddyPet() {
    friendship.registerPet();
    if (buddyPettedRef.current) return;
    buddyPettedRef.current = true;
    showAchievement("Achievement unlocked: buddy befriended", 3200);
  }

  function handleBuddyMilestone(level) {
    showAchievement(`Achievement unlocked: buddy friendship lv ${String(level).padStart(2, "0")}`, 3600);
  }

  function handleBuddyQuestComplete(quest) {
    showAchievement(`Buddy quest complete: ${quest.title} // ${quest.reward} acquired`, 3600);
  }

  function openTerminal() {
    window.dispatchEvent(new CustomEvent("daivr-buddy-quest-progress", {
      detail: { type: "terminal" }
    }));
    setTerminalOpen(true);
  }

  useEffect(() => {
    function openTerminalShortcut(event) {
      if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target;
      const isTyping = target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
      if (isTyping || terminalOpen || entrySplashOpen || buddyModal || isLaunching) return;
      if (document.querySelector(".attract-mode,.konami-library-backdrop,.madrace-backdrop,.tower-modal-backdrop,.arcade-embed-backdrop,.project-modal,.comments-gif-modal,.comments-delete-modal")) return;
      event.preventDefault();
      window.dispatchEvent(new CustomEvent("daivr-buddy-quest-progress", {
        detail: { type: "terminal" }
      }));
      setTerminalOpen(true);
    }

    window.addEventListener("keydown", openTerminalShortcut);
    return () => window.removeEventListener("keydown", openTerminalShortcut);
  }, [buddyModal, entrySplashOpen, isLaunching, terminalOpen]);

  useEffect(() => () => window.clearTimeout(achievementTimerRef.current), []);

  useEffect(() => {
    const sequence = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];

    function detectKonami(event) {
      if (entrySplashOpen || konamiView || isLaunching || terminalOpen || buddyModal) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) {
        konamiIndexRef.current = 0;
        return;
      }
      if (document.querySelector(".attract-mode,.project-modal,.comments-gif-modal,.comments-delete-modal")) return;

      const key = String(event.key || "").toLowerCase();
      const index = konamiIndexRef.current;
      if (key === sequence[index]) {
        event.preventDefault();
        const next = index + 1;
        if (next === sequence.length) {
          konamiIndexRef.current = 0;
          setKonamiView("library");
          showAchievement("SECRET GAME LIBRARY UNLOCKED // 2 DISKS FOUND", 3000);
        } else {
          konamiIndexRef.current = next;
        }
        return;
      }
      konamiIndexRef.current = key === sequence[0] ? 1 : 0;
    }

    window.addEventListener("keydown", detectKonami);
    return () => window.removeEventListener("keydown", detectKonami);
  }, [buddyModal, entrySplashOpen, isLaunching, konamiView, terminalOpen]);

  useEffect(() => {
    const shell = shellRef.current;
    const sections = [...document.querySelectorAll("main section[id]")];
    if (!shell || !sections.length) return undefined;

    let ticking = false;

    function updateActiveSection() {
      ticking = false;

      const checkpoint = Math.min(shell.clientHeight * 0.34, 280);
      const pageBottom = shell.scrollTop + shell.clientHeight >= shell.scrollHeight - 8;
      let current = sections[0].id;

      if (pageBottom) {
        current = sections[sections.length - 1].id;
      } else {
        for (const section of sections) {
          if (section.getBoundingClientRect().top <= checkpoint) current = section.id;
        }
      }

      setActiveSection((value) => (value === current ? value : current));
    }

    function requestUpdate() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateActiveSection);
    }

    updateActiveSection();
    shell.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      shell.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, []);

  function appendTerminal(command, response) {
    setTerminalLog((value) => `${value}\n\n$ ${command}\n${response}`.trim());
  }

  function runBuild() {
    if (isLaunching) {
      return "Dai.exe is already running. Let the cabinet finish booting.";
    }

    if (hasRun) {
      const onlineMessage = "Dai.exe already online // stable";

      showAchievement("Dai.exe is already online. No reboot needed.", 2800);
      setBuildLog((value) => (value.includes(onlineMessage) ? value : `${value}\n${onlineMessage}`));

      return "Dai.exe is already online.\nNo reboot needed.";
    }

    const nodeLines = [
      "node 01 online // homebase",
      "node 02 online // CRT glow",
      "node 03 online // Discord sync",
      "node 04 online // console",
      "node 05 online // utility",
      "node 06 online // rewards"
    ];
    const phaseMs = 1180;
    const bootStartDelay = 300;
    const finishDelay = bootStartDelay + nodeLines.length * phaseMs + 620;

    const lines = [
      "$ run Dai.exe",
      ...nodeLines,
      "Dai.exe online // +07 XP"
    ];

    setIsLaunching(true);
    setLaunchPhase(0);
    setLaunchComplete(false);
    setLaunchClosing(false);
    setHasRun(false);
    setAchievement("");
    setBuildLog(lines[0]);

    const timers = nodeLines.map((line, index) =>
      window.setTimeout(() => {
        setLaunchPhase(Math.min(index, 5));
        setBuildLog((value) => `${value}\n${line}`);
      }, bootStartDelay + index * phaseMs)
    );

    timers.push(window.setTimeout(() => {
      setBuildLog((value) => `${value}\nDai.exe online // +07 XP`);
      setLaunchComplete(true);
    }, finishDelay - 360));

    window.setTimeout(() => {
      setLaunchClosing(true);
    }, finishDelay + 920);

    window.setTimeout(() => {
      setScore((value) => Math.min(999, value + 7));
      setIsLaunching(false);
      setLaunchComplete(false);
      setLaunchClosing(false);
      setHasRun(true);
      showAchievement("Achievement unlocked: Dai.exe went live", 3600);
    }, finishDelay + 1280);

    return "Launching Dai.exe...\nwatch the cabinet warm up.";
  }

  function runCommand(rawInput) {
    const input = rawInput.trim();
    if (!input) return;
    const [rawName, ...args] = input.split(/\s+/);
    const name = rawName.toLowerCase();
    const arg = args.join(" ").trim();

    if (name === "help") {
      const advanced = args.some((item) => ["--all", "-a", "advanced"].includes(item.toLowerCase()));
      appendTerminal(input, advanced
        ? "COMMAND INDEX // ALL\n  help [--all]       command directory\n  status             cabinet telemetry\n  ls                 list page nodes\n  goto <node>        navigate the cabinet\n  theme [crt|glitch] set or toggle theme\n  season [event]     mount a seasonal cartridge\n  run                boot Dai.exe\n  attract            start arcade demo mode\n  whoami / now / scan / discord / contact\n  date / echo <text> / clear / exit\n\nDIAGNOSTIC BUS // use responsibly\n  fish / forage / wildlife / debugbug\n  blackout           rare breaker simulation\n  unlockall [off]    admin: unlock all buddy cosmetics"
        : "COMMAND INDEX\n  status             cabinet telemetry\n  ls                 list page nodes\n  goto <node>        navigate the cabinet\n  theme [crt|glitch] set or toggle theme\n  season [event]     mount a seasonal cartridge\n  run                boot Dai.exe\n  attract            start arcade demo mode\n  whoami / now / scan / discord / contact\n  date / echo <text> / clear / exit\n\nHint: type season for event names, or help --all for diagnostics.");
      return;
    }

    if (name === "theme") {
      const requested = args[0]?.toLowerCase();
      if (requested && !["crt", "glitch", "toggle"].includes(requested)) {
        appendTerminal(input, "Usage: theme [crt|glitch|toggle]");
        return;
      }
      const nextTheme = requested && requested !== "toggle" ? requested : theme === "crt" ? "glitch" : "crt";
      updateThemePreference(nextTheme);
      appendTerminal(input, `Theme set: ${nextTheme.toUpperCase()} // palette bus synchronized.`);
      return;
    }

    if (name === "season" || name === "event") {
      const requested = (args[0] || "status").toLowerCase();
      const aliases = {
        april: "april-fools",
        aprilfools: "april-fools",
        "april-fools": "april-fools",
        birthday: "birthday",
        anniversary: "anniversary",
        halloween: "halloween",
        winter: "winter"
      };

      if (requested === "status") {
        appendTerminal(input, [
          "SEASONAL EVENT BUS",
          `  active       ${seasonalEvent || "none"}`,
          `  scheduler    ${seasonalOverride === null ? "automatic" : "manual"}`,
          "Usage: season <halloween|winter|birthday|anniversary|april-fools|auto|off>"
        ].join("\n"));
        return;
      }

      if (requested === "auto") {
        const scheduled = getSeasonalEvent();
        setSeasonalOverride(null);
        setSeasonalEvent(scheduled);
        appendTerminal(input, `Season scheduler restored // ${scheduled || "no event scheduled today"}.`);
        return;
      }

      if (["off", "none", "clear"].includes(requested)) {
        setSeasonalOverride("off");
        setSeasonalEvent(null);
        appendTerminal(input, "Seasonal effects suspended for this session.");
        return;
      }

      const nextSeason = aliases[requested];
      if (!nextSeason) {
        appendTerminal(input, "Unknown seasonal cartridge.\nAvailable: halloween, winter, birthday, anniversary, april-fools, auto, off");
        return;
      }

      setSeasonalOverride(nextSeason);
      setSeasonalEvent(nextSeason);
      appendTerminal(input, `Seasonal cartridge mounted: ${nextSeason.toUpperCase()} // environment reskin online.`);
      showAchievement(`Seasonal event activated: ${nextSeason}`, 3000);
      return;
    }

    if (name === "run") {
      appendTerminal(input, runBuild());
      return;
    }

    if (name === "clear") {
      setTerminalLog("");
      return;
    }

    if (name === "exit" || name === "close") {
      appendTerminal(input, "Session detached. Press / to reconnect.");
      setTerminalOpen(false);
      return;
    }

    if (name === "status") {
      appendTerminal(input, [
        "CABINET TELEMETRY",
        `  dai.exe       ${hasRun ? "ONLINE" : isLaunching ? "BOOTING" : "OFFLINE"}`,
        `  theme         ${theme.toUpperCase()}`,
        `  score         ${String(score).padStart(3, "0")}`,
        `  fps           ${fps}`,
        `  active_node   ${activeSection}`,
        `  buddy_level   ${String(friendship.level).padStart(2, "0")}`,
        `  power_bus     ${powerOutage || "nominal"}`,
        "status complete // all readable systems polled"
      ].join("\n"));
      return;
    }

    if (name === "ls") {
      appendTerminal(input, "~/daivr nodes\n  home/  now/  builds/  room/  games/\n  toolbelt/  patchlog/  comments/\nUsage: goto <node>");
      return;
    }

    if (name === "goto" || name === "cd") {
      const requested = arg.toLowerCase().replace(/^#/, "");
      const nodeId = TERMINAL_NODES.find(([alias]) => alias === requested)?.[1];
      const node = nodeId ? document.getElementById(nodeId) : null;
      if (!node) {
        appendTerminal(input, `Node not found: ${arg || "(missing)"}\nRun ls to list valid cabinet nodes.`);
        return;
      }
      node.scrollIntoView({ behavior: "smooth", block: "start" });
      appendTerminal(input, `Mounted #${nodeId} // viewport routing accepted.`);
      return;
    }

    if (name === "date" || name === "time") {
      appendTerminal(input, `${new Date().toLocaleString()}\nlocal cabinet clock synchronized.`);
      return;
    }

    if (name === "echo") {
      appendTerminal(input, arg || "Usage: echo <text>");
      return;
    }

    if (name === "attract" || name === "demo") {
      appendTerminal(input, "ATTRACT.MODE requested.\nHanding controls to the coin slot...");
      setTerminalOpen(false);
      window.dispatchEvent(new CustomEvent("daivr-attract-request"));
      return;
    }

    if (name === "contact") {
      appendTerminal(input, `Open channel: ${profile.email}`);
      return;
    }

    // Hidden cabinet diagnostics double as easter-egg commands. They are kept
    // out of help so normal visitors discover the encounters organically.
    const buddySignals = {
      fish: ["daivr-buddy-fish", "Buddy fishing diagnostic queued."],
      forage: ["daivr-buddy-find", "Footer loot scanner pulsed."],
      wildlife: ["daivr-buddy-creature", "Environmental creature ping sent."],
      debugbug: ["daivr-buddy-enemy", "Hostile bug simulation started."]
    };
    if (buddySignals[name]) {
      const [eventName, response] = buddySignals[name];
      window.dispatchEvent(new CustomEvent(eventName));
      appendTerminal(input, response);
      return;
    }

    if (["blackout", "powerout", "power-out"].includes(name)) {
      if (powerOutage) {
        appendTerminal(input, `Power bus already busy: ${powerOutage}.`);
        return;
      }
      appendTerminal(input, "BREAKER_OVERRIDE accepted.\nRare outage sequence armed // flashlight crew notified.");
      setTerminalOpen(false);
      window.dispatchEvent(new CustomEvent("daivr-buddy-outage"));
      return;
    }

    if (["unlockall", "unlock-all", "unlockcosmetics"].includes(name)) {
      const disable = ["off", "lock", "reset", "clear", "false", "0"].includes((args[0] || "").toLowerCase());
      window.dispatchEvent(new CustomEvent("daivr-buddy-admin-unlock", { detail: { value: !disable } }));
      appendTerminal(input, disable
        ? "ADMIN // cosmetic override cleared.\nBuddy loadout back to earned unlocks."
        : "ADMIN // GEAR_OVERRIDE accepted.\nAll buddy cosmetics unlocked // open the buddy inventory to equip.");
      if (!disable) showAchievement("Admin override: all buddy cosmetics unlocked", 3200);
      return;
    }

    const command = commands.find(([commandName]) => commandName === name);
    if (command) {
      appendTerminal(input, command[1]);
      return;
    }

    appendTerminal(input, `Command not found: ${input}\nTip: run help, use Tab completion, or try ls.`);
  }

  return (
    <div ref={shellRef} className={`app-shell ${theme === "glitch" ? "theme-glitch" : ""} ${isLaunching ? "is-launching" : ""} ${powerOutage ? `has-power-outage outage-${powerOutage}` : ""} ${seasonalEvent ? `season-${seasonalEvent}` : ""}`} data-glitch-root>
      <ArcadeBackground />
      <SeasonalEvent event={seasonalEvent} entrySplashOpen={entrySplashOpen} />
      <CursorTrail theme={theme} />
      <PerchedBirds />
      {powerOutage ? (
        <div className={`cabinet-power-outage is-${powerOutage}`} aria-live="polite">
          <span className="power-outage-noise" aria-hidden="true" />
          <span className="power-outage-label">{powerOutage === "restore" ? "POWER RESTORING" : "CABINET POWER LOST"}</span>
        </div>
      ) : null}
      {entrySplashOpen ? (
        <EntrySplash
          onBuddyLaunch={setBuddyDrop}
          onEnter={() => setEntrySplashOpen(false)}
          seasonalEvent={seasonalEvent}
          friendshipLevel={buddy.friendship.level}
          inventory={buddy.adventure.inventoryIds}
          hiddenGear={buddy.effectiveHiddenGear}
          unlockedGear={buddy.unlockedGearIds}
        />
      ) : null}
      {buddyDrop ? (
        <BuddyDrop
          start={buddyDrop}
          onDone={() => setBuddyDrop(null)}
          friendshipLevel={buddy.friendship.level}
          inventory={buddy.adventure.inventoryIds}
          hiddenGear={buddy.effectiveHiddenGear}
          unlockedGear={buddy.unlockedGearIds}
        />
      ) : null}

      <a
        className="fixed left-3 top-3 z-100 -translate-y-24 bg-phosphor px-3 py-2 font-black text-ink-950 focus:translate-y-0"
        href="#main"
      >
        Skip to content
      </a>

      <div className="cabinet-layout relative grid min-h-screen lg:grid-cols-[292px_minmax(0,1fr)]">
        <Sidebar
          activeSection={activeSection}
          buddy={buddy}
          onOpenBuddyModal={setBuddyModal}
          theme={theme}
          onThemeChange={updateThemePreference}
        />

        <div className="min-w-0">
          <header className={`cart-slot sticky top-0 z-40 flex min-h-[68px] flex-col gap-3 border-b border-phosphor/20 bg-ink-950/85 px-4 py-3 backdrop-blur md:flex-row md:items-center md:justify-between lg:px-10 ${cartPhase === "insert" ? "is-cart-seat" : ""}`}>
            <div>
              <span className="pixel-label text-phosphor-soft/60">ACTIVE PROGRAM</span>
              <strong className="ml-2 font-display text-white">Dai.exe</strong>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="border border-phosphor/25 px-3 py-2 text-phosphor-soft">XP <b data-score>{String(score).padStart(3, "0")}</b></span>
              <span className="border border-phosphor/25 px-3 py-2 text-phosphor-soft">FPS <b className="tabular-nums">{fps}</b></span>
              <span className="border border-phosphor/25 px-3 py-2 text-phosphor-soft">{time}</span>
            </div>
          </header>

          <main className={`cart-stage mx-auto w-[min(1180px,calc(100%-clamp(28px,6vw,76px)))] ${cartPhase ? `is-cart-${cartPhase}` : ""}`} id="main">
            <HeroStation
              buildLog={buildLog}
              hasRun={hasRun}
              isLaunching={isLaunching}
              launchPhase={launchPhase}
              onOpenTerminal={openTerminal}
              onRun={runBuild}
            />
            <ProgramSections />
            <CommentsSection />
          </main>
          <SiteFooter buddy={buddy} onBuddyPet={handleBuddyPet} onPowerOutage={setPowerOutage} />
        </div>
      </div>

      {achievement ? (
        <div className="achievement-toast fixed right-3 top-20 z-50 border border-cabinet/60 bg-ink-950/90 px-4 py-3 text-sm font-black text-cabinet shadow-crt" role="status">
          {achievement}
        </div>
      ) : null}

      <AttractMode enabled={!entrySplashOpen} score={score} />

      <KonamiGameLibrary open={konamiView === "library"} onClose={closeKonami} onSelect={selectKonamiGame} />
      <MadraceModal open={konamiView === "madrace"} onBack={openKonamiLibrary} onClose={closeKonami} />
      <TowerBlockModal open={konamiView === "tower-block"} onBack={openKonamiLibrary} onClose={closeKonami} />
      <ArcadeEmbedModal game={konamiView} open={["cross-road", "rubiks-cube"].includes(konamiView)} onBack={openKonamiLibrary} onClose={closeKonami} />

      <BuddyModal
        buddy={buddy}
        mode={buddyModal}
        onClose={() => setBuddyModal(null)}
        onModeChange={setBuddyModal}
      />

      <LaunchOverlay active={isLaunching} closing={launchClosing} complete={launchComplete} phase={launchPhase} />

      <TerminalDialog
        log={terminalLog}
        onCommand={runCommand}
        onOpenChange={setTerminalOpen}
        open={terminalOpen}
      />
    </div>
  );
}
