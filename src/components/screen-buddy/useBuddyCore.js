import { useState } from "react";
import { runAdminBuddyDiagnostic } from "../../../shared/buddy-diagnostics.mjs";
import { contextLines } from "../../lib/buddyContext";
import { getCabinetSignal } from "../../lib/cabinetSignals";
import { LINES, MIKU_LINES, lineTopic, rememberTopic, visitReturnLines } from "./buddyLines";

/*
  Nucleo de Buddy: lo que comparten todas sus piezas (pesca, tiempo,
  encuentros, apagon, charla, arrastre y el cerebro de ScreenBuddy).
  - El estado que se pinta (humor, posicion, burbuja, particulas...).
  - Los refs que leen los timers y los listeners: el humor con su contador de
    generacion (un timer viejo no pisa un humor nuevo), la posicion, el evento
    activo (solo uno a la vez: pesca, lluvia, bicho, apagon...).
  - Las acciones basicas: andar, girarse, hablar (cola de burbujas con
    prioridad), particulas, timers que se limpian al desmontar.
  Se crea una sola vez por montaje y no cambia: las piezas lo reciben y
  pueden guardarse sus funciones en efectos sin dependencias.
*/

export const SPRITE_WIDTH = 64;
export const WALK_MARGIN = 72;
export const WALK_SPEED_PX_S = 44;
export const FALL_SPEED_PX_S = 58;
const DIALOGUE_GAP_MS = 420;
const MIN_DIALOGUE_MS = 1800;
const CONFETTI_COLORS = ["#3fff97", "#45d8ff", "#ff3d9d", "#ffd166", "#f4fff8"];
const SPLASH_COLORS = ["#45d8ff", "#b8f7ff", "#f4fff8"];

export const reduceMotionQuery =
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;

export const desktopQuery =
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(min-width: 760px)")
    : null;

