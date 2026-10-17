import { useEffect, useRef } from "react";
import { fishArc, fishContact, fishRebound, reboundPoint } from "../../shared/footer-fish-motion.mjs";
import { ART } from "../lib/pixelWorld/core";
import { H, WATER_Y, WORLD_TOP, layoutCssVars } from "../lib/pixelWorld/layout";
import { skyScene } from "../lib/pixelWorld/skyBus";
import { createFooterWorld } from "../lib/pixelWorld/world";
import { actorPosition, dropActor, listActors, publishActor } from "../lib/pixelWorld/worldBus";

// El mundo del footer en pixel art (src/lib/pixelWorld): un solo lienzo con
// el cielo, el bosque, el sendero, las farolas, la hoguera y el puesto del
// mercado, con la hora y el tiempo de verdad (FooterSky). Aqui solo vive el
// ciclo: medir, redibujar a 30 fps mientras se ve, y los avisos de fuera
// (lluvia de Buddy, deseos a estrellas fugaces, peces que saltan, ranas).
const FRAME_MS = 1000 / 30;
// Centro del sprite en el escenario de Buddy (64 px + 4 px de margen a cada lado).
const SPRITE_HALF = 36;
// Mas arriba de esto (px CSS sobre el riel) Pip, con su paracaidas, ya no cabe
// en el margen de arriba del lienzo.
const ALOFT_PX = 190;
const FISH_SPECIES = ["byte-minnow", "cache-carp", "pixel-perch", "syntax-salmon", "neon-tetra"];
// Alto del lienzo en CSS (con el margen de arriba), donde empieza el mundo y
// la superficie del agua del sendero, medidos desde arriba del lienzo.
const WORLD_PX = (H + WORLD_TOP) * ART;
const TOP_PX = WORLD_TOP * ART;
const WATER_PX = TOP_PX + WATER_Y * ART;
// El agujero se abre un poco antes de que salte el pez.
const SPOT_LEAD_MS = 320;

const randomBetween = (min, max) => min + Math.random() * (max - min);

