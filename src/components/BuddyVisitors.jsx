import { useEffect, useMemo, useRef, useState } from "react";
import { BuddySprite } from "./BuddySprite";
import { useCabinetSignal } from "../lib/cabinetSignals";
import {
  ACTION_LINES,
  actionComment,
  actionTopic,
  buddyVisitLook,
  createVisitSchedule,
  EXPLORE_LINES,
  guestAnswerTo,
  guestTalkPool,
  pickTalk,
  pickVisitLine,
  planVisits,
  replyTopic,
  VISIT_RULES,
  VISITOR_LINES,
  visitorReplyTo,
  visitorTalkPool,
  visitSpriteProps,
  visitStayMs,
  VISITS_STORAGE_KEY
} from "../../shared/buddy-visits.mjs";

/*
  Buddies de visita: el buddy de otro jugador conectado se pasa por el footer.
  - Como mucho 2 a la vez (1 en pantallas estrechas), y cada uno se queda al
    menos un minuto (VISIT_RULES en shared/buddy-visits.mjs).
  - Se materializa en un borde, camina hasta el buddy de casa, saluda, y este
    le contesta (evento `daivr-buddy-visitor` que escucha ScreenBuddy).
  - Mientras esta, hace su vida: pasea por todo el footer, vuelve junto al de
    casa, le sigue cuando este se pone a andar, baila, salta, mira alrededor,
    y si el de casa se duerme, anda de puntillas o se echa una siesta.
  - Todos hablan con todos: contesta a lo que dice el de casa
    (`daivr-buddy-said`), le cuenta cosas y le hace caso cuando pregunta,
    charla con el otro visitante, y cada uno comenta lo que hacen los demas
    (`daivr-buddy-action`, que lanzan tanto ScreenBuddy como este componente).
  - Al irse se despide, el de casa le dice adios, y se desmaterializa.
  El aspecto y el nombre son de verdad (llegan por el stream del libro de
  visitas); lo que dicen y hacen se genera aqui, en cada pantalla.
*/

const SPRITE_WIDTH = 64;
const EDGE = 8;
// Entra con algo de prisa; de paseo va al ritmo del buddy de casa.
const WALK_PX_S = 96;
const STROLL_PX_S = 46;
const TIPTOE_PX_S = 30;
const MAX_WALK_MS = 5000;
const MAX_STROLL_MS = 11_000;
const STROLL_PX = [110, 480];
const MATERIALIZE_MS = 650;
const HOST_GAP = 96;
const NEIGHBOR_GAP = 80;
// Mas cerca que esto del de casa, le mira; mas lejos, va a lo suyo.
const NEAR_HOST_PX = 260;
const TICK_MS = 1000;
const FLOOR_GAP_MS = 450;
const LINE_MS = 2500;
const REPLY_COOLDOWN_MS = 6000;
const OWN_LINE_MS = [22_000, 40_000];
// Cada cuanto se le ocurre hacer algo: pasear, volver, bailar, mirar...
const ACT_MS = [8_000, 16_000];
const NAP_MS = [25_000, 45_000];
const FOLLOW_CHANCE = 0.45;
const EXPLORE_LINE_CHANCE = 0.35;
const GUEST_TALK_CHANCE = 0.4;
// Saludo y despedida esperan turno como mucho esto; una respuesta al de casa,
// lo que dura una frase suya; el relleno, nada.
const PATIENCE_MS = 8000;
const HOST_REPLY_PATIENCE_MS = 3200;
const BROWSER_KEY = "daivr.buddyVisitBrowser.v1";
const LOOK_RETRY_MS = 1600;

// Visitantes de prueba (comando `visit` de la consola).
const TEST_VISITORS = [
  { name: "Nena", look: { level: 5, worn: ["party-hat", "sunglasses", "scarf", "gold-antenna"] } },
  { name: "", look: { level: 2, worn: ["star-cap", "headset"] } },
  { name: "Vasquez", look: { level: 4, worn: ["miku-wig", "rocket-boots", "scarf", "sunglasses"] } }
];

const between = ([min, max]) => min + Math.random() * (max - min);
const pickOne = (list) => list[Math.floor(Math.random() * list.length)];
const facingFor = (direction) => (direction >= 0 ? -1 : 1);
const media = (query) => typeof window !== "undefined" && Boolean(window.matchMedia?.(query).matches);
const reduceMotion = () => media("(prefers-reduced-motion: reduce)");
const maxVisitors = () => (media("(max-width: 759px)") ? VISIT_RULES.compactMaxVisitors : VISIT_RULES.maxVisitors);

