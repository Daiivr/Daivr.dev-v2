import { useEffect, useRef, useState } from "react";
import { BuddyChuteCanopy, BuddySprite } from "./BuddySprite";

const SLEEP_AFTER_MS = 45000;
const WALK_SPEED_PX_S = 44;
const SLEEPY_SPEED_PX_S = 30;
const FALL_SPEED_PX_S = 58;
const BRAIN_TICK_MS = 1100;
const SPRITE_WIDTH = 64;
const WALK_MARGIN = 72;
const CORNER_MARGIN = 12;
const PET_SPAM_WINDOW_MS = 2600;
const EYE_TRACK_RADIUS = 340;
const DRAG_THRESHOLD_PX = 7;

const CONFETTI_COLORS = ["#3fff97", "#45d8ff", "#ff3d9d", "#ffd166", "#f4fff8"];

const LINES = {
  boot: ["hello, player.", "buddy.exe delivered.", "touchdown. footer secured.", "special delivery."],
  idle: [
    "beep.",
    "...",
    "coffee?",
    "insert coin.",
    "nice cabinet, right?",
    "01101000 01101001",
    "the rainbow line is warm.",
    "i live here now.",
    "guarding the footer.",
    "step count: many.",
    "no bugs down here. checked.",
    "dai said i could stay."
  ],
  walkStop: [
    "wait. i heard something.",
    "this spot is nice.",
    "checking the pixels... clean.",
    "all systems green.",
    "patrol complete-ish.",
    "hm. footer secure."
  ],
  night: ["late shift again?", "the glow hits different at night.", "hydrate, player.", "night mode: cozy."],
  morning: ["good morning, player.", "fresh phosphor smell.", "early. impressive."],
  pet: ["beep!", "+1 friendship", "hehe.", "again!", "purr.exe", "<3", "acceptable."],
  petSpam: ["ok ok!", "dizzy...", "affection overload!", "cooldown needed."],
  wake: ["!?", "i'm up. i'm up.", "rebooting...", "was not sleeping."],
  sleepy: ["low battery...", "bedtime protocol.", "corner. now."],
  party: ["gg!", "achievement get!", "new record?", "confetti protocol!"],
  dance: ["dance protocol engaged.", "do not perceive me.", "grooving."],
  flip: ["wheee!", "gymnastics.exe", "10/10 landing."],
  held: ["hey!", "unauthorized lift!", "flying???", "put me down?", "no seatbelt!"],
  chute: ["deploying chute.", "wheee.", "this is fine.", "mayday? no. style points."],
  landed: ["soft landing.", "10/10 landing.", "again.", "chute packed. ready."],
  glitchTheme: ["reality.exe corrupted?", "pink? bold choice.", "i feel... glitchy.", "who turned the colors?"],
  crtTheme: ["ah. classic green.", "home sweet green.", "calibration restored."],
  music: ["this track slaps.", "vibing in binary.", "volume up. trust me."]
};

const reduceMotionQuery =
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;

