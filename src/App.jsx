import { useEffect, useRef, useState } from "react";
import { commands, discord, games, profile, projects } from "./data/site";
import { preloadImages } from "./lib/preloadImages";
import { useClock } from "./hooks/useClock";
import { useRandomGlitchWords } from "./hooks/useRandomGlitchWords";
import { ArcadeBackground } from "./components/ArcadeBackground";
import { CommentsSection } from "./components/CommentsSection";
import { EntrySplash } from "./components/EntrySplash";
import { HeroStation } from "./components/HeroStation";
import { LaunchOverlay } from "./components/LaunchOverlay";
import { ProgramSections } from "./components/ProgramSections";
import { Sidebar } from "./components/Sidebar";
import { SiteFooter } from "./components/SiteFooter";
import { TerminalDialog } from "./components/TerminalDialog";

export default function App() {
  const [theme, setTheme] = useState("crt");
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [score, setScore] = useState(87);
  const [buildLog, setBuildLog] = useState("$ idle\nDai.exe offline\nnodes waiting for RUN command...");
  const [terminalLog, setTerminalLog] = useState("$ whoami\npersonal arcade station offline.\n\nTip: type help, run, theme, scan, clear.");
  const [activeSection, setActiveSection] = useState("home");
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchPhase, setLaunchPhase] = useState(0);
  const [launchComplete, setLaunchComplete] = useState(false);
  const [launchClosing, setLaunchClosing] = useState(false);
  const [entrySplashOpen, setEntrySplashOpen] = useState(true);
  const [hasRun, setHasRun] = useState(false);
  const [achievement, setAchievement] = useState("");
  const achievementTimerRef = useRef(0);
  const shellRef = useRef(null);
  const time = useClock();
  useRandomGlitchWords(theme === "glitch");

  useEffect(() => {
    preloadImages([
      profile.avatar,
      discord.fallbackAvatar,
      ...games.flatMap((game) => [game.image, game.logo, game.character]),
      ...projects.flatMap((project) => [project.image, project.icon])
    ]);
  }, []);

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
  }

  useEffect(() => () => window.clearTimeout(achievementTimerRef.current), []);

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
    const name = input.toLowerCase();
    if (!name) return;

    if (name === "theme") {
      updateThemePreference(theme === "crt" ? "glitch" : "crt");
      appendTerminal(input, "Theme toggled. Glitch layer recalibrated.");
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

    if (name === "contact") {
      appendTerminal(input, `Open channel: ${profile.email}`);
      return;
    }

    const command = commands.find(([commandName]) => commandName === name);
    if (command) {
      appendTerminal(input, command[1]);
      return;
    }

    appendTerminal(input, `Command not found: ${input}\nTry help, run, theme, scan, clear.`);
  }

  return (
    <div ref={shellRef} className={`app-shell ${theme === "glitch" ? "theme-glitch" : ""} ${isLaunching ? "is-launching" : ""}`} data-glitch-root>
      <ArcadeBackground />
      {entrySplashOpen ? <EntrySplash onEnter={() => setEntrySplashOpen(false)} /> : null}

      <a
        className="fixed left-3 top-3 z-100 -translate-y-24 bg-phosphor px-3 py-2 font-black text-ink-950 focus:translate-y-0"
        href="#main"
      >
        Skip to content
      </a>

      <div className="relative z-10 grid min-h-screen lg:grid-cols-[292px_minmax(0,1fr)]">
        <Sidebar activeSection={activeSection} theme={theme} onThemeChange={updateThemePreference} />

        <div className="min-w-0">
          <header className="sticky top-0 z-40 flex min-h-[68px] flex-col gap-3 border-b border-phosphor/20 bg-ink-950/85 px-4 py-3 backdrop-blur md:flex-row md:items-center md:justify-between lg:px-10">
            <div>
              <span className="pixel-label text-phosphor-soft/60">ACTIVE PROGRAM</span>
              <strong className="ml-2 font-display text-white">Dai.exe</strong>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="border border-phosphor/25 px-3 py-2 text-phosphor-soft">XP <b data-score>{String(score).padStart(3, "0")}</b></span>
              <span className="border border-phosphor/25 px-3 py-2 text-phosphor-soft">FPS <b>60</b></span>
              <span className="border border-phosphor/25 px-3 py-2 text-phosphor-soft">{time}</span>
            </div>
          </header>

          <main className="mx-auto w-[min(1180px,calc(100%-clamp(28px,6vw,76px)))]" id="main">
            <HeroStation
              buildLog={buildLog}
              hasRun={hasRun}
              isLaunching={isLaunching}
              launchPhase={launchPhase}
              onOpenTerminal={() => setTerminalOpen(true)}
              onRun={runBuild}
            />
            <ProgramSections />
            <CommentsSection />
          </main>
          <SiteFooter />
        </div>
      </div>

      {achievement ? (
        <div className="achievement-toast fixed right-3 top-20 z-50 border border-cabinet/60 bg-ink-950/90 px-4 py-3 text-sm font-black text-cabinet shadow-crt" role="status">
          {achievement}
        </div>
      ) : null}

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