export function FooterWorld({ sky, season, marketOpen, marketHover }) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const propsRef = useRef(null);
  const repaintRef = useRef(() => {});
  propsRef.current = { sky, season: season || "", marketOpen, marketHover };

  useEffect(() => { repaintRef.current(); }, [sky, season, marketOpen, marketHover]);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return undefined;
    const zone = root.closest(".app-footer-zone");
    const world = createFooterWorld(canvas);
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const timers = new Set();
    let width = 0, inView = false, frame = 0, last = 0, acc = 0;
    let buddyEventActive = Boolean(document.documentElement.dataset.buddyEvent);
    let fish = null;

    const schedule = (callback, delay) => {
      const timer = window.setTimeout(() => { timers.delete(timer); callback(); }, delay);
      timers.add(timer);
    };

    function rebuild() {
      if (!width) return;
      const layout = world.build(width);
      canvas.style.width = `${world.width * ART}px`;
      canvas.style.height = `${WORLD_PX}px`;
      Object.entries(layoutCssVars(layout)).forEach(([key, value]) => zone?.style.setProperty(key, value));
    }
    function sync() {
      const props = propsRef.current;
      world.state.sky = {
        altitude: Number.isFinite(props.sky?.altitude) ? props.sky.altitude : (props.sky?.phase === "day" ? 1 : -1),
        phase: props.sky?.phase || "night",
        cover: props.sky?.cover || "fair",
        wind: props.sky?.wind ?? 1
      };
      world.state.market = { open: props.marketOpen !== false, hover: Boolean(props.marketHover) };
      world.state.scene = skyScene();
      if (world.setSeason(props.season) || !world.layout) rebuild();
    }
    // Buddy y las visitas, tal y como los publican ScreenBuddy y BuddyVisitors
    // (src/lib/pixelWorld/worldBus.js), en px de arte para el lienzo.
    function trackActors(now) {
      world.state.actors = listActors()
        .filter((actor) => actor.visible !== false)
        .map((actor) => {
          const pos = actorPosition(actor, now);
          const aloft = pos.y < -ALOFT_PX;
          if (actor.id === "host") markAloft(aloft);
          return {
            ...actor,
            x: (pos.x + SPRITE_HALF) / ART,
            y: pos.y / ART,
            aloft,
            moving: pos.moving && actor.x !== actor.fromX,
            // facing -1 en ScreenBuddy = mira a la derecha
            dir: (actor.facing || 1) < 0 ? 1 : -1
          };
        });
    }

    // Cuerpo de Buddy (sin antena, equipo ni bocadillo) en px del lienzo.
    function readBody() {
      const node = document.querySelector(".screen-buddy-root:not(.is-off)");
      const sprite = node?.querySelector(".screen-buddy-sprite");
      if (!sprite || node.matches(".is-off,.is-held,.is-chute,.is-sleep,.is-sleepy,.is-outage,.is-hunt")) return null;
      const body = sprite.getBoundingClientRect(), box = canvas.getBoundingClientRect();
      return {
        left: body.left - box.left + body.width * 0.19, right: body.right - box.left - body.width * 0.19,
        top: body.top - box.top + body.height * 0.24, bottom: body.bottom - box.top - body.height * 0.13
      };
    }
    function spawnFish({ forceCollision = false } = {}) {
      if (reduceMotion || buddyEventActive || fish || document.hidden || !inView || !width) return;
      const body = readBody();
      let direction = Math.random() < 0.5 ? -1 : 1;
      if (forceCollision && body) direction = (body.left + body.right) / 2 > width / 2 ? 1 : -1;
      // Ni el agujero de salida ni el de llegada en el mercado o la hoguera:
      // los dos quedan a la derecha de dryEnd (en pantallas estrechas, el salto
      // se acorta para que quepa).
      const margin = 25, dryEnd = dryZoneEnd(), room = width - margin - dryEnd;
      if (room < 80) return;
      const drift = direction * Math.min(randomBetween(115, 185), room - 10);
      const startMin = direction > 0 ? dryEnd : dryEnd + Math.abs(drift);
      const startMax = direction > 0 ? width - margin - Math.abs(drift) : width - margin;
      const startX = forceCollision && body
        ? Math.max(startMin, Math.min(startMax, (body.left + body.right) / 2 - drift * 0.55))
        : randomBetween(Math.min(startMin, startMax), Math.max(startMin, startMax));
      const item = {
        startX, drift, waterY: WATER_PX, height: randomBetween(61, 85),
        species: FISH_SPECIES[Math.floor(Math.random() * FISH_SPECIES.length)],
        duration: randomBetween(1.35, 1.75), facing: direction
      };
      // Sale de un agujero de agua que se abre en el sendero, y cae en otro.
      fish = { item, startedAt: null, bounce: null, hitTime: 0, previous: fishArc(item, 0), previousBody: body, leapt: false, landing: null };
      world.waterSpot(startX / ART, (SPOT_LEAD_MS + 500) / 1000);
      window.dispatchEvent(new CustomEvent("daivr-footer-wildlife-event", { detail: { active: true, name: "flying-fish" } }));
      window.dispatchEvent(new CustomEvent("daivr-footer-fish-seen", { detail: { x: startX / width * 100, direction } }));
    }
    function dryZoneEnd() {
      const zone = world.layout?.noWater;
      return zone ? zone[1] * ART + 24 : 0;
    }
    function endFish() {
      fish = null;
      world.state.fish = null;
      window.dispatchEvent(new CustomEvent("daivr-footer-wildlife-event", { detail: { active: false, name: "flying-fish" } }));
    }
    // Las mismas coordenadas mueven el pez y deciden si choca con Buddy.
    function stepFish(now) {
      if (!fish) return;
      const { item } = fish;
      fish.startedAt ??= now + SPOT_LEAD_MS;
      const time = (now - fish.startedAt) / 1000;
      if (time < 0) return;
      if (!fish.leapt) { fish.leapt = true; world.splashSpot(item.startX / ART); }
      let point = fish.bounce ? reboundPoint(fish.bounce, Math.min(time - fish.hitTime, fish.bounce.duration)) : fishArc(item, time);
      const liveBody = readBody();
      const contact = !fish.bounce && time > 0.08 ? fishContact(fish.previous, point, fish.previousBody, liveBody) : null;
      if (contact) {
        fish.bounce = fishRebound(contact, point, item.waterY);
        // Rebotado hacia el mercado: que caiga justo pasada la hoguera.
        const dryEnd = dryZoneEnd();
        if (contact.x + fish.bounce.vx * fish.bounce.duration < dryEnd) fish.bounce.vx = (dryEnd + 6 - contact.x) / fish.bounce.duration;
        fish.hitTime = time;
        fish.landing = reboundPoint(fish.bounce, fish.bounce.duration).x;
        world.waterSpot(fish.landing / ART, fish.bounce.duration + 0.5);
        point = { ...point, x: contact.x, y: contact.y };
        world.impact(contact.x / ART, (contact.y - TOP_PX) / ART);
        window.dispatchEvent(new CustomEvent("daivr-footer-fish-bump", {
          detail: { x: contact.x / width * 100, direction: item.facing, speed: Math.hypot(point.vx, point.vy) }
        }));
      }
      fish.previous = point;
      fish.previousBody = liveBody;
      if (!fish.bounce && fish.landing == null && time >= item.duration - 0.45) {
        fish.landing = item.startX + item.drift;
        world.waterSpot(fish.landing / ART, 0.95);
      }
      world.state.fish = { x: point.x / ART, y: (point.y - TOP_PX) / ART, vy: point.vy, dir: point.vx >= 0 ? 1 : -1, species: item.species, alpha: 1 };
      if (fish.bounce ? time - fish.hitTime >= fish.bounce.duration : time >= item.duration) {
        world.splashSpot((fish.landing ?? point.x) / ART);
        endFish();
      }
    }
    const queueFish = () => schedule(() => { spawnFish(); queueFish(); }, randomBetween(14000, 30000));

    // Arrastrado (o cayendo) mas alto de lo que cabe en el lienzo: lo pinta el
    // DOM de ScreenBuddy (data-aloft) y el lienzo lo deja de dibujar.
    let aloftShown = false;
    function markAloft(value) {
      if (value === aloftShown) return;
      aloftShown = value;
      const node = zone?.querySelector(".screen-buddy-root:not(.is-visitor)");
      if (!node) { aloftShown = !value; return; }
      if (value) node.setAttribute("data-aloft", ""); else node.removeAttribute("data-aloft");
      // (el bocadillo, por encima de la tela; al volver lo recoloca liftBubbles)
      node.style.setProperty("--buddy-bubble-lift", value ? "48px" : "0px");
      lifts.delete("host");
    }
    // Sube el bocadillo DOM de cada actor por encima de lo que lleva en alto
    // (solo se escribe cuando cambia).
    const lifts = new Map();
    function liftBubbles() {
      for (const [id, px] of world.bubbleLifts) {
        const value = Math.round(px / 2) * 2;
        if (lifts.get(id) === value) continue;
        lifts.set(id, value);
        const node = id === "host"
          ? zone?.querySelector(".screen-buddy-root:not(.is-visitor)")
          : zone?.querySelector(`[data-visitor-id="${id.replace(/^visitor-/, "")}"]`);
        node?.style.setProperty("--buddy-bubble-lift", `${value}px`);
      }
    }
    // La hoguera apagada por la lluvia: se avisa a Buddy (useBuddyCampfire),
    // que va a encenderla cuando escampa (`daivr-campfire-relight`).
    let fireKey = "";
    function announceFire() {
      const key = world.fireOut + "|" + world.raining();
      if (key === fireKey) return;
      fireKey = key;
      window.dispatchEvent(new CustomEvent("daivr-campfire-state", { detail: { out: world.fireOut, raining: world.raining() } }));
    }
    const onRelight = () => world.relightFire();
    // Coste por fotograma (solo en desarrollo, para window.__daivrWorld).
    const cost = { frames: 0, total: 0, max: 0 };
    function tick(now) {
      frame = window.requestAnimationFrame(tick);
      acc += Math.max(0, Math.min(100, now - last));
      last = now;
      if (acc < FRAME_MS) return;
      const step = Math.min(acc, 100) / 1000;
      acc = 0;
      const startedAt = import.meta.env.DEV ? performance.now() : 0;
      sync();
      trackActors(now);
      stepFish(now);
      world.update(step);
      world.draw();
      liftBubbles();
      announceFire();
      if (import.meta.env.DEV) {
        const spent = performance.now() - startedAt;
        cost.frames += 1; cost.total += spent; cost.max = Math.max(cost.max, spent);
      }
    }
    function start() {
      if (frame || reduceMotion || !inView || document.hidden || !width) return;
      last = performance.now();
      acc = FRAME_MS;
      frame = window.requestAnimationFrame(tick);
    }
    function stop() {
      window.cancelAnimationFrame(frame);
      frame = 0;
    }
    // Sin bucle (fuera de vista o movimiento reducido): un fotograma suelto.
    repaintRef.current = () => {
      if (frame || !width) return;
      sync();
      trackActors(performance.now());
      world.update(0);
      world.draw();
    };

    const resize = new ResizeObserver(([entry]) => {
      const next = Math.round(entry.contentRect.width);
      if (!next || next === width) return;
      width = next;
      rebuild();
      repaintRef.current();
      start();
    });
    resize.observe(root);
    const visibility = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView) start(); else stop();
    }, { root: root.closest(".app-shell"), rootMargin: "160px 0px" });
    visibility.observe(root);
    const onVisibility = () => (document.hidden ? stop() : start());

    // El chaparron de Buddy: la lluvia la trae el tiempo (FooterSky); aqui
    // solo salen las ranas de la hierba a su lado.
    const onRain = (event) => {
      const { active, x } = event.detail || {};
      if (active && !reduceMotion) world.rainFrogs((Number.isFinite(x) ? x : width / 2) / ART);
    };
    const onFishSignal = (event) => spawnFish({ forceCollision: Boolean(event.detail?.forceCollision) });
    // Deseo a una estrella fugaz (x e y dentro de la capa de FooterSky, que
    // empieza en la fila 0 del mundo): chispas en el lienzo.
    const onShootingStar = (event) => {
      const { phase, x, y } = event.detail || {};
      if (phase === "wish" && Number.isFinite(x) && Number.isFinite(y)) world.wish(x / ART, y / ART);
    };
    const onBuddyEventState = (event) => { buddyEventActive = Boolean(event.detail?.active); };
    window.addEventListener("daivr-footer-rain", onRain);
    window.addEventListener("daivr-footer-fish", onFishSignal);
    window.addEventListener("daivr-shooting-star", onShootingStar);
    window.addEventListener("daivr-buddy-event-state", onBuddyEventState);
    window.addEventListener("daivr-campfire-relight", onRelight);
    document.addEventListener("visibilitychange", onVisibility);
    if (!reduceMotion) {
      schedule(spawnFish, 4200);
      queueFish();
    }
    // Gancho de desarrollo, como los motores de temporada: medir el coste,
    // avanzar a mano cuando el panel no da fotogramas, o lanzar un pez.
    if (import.meta.env.DEV) {
      window.__daivrWorld = {
        world,
        cost: () => ({ frames: cost.frames, avgMs: cost.frames ? cost.total / cost.frames : 0, maxMs: cost.max }),
        resetCost: () => { cost.frames = 0; cost.total = 0; cost.max = 0; },
        step: (ms = FRAME_MS) => { sync(); trackActors(performance.now()); stepFish(performance.now()); world.update(ms / 1000); world.draw(); },
        fish: (forceCollision = false) => spawnFish({ forceCollision }),
        birds: (kind, dir) => world.flock(kind, dir),
        // actores de prueba (eventos que solo se lanzan con sesion de admin)
        bus: { publishActor, dropActor }
      };
    }

    return () => {
      stop();
      resize.disconnect();
      visibility.disconnect();
      window.removeEventListener("daivr-footer-rain", onRain);
      window.removeEventListener("daivr-footer-fish", onFishSignal);
      window.removeEventListener("daivr-shooting-star", onShootingStar);
      window.removeEventListener("daivr-buddy-event-state", onBuddyEventState);
      window.removeEventListener("daivr-campfire-relight", onRelight);
      document.removeEventListener("visibilitychange", onVisibility);
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
      if (fish) endFish();
      repaintRef.current = () => {};
      if (import.meta.env.DEV) delete window.__daivrWorld;
    };
  }, []);

  return (
    <div className="footer-world" aria-hidden="true" ref={rootRef}>
      <canvas className="footer-world-canvas" ref={canvasRef} />
      {/* Ancla invisible: Buddy busca la hoguera por esta clase para sentarse a su lado. */}
      <span className="footer-campfire" />
    </div>
  );
}
