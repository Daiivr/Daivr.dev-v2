import { useEffect, useMemo, useRef, useState } from "react";
import { BuddySprite } from "./BuddySprite";
import { useCabinetSignal } from "../lib/cabinetSignals";
import {
  buddyVisitLook,
  createVisitSchedule,
  pickVisitLine,
  planVisits,
  VISIT_RULES,
  VISITOR_LINES,
  visitorIdlePool,
  visitorReplyTo,
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
  - Escucha lo que dice el buddy de casa (`daivr-buddy-said`, con su tema) y a
    veces contesta a juego: pesca, lluvia, musica, caricias...
  - Al irse se despide, el de casa le dice adios, y se desmaterializa.
  El aspecto y el nombre son de verdad (llegan por el stream del libro de
  visitas); lo que dicen se genera aqui, en cada pantalla.
*/

const SPRITE_WIDTH = 64;
const EDGE = 8;
const WALK_PX_S = 96;
const MAX_WALK_MS = 5000;
const MATERIALIZE_MS = 650;
const HOST_GAP = 96;
const NEIGHBOR_GAP = 80;
const TICK_MS = 1000;
const FLOOR_GAP_MS = 450;
const LINE_MS = 2500;
const REPLY_COOLDOWN_MS = 6000;
const OWN_LINE_MS = [26_000, 46_000];
const WANDER_MS = [14_000, 26_000];
// Saludo y despedida esperan turno como mucho esto; el relleno, nada.
const PATIENCE_MS = 8000;
const BROWSER_KEY = "daivr.buddyVisitBrowser.v1";
const LOOK_RETRY_MS = 1600;

// Visitantes de prueba (comando `visit` de la consola).
const TEST_VISITORS = [
  { name: "Nena", look: { level: 5, worn: ["party-hat", "sunglasses", "scarf", "gold-antenna"] } },
  { name: "", look: { level: 2, worn: ["star-cap", "headset"] } },
  { name: "Vasquez", look: { level: 4, worn: ["miku-wig", "rocket-boots", "scarf", "sunglasses"] } }
];

const between = ([min, max]) => min + Math.random() * (max - min);
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
    const visiting = () => [...map.values()].filter((visitor) => visitor.phase === "visiting");

    function hostX() {
      const node = hostNode();
      const parent = zone();
      if (!node || !parent) return stageWidth() * 0.3;
      return node.getBoundingClientRect().left - parent.getBoundingClientRect().left;
    }

    function lineValues(visitor) {
      const other = [...map.values()].find((entry) => entry !== visitor);
      return { from: visitor.name, host: hostNameRef.current, other: other?.name || "" };
    }

    function faceHost(visitor) {
      visitor.facing = facingFor(hostX() > visitor.x ? 1 : -1);
      render();
    }

    // Sitio libre junto al buddy de casa: primero pegado a el (del lado con mas
    // sitio y, si esta ocupado, del otro), y solo despues mas lejos. Asi un
    // segundo visitante se pone al otro lado en vez de hacer cola detras.
    function freeSpot(preferredSide, selfId) {
      const host = hostX();
      const taken = [...map.values()].filter((visitor) => visitor.id !== selfId).map((visitor) => visitor.targetX);
      for (let step = 0; step < 3; step += 1) {
        for (const side of [preferredSide, -preferredSide]) {
          const x = host + side * (HOST_GAP + step * NEIGHBOR_GAP);
          if (x < EDGE || x > maxX()) continue;
          if (taken.every((other) => Math.abs(other - x) >= NEIGHBOR_GAP - 8)) return { x, side };
        }
      }
      return { x: clampX(host + preferredSide * HOST_GAP), side: preferredSide };
    }

    function walkTo(visitor, target, done) {
      const distance = Math.abs(target - visitor.x);
      const ms = reduceMotion() ? 0 : Math.min(MAX_WALK_MS, (distance / WALK_PX_S) * 1000);
      if (distance > 1) visitor.facing = facingFor(target > visitor.x ? 1 : -1);
      if (ms) visitor.mood = "walk";
      visitor.walkMs = ms;
      visitor.x = target;
      visitor.targetX = target;
      render();
      later(ms + 60, () => {
        if (!alive(visitor)) return;
        visitor.walkMs = 0;
        if (visitor.mood === "walk") visitor.mood = "idle";
        render();
        done?.();
      });
    }

    function speak(visitor, line, { ms = LINE_MS, mood = "talk", then } = {}) {
      if (!line || !alive(visitor)) return;
      const now = Date.now();
      visitor.bubble = line;
      visitor.lastLine = line;
      if (visitor.mood !== "walk") visitor.mood = mood;
      floorUntil = now + ms + FLOOR_GAP_MS;
      window.dispatchEvent(new CustomEvent("daivr-buddy-visitor", { detail: { phase: "talking", until: now + ms + 300 } }));
      render();
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
      if (!alive(visitor)) return;
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

    function announce(phase, visitor) {
      window.dispatchEvent(new CustomEvent("daivr-buddy-visitor", { detail: { phase, name: visitor.name, x: visitor.x } }));
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
          if (earlier) {
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
      const spot = freeSpot(host < stageWidth() / 2 ? 1 : -1, entry.id);
      const edgeX = spot.side < 0 ? EDGE : maxX();
      const visitor = {
        id: entry.id,
        name: entry.name || "",
        look: entry.look,
        x: edgeX,
        targetX: spot.x,
        walkMs: 0,
        facing: facingFor(spot.x >= edgeX ? 1 : -1),
        mood: "idle",
        bubble: "",
        phase: "arriving",
        fade: "in",
        stayMs: options.stayMs,
        stayUntil: null,
        replyAt: 0,
        ownLineAt: 0,
        wanderAt: 0,
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
          visitor.wanderAt = now + between(WANDER_MS);
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
        render();
      });
    }

    function leave(visitor, { quick = false } = {}) {
      if (visitor.phase === "leaving") return;
      visitor.phase = "leaving";
      const exit = () => {
        if (!alive(visitor)) return;
        // Sale por su lado, sin cruzar por encima del buddy de casa.
        walkTo(visitor, visitor.x >= hostX() ? maxX() : EDGE, () => vanish(visitor));
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

    // El buddy de casa dijo algo: turno ocupado mientras dure, y quiza uno de
    // los visitantes contesta al terminar.
    function onHostSaid(event) {
      const { topic, ms } = event.detail || {};
      const duration = Number(ms) || LINE_MS;
      const now = Date.now();
      floorUntil = Math.max(floorUntil, now + duration + FLOOR_GAP_MS);
      if (!topic || topic === "visitor") return;
      const listeners = visiting().filter((visitor) => !visitor.bubble && now >= visitor.replyAt);
      if (!listeners.length) return;
      const visitor = listeners[Math.floor(Math.random() * listeners.length)];
      const reply = visitorReplyTo(topic, lineValues(visitor), Math.random, visitor.lastLine);
      if (!reply) return;
      visitor.replyAt = now + REPLY_COOLDOWN_MS;
      const mood = topic === "dance" ? "dance" : ["party", "fishRare", "bugWin", "outageFix"].includes(topic) ? "party" : "talk";
      later(duration + FLOOR_GAP_MS, () => speakWhenFree(visitor, reply, { mood, patience: 1500, dropWhenLate: true }));
    }

    function tick() {
      const now = Date.now();
      const roster = enabledRef.current ? rosterRef.current || [] : [];
      const canArrive = enabledRef.current
        && footerVisible
        && !attract
        && document.visibilityState === "visible"
        && hostReady()
        && !document.documentElement.dataset.buddyEvent;
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
        if (visitor.phase !== "visiting" || visitor.walkMs || visitor.bubble) continue;

        // El buddy de casa se le ha echado encima: se aparta.
        if (Math.abs(host - visitor.x) < 48 && !reduceMotion()) {
          const away = visitor.x >= host ? 1 : -1;
          let target = clampX(visitor.x + away * 84);
          if (Math.abs(target - host) < 48) target = clampX(host - away * 84);
          walkTo(visitor, target, () => faceHost(visitor));
          continue;
        }
        if (visitor.mood === "idle" && facingFor(host > visitor.x ? 1 : -1) !== visitor.facing) faceHost(visitor);

        if (!asleep && now >= visitor.ownLineAt) {
          visitor.ownLineAt = now + between(OWN_LINE_MS);
          speakWhenFree(visitor, () => {
            const online = (rosterRef.current || []).length + 1;
            const pool = [...visitorIdlePool(hostLookRef.current), ...(online > 2 ? [`${online} buddies online right now.`] : [])];
            return pickVisitLine(pool, lineValues(visitor), Math.random, visitor.lastLine);
          });
        } else if (now >= visitor.wanderAt && !reduceMotion()) {
          visitor.wanderAt = now + between(WANDER_MS);
          const target = clampX(visitor.x + (Math.random() < 0.5 ? -1 : 1) * (18 + Math.random() * 26));
          const clear = Math.abs(target - host) >= 70
            && [...map.values()].every((other) => other === visitor || Math.abs(other.targetX - target) >= NEIGHBOR_GAP - 8);
          if (clear) walkTo(visitor, target, () => faceHost(visitor));
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
  return (
    <div
      className={`screen-buddy-root is-visitor is-${visitor.mood} ${visitor.fade ? `is-fade-${visitor.fade}` : ""} ${visitor.bubble ? "is-speaking" : ""} ${worn.includes("rocket-boots") ? "has-rocket-boots" : ""} ${worn.includes("miku-costume") ? "has-miku-costume" : ""}`}
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
        aria-label={`${label}'s Buddy is visiting. Say hi`}
        onClick={() => onPoke(visitor.id)}
      >
        <span className="buddy-visitor-holo">
          <span className="screen-buddy-body">
            <BuddySprite
              className="screen-buddy-sprite"
              expression={["party", "dance"].includes(visitor.mood) ? "happy" : "idle"}
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