export function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// La noche cuenta hasta el mediodia siguiente: la de las 23:00 y la de las
// 2:00 son la misma (limites por noche de la hoguera y los deseos).
export function nightKey(now = Date.now()) {
  const date = new Date(now - 12 * 3600_000);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function useBuddyCore() {
  const [mood, setMood] = useState("off");
  const [fx, setFx] = useState("");
  const [bubble, setBubble] = useState("");
  const [x, setX] = useState(WALK_MARGIN);
  const [y, setY] = useState(0);
  const [facing, setFacing] = useState(1);
  const [travelDirection, setTravelDirection] = useState(1);
  const [walkMs, setWalkMs] = useState(0);
  const [particles, setParticles] = useState([]);
  const [core] = useState(() => createBuddyCore({ setMood, setFx, setBubble, setX, setY, setFacing, setTravelDirection, setWalkMs, setParticles }));
  return { core, view: { mood, fx, bubble, x, y, facing, travelDirection, walkMs, particles } };
}

const ref = (current) => ({ current });

function createBuddyCore({ setMood, setFx, setBubble, setX, setY, setFacing, setTravelDirection, setWalkMs, setParticles }) {
  const core = {
    rootRef: ref(null),
    moodRef: ref("off"),
    moodGenRef: ref(0),
    xRef: ref(WALK_MARGIN),
    yRef: ref(0),
    facingRef: ref(1),
    travelDirectionRef: ref(1),
    visibleRef: ref(false),
    bootedRef: ref(false),
    dropInFlightRef: ref(false),
    lastActivityRef: ref(Date.now()),
    lastLineRef: ref(""),
    timersRef: ref(new Set()),
    bubbleTimerRef: ref(0),
    bubbleGapTimerRef: ref(0),
    bubbleQueueRef: ref([]),
    activeBubbleRef: ref(null),
    activeEventRef: ref(""),
    fxTimerRef: ref(0),
    particleIdRef: ref(0),
    petTimesRef: ref([]),
    attractModeRef: ref(false),
    // Lo que llega por props, para los timers y listeners.
    visitCountRef: ref(null),
    nowPlayingRef: ref(null),
    equippedGearRef: ref({ lure: "", rod: "" }),
    mikuCostumeRef: ref(false),
    rocketBootsRef: ref(false),
    inventoryRef: ref([]),
    onPowerOutageRef: ref(null),
    userRef: ref({ name: "guest", discord: false }),
    // Mientras habla un buddy de visita, la charla de relleno de este espera.
    visitorFloorRef: ref(0),
    // Visitas presentes ({id, name, look, x}).
    visitorsRef: ref(new Map()),
    // El tiempo de fuera (/api/weather), si lo hay.
    weatherRef: ref(null),
    // Fase del cielo del footer (night/dawn/day/dusk) y peces ya pescados ({id, name}).
    skyPhaseRef: ref("day"),
    caughtFishRef: ref([]),
    // Luna llena esta noche y nombre de la lluvia de estrellas, si la hay.
    fullMoonRef: ref(false),
    showerRef: ref(""),
    // Al terminar un evento, cada pieza recoge lo suyo (la pesca cierra el portal).
    eventEndHandlers: new Map(),
    disposed: false,
    reduceMotion: Boolean(reduceMotionQuery?.matches),
    setWalkMs,
    setParticles
  };
  const {
    rootRef, moodRef, moodGenRef, xRef, yRef, facingRef, travelDirectionRef, lastLineRef, timersRef,
    bubbleTimerRef, bubbleGapTimerRef, bubbleQueueRef, activeBubbleRef, activeEventRef, fxTimerRef,
    particleIdRef, visitCountRef, nowPlayingRef, mikuCostumeRef, userRef, visitorFloorRef, visitorsRef, weatherRef
  } = core;

  function updateMood(next) {
    const previous = moodRef.current;
    moodGenRef.current += 1;
    moodRef.current = next;
    setMood(next);
    // Las visitas se enteran de cuando se duerme y se despierta.
    if (next === "sleep" && previous !== "sleep") announceAction("sleep");
    else if (previous === "sleep" && next !== "sleep") announceAction("wake");
  }

  // Lo que hace Buddy, para que sus visitas lo comenten (BuddyVisitors).
  function announceAction(action, extra = {}) {
    if (!visitorsRef.current.size) return;
    window.dispatchEvent(new CustomEvent("daivr-buddy-action", { detail: { actor: "host", action, x: xRef.current, ...extra } }));
  }

  function beginBuddyEvent(name) {
    if (activeEventRef.current) return false;
    activeEventRef.current = name;
    document.documentElement.dataset.buddyEvent = name;
    window.dispatchEvent(new CustomEvent("daivr-buddy-event-state", {
      detail: { active: true, name }
    }));
    return true;
  }

  function endBuddyEvent(name) {
    if (activeEventRef.current !== name) return;
    activeEventRef.current = "";
    core.eventEndHandlers.get(name)?.();
    delete document.documentElement.dataset.buddyEvent;
    window.dispatchEvent(new CustomEvent("daivr-buddy-event-state", {
      detail: { active: false, name }
    }));
  }

  function updateFacing(next) {
    if (facingRef.current === next) return;
    facingRef.current = next;
    setFacing(next);
  }

  function facingForDirection(direction) {
    return direction >= 0 ? -1 : 1;
  }

  function updateTravelDirection(next) {
    if (travelDirectionRef.current === next) return;
    travelDirectionRef.current = next;
    setTravelDirection(next);
  }

  function faceTravelDirection(direction) {
    updateTravelDirection(direction);
    updateFacing(facingForDirection(direction));
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

  function inwardEventDirection(preferredDirection = 1, position = xRef.current, clearance = 132) {
    const width = stageWidth();
    const preferred = preferredDirection < 0 ? -1 : 1;
    if (position < clearance) return 1;
    if (position + SPRITE_WIDTH > width - clearance) return -1;
    return preferred;
  }

  function pickLine(pool) {
    const options = pool.filter((line) => line !== lastLineRef.current);
    const line = options[Math.floor(Math.random() * options.length)] || pool[0];
    lastLineRef.current = line;
    return line;
  }

  function showNextBubble() {
    const next = bubbleQueueRef.current.shift();
    if (!next) return;

    activeBubbleRef.current = next;
    setBubble(next.line);
    window.dispatchEvent(new CustomEvent("daivr-buddy-said", { detail: { line: next.line, topic: next.topic, ms: next.ms, to: next.to } }));
    bubbleTimerRef.current = window.setTimeout(() => {
      bubbleTimerRef.current = 0;
      activeBubbleRef.current = null;
      setBubble("");
      bubbleGapTimerRef.current = window.setTimeout(() => {
        bubbleGapTimerRef.current = 0;
        showNextBubble();
      }, DIALOGUE_GAP_MS);
    }, next.ms);
  }

  function say(line, ms = 2400, options = {}) {
    if (!line) return;
    const priority = options.priority === "ambient" ? "ambient" : "event";
    const topic = options.topic || lineTopic(line, activeEventRef.current);
    // `to`: id de la visita a la que se lo dice (una pregunta, una respuesta).
    const item = { line, ms: Math.max(MIN_DIALOGUE_MS, ms), priority, key: options.key || "", topic, to: options.to || "" };
    const active = activeBubbleRef.current;

    if (active?.line === line || bubbleQueueRef.current.some((entry) => entry.line === line)) return;
    if (item.key) bubbleQueueRef.current = bubbleQueueRef.current.filter((entry) => entry.key !== item.key);

    if (priority === "ambient") {
      if (activeEventRef.current) return;
      if (Date.now() < visitorFloorRef.current) return;
      if (active || bubbleGapTimerRef.current || bubbleQueueRef.current.length) return;
    } else {
      // Events are never discarded, but stale ambient chatter should not make
      // a catch, collision, weather change, or user interaction wait in line.
      bubbleQueueRef.current = bubbleQueueRef.current.filter((entry) => entry.priority !== "ambient");
      if (active?.priority === "ambient") {
        window.clearTimeout(bubbleTimerRef.current);
        window.clearTimeout(bubbleGapTimerRef.current);
        bubbleTimerRef.current = 0;
        bubbleGapTimerRef.current = 0;
        activeBubbleRef.current = null;
        setBubble("");
      }
    }

    bubbleQueueRef.current.push(item);
    if (!active && !bubbleGapTimerRef.current && !bubbleTimerRef.current) showNextBubble();
  }

  function clearDialogue(render = true) {
    window.clearTimeout(bubbleTimerRef.current);
    window.clearTimeout(bubbleGapTimerRef.current);
    bubbleTimerRef.current = 0;
    bubbleGapTimerRef.current = 0;
    activeBubbleRef.current = null;
    bubbleQueueRef.current = [];
    if (render) setBubble("");
  }

  function playFx(name, ms) {
    window.clearTimeout(fxTimerRef.current);
    setFx(name);
    fxTimerRef.current = window.setTimeout(() => setFx(""), ms);
  }

  function spawnParticles(kind, count) {
    // El splash brota en la punta de la linea (afuera, a la altura del riel),
    // no sobre la cabeza del buddy como corazones y confeti.
    const splash = kind === "splash";
    const palette = splash ? SPLASH_COLORS : CONFETTI_COLORS;
    const items = Array.from({ length: count }, () => ({
      id: (particleIdRef.current += 1),
      kind,
      dx: kind === "heart" ? randomBetween(-18, 18) : splash ? randomBetween(-13, 13) : randomBetween(-46, 46),
      dy: kind === "heart" ? randomBetween(-46, -30) : splash ? randomBetween(-32, -14) : randomBetween(-78, -34),
      ox: splash ? facingRef.current * -30 : 0,
      oy: splash ? -30 : 0,
      rot: randomBetween(-280, 280),
      delay: randomBetween(0, splash ? 140 : 240),
      color: palette[Math.floor(Math.random() * palette.length)]
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

  function buddyLine(key) {
    const regular = LINES[key] || [];
    const miku = mikuCostumeRef.current ? MIKU_LINES[key] || [] : [];
    return pickLine(miku.length ? [...miku, ...miku, ...regular] : regular);
  }

  function contextIdlePool() {
    const hour = new Date().getHours();
    const pool = [...LINES.idle, ...LINES.walkStop];
    if (mikuCostumeRef.current) pool.push(...MIKU_LINES.idle, ...MIKU_LINES.idle, ...MIKU_LINES.walkStop);
    if (hour >= 22 || hour < 5) pool.push(...LINES.night, ...LINES.night);
    else if (hour < 11) pool.push(...LINES.morning);
    if (visitCountRef.current) pool.push(`visitor #${visitCountRef.current.toLocaleString("en-US")} logged.`);

    const playing = nowPlayingRef.current;
    if (playing?.song) {
      const song = playing.song.length > 26 ? `${playing.song.slice(0, 24)}...` : playing.song;
      pool.push(`♪ ${song}? good taste.`, ...LINES.music);
    }

    const identity = userRef.current;
    if (identity.discord) {
      pool.push(
        `hey ${identity.name}. footer patrol is online.`,
        `${identity.name}, your Discord signal is crystal clear.`,
        `still exploring, ${identity.name}?`,
        `${identity.name}! i kept the footer warm.`,
        `status report for ${identity.name}: all cozy.`,
        `i recognize that signal, ${identity.name}.`
      );
    } else {
      pool.push(
        "hey guest. enjoying the cabinet?",
        "guest signal detected. welcome in.",
        "you can call me Buddy, guest.",
        "still there, guest? beep twice for yes.",
        "guest patrol companion reporting in.",
        "pick a cartridge, guest. i will guard the footer."
      );
    }

    // Lo de fuera y lo de ahora: el tiempo, el dia, el arcade.
    const context = contextLines({
      date: new Date(),
      weather: weatherRef.current,
      locale: typeof navigator === "undefined" ? "" : navigator.language,
      online: getCabinetSignal("online"),
      level: getCabinetSignal("player")?.level ?? null,
      nzp: getCabinetSignal("nzpUnlocked")
    });
    context.forEach(({ line, topic }) => pool.push(rememberTopic(line, topic)));
    pool.push(...LINES.tips, ...LINES.lore);

    return pool;
  }

  function greetingPool() {
    const identity = userRef.current;
    const pool = identity.discord
      ? [...LINES.boot, `hello, ${identity.name}!`, `${identity.name} signal linked.`, `welcome back, ${identity.name}.`]
      : [...LINES.boot, "hello, guest!", "guest session linked. stay awhile."];
    if (mikuCostumeRef.current) pool.push(...MIKU_LINES.boot, ...MIKU_LINES.boot);
    // Primera visita o vuelta tras unos dias: casi siempre gana el saludo personal.
    const returning = visitReturnLines().map((line) => rememberTopic(line, "returning"));
    if (returning.length && Math.random() < 0.75) return returning;
    return pool;
  }

  // Paseo a un punto al azar, o a `destination` (junto a una visita, cuyo id
  // va en `towardId` para que esa le espere).
  function startWalk(destination = null, towardId = "") {
    const maxX = Math.max(WALK_MARGIN, stageWidth() - SPRITE_WIDTH - WALK_MARGIN);
    // Al azar, pero sin plantarse encima de una visita.
    const guests = [...visitorsRef.current.values()].map((guest) => guest.x).filter(Number.isFinite);
    let target = destination == null ? null : clamp(destination, WALK_MARGIN, maxX);
    for (let tries = 0; target == null && tries < 6; tries += 1) {
      const spot = WALK_MARGIN + Math.random() * (maxX - WALK_MARGIN);
      if (tries === 5 || guests.every((x) => Math.abs(x - spot) >= 72)) target = spot;
    }
    const distance = Math.abs(target - xRef.current);
    if (distance < 56) return false;

    const ms = Math.min(8000, (distance / WALK_SPEED_PX_S) * 1000);
    faceTravelDirection(target > xRef.current ? 1 : -1);
    updateMood("walk");
    const generation = moodGenRef.current;
    setWalkMs(ms);
    moveTo(target);
    announceAction("walk", { targetX: target, ms, toward: towardId });

    schedule(() => {
      if (moodGenRef.current !== generation || moodRef.current !== "walk") return;
      if (Math.random() < 0.4) {
        updateMood("talk");
        say(pickLine([...LINES.walkStop, ...contextIdlePool()]), 2600, { priority: "ambient", key: "ambient" });
        settleDown(2700);
      } else {
        updateMood("idle");
      }
    }, ms + 80);
    return true;
  }

  // Libre para charlar: despierto, en el suelo y sin ningun evento en marcha.
  function canChat() {
    return core.bootedRef.current
      && !activeEventRef.current
      && !core.attractModeRef.current
      && !["off", "held", "chute", "outage", "hunt", "fishing", "sleep", "sleepy"].includes(moodRef.current);
  }

  function chat(lines, topic, ms = 2600, priority = "event") {
    if (!canChat()) return;
    updateMood("talk");
    say(rememberTopic(pickLine(lines), topic), ms, { priority, key: priority === "ambient" ? "ambient" : topic, topic });
    settleDown(ms + 100);
  }

  // Gatillos de admin (consola): solo si Buddy esta libre; contesta el estado.
  async function runAdmin(event, start) {
    const status = await runAdminBuddyDiagnostic(() => {
      if (core.disposed) return "unavailable";
      if (reduceMotionQuery?.matches) return "reduced-motion";
      if (activeEventRef.current || core.dropInFlightRef.current || core.attractModeRef.current
        || ["held", "chute", "hunt"].includes(moodRef.current)) return "busy";
      core.bootedRef.current = true;
      freezeAtCurrentPosition();
      liftTo(0);
      updateMood("idle");
      start();
      return "started";
    });
    if (typeof event.detail?.reply === "function") event.detail.reply(status);
  }

  return Object.assign(core, {
    updateMood,
    announceAction,
    beginBuddyEvent,
    endBuddyEvent,
    updateFacing,
    facingForDirection,
    updateTravelDirection,
    faceTravelDirection,
    moveTo,
    liftTo,
    schedule,
    stageWidth,
    inwardEventDirection,
    pickLine,
    say,
    clearDialogue,
    playFx,
    spawnParticles,
    currentDomPosition,
    freezeAtCurrentPosition,
    settleDown,
    buddyLine,
    contextIdlePool,
    greetingPool,
    startWalk,
    canChat,
    chat,
    runAdmin
  });
}