function readEnabled() {
  try {
    return window.localStorage.getItem(VISITS_STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

// Id aleatorio por navegador: solo lo ve el servidor, para no mandarte de
// visita tus propias pestañas.
function browserId() {
  try {
    let id = window.localStorage.getItem(BROWSER_KEY);
    if (!id) {
      id = (window.crypto?.randomUUID?.() || `${Date.now()}${Math.random()}`).replace(/[^\w]/g, "").slice(0, 32);
      window.localStorage.setItem(BROWSER_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

export function BuddyVisitors({ friendshipLevel = 1, inventory = [], hiddenGear = [], unlockedGear = [], hostName = "" }) {
  const anchorRef = useRef(null);
  const mapRef = useRef(new Map());
  const pokeRef = useRef(null);
  const [visitors, setVisitors] = useState([]);
  const [enabled, setEnabled] = useState(readEnabled);
  const enabledRef = useRef(enabled);
  const hello = useCabinetSignal("visitHello");
  const roster = useCabinetSignal("visitRoster");
  const rosterRef = useRef(roster);
  const hostNameRef = useRef(hostName);
  const look = useMemo(
    () => buddyVisitLook({ friendshipLevel, inventory, hiddenGear, unlockedGear }),
    [friendshipLevel, inventory, hiddenGear, unlockedGear]
  );
  const lookKey = JSON.stringify(look);
  const hostLookRef = useRef(look);

  useEffect(() => {
    rosterRef.current = roster;
  }, [roster]);

  useEffect(() => {
    hostNameRef.current = hostName;
  }, [hostName]);

  useEffect(() => {
    hostLookRef.current = look;
  }, [look]);

  // Publica el aspecto de este buddy (o lo retira si las visitas estan
  // apagadas) cada vez que cambia o que el stream da un token nuevo.
  useEffect(() => {
    if (!hello?.token) return undefined;
    let cancelled = false;
    let timer = 0;
    function post(retry) {
      fetch("/api/comments/stream/look", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: hello.token, look: enabled ? JSON.parse(lookKey) : null, browser: browserId() })
      })
        .then((response) => {
          if (response.status === 429 && retry && !cancelled) timer = window.setTimeout(() => post(false), LOOK_RETRY_MS);
        })
        .catch(() => {});
    }
    timer = window.setTimeout(() => post(true), 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [hello?.token, lookKey, enabled]);

  useEffect(() => {
    const map = mapRef.current;
    const timers = new Set();
    const schedule = createVisitSchedule(Date.now());
    let floorUntil = 0;
    let footerVisible = false;
    let attract = false;
    let testCount = 0;

    function later(ms, fn) {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        fn();
      }, ms);
      timers.add(timer);
    }

    const render = () => setVisitors([...map.values()].map((visitor) => ({ ...visitor })));
    const alive = (visitor) => map.get(visitor.id) === visitor;
    const zone = () => anchorRef.current?.parentElement || null;
    const stageWidth = () => zone()?.clientWidth || 640;
    const maxX = () => Math.max(EDGE, stageWidth() - SPRITE_WIDTH - EDGE);
    const clampX = (x) => Math.min(maxX(), Math.max(EDGE, x));
    const hostNode = () => zone()?.querySelector(".screen-buddy-root:not(.is-visitor)") || null;
    const hostReady = () => Boolean(hostNode()) && !hostNode().classList.contains("is-off");
    const hostAsleep = () => Boolean(hostNode()?.classList.contains("is-sleep"));
    const hostBusy = () => Boolean(document.documentElement.dataset.buddyEvent);
    const visiting = () => [...map.values()].filter((visitor) => visitor.phase === "visiting");
    // Libre para reaccionar: ni hablando, ni dormido, ni a mitad de respuesta.
    const free = (visitor, now = Date.now()) => !visitor.bubble && !visitor.napping && now >= visitor.replyAt;

    function leftOf(node) {
      const parent = zone();
      if (!node || !parent) return null;
      return node.getBoundingClientRect().left - parent.getBoundingClientRect().left;
    }

    function hostX() {
      return leftOf(hostNode()) ?? stageWidth() * 0.3;
    }

    // Donde esta de verdad (a mitad de paseo, `x` ya es el destino).
    function liveX(visitor) {
      const node = [...(zone()?.querySelectorAll(".screen-buddy-root.is-visitor") || [])].find((element) => element.dataset.visitorId === visitor.id);
      return leftOf(node) ?? visitor.x;
    }

    function lineValues(visitor) {
      const other = [...map.values()].find((entry) => entry !== visitor);
      return { from: visitor.name, host: hostNameRef.current, other: other?.name || "" };
    }

    function faceTowards(visitor, x) {
      const facing = facingFor(x > liveX(visitor) ? 1 : -1);
      if (facing === visitor.facing) return;
      visitor.facing = facing;
      render();
    }

    const faceHost = (visitor) => faceTowards(visitor, hostX());

    // Sitio libre junto a `anchor` (el buddy de casa, o adonde va): primero
    // pegado a el (del lado preferido y, si esta ocupado, del otro), y solo
    // despues mas lejos. Asi un segundo visitante se pone al otro lado en vez
    // de hacer cola detras.
    function freeSpotNear(anchor, preferredSide, selfId) {
      const taken = [...map.values()].filter((visitor) => visitor.id !== selfId).map((visitor) => visitor.targetX);
      for (let step = 0; step < 3; step += 1) {
        for (const side of [preferredSide, -preferredSide]) {
          const x = anchor + side * (HOST_GAP + step * NEIGHBOR_GAP);
          if (x < EDGE || x > maxX()) continue;
          if (taken.every((other) => Math.abs(other - x) >= NEIGHBOR_GAP - 8)) return { x, side };
        }
      }
      return { x: clampX(anchor + preferredSide * HOST_GAP), side: preferredSide };
    }

    function walkTo(visitor, target, done, { speed = WALK_PX_S, maxMs = MAX_WALK_MS, mood = "walk" } = {}) {
      const from = liveX(visitor);
      const distance = Math.abs(target - from);
      const ms = reduceMotion() ? 0 : Math.min(maxMs, (distance / speed) * 1000);
      // Un paseo nuevo anula el final del anterior.
      const walk = (visitor.walkGen += 1);
      if (distance > 1) visitor.facing = facingFor(target > from ? 1 : -1);
      if (ms) visitor.mood = mood;
      visitor.walkMs = ms;
      visitor.x = target;
      visitor.targetX = target;
      render();
      later(ms + 60, () => {
        if (!alive(visitor) || visitor.walkGen !== walk) return;
        visitor.walkMs = 0;
        if (visitor.mood === mood) visitor.mood = "idle";
        render();
        done?.();
      });
    }

    // Lo que hace un visitante: el de casa lo oye por el evento; el otro
    // visitante, aqui mismo.
    function announceAction(visitor, action, extra = {}) {
      window.dispatchEvent(new CustomEvent("daivr-buddy-action", {
        detail: { actor: "visitor", id: visitor.id, name: visitor.name, action, x: liveX(visitor), ...extra }
      }));
      noticeGuestAction(visitor, action);
    }

    function speak(visitor, line, { ms = LINE_MS, mood = "talk", topic = "", to = "", then } = {}) {
      if (!line || !alive(visitor)) return;
      const now = Date.now();
      visitor.bubble = line;
      visitor.lastLine = line;
      if (!["walk", "sleepy"].includes(visitor.mood)) visitor.mood = mood;
      floorUntil = now + ms + FLOOR_GAP_MS;
      window.dispatchEvent(new CustomEvent("daivr-buddy-visitor", {
        detail: { phase: "talking", until: now + ms + 300, id: visitor.id, name: visitor.name, x: liveX(visitor), topic, to }
      }));
      render();
      if (topic && to && to !== "host") {
        // A quien le hablan no saca otro tema antes de contestar.
        const listener = map.get(to);
        if (listener) listener.ownLineAt = Math.max(listener.ownLineAt, now + ms + 4000);
        later(ms + FLOOR_GAP_MS, () => guestHeard(visitor, topic, to));
      }
      later(ms, () => {
        if (!alive(visitor)) return;
        visitor.bubble = "";
        if (["talk", "party", "dance"].includes(visitor.mood)) visitor.mood = "idle";
        render();
        then?.();
      });
    }

    // Habla cuando nadie mas lo esta haciendo. Con `patience` espera turno y
    // al final habla igual (saludos, despedidas); sin ella, o con `dropWhenLate`
    // (respuestas, que pasado el momento ya no pegan), si sigue ocupado se calla.
    function speakWhenFree(visitor, makeLine, options = {}, waited = 0) {
      if (!alive(visitor) || visitor.napping) return;
      const wait = floorUntil - Date.now();
      const patience = options.patience || 0;
      if (wait > 0 && waited < patience) {
        const step = Math.min(wait + 60, 1500);
        later(step, () => speakWhenFree(visitor, makeLine, options, waited + step));
        return;
      }
      if (wait > 0 && (!patience || options.dropWhenLate)) return;
      speak(visitor, typeof makeLine === "function" ? makeLine() : makeLine, options);
    }

    // Contestar: espera a que el otro termine, y si para entonces ya habla
    // alguien mas, se lo calla.
    function answer(visitor, line, { delay, face, ...options }) {
      visitor.replyAt = Date.now() + REPLY_COOLDOWN_MS;
      later(delay, () => {
        if (!alive(visitor) || visitor.phase !== "visiting") return;
        if (face != null && !visitor.walkMs) faceTowards(visitor, face());
        speakWhenFree(visitor, line, { patience: 1500, dropWhenLate: true, ...options });
      });
    }

    function announce(phase, visitor) {
      window.dispatchEvent(new CustomEvent("daivr-buddy-visitor", {
        detail: { phase, id: visitor.id, name: visitor.name, look: visitor.look, x: liveX(visitor) }
      }));
    }

    function greet(visitor) {
      const values = lineValues(visitor);
      const pool = values.host ? [...VISITOR_LINES.greet, ...VISITOR_LINES.greetHost] : VISITOR_LINES.greet;
      const earlier = visiting().find((entry) => entry !== visitor);
      speakWhenFree(visitor, () => pickVisitLine(pool, values), {
        patience: PATIENCE_MS,
        then: () => {
          announce("arrive", visitor);
          // El que ya estaba saluda al recien llegado despues del de casa.
          if (earlier && !earlier.napping) {
            later(LINE_MS + FLOOR_GAP_MS * 2, () => speakWhenFree(earlier, () => (
              pickVisitLine(VISITOR_LINES.greetOther, { other: visitor.name }) || pickVisitLine(VISITOR_LINES.greetOtherGuest)
            ), { patience: 4000 }));
          }
        }
      });
    }

    function arrive(entry, options = {}) {
      if (map.has(entry.id)) return;
      const host = hostX();
      const spot = freeSpotNear(host, host < stageWidth() / 2 ? 1 : -1, entry.id);
      const edgeX = spot.side < 0 ? EDGE : maxX();
      const visitor = {
        id: entry.id,
        name: entry.name || "",
        look: entry.look,
        x: edgeX,
        targetX: spot.x,
        walkMs: 0,
        walkGen: 0,
        facing: facingFor(spot.x >= edgeX ? 1 : -1),
        mood: "idle",
        fx: "",
        bubble: "",
        phase: "arriving",
        fade: "in",
        stayMs: options.stayMs,
        stayUntil: null,
        replyAt: 0,
        ownLineAt: 0,
        actAt: 0,
        napping: false,
        napUntil: 0,
        lastLine: ""
      };
      map.set(visitor.id, visitor);
      render();
      later(MATERIALIZE_MS, () => {
        if (!alive(visitor)) return;
        visitor.fade = "";
        walkTo(visitor, spot.x, () => {
          const now = Date.now();
          visitor.phase = "visiting";
          // El minuto minimo cuenta desde que llega a su sitio.
          visitor.stayUntil = now + (visitor.stayMs ?? visitStayMs());
          visitor.ownLineAt = now + between(OWN_LINE_MS);
          visitor.actAt = now + between(ACT_MS);
          faceHost(visitor);
          greet(visitor);
        });
      });
    }

    function vanish(visitor) {
      visitor.fade = "out";
      render();
      later(MATERIALIZE_MS, () => {
        if (!alive(visitor)) return;
        map.delete(visitor.id);
        schedule.leftAt[visitor.id] = Date.now();
        announce("gone", visitor);
        render();
      });
    }

    function leave(visitor, { quick = false } = {}) {
      if (visitor.phase === "leaving") return;
      if (visitor.napping) wakeUp(visitor, { quiet: true });
      visitor.phase = "leaving";
      const exit = () => {
        if (!alive(visitor)) return;
        // Sale por su lado, sin cruzar por encima del buddy de casa.
        walkTo(visitor, liveX(visitor) >= hostX() ? maxX() : EDGE, () => vanish(visitor));
      };
      if (quick) {
        exit();
        return;
      }
      speakWhenFree(visitor, () => pickVisitLine(VISITOR_LINES.bye, lineValues(visitor)), {
        patience: PATIENCE_MS,
        then: () => {
          announce("leave", visitor);
          later(1300, exit);
        }
      });
    }

    // --- Lo que hace por su cuenta -------------------------------------------

    // Paseo a cualquier punto del footer que no este pegado a nadie.
    function stroll(visitor, { tiptoe = false } = {}) {
      const from = liveX(visitor);
      const host = hostX();
      const others = [...map.values()].filter((other) => other !== visitor).map((other) => other.targetX);
      let target = null;
      for (let tries = 0; tries < 10 && target == null; tries += 1) {
        const x = EDGE + Math.random() * (maxX() - EDGE);
        const distance = Math.abs(x - from);
        if (distance < STROLL_PX[0] || distance > STROLL_PX[1]) continue;
        if (Math.abs(x - host) < 72 || others.some((other) => Math.abs(other - x) < NEIGHBOR_GAP - 8)) continue;
        target = x;
      }
      if (target == null) return false;
      if (!tiptoe) announceAction(visitor, "roam", { targetX: target });
      walkTo(visitor, target, () => {
        if (tiptoe || hostAsleep() || Math.random() >= EXPLORE_LINE_CHANCE) return;
        speakWhenFree(visitor, () => pickVisitLine(EXPLORE_LINES, lineValues(visitor), Math.random, visitor.lastLine), { topic: "explore", to: "host" });
      }, { speed: tiptoe ? TIPTOE_PX_S : STROLL_PX_S, maxMs: MAX_STROLL_MS, mood: tiptoe ? "sleepy" : "walk" });
      return true;
    }

    function comeBack(visitor) {
      const host = hostX();
      const spot = freeSpotNear(host, liveX(visitor) < host ? -1 : 1, visitor.id);
      announceAction(visitor, "back", { targetX: spot.x });
      walkTo(visitor, spot.x, () => faceHost(visitor), { speed: STROLL_PX_S, maxMs: MAX_STROLL_MS });
    }

    function moodFor(visitor, mood, ms) {
      visitor.mood = mood;
      render();
      later(ms, () => {
        if (!alive(visitor) || visitor.mood !== mood) return;
        visitor.mood = "idle";
        render();
      });
    }

    function playFx(visitor, fx, ms) {
      visitor.fx = fx;
      render();
      later(ms, () => {
        if (!alive(visitor) || visitor.fx !== fx) return;
        visitor.fx = "";
        render();
      });
    }

    function lookAround(visitor) {
      playFx(visitor, "scan", 1600);
      later(800, () => {
        if (!alive(visitor) || visitor.walkMs) return;
        visitor.facing = -visitor.facing;
        render();
      });
      announceAction(visitor, "look");
    }

    function nap(visitor) {
      visitor.napping = true;
      visitor.napUntil = Date.now() + between(NAP_MS);
      visitor.mood = "sleep";
      render();
      announceAction(visitor, "nap");
    }

    function wakeUp(visitor, { quiet = false } = {}) {
      if (!visitor.napping) return;
      visitor.napping = false;
      visitor.mood = "idle";
      visitor.actAt = Date.now() + between(ACT_MS);
      render();
      if (quiet) return;
      announceAction(visitor, "wake");
      if (Math.random() < 0.5) {
        speakWhenFree(visitor, () => pickVisitLine(VISITOR_LINES.napWake, lineValues(visitor), Math.random, visitor.lastLine), { topic: "napWake", to: "host" });
      }
    }

    function act(visitor, now) {
      visitor.actAt = now + between(ACT_MS);
      if (reduceMotion()) return;
      // Con el de casa dormido: de puntillas, o una siesta tambien.
      if (hostAsleep()) {
        if (Math.random() < 0.5) nap(visitor);
        else stroll(visitor, { tiptoe: true });
        return;
      }
      const away = Math.abs(liveX(visitor) - hostX()) > NEAR_HOST_PX - 30;
      const roll = Math.random();
      if (roll < 0.45 || (roll < 0.62 && !away)) {
        if (!stroll(visitor) && away) comeBack(visitor);
      } else if (roll < 0.62) comeBack(visitor);
      else if (roll < 0.74) {
        moodFor(visitor, "dance", 2600);
        announceAction(visitor, "dance");
      } else if (roll < 0.83) {
        playFx(visitor, "flip", 800);
        announceAction(visitor, "flip");
      } else if (roll < 0.93) lookAround(visitor);
      else {
        moodFor(visitor, "pet", 650);
        announceAction(visitor, "hop");
      }
    }

    // --- Lo que oyen y ven -----------------------------------------------------

    // El buddy de casa dijo algo: turno ocupado mientras dure, y quiza uno de
    // los visitantes contesta al terminar. Si se lo decia a uno en concreto
    // (una pregunta, un cumplido, una respuesta), contesta ese.
    function onHostSaid(event) {
      const { topic, ms, to } = event.detail || {};
      const duration = Number(ms) || LINE_MS;
      const now = Date.now();
      floorUntil = Math.max(floorUntil, now + duration + FLOOR_GAP_MS);
      if (!topic || topic === "visitor" || topic === "end") return;
      if (map.has(to)) map.get(to).ownLineAt = Math.max(map.get(to).ownLineAt, now + duration + 4000);
      const listeners = to
        ? visiting().filter((visitor) => visitor.id === to && !visitor.napping)
        : visiting().filter((visitor) => free(visitor, now));
      if (!listeners.length) return;
      const visitor = pickOne(listeners);
      const reply = visitorReplyTo(topic, lineValues(visitor), Math.random, visitor.lastLine);
      if (!reply) return;
      const mood = topic === "dance" ? "dance" : ["party", "fishRare", "bugWin", "outageFix"].includes(topic) ? "party" : "talk";
      // En plena pesca el de casa encadena frases: espera a la siguiente pausa
      // en vez de rendirse a la primera.
      answer(visitor, reply, { delay: duration + FLOOR_GAP_MS, face: to ? hostX : null, mood, topic: replyTopic(topic), to: "host", patience: HOST_REPLY_PATIENCE_MS });
    }

    // Un visitante le hablo a otro: este a veces contesta.
    function guestHeard(speaker, topic, to) {
      if (topic === "end") return;
      const listener = map.get(to);
      if (!listener || listener.phase !== "visiting" || listener.napping || listener.bubble) return;
      const reply = guestAnswerTo(topic, lineValues(listener), Math.random, listener.lastLine);
      if (!reply) return;
      answer(listener, reply, { delay: 0, face: () => liveX(speaker), topic: replyTopic(topic), to: speaker.id });
    }

    // El buddy de casa hizo algo (se puso a andar, a bailar, se durmio...).
    function onBuddyAction(event) {
      const detail = event.detail || {};
      if (detail.actor !== "host") return;
      const now = Date.now();
      const { action } = detail;
      if (action === "wake") {
        visiting().filter((visitor) => visitor.napping).forEach((visitor, index) => later(600 + index * 900, () => wakeUp(visitor)));
        return;
      }
      if (action === "walk") {
        // Viene hacia uno: ese se queda esperandole.
        const awaited = detail.toward && map.get(detail.toward);
        if (awaited) {
          awaited.actAt = Math.max(awaited.actAt, now + (Number(detail.ms) || 0) + 4000);
          return;
        }
        if (follow(detail)) return;
      }
      const watchers = visiting().filter((visitor) => free(visitor, now));
      if (!watchers.length) return;
      const visitor = pickOne(watchers);
      // A un baile, a veces se une.
      if (action === "dance" && !visitor.walkMs && !reduceMotion() && Math.random() < 0.35) later(500, () => moodFor(visitor, "dance", 2400));
      const line = actionComment("onHost", action, lineValues(visitor), Math.random, visitor.lastLine);
      if (!line) return;
      answer(visitor, line, { delay: 600 + Math.random() * 500, face: action === "walk" ? null : hostX, mood: action === "dance" ? "dance" : "talk", topic: actionTopic(action), to: "host" });
    }

    // El de casa se pone a andar: a veces un visitante se va detras, a su lado.
    function follow({ targetX, ms }) {
      if (reduceMotion() || !Number.isFinite(targetX) || Math.random() >= FOLLOW_CHANCE) return false;
      // Tambien uno que iba de paseo: cambia de idea y se va con el.
      const candidates = visiting().filter((visitor) => free(visitor));
      if (!candidates.length) return false;
      const visitor = pickOne(candidates);
      const spot = freeSpotNear(targetX, liveX(visitor) <= targetX ? -1 : 1, visitor.id);
      visitor.actAt = Date.now() + (Number(ms) || 0) + between(ACT_MS);
      visitor.replyAt = Date.now() + REPLY_COOLDOWN_MS;
      later(400 + Math.random() * 500, () => {
        if (!alive(visitor) || visitor.phase !== "visiting" || visitor.napping) return;
        announceAction(visitor, "follow", { targetX: spot.x });
        walkTo(visitor, spot.x, () => faceHost(visitor), { speed: STROLL_PX_S, maxMs: MAX_STROLL_MS });
        if (Math.random() < 0.6) speakWhenFree(visitor, () => pickVisitLine(ACTION_LINES.onHost.follow, lineValues(visitor), Math.random, visitor.lastLine), { topic: "end", to: "host" });
      });
      return true;
    }

    // Un visitante hizo algo: el otro a veces lo comenta (el de casa tambien
    // puede, por su lado; no siempre los dos).
    function noticeGuestAction(actor, action) {
      const now = Date.now();
      const watcher = visiting().find((visitor) => visitor !== actor && free(visitor, now));
      if (!watcher || (hostAsleep() && action !== "nap")) return;
      if (action === "dance" && !watcher.walkMs && !reduceMotion() && Math.random() < 0.3) later(500, () => moodFor(watcher, "dance", 2400));
      if (Math.random() >= 0.6) return;
      const line = actionComment("onGuest", action, lineValues(watcher), Math.random, watcher.lastLine);
      if (!line) return;
      answer(watcher, line, { delay: 700 + Math.random() * 600, face: () => liveX(actor), topic: actionTopic(action), to: actor.id });
    }

    function tick() {
      const now = Date.now();
      const roster = enabledRef.current ? rosterRef.current || [] : [];
      const canArrive = enabledRef.current
        && footerVisible
        && !attract
        && document.visibilityState === "visible"
        && hostReady()
        && !hostBusy();
      const { leaving, arrival } = planVisits(schedule, {
        present: [...map.values()].map((visitor) => ({ id: visitor.id, stayUntil: visitor.stayUntil })),
        roster,
        now,
        canArrive,
        maxVisitors: maxVisitors()
      });
      leaving.forEach((id) => map.get(id) && leave(map.get(id)));
      if (arrival) arrive(arrival);

      const host = hostX();
      const asleep = hostAsleep();
      for (const visitor of map.values()) {
        // Si su jugador se cambia de gorro durante la visita, se le ve.
        const entry = roster.find((item) => item.id === visitor.id);
        if (entry && JSON.stringify(entry.look) !== JSON.stringify(visitor.look)) {
          visitor.look = entry.look;
          render();
        }
        if (visitor.phase !== "visiting") continue;
        if (visitor.napping) {
          // Se despierta cuando el de casa, o cuando se cansa de dormir.
          if (!asleep || now >= visitor.napUntil) wakeUp(visitor, { quiet: asleep });
          continue;
        }
        if (visitor.walkMs || visitor.bubble) continue;
        const x = liveX(visitor);

        // El buddy de casa se le ha echado encima: se aparta.
        if (Math.abs(host - x) < 48 && !reduceMotion()) {
          const away = x >= host ? 1 : -1;
          let target = clampX(x + away * 84);
          if (Math.abs(target - host) < 48) target = clampX(host - away * 84);
          walkTo(visitor, target, () => faceHost(visitor));
          continue;
        }
        if (visitor.mood === "idle" && Math.abs(host - x) < NEAR_HOST_PX && facingFor(host > x ? 1 : -1) !== visitor.facing) faceHost(visitor);

        // Mientras el de casa pesca, caza un bicho, se moja... se queda
        // mirando: ni saca temas ni se va de paseo (contestar, si).
        if (hostBusy()) continue;
        if (!asleep && now >= visitor.ownLineAt) {
          visitor.ownLineAt = now + between(OWN_LINE_MS);
          const other = visiting().find((candidate) => candidate !== visitor && !candidate.napping);
          const toGuest = Boolean(other) && Math.random() < GUEST_TALK_CHANCE;
          const pool = toGuest ? guestTalkPool(other.look) : visitorTalkPool(hostLookRef.current, (rosterRef.current || []).length + 1);
          const talk = pickTalk(pool, lineValues(visitor), Math.random, visitor.lastLine);
          if (!talk) continue;
          faceTowards(visitor, toGuest ? liveX(other) : host);
          speakWhenFree(visitor, talk.line, { topic: talk.topic, to: toGuest ? other.id : "host" });
        } else if (now >= visitor.actAt) {
          act(visitor, now);
        }
      }
    }

    function onVisitsToggle(event) {
      const next = Boolean(event.detail?.enabled);
      enabledRef.current = next;
      setEnabled(next);
      try {
        window.localStorage.setItem(VISITS_STORAGE_KEY, next ? "on" : "off");
      } catch {
        // Sin almacenamiento la eleccion dura lo que la pestaña.
      }
      if (!next) map.forEach((visitor) => leave(visitor, { quick: visitor.phase !== "visiting" }));
    }

    // `visit` en la consola: un visitante de prueba, sin esperar a nadie.
    function onTestVisit(event) {
      const detail = event.detail || {};
      if ([...map.values()].filter((visitor) => visitor.phase !== "leaving").length >= maxVisitors()) return;
      const sample = TEST_VISITORS[testCount % TEST_VISITORS.length];
      testCount += 1;
      arrive({ id: `test-${Date.now()}-${testCount}`, name: detail.name ?? sample.name, look: detail.look || sample.look }, { stayMs: detail.stayMs });
    }

    function onAttract(event) {
      attract = Boolean(event.detail?.active);
    }

    function onResize() {
      for (const visitor of map.values()) {
        if (visitor.x > maxX()) {
          visitor.walkMs = 0;
          visitor.x = maxX();
          visitor.targetX = visitor.x;
        }
      }
      render();
    }

    pokeRef.current = (id) => {
      const visitor = map.get(id);
      if (!visitor || visitor.phase !== "visiting" || visitor.bubble) return;
      if (visitor.napping) {
        wakeUp(visitor);
        return;
      }
      speak(visitor, pickVisitLine(VISITOR_LINES.poke, lineValues(visitor), Math.random, visitor.lastLine), {
        mood: "party",
        then: () => {
          if (Math.random() < 0.6) announce("poke", visitor);
        }
      });
    };

    const stage = zone();
    const observer = typeof IntersectionObserver === "function" && stage
      ? new IntersectionObserver((entries) => {
        footerVisible = entries.some((entry) => entry.isIntersecting);
      }, { threshold: 0.1 })
      : null;
    if (observer) observer.observe(stage);
    else footerVisible = true;

    const ticker = window.setInterval(tick, TICK_MS);
    window.addEventListener("daivr-buddy-said", onHostSaid);
    window.addEventListener("daivr-buddy-action", onBuddyAction);
    window.addEventListener("daivr-buddy-visits", onVisitsToggle);
    window.addEventListener("daivr-buddy-visit-test", onTestVisit);
    window.addEventListener("daivr-attract-mode", onAttract);
    window.addEventListener("resize", onResize);

    return () => {
      observer?.disconnect();
      window.clearInterval(ticker);
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
      window.removeEventListener("daivr-buddy-said", onHostSaid);
      window.removeEventListener("daivr-buddy-action", onBuddyAction);
      window.removeEventListener("daivr-buddy-visits", onVisitsToggle);
      window.removeEventListener("daivr-buddy-visit-test", onTestVisit);
      window.removeEventListener("daivr-attract-mode", onAttract);
      window.removeEventListener("resize", onResize);
      pokeRef.current = null;
      map.clear();
    };
  }, []);

  const stageWidth = anchorRef.current?.parentElement?.clientWidth || 640;
  return (
    <>
      <span ref={anchorRef} className="buddy-visitors-anchor" hidden />
      {visitors.map((visitor) => (
        <VisitingBuddy key={visitor.id} visitor={visitor} stageWidth={stageWidth} onPoke={(id) => pokeRef.current?.(id)} />
      ))}
    </>
  );
}

function VisitingBuddy({ visitor, stageWidth, onPoke }) {
  const label = visitor.name || "guest";
  const sprite = visitSpriteProps(visitor.look);
  const worn = sprite.unlockedGear;
  const anchor = visitor.x > stageWidth - 180 ? "anchor-right" : visitor.x < 116 ? "anchor-left" : "anchor-center";
  const expression = visitor.mood === "sleep" ? "sleep" : ["party", "dance", "pet"].includes(visitor.mood) ? "happy" : "idle";
  return (
    <div
      className={`screen-buddy-root is-visitor is-${visitor.mood} ${visitor.fx ? `fx-${visitor.fx}` : ""} ${visitor.fade ? `is-fade-${visitor.fade}` : ""} ${visitor.bubble ? "is-speaking" : ""} ${worn.includes("rocket-boots") ? "has-rocket-boots" : ""} ${worn.includes("miku-costume") ? "has-miku-costume" : ""}`}
      data-visitor-id={visitor.id}
      style={{
        "--buddy-x": `${visitor.x}px`,
        "--buddy-y": "0px",
        "--buddy-walk-ms": `${visitor.walkMs}ms`,
        "--buddy-facing": visitor.facing,
        "--buddy-travel-direction": visitor.facing > 0 ? -1 : 1
      }}
    >
      <div className={`screen-buddy-bubble ${anchor} ${visitor.bubble ? "is-visible" : ""}`} aria-hidden="true">
        {visitor.bubble ? <small>{label}</small> : null}
        {visitor.bubble}
      </div>
      <span className="buddy-visitor-tag" aria-hidden="true">{label}</span>
      <button
        className="screen-buddy buddy-visitor"
        type="button"
        aria-label={visitor.napping ? `${label}'s Buddy is napping. Wake it up` : `${label}'s Buddy is visiting. Say hi`}
        onClick={() => onPoke(visitor.id)}
      >
        <span className="buddy-visitor-holo">
          <span className="screen-buddy-body">
            <BuddySprite
              className="screen-buddy-sprite"
              expression={expression}
              facing={visitor.facing}
              {...sprite}
            />
          </span>
        </span>
        <span className="screen-buddy-shadow" aria-hidden="true" />
      </button>
    </div>
  );
}
