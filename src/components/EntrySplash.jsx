import { useEffect, useMemo, useRef, useState } from "react";
import { getLocalBuddyLevel } from "../hooks/useBuddyFriendship";
import { BuddySprite } from "./BuddySprite";

const BOOT_STEPS = [
  { tone: "command", text: "$ knock --cabinet-gate" },
  { tone: "ok", text: "gate.signal........accepted" },
  { tone: "ok", text: "room.lights........awake" },
  { tone: "active", text: "discord.pass.......scanning" },
  { tone: "ok", text: "arcade.floor.......open" },
  { tone: "online", text: "session............ready" }
];

const STEP_DELAY = 430;

export function EntrySplash({ onEnter, onBuddyLaunch }) {
  const [visibleCount, setVisibleCount] = useState(1);
  const [displayProgress, setDisplayProgress] = useState(Math.round((1 / BOOT_STEPS.length) * 100));
  const [discordUser, setDiscordUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [closing, setClosing] = useState(false);
  const progressRef = useRef(displayProgress);
  const closeTimerRef = useRef(0);
  const splashBuddyRef = useRef(null);
  const [buddyLevel] = useState(() => getLocalBuddyLevel());
  const [buddyLine, setBuddyLine] = useState("");
  const maxVisibleCount = authChecked ? BOOT_STEPS.length : BOOT_STEPS.length - 1;
  const bootComplete = visibleCount >= BOOT_STEPS.length;
  const ready = bootComplete && authChecked;
  const displayName = discordUser?.username || "guest";
  const greeting = `hi, ${displayName}`;
  const targetProgress = Math.round((visibleCount / BOOT_STEPS.length) * 100);
  const progress = Math.round(displayProgress);
  const initial = displayName.trim().charAt(0).toUpperCase() || "G";
  const canEnter = ready && !closing;

  const lines = useMemo(() => {
    const identityLine = discordUser
      ? `discord.pass.......${discordUser.username}`
      : authChecked
        ? "discord.pass.......guest"
        : "discord.pass.......scanning";

    return BOOT_STEPS.map((step) => (step.text.includes("discord.pass") ? { ...step, text: identityLine } : step));
  }, [authChecked, discordUser]);

  useEffect(() => {
    let cancelled = false;

    async function loadIdentity() {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 2200);

      try {
        const response = await fetch("/api/comments", { credentials: "include", signal: controller.signal });
        if (!response.ok) throw new Error(`auth returned ${response.status}`);
        const payload = await response.json();
        if (!cancelled) setDiscordUser(payload.auth?.user || null);
      } catch {
        if (!cancelled) setDiscordUser(null);
      } finally {
        window.clearTimeout(timeout);
        if (!cancelled) setAuthChecked(true);
      }
    }

    loadIdentity();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (visibleCount >= maxVisibleCount) return undefined;
    const timer = window.setTimeout(() => {
      setVisibleCount((value) => Math.min(maxVisibleCount, value + 1));
    }, authChecked && visibleCount === BOOT_STEPS.length - 1 ? 180 : STEP_DELAY);

    return () => window.clearTimeout(timer);
  }, [authChecked, maxVisibleCount, visibleCount]);

  useEffect(() => {
    let frame = 0;
    const start = progressRef.current;
    const delta = targetProgress - start;
    const duration = targetProgress === 100 ? 980 : 520;
    const startedAt = performance.now();

    function tick(now) {
      const elapsed = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - (1 - elapsed) ** 3;
      const next = start + delta * eased;
      progressRef.current = next;
      setDisplayProgress(next);

      if (elapsed < 1) frame = window.requestAnimationFrame(tick);
    }

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [targetProgress]);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    root.classList.add("entry-splash-lock");
    body.classList.add("entry-splash-lock");

    return () => {
      root.classList.remove("entry-splash-lock");
      body.classList.remove("entry-splash-lock");
      window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  function requestEnter() {
    if (!canEnter) return;

    // Relevo del buddy: entrega su posicion exacta en viewport para que la
    // caida de bienvenida (BuddyDrop, a nivel App) arranque sin costura.
    // Si el perchado esta oculto (pantallas bajas) no hay caida que hacer.
    const buddyRect = splashBuddyRef.current?.getBoundingClientRect();
    onBuddyLaunch?.(buddyRect && buddyRect.width > 0 ? { x: buddyRect.left, y: buddyRect.top } : null);

    setClosing(true);
    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(onEnter, 620);
  }

  // El buddy saluda al abrirse la puerta: por nombre de Discord o como guest,
  // y luego reta a la carrera hacia abajo.
  useEffect(() => {
    if (!ready) return undefined;
    setBuddyLine(`hi, ${displayName}.`);
    const raceTimer = window.setTimeout(() => setBuddyLine("race you down."), 3000);
    return () => window.clearTimeout(raceTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => {
    if (!ready) return undefined;

    function enterOnKey(event) {
      if (event.key === "Enter") requestEnter();
    }

    window.addEventListener("keydown", enterOnKey);
    return () => window.removeEventListener("keydown", enterOnKey);
  }, [canEnter, ready]);

  return (
    <div className={`entry-splash ${closing ? "is-closing" : ""}`} role="dialog" aria-modal="true" aria-labelledby="entry-splash-title">
      <div className="entry-splash-marquee" aria-hidden="true">DAI.EXE</div>
      <div className="entry-splash-stage">
        <div className={`splash-buddy ${closing ? "is-launched" : ""}`} aria-hidden="true" ref={splashBuddyRef}>
          <div className={`screen-buddy-bubble ${buddyLine && !closing ? "is-visible" : ""}`}>{buddyLine}</div>
          <BuddySprite className="splash-buddy-sprite" expression={ready ? "happy" : "idle"} friendshipLevel={buddyLevel} />
        </div>
        <section className={`entry-splash-gate ${ready ? "is-ready" : ""} ${closing ? "is-closing" : ""}`} aria-live="polite">
        <div className="entry-splash-id">
          <span className="pixel-label">WELCOME ACCESS PASS</span>
          <div className="entry-splash-identity">
            <div className="entry-splash-avatar" aria-hidden="true">
              {discordUser?.avatarUrl ? <img src={discordUser.avatarUrl} alt="" /> : <span>{initial}</span>}
            </div>
            <div>
              <h1 id="entry-splash-title">{greeting}</h1>
              <p>{discordUser ? "Discord signal recognized. Your cabinet session is warmed up." : "Guest signal recognized. The arcade cabinet is ready for a look around."}</p>
            </div>
          </div>
          <div className="entry-splash-tags" aria-label="Session status">
            <span>{discordUser ? "discord linked" : "guest pass"}</span>
            <span>{ready ? "gate open" : "checking signal"}</span>
            <span>{progress}%</span>
          </div>
        </div>

        <div className="entry-splash-console">
          <header>
            <span>~/welcome.gate</span>
            <strong>{ready ? "unlocked" : "handshake"}</strong>
          </header>
          <div>
            {lines.slice(0, visibleCount).map((line, index) => (
              <span
              className={`entry-splash-line is-${line.tone} ${index === visibleCount - 1 && !ready ? "is-typing" : ""} ${index === visibleCount - 1 && ready ? "is-final" : ""}`}
                key={`${line.tone}-${index}`}
                style={{ "--type-chars": line.text.length }}
              >
                {line.text}
              </span>
            ))}
          </div>
        </div>

        <footer className="entry-splash-actions">
          <div className="entry-splash-progress" aria-hidden="true">
            <span style={{ width: `${displayProgress}%` }} />
          </div>
          <button type="button" onClick={requestEnter} disabled={!canEnter}>
            {closing ? "entering..." : ready ? "enter web" : "opening gate..."}
          </button>
        </footer>
        </section>
      </div>
    </div>
  );
}