const desktopQuery =
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(min-width: 760px)")
    : null;

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/*
  buddy.exe v3 — mascota del cabinet anclada al footer:
  - patrulla la barra, se detiene a comentar, baila, mira al cursor;
  - en desktop camina hasta una esquina libre del footer para dormir;
  - se puede agarrar y soltar: baja en paracaidas hasta el riel;
  - niveles de amistad (props) desbloquean cosmeticos: gorro, lentes, bufanda,
    LED dorado;
  - comenta la cancion de Spotify si hay una sonando.
  Cada humor lleva un contador de generacion para que timers viejos no pisen
  estados nuevos.
*/
export function ScreenBuddy({ onPet, visitCount, friendshipLevel = 1, nowPlaying = null }) {
  const [mood, setMood] = useState("off");
  const [fx, setFx] = useState("");
  const [bubble, setBubble] = useState("");
  const [x, setX] = useState(WALK_MARGIN);
  const [y, setY] = useState(0);
  const [facing, setFacing] = useState(1);
  const [walkMs, setWalkMs] = useState(0);
  const [particles, setParticles] = useState([]);

  const moodRef = useRef("off");
  const moodGenRef = useRef(0);
  const xRef = useRef(WALK_MARGIN);
  const yRef = useRef(0);
  const facingRef = useRef(1);
  const rootRef = useRef(null);
  const visibleRef = useRef(false);
  const bootedRef = useRef(false);
  const dropInFlightRef = useRef(false);
  const lastActivityRef = useRef(Date.now());
  const lastLineRef = useRef("");
  const timersRef = useRef(new Set());
  const bubbleTimerRef = useRef(0);
  const fxTimerRef = useRef(0);
  const petTimesRef = useRef([]);
  const particleIdRef = useRef(0);
  const visitCountRef = useRef(null);
  const nowPlayingRef = useRef(null);
  const dragRef = useRef(null);
  const draggedRef = useRef(false);
  const dragFrameRef = useRef(0);
  const pendingDragRef = useRef(null);

  useEffect(() => {
    visitCountRef.current = typeof visitCount === "number" ? visitCount : null;
  }, [visitCount]);

  useEffect(() => {
    nowPlayingRef.current = nowPlaying?.song ? nowPlaying : null;
  }, [nowPlaying]);

  function updateMood(next) {
    moodGenRef.current += 1;
    moodRef.current = next;
    setMood(next);
  }

  function updateFacing(next) {
    if (facingRef.current === next) return;
    facingRef.current = next;
    setFacing(next);
  }

  function moveTo(target) {
    xRef.current = target;
    setX(target);
  }

  function liftTo(target) {
    yRef.current = target;
    setY(target);
  }

  function schedule(fn, ms) {
    const timer = window.setTimeout(() => {
      timersRef.current.delete(timer);
      fn();
    }, ms);
    timersRef.current.add(timer);
    return timer;
  }

  function stageWidth() {
    return rootRef.current?.parentElement?.clientWidth || 640;
  }

  function pickLine(pool) {
    const options = pool.filter((line) => line !== lastLineRef.current);
    const line = options[Math.floor(Math.random() * options.length)] || pool[0];
    lastLineRef.current = line;
    return line;
  }

  function say(line, ms = 2400) {
    window.clearTimeout(bubbleTimerRef.current);
    setBubble(line);
    bubbleTimerRef.current = window.setTimeout(() => setBubble(""), ms);
  }

  function playFx(name, ms) {
    window.clearTimeout(fxTimerRef.current);
    setFx(name);
    fxTimerRef.current = window.setTimeout(() => setFx(""), ms);
  }

  function spawnParticles(kind, count) {
    const items = Array.from({ length: count }, () => ({
      id: (particleIdRef.current += 1),
      kind,
      dx: kind === "heart" ? randomBetween(-18, 18) : randomBetween(-46, 46),
      dy: kind === "heart" ? randomBetween(-46, -30) : randomBetween(-78, -34),
      rot: randomBetween(-280, 280),
      delay: randomBetween(0, 240),
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]
    }));
    const ids = new Set(items.map((item) => item.id));
    setParticles((current) => [...current, ...items]);
    schedule(() => setParticles((current) => current.filter((item) => !ids.has(item.id))), 1500);
  }

  // Posicion actual real (puede estar a mitad de un paseo o caida).
  function currentDomPosition() {
    const node = rootRef.current;
    const parent = node?.parentElement;
    if (!node || !parent) return { x: xRef.current, y: yRef.current };
    const nodeRect = node.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();
    return {
      x: nodeRect.left - parentRect.left,
      y: nodeRect.bottom - (parentRect.top + 2)
    };
  }

  function freezeAtCurrentPosition() {
    const position = currentDomPosition();
    setWalkMs(0);
    moveTo(position.x);
    liftTo(Math.min(0, position.y));
  }

  function settleDown(delayMs) {
    // Solo el humor que programo este timer puede cerrarse a si mismo: si un
    // humor mas nuevo tomo el control, el timer viejo no debe pisarlo.
    const generation = moodGenRef.current;
    schedule(() => {
      if (moodGenRef.current !== generation) return;
      if (["pet", "party", "dance", "talk"].includes(moodRef.current)) {
        updateMood("idle");
      }
    }, delayMs);
  }

  function contextIdlePool() {
    const hour = new Date().getHours();
    const pool = [...LINES.idle, ...LINES.walkStop];
    if (hour >= 22 || hour < 5) pool.push(...LINES.night, ...LINES.night);
    else if (hour < 11) pool.push(...LINES.morning);
    if (visitCountRef.current) pool.push(`visitor #${visitCountRef.current.toLocaleString("en-US")} logged.`);

    const playing = nowPlayingRef.current;
    if (playing?.song) {
      const song = playing.song.length > 26 ? `${playing.song.slice(0, 24)}...` : playing.song;
      pool.push(`♪ ${song}? good taste.`, ...LINES.music);
    }

    return pool;
  }

  function handlePet() {
    if (draggedRef.current) return;
    if (["held", "chute"].includes(moodRef.current)) return;

    const wasAsleep = moodRef.current === "sleep" || moodRef.current === "sleepy";
    lastActivityRef.current = Date.now();

    const now = Date.now();
    petTimesRef.current = [...petTimesRef.current.filter((t) => now - t < PET_SPAM_WINDOW_MS), now];

    freezeAtCurrentPosition();

    if (petTimesRef.current.length >= 4) {
      petTimesRef.current = [];
      updateMood("pet");
      playFx("dizzy", 1500);
      say(pickLine(LINES.petSpam), 2000);
      settleDown(1700);
      onPet?.();
      return;
    }

    updateMood("pet");
    spawnParticles("heart", 3);
    say(wasAsleep ? pickLine(LINES.wake) : pickLine(LINES.pet), 1900);
    onPet?.();
    settleDown(1700);
  }

  function handleFlip() {
    if (reduceMotionQuery?.matches) return;
    if (["held", "chute"].includes(moodRef.current)) return;
    playFx("flip", 800);
    say(pickLine(LINES.flip), 1800);
  }

  // --- Agarrar y soltar -----------------------------------------------------

  function applyDragFrame() {
    dragFrameRef.current = 0;
    const drag = dragRef.current;
    const point = pendingDragRef.current;
    if (!drag?.dragging || !point) return;
    moveTo(clamp(drag.originX + (point.clientX - drag.startClientX), 4, drag.maxX));
    liftTo(clamp(drag.originY + (point.clientY - drag.startClientY), drag.minY, 0));
  }

  function handlePointerDown(event) {
    if (reduceMotionQuery?.matches) return;
    if (event.button != null && event.button !== 0) return;
    const node = rootRef.current;
    const parent = node?.parentElement;
    if (!node || !parent) return;

    const parentRect = parent.getBoundingClientRect();
    const position = currentDomPosition();

    dragRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originX: position.x,
      originY: Math.min(0, position.y),
      // Altura maxima: que el sprite no salga del viewport por arriba.
      minY: Math.min(-40, -(parentRect.top - 26)),
      maxX: Math.max(4, parent.clientWidth - SPRITE_WIDTH - 4),
      dragging: false
    };
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      // Punteros sinteticos o ya liberados: el arrastre funciona igual.
    }
  }

  function handlePointerMove(event) {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;

    pendingDragRef.current = { clientX: event.clientX, clientY: event.clientY };

    if (!drag.dragging) {
      const moved = Math.hypot(event.clientX - drag.startClientX, event.clientY - drag.startClientY);
      if (moved < DRAG_THRESHOLD_PX) return;
      drag.dragging = true;
      draggedRef.current = true;
      // Congela la posicion real antes de matar la transicion para no saltar.
      moveTo(drag.originX);
      liftTo(drag.originY);
      setWalkMs(0);
      updateMood("held");
      say(pickLine(LINES.held), 1800);
    }

    if (!dragFrameRef.current) {
      dragFrameRef.current = window.requestAnimationFrame(applyDragFrame);
    }
  }

  function handlePointerRelease(event) {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    dragRef.current = null;
    pendingDragRef.current = null;
    window.cancelAnimationFrame(dragFrameRef.current);
    dragFrameRef.current = 0;
    try {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    } catch {
      // Sin captura activa no hay nada que liberar.
    }

    if (!drag.dragging) return;
    schedule(() => {
      draggedRef.current = false;
    }, 220);

    if (yRef.current < -30) {
      updateMood("chute");
      say(pickLine(LINES.chute), 2200);
      const fallMs = clamp((Math.abs(yRef.current) / FALL_SPEED_PX_S) * 1000, 650, 6500);
      const generation = moodGenRef.current;
      setWalkMs(fallMs);
      liftTo(0);
      schedule(() => {
        if (moodGenRef.current !== generation || moodRef.current !== "chute") return;
        setWalkMs(0);
        updateMood("idle");
        say(pickLine(LINES.landed), 2200);
      }, fallMs + 60);
    } else {
      setWalkMs(0);
      liftTo(0);
      updateMood("idle");
    }
  }

  // --- Cerebro ---------------------------------------------------------------

  useEffect(() => {
    const timers = timersRef.current;
    const reduceMotion = Boolean(reduceMotionQuery?.matches);
    const stage = rootRef.current?.parentElement;

    function bootUp() {
      bootedRef.current = true;
      moveTo(Math.min(Math.max(WALK_MARGIN, stageWidth() * 0.14), stageWidth() - WALK_MARGIN - SPRITE_WIDTH));

      if (reduceMotion) {
        updateMood("idle");
        say(pickLine(LINES.boot), 2600);
        return;
      }

      // Aterrizaje inaugural: continua el salto desde la puerta de bienvenida,
      // entrando en paracaidas desde arriba hasta tocar el riel.
      const parentTop = rootRef.current?.parentElement?.getBoundingClientRect().top ?? 300;
      const dropFrom = Math.round(Math.max(200, Math.min(320, parentTop - 30)));
      liftTo(-dropFrom);
      updateMood("chute");
      const generation = moodGenRef.current;
      const fallMs = clamp((dropFrom / FALL_SPEED_PX_S) * 1000, 900, 6500);

      // Un tick para que la posicion elevada pinte antes de iniciar la caida.
      schedule(() => {
        if (moodGenRef.current !== generation) return;
        setWalkMs(fallMs);
        liftTo(0);
      }, 60);

      schedule(() => {
        if (moodGenRef.current !== generation || moodRef.current !== "chute") return;
        setWalkMs(0);
        updateMood("idle");
        say(pickLine(LINES.boot), 2600);
      }, fallMs + 200);
    }

    function startWalk() {
      const maxX = Math.max(WALK_MARGIN, stageWidth() - SPRITE_WIDTH - WALK_MARGIN);
      const target = WALK_MARGIN + Math.random() * (maxX - WALK_MARGIN);
      const distance = Math.abs(target - xRef.current);
      if (distance < 56) return;

      const ms = Math.min(8000, (distance / WALK_SPEED_PX_S) * 1000);
      updateFacing(target > xRef.current ? 1 : -1);
      updateMood("walk");
      const generation = moodGenRef.current;
      setWalkMs(ms);
      moveTo(target);

      schedule(() => {
        if (moodGenRef.current !== generation || moodRef.current !== "walk") return;
        if (Math.random() < 0.4) {
          updateMood("talk");
          say(pickLine([...LINES.walkStop, ...contextIdlePool()]), 2600);
          settleDown(2700);
        } else {
          updateMood("idle");
        }
      }, ms + 80);
    }

    // En desktop camina hasta la esquina mas cercana del footer y duerme ahi;
    // en mobile (o con motion reducido) se duerme donde este.
    function goToSleep() {
      if (!desktopQuery?.matches || reduceMotion) {
        updateMood("sleep");
        window.clearTimeout(bubbleTimerRef.current);
        setBubble("");
        return;
      }

      const width = stageWidth();
      const leftCorner = CORNER_MARGIN;
      const rightCorner = Math.max(leftCorner, width - SPRITE_WIDTH - CORNER_MARGIN);
      const target = xRef.current < width / 2 ? leftCorner : rightCorner;
      const distance = Math.abs(target - xRef.current);

      if (distance < 24) {
        updateMood("sleep");
        window.clearTimeout(bubbleTimerRef.current);
        setBubble("");
        return;
      }

      updateFacing(target > xRef.current ? 1 : -1);
      updateMood("sleepy");
      say(pickLine(LINES.sleepy), 2000);
      const generation = moodGenRef.current;
      const ms = Math.min(11000, (distance / SLEEPY_SPEED_PX_S) * 1000);
      setWalkMs(ms);
      moveTo(target);

      schedule(() => {
        if (moodGenRef.current !== generation || moodRef.current !== "sleepy") return;
        updateMood("sleep");
        window.clearTimeout(bubbleTimerRef.current);
        setBubble("");
      }, ms + 80);
    }

    function brainTick() {
      if (!visibleRef.current) return;

      const currentMood = moodRef.current;
      if (["off", "walk", "pet", "party", "dance", "held", "chute"].includes(currentMood)) return;

      const idleFor = Date.now() - lastActivityRef.current;

      if (currentMood === "sleepy") {
        // El usuario volvio antes de llegar a la cama: cancela la caminata.
        if (idleFor < SLEEP_AFTER_MS) {
          freezeAtCurrentPosition();
          updateMood("idle");
          say(pickLine(LINES.wake), 1700);
        }
        return;
      }

      if (idleFor > SLEEP_AFTER_MS) {
        if (currentMood !== "sleep") goToSleep();
        return;
      }

      if (currentMood === "sleep") {
        updateMood("idle");
        say(pickLine(LINES.wake), 1700);
        return;
      }

      if (currentMood === "talk") return;

      const roll = Math.random();
      if (roll < 0.3 && !reduceMotion) {
        startWalk();
      } else if (roll < 0.46) {
        updateMood("talk");
        say(pickLine(contextIdlePool()), 2600);
        settleDown(2700);
      } else if (roll < 0.51 && !reduceMotion) {
        updateMood("dance");
        if (Math.random() < 0.5) say(pickLine(LINES.dance), 2200);
        settleDown(2600);
      } else if (roll < 0.58 && !reduceMotion) {
        playFx("static", 700);
      } else if (roll < 0.66 && !reduceMotion) {
        playFx("scan", 1600);
      }
    }

    function markActivity() {
      lastActivityRef.current = Date.now();
    }

    function celebrate() {
      if (!visibleRef.current) return;
      if (["pet", "off", "held", "chute"].includes(moodRef.current)) return;
      freezeAtCurrentPosition();
      updateMood("party");
      spawnParticles("confetti", 16);
      say(pickLine(LINES.party), 2600);
      settleDown(3000);
    }

    function reactToTheme(event) {
      if (!visibleRef.current) return;
      if (["off", "sleep", "sleepy", "held", "chute"].includes(moodRef.current)) return;
      playFx("glitchy", 900);
      say(pickLine(event.detail?.theme === "glitch" ? LINES.glitchTheme : LINES.crtTheme), 2400);
    }

    // Relevo con la caida de bienvenida (BuddyDrop): mientras el clon del
    // splash sigue en el aire, este buddy NO aparece (evita duplicados); al
    // tocar el riel, toma el control exactamente donde aterrizo.
    function onDropSignal(event) {
      const detail = event.detail || {};

      if (detail.phase === "start") {
        dropInFlightRef.current = true;
        return;
      }

      if (detail.phase === "land") {
        dropInFlightRef.current = false;
        if (bootedRef.current) return;
        bootedRef.current = true;

        const maxX = Math.max(4, stageWidth() - SPRITE_WIDTH - 4);
        setWalkMs(0);
        moveTo(clamp(Number(detail.x) || stageWidth() * 0.14, 4, maxX));
        liftTo(0);
        updateMood("idle");
        say(pickLine(LINES.boot), 2600);
      }
    }

    function clampToStage() {
      const maxX = Math.max(WALK_MARGIN, stageWidth() - SPRITE_WIDTH - WALK_MARGIN);
      if (xRef.current > maxX) {
        setWalkMs(0);
        moveTo(maxX);
      }
    }

    // Ojos que siguen el cursor (via CSS vars, sin re-render). El giro del
    // cuerpo solo ocurre parado, para no torcerlo a mitad de un paseo.
    let eyeRaf = 0;
    function trackPointer(event) {
      if (!visibleRef.current || reduceMotion || eyeRaf) return;
      eyeRaf = window.requestAnimationFrame(() => {
        eyeRaf = 0;
        const node = rootRef.current;
        if (!node) return;
        const rect = node.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);

        if (Math.hypot(dx, dy) < EYE_TRACK_RADIUS) {
          node.style.setProperty("--buddy-eye-x", `${Math.max(-1.7, Math.min(1.7, dx / 70)).toFixed(2)}px`);
          node.style.setProperty("--buddy-eye-y", `${Math.max(-1.2, Math.min(1.2, dy / 90)).toFixed(2)}px`);
          if (["idle", "talk"].includes(moodRef.current)) updateFacing(dx >= 0 ? 1 : -1);
        } else {
          node.style.setProperty("--buddy-eye-x", "0px");
          node.style.setProperty("--buddy-eye-y", "0px");
        }
      });
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);
        visibleRef.current = visible;
        if (visible && !bootedRef.current && !dropInFlightRef.current) bootUp();
      },
      { threshold: 0.15 }
    );
    if (stage) observer.observe(stage);

    const brainTimer = window.setInterval(brainTick, BRAIN_TICK_MS);
    const activityEvents = ["pointerdown", "keydown", "wheel", "touchstart"];
    activityEvents.forEach((name) => window.addEventListener(name, markActivity, { passive: true }));
    window.addEventListener("pointermove", markActivity, { passive: true });
    window.addEventListener("pointermove", trackPointer, { passive: true });
    window.addEventListener("daivr-achievement", celebrate);
    window.addEventListener("daivr-theme", reactToTheme);
    window.addEventListener("daivr-buddy-drop", onDropSignal);
    window.addEventListener("resize", clampToStage);

    return () => {
      observer.disconnect();
      window.clearInterval(brainTimer);
      window.cancelAnimationFrame(eyeRaf);
      window.cancelAnimationFrame(dragFrameRef.current);
      activityEvents.forEach((name) => window.removeEventListener(name, markActivity));
      window.removeEventListener("pointermove", markActivity);
      window.removeEventListener("pointermove", trackPointer);
      window.removeEventListener("daivr-achievement", celebrate);
      window.removeEventListener("daivr-theme", reactToTheme);
      window.removeEventListener("daivr-buddy-drop", onDropSignal);
      window.removeEventListener("resize", clampToStage);
      window.clearTimeout(bubbleTimerRef.current);
      window.clearTimeout(fxTimerRef.current);
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isHappy = ["pet", "party", "dance"].includes(mood);
  const isAsleep = mood === "sleep";
  const isAirborne = y < -4;

  return (
    <div
      className={`screen-buddy-root is-${mood} ${fx ? `fx-${fx}` : ""} ${isAirborne ? "is-airborne" : ""}`}
      ref={rootRef}
      style={{ "--buddy-x": `${x}px`, "--buddy-y": `${y}px`, "--buddy-walk-ms": `${walkMs}ms` }}
    >
      <div className={`screen-buddy-bubble ${bubble ? "is-visible" : ""}`} aria-hidden="true">
        {bubble}
      </div>

      {isAsleep ? (
        <span className="screen-buddy-zzz" aria-hidden="true">
          <i>z</i>
          <i>z</i>
          <i>z</i>
        </span>
      ) : null}

      <span className="screen-buddy-particles" aria-hidden="true">
        {particles.map((particle) =>
          particle.kind === "heart" ? (
            <i
              className="buddy-particle buddy-particle-heart"
              key={particle.id}
              style={{ "--px": `${particle.dx}px`, "--py": `${particle.dy}px`, "--pd": `${particle.delay}ms` }}
            >
              ♥
            </i>
          ) : (
            <i
              className="buddy-particle buddy-particle-confetti"
              key={particle.id}
              style={{
                "--px": `${particle.dx}px`,
                "--py": `${particle.dy}px`,
                "--rot": `${particle.rot}deg`,
                "--pd": `${particle.delay}ms`,
                background: particle.color
              }}
            />
          )
        )}
      </span>

      <button
        className="screen-buddy arcade-focus"
        type="button"
        aria-label="Pet Dai's screen buddy (drag to carry it)"
        onClick={handlePet}
        onDoubleClick={handleFlip}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerRelease}
        onPointerCancel={handlePointerRelease}
      >
        <span className="screen-buddy-body">
          <BuddyChuteCanopy className="screen-buddy-chute-canopy" />

          <BuddySprite
            className="screen-buddy-sprite"
            expression={isHappy ? "happy" : isAsleep ? "sleep" : "idle"}
            facing={facing}
            friendshipLevel={friendshipLevel}
          />
        </span>
        <span className="screen-buddy-shadow" aria-hidden="true" />
      </button>
    </div>
  );
}
