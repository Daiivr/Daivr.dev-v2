// Hojas de estilo del armario, en el mismo orden relativo que tenian en
// main.jsx (el orden decide empates dentro de cada @layer). Las que pinta la
// puerta de entrada (index, screen-buddy, entry-*) se cargan antes, desde main.
import "./styles/attract-mode.css";
import "./styles/cart-swap.css";
import "./styles/discord-presence.css";
import "./styles/game-shelf.css";
import "./styles/hero-entry.css";
import "./styles/launch-overlay.css";
import "./styles/workstation-materials.css";
import "./styles/link-console.css";
import "./styles/now-dashboard.css";
import "./styles/project-console.css";
import "./styles/project-folder.css";
import "./styles/project-lanyard.css";
import "./styles/toolbelt.css";
import "./styles/comments-console.css";
import "./styles/patch-log.css";
import "./styles/perched-birds.css";
import "./styles/site-footer.css";
import "./styles/system-pages.css";
import "./styles/footer-wildlife.css";
import "./styles/buddy-shared.css";
import "./styles/buddy-world-polish.css";
import "./styles/buddy-animation-gear.css";
import "./styles/buddy-body-water.css";
import "./styles/buddy-rain-hunt.css";
import "./styles/buddy-encounter-fishing.css";
import "./styles/buddy-abyss.css";
import "./styles/buddy-outage.css";
import "./styles/pixel-birds.css";
import "./styles/ranking-avatar.css";
import "./styles/cursor.css";
import "./styles/seasonal-tints.css";
import "./styles/mobile.css";
import "./styles/cabinet-sidebar.css";
import "./styles/cabinet-topbar.css";
import "./styles/community.css";
import "./styles/project-story.css";
import "./styles/discord-desk.css";
import "./styles/game-collection.css";
import "./styles/arcade-panels.css";
import "./styles/player-passport.css";
import "./styles/panel-glitch.css";
import "./styles/discord-tabletop.css";
import "./styles/notebook-desk.css";
import "./styles/buddy-visitors.css";
import "./styles/buddy-campfire.css";
import "./styles/footer-sky.css";
import "./styles/modal-motion.css";
import { Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { bootNodes, discord, games, navItems, profile, projects } from "./data/site";
import { KONAMI_GAMES } from "./data/konamiGames";
import { preloadImages } from "./lib/preloadImages";
import { ChunkBoundary, lazyChunk } from "./lib/chunkRecovery";
import { getSeasonalEvent } from "./lib/seasons";
import { getCabinetSignal } from "./lib/cabinetSignals";
import { runTerminalCommand } from "./lib/terminalCommands";
import { useBuddyAdventure } from "./hooks/useBuddyAdventure";
import { useBuddyFriendship } from "./hooks/useBuddyFriendship";
import { useBuddyLoadout } from "./hooks/useBuddyLoadout";
import { useCartridgeSwap } from "./hooks/useCartridgeSwap";
import { getLatestFps } from "./hooks/useFps";
import { useRandomGlitchWords } from "./hooks/useRandomGlitchWords";
import { ArcadeBackground } from "./components/ArcadeBackground";
import { CabinetTopbar } from "./components/CabinetTopbar";
import { AttractMode } from "./components/AttractMode";
import { BuddyDrop } from "./components/BuddyDrop";
import { CommentsSection } from "./components/CommentsSection";
import { SignalCursor } from "./components/SignalCursor";
import { CursorTrail } from "./components/CursorTrail";
import { HeroStation } from "./components/HeroStation";
import { LaunchOverlay } from "./components/LaunchOverlay";
import { PerchedBirds } from "./components/PerchedBirds";
import { ProgramSections } from "./components/ProgramSections";
import { Sidebar } from "./components/Sidebar";
import { SiteFooter } from "./components/SiteFooter";
import { UpdateNotice } from "./components/UpdateNotice";
import { SystemGatePage } from "./components/SystemGatePage";

// Piezas que solo hacen falta cuando se usan: se descargan la primera vez y
// despues se quedan montadas (asi conservan sus animaciones de cierre).
const BuddyModal = lazyChunk(() => import("./components/BuddyModal"), (module) => module.BuddyModal);
const TerminalDialog = lazyChunk(() => import("./components/TerminalDialog"), (module) => module.TerminalDialog);
const SeasonalEvent = lazyChunk(() => import("./components/SeasonalEvent"), (module) => module.SeasonalEvent);
const KonamiGameLibrary = lazyChunk(() => import("./components/KonamiGameLibrary"), (module) => module.KonamiGameLibrary);
const MadraceModal = lazyChunk(() => import("./components/MadraceModal"), (module) => module.MadraceModal);
const TowerBlockModal = lazyChunk(() => import("./components/TowerBlockModal"), (module) => module.TowerBlockModal);
const ArcadeEmbedModal = lazyChunk(() => import("./components/ArcadeEmbedModal"), (module) => module.ArcadeEmbedModal);
const EMBED_GAMES = ["cross-road", "rubiks-cube", "space-cadet-pinball"];

function useUsedOnce(active) {
  const [used, setUsed] = useState(active);
  useEffect(() => {
    if (active) setUsed(true);
  }, [active]);
  return used || active;
}

function LazyPiece({ show, children }) {
  if (!show) return null;
  return <ChunkBoundary><Suspense fallback={null}>{children}</Suspense></ChunkBoundary>;
}

const ACCESS_DENIED_ROUTES = ["/403", "/access-denied", "/forbidden"];
const PROTECTED_ROUTE_PREFIXES = ["/admin", "/private", "/restricted", "/system"];

function isAccessDeniedPath(pathname) {
  const normalizedPath = pathname.toLowerCase().replace(/\/+$/, "") || "/";
  return ACCESS_DENIED_ROUTES.includes(normalizedPath)
    || PROTECTED_ROUTE_PREFIXES.some((prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`));
}

export default function App(props) {
  const pathname = window.location.pathname;

  if (isAccessDeniedPath(pathname)) {
    return <SystemGatePage requestedPath={pathname} variant="denied" />;
  }

  if (pathname !== "/" && pathname !== "/index.html") {
    return <SystemGatePage requestedPath={pathname} variant="missing" />;
  }

  return <CabinetApp {...props} />;
}

// La puerta y el .app-shell los pone CabinetRoot (chunk de entrada); aqui llega
// si la puerta sigue abierta y por donde devolverle lo que necesita.
function CabinetApp({ shellRef, gateOpen: entrySplashOpen = false, onShellClass, onGateBridge }) {
  const [theme, setTheme] = useState("crt");
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [buildLog, setBuildLog] = useState("$ dai.exe --status\nDai.exe offline // 0/6 up\nwaiting for RUN...");
  const [terminalLog, setTerminalLog] = useState("┌─ DAI.EXE COMMAND CONSOLE // v2.6\n│ cabinet shell mounted at ~/daivr\n│ history + completion modules online\n└─ Tip: type help, use Tab completion, or press ↑ for history.\n\n$ status\nshell ready // awaiting operator input");
  const [activeSection, setActiveSection] = useState("home");
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchPhase, setLaunchPhase] = useState(0);
  const [launchComplete, setLaunchComplete] = useState(false);
  const [launchClosing, setLaunchClosing] = useState(false);
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
  const konamiCoversWarmedRef = useRef(false);
  const friendship = useBuddyFriendship({ onMilestone: handleBuddyMilestone });
  const adventure = useBuddyAdventure({ onQuestComplete: handleBuddyQuestComplete });
  const loadout = useBuddyLoadout({ friendship, adventure });
  const cartPhase = useCartridgeSwap(shellRef);
  const buddy = { friendship, adventure, ...loadout };
  const closeKonami = useCallback(() => setKonamiView(null), []);
  const openKonamiLibrary = useCallback(() => setKonamiView("library"), []);
  const selectKonamiGame = useCallback((game) => setKonamiView(game), []);

  const terminalUsed = useUsedOnce(terminalOpen);
  const buddyModalUsed = useUsedOnce(Boolean(buddyModal));
  const libraryUsed = useUsedOnce(konamiView === "library");
  const madraceUsed = useUsedOnce(konamiView === "madrace");
  const towerUsed = useUsedOnce(konamiView === "tower-block");
  const embedUsed = useUsedOnce(EMBED_GAMES.includes(konamiView));
  const shellClass = `${theme === "glitch" ? "theme-glitch" : ""} ${isLaunching ? "is-launching" : ""} ${powerOutage ? `has-power-outage outage-${powerOutage}` : ""} ${seasonalEvent ? `season-${seasonalEvent}` : ""}`;
  const gateBridgeKey = JSON.stringify([seasonalEvent, friendship.level, adventure.inventoryIds, loadout.effectiveHiddenGear, loadout.unlockedGearIds]);

  useLayoutEffect(() => {
    onShellClass?.(shellClass);
  }, [onShellClass, shellClass]);

  // La puerta pinta el buddy con su equipo y la temporada activa; solo se le
  // avisa cuando algo de eso cambia de verdad.
  useLayoutEffect(() => {
    onGateBridge?.({
      seasonalEvent,
      friendshipLevel: friendship.level,
      inventory: adventure.inventoryIds,
      hiddenGear: loadout.effectiveHiddenGear,
      unlockedGear: loadout.unlockedGearIds,
      launchBuddy: setBuddyDrop
    });
  }, [gateBridgeKey, onGateBridge]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // La precarga marca una veintena de imagenes como fetchPriority high. Hecha
  // al montar, competia con la propia puerta de entrada por ancho de banda y
  // por decodificaciones, y todas esas imagenes ya estan en el DOM montado:
  // se descargarian igual, solo que sin adelantar a lo que si se esta viendo.
  // Se calienta cuando el visitante ya ha entrado y el hilo esta libre.
  useEffect(() => {
    if (entrySplashOpen) return undefined;

    const warm = () => preloadImages([
      profile.avatar,
      discord.fallbackAvatar,
      ...games.flatMap((game) => [game.image, game.logo]),
      ...projects.flatMap((project) => [project.image, project.icon])
    ]);

    if (typeof window.requestIdleCallback !== "function") {
      const timer = window.setTimeout(warm, 600);
      return () => window.clearTimeout(timer);
    }

    const idle = window.requestIdleCallback(warm, { timeout: 2500 });
    return () => window.cancelIdleCallback(idle);
  }, [entrySplashOpen]);

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
        // Las portadas de los cartuchos solo se citan dentro de la biblioteca, asi
        // que hasta ahora se pedian en el mismo instante en que se montaba el
        // dialogo y entraban un segundo tarde. A mitad de secuencia ya no hay duda
        // de que van a hacer falta, y quedan seis teclas de margen para bajarlas;
        // fuera de aqui no se descarga nada, que es un huevo de pascua.
        if (next >= 4 && !konamiCoversWarmedRef.current) {
          konamiCoversWarmedRef.current = true;
          preloadImages(KONAMI_GAMES.map((game) => game.image));
        }
        if (next === sequence.length) {
          konamiIndexRef.current = 0;
          setKonamiView("library");
          showAchievement(`SECRET GAME LIBRARY UNLOCKED // ${KONAMI_GAMES.length} DISKS FOUND`, 3000);
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
    const destinations = new Set(navItems.map(([, href]) => href.slice(1)));
    const sections = [...document.querySelectorAll("main section[id]")].filter((section) => destinations.has(section.id));
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
      const onlineMessage = "already online // stable";

      showAchievement("Dai.exe is already online. No reboot needed.", 2800);
      setBuildLog((value) => (value.includes(onlineMessage) ? value : `${value}\n${onlineMessage}`));

      return "Dai.exe is already online.\nNo reboot needed.";
    }

    // Cada nodo entra en el log cuando termina, no cuando empieza: antes el
    // panel decia "node 01 online" mientras el arranque lo tenia en RUN.
    const nodeLines = bootNodes.map((node, index) => `node ${String(index + 1).padStart(2, "0")} online // ${node.name}`);
    const phaseMs = 1180;
    const bootStartDelay = 300;
    const finishDelay = bootStartDelay + nodeLines.length * phaseMs + 620;

    const lines = [
      "$ run Dai.exe",
      ...nodeLines,
      "Dai.exe online // all green"
    ];

    setIsLaunching(true);
    setLaunchPhase(0);
    setLaunchComplete(false);
    setLaunchClosing(false);
    setHasRun(false);
    setAchievement("");
    setBuildLog(lines[0]);

    const timers = nodeLines.map((_, index) =>
      window.setTimeout(() => {
        setLaunchPhase(Math.min(index, 5));
        if (index > 0) setBuildLog((value) => `${value}\n${nodeLines[index - 1]}`);
      }, bootStartDelay + index * phaseMs)
    );

    timers.push(window.setTimeout(() => {
      setBuildLog((value) => `${value}\n${nodeLines.at(-1)}\n${lines.at(-1)}`);
      setLaunchComplete(true);
    }, finishDelay - 360));

    window.setTimeout(() => {
      setLaunchClosing(true);
    }, finishDelay + 920);

    window.setTimeout(() => {
      setIsLaunching(false);
      setLaunchComplete(false);
      setLaunchClosing(false);
      setHasRun(true);
      window.dispatchEvent(new CustomEvent("daivr-buddy-quest-progress", { detail: { type: "dai-boot" } }));
      showAchievement("Achievement unlocked: Dai.exe went live", 3600);
    }, finishDelay + 1280);

    return "Launching Dai.exe...\nwatch the cabinet warm up.";
  }

  // Los comandos viven en src/lib/terminalCommands.js; aqui solo se les da
  // acceso al estado del armario.
  function openLinkedProject(slug) {
    const target = `#project-${slug}`;
    if (window.location.hash === target) window.dispatchEvent(new HashChangeEvent("hashchange"));
    else window.location.hash = target;
  }

  function runCommand(rawInput) {
    return runTerminalCommand(rawInput, {
      print: appendTerminal,
      clear: () => setTerminalLog(""),
      close: () => setTerminalOpen(false),
      status: () => ({
        hasRun,
        isLaunching,
        theme,
        fps: getLatestFps(),
        activeSection,
        buddyLevel: friendship.level,
        powerOutage,
        player: getCabinetSignal("player"),
        online: getCabinetSignal("online")
      }),
      setTheme: updateThemePreference,
      runBuild,
      achievement: showAchievement,
      openGame: selectKonamiGame,
      openProject: openLinkedProject,
      openPassport: (view) => window.dispatchEvent(new CustomEvent("daivr-open-passport", { detail: { view } })),
      season: () => ({
        current: seasonalEvent,
        manual: seasonalOverride !== null,
        restore: () => {
          const scheduled = getSeasonalEvent();
          setSeasonalOverride(null);
          setSeasonalEvent(scheduled);
          return scheduled;
        },
        suspend: () => {
          setSeasonalOverride("off");
          setSeasonalEvent(null);
        },
        mount: (next) => {
          setSeasonalOverride(next);
          setSeasonalEvent(next);
        }
      })
    });
  }

  return (
    <>
      <ArcadeBackground />
      <LazyPiece show={Boolean(seasonalEvent)}>
        <SeasonalEvent event={seasonalEvent} entrySplashOpen={entrySplashOpen} />
      </LazyPiece>
      <CursorTrail theme={theme} />
      <SignalCursor theme={theme} />
      <PerchedBirds />
      {powerOutage ? (
        <div className={`cabinet-power-outage is-${powerOutage}`} aria-live="polite">
          <span className="power-outage-noise" aria-hidden="true" />
          <span className="power-outage-label">{powerOutage === "restore" ? "POWER RESTORING" : "CABINET POWER LOST"}</span>
        </div>
      ) : null}
      {buddyDrop ? (
        <BuddyDrop
          start={buddyDrop}
          aboveSplash={entrySplashOpen}
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
        tabIndex={entrySplashOpen ? -1 : undefined}
      >
        Skip to content
      </a>

      {/* grid-cols-1 (minmax(0,1fr)) explicito: sin el, bajo lg la unica
          columna era implicita y por tanto auto, asi que se dimensionaba al
          max-content de la barra lateral. El carril horizontal del nav pedia
          mas ancho que el viewport y estiraba la pagina entera en vez de
          scrollear dentro de si mismo. */}
      <div className="cabinet-layout relative grid min-h-screen grid-cols-1 lg:grid-cols-[292px_minmax(0,1fr)]" inert={entrySplashOpen ? true : undefined} aria-hidden={entrySplashOpen ? "true" : undefined}>
        <Sidebar
          activeSection={activeSection}
          buddy={buddy}
          onOpenBuddyModal={setBuddyModal}
          theme={theme}
          onThemeChange={updateThemePreference}
        />

        <div className="min-w-0">
          <CabinetTopbar activeSection={activeSection} cartPhase={cartPhase} onOpenTerminal={openTerminal} onPlay={selectKonamiGame} theme={theme} />

          <main className={`cart-stage mx-auto w-[min(1180px,calc(100%-clamp(28px,6vw,76px)))] ${cartPhase ? `is-cart-${cartPhase}` : ""}`} id="main" tabIndex={-1}>
            <HeroStation
              buildLog={buildLog}
              hasRun={hasRun}
              isLaunching={isLaunching}
              launchPhase={launchPhase}
              onOpenTerminal={openTerminal}
              onRun={runBuild}
            />
            <ProgramSections theme={theme} interactive={!entrySplashOpen} />
            <CommentsSection />
          </main>
          <SiteFooter onOpenMarket={() => setBuddyModal("market")} buddy={buddy} onBuddyPet={handleBuddyPet} onPowerOutage={setPowerOutage} />
        </div>
      </div>

      {achievement ? (
        <div className="achievement-toast fixed right-3 top-20 z-50 border border-cabinet/60 bg-ink-950/90 px-4 py-3 text-sm font-black text-cabinet shadow-crt" role="status">
          {achievement}
        </div>
      ) : null}

      <AttractMode enabled={!entrySplashOpen && !konamiView} />

      <UpdateNotice hidden={entrySplashOpen} shellRef={shellRef} playingGame={konamiView === "madrace" || konamiView === "tower-block" || EMBED_GAMES.includes(konamiView)} />

      <LazyPiece show={libraryUsed}>
        <KonamiGameLibrary open={konamiView === "library"} onClose={closeKonami} onSelect={selectKonamiGame} />
      </LazyPiece>
      <LazyPiece show={madraceUsed}>
        <MadraceModal open={konamiView === "madrace"} onBack={openKonamiLibrary} onClose={closeKonami} />
      </LazyPiece>
      <LazyPiece show={towerUsed}>
        <TowerBlockModal open={konamiView === "tower-block"} onBack={openKonamiLibrary} onClose={closeKonami} />
      </LazyPiece>
      <LazyPiece show={embedUsed}>
        <ArcadeEmbedModal game={konamiView} open={EMBED_GAMES.includes(konamiView)} onBack={openKonamiLibrary} onClose={closeKonami} />
      </LazyPiece>

      <LazyPiece show={buddyModalUsed}>
        <BuddyModal
          buddy={buddy}
          mode={buddyModal}
          seasonalEvent={seasonalEvent}
          onClose={() => setBuddyModal(null)}
          onModeChange={setBuddyModal}
          theme={theme}
        />
      </LazyPiece>

      <LaunchOverlay active={isLaunching} closing={launchClosing} complete={launchComplete} phase={launchPhase} />

      <LazyPiece show={terminalUsed}>
        <TerminalDialog
          log={terminalLog}
          onCommand={runCommand}
          onOpenChange={setTerminalOpen}
          open={terminalOpen}
          theme={theme}
        />
      </LazyPiece>
    </>
  );
}
