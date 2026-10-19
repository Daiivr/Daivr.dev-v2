import { useEffect, useState } from "react";
import { natureSeason } from "../../lib/pixelWorld/life/util";
import { worldLayout } from "../../lib/pixelWorld/worldBus";
import { LINES } from "./buddyLines";
import { SPRITE_WIDTH, walkDuration, nightKey } from "./useBuddyCore";

/*
  Medusas de luna: una noche de verano despejada, de vez en cuando (se tira el
  dado una vez por noche), el sendero se abre en una poza quieta y salen
  medusas que brillan y suben hacia las estrellas. Pip va al embarcadero, se
  sienta en la punta a mirarlas y al final se despide con la mano. Lo dibuja
  events/jellies.js con lo que se publica en el bus (fase, x de la poza y lado
  del embarcadero). `daivr-buddy-jellies` lo lanza ya (pruebas).
*/
const JELLY_KEY = "daivr.jellies.v1";
const NIGHT_CHANCE = 0.3;
const SETTLE_MS = 25_000; // no nada mas cargar la pagina
const WATCH_MS = 30_000;
const LEAVE_MS = 2200;
// Media poza (con su orilla) y lo que sobresale el embarcadero, en px CSS.
const POND_HALF = 50;
const DOCK_OUT = 22;
// Pip, en el embarcadero, un poco antes de la punta (sobre el agua).
const DOCK_TIP = 30;

function readNight() {
  try { return JSON.parse(window.localStorage.getItem(JELLY_KEY) || "null") || {}; } catch { return {}; }
}
function saveNight(value) {
  try { window.localStorage.setItem(JELLY_KEY, JSON.stringify(value)); } catch { /* sin almacenamiento: vale para esta visita */ }
}

export function useBuddyJellies(core) {
  const [jellies, setJellies] = useState(null);
  const [api] = useState(() => createJellies(core, setJellies));
  useEffect(() => {
    core.eventEndHandlers.set("jellies", () => setJellies(null));
    const onSignal = () => { if (!core.activeEventRef.current) api.start({ force: true }); };
    window.addEventListener("daivr-buddy-jellies", onSignal);
    return () => {
      core.eventEndHandlers.delete("jellies");
      window.removeEventListener("daivr-buddy-jellies", onSignal);
    };
  }, [api, core]);
  return { api, view: { jellies } };
}

function createJellies(core, setJellies) {
  const { rootRef, moodGenRef, xRef, activeEventRef, skyPhaseRef, skyCoverRef, reduceMotion } = core;
  const { beginBuddyEvent, endBuddyEvent, freezeAtCurrentPosition, updateMood, updateFacing, updateTravelDirection, faceTravelDirection, moveTo, schedule, say, pickLine, stageWidth, setWalkMs, spawnParticles } = core;
  const bootAt = Date.now();

  // Noche de verano despejada, y la de hoy ha tocado (una tirada por noche).
  function canStart(now = Date.now()) {
    if (reduceMotion || !rootRef.current?.parentElement || now - bootAt < SETTLE_MS) return false;
    if (skyPhaseRef.current !== "night" || !["clear", "fair"].includes(skyCoverRef.current) || natureSeason() !== "summer") return false;
    const night = nightKey(now);
    let saved = readNight();
    if (saved.night !== night) { saved = { night, lucky: Math.random() < NIGHT_CHANCE, seen: false }; saveNight(saved); }
    return saved.lucky && !saved.seen;
  }

  // Donde abrir la poza: pasado el mercado, la hoguera y el huerto, lejos de la
  // tienda y con sitio para el embarcadero a cada lado.
  function pondSpot() {
    const stage = rootRef.current?.parentElement;
    if (!stage) return null;
    const left = stage.getBoundingClientRect().left, width = stageWidth();
    const box = (selector) => { const r = document.querySelector(selector)?.getBoundingClientRect(); return r?.width ? [r.left - left, r.right - left] : null; };
    const dry = box(".footer-campfire")?.[1] || 0;
    const margin = POND_HALF + DOCK_OUT + 8;
    let segments = [[dry + margin, width - margin]];
    // (ni la tienda ni el huerto del centro)
    for (const avoid of [box(".footer-tent"), box(".footer-garden[data-dry]")]) {
      if (avoid) segments = segments.flatMap(([lo, hi]) => [[lo, Math.min(hi, avoid[0] - POND_HALF - 12)], [Math.max(lo, avoid[1] + POND_HALF + 12), hi]]).filter(([lo, hi]) => hi > lo);
    }
    if (!segments.length) return null;
    // Lo mas cerca de Pip que se pueda, pero sin que su sitio en el
    // embarcadero quede delante de una farola (sentado, asoma por encima).
    const at = xRef.current + SPRITE_WIDTH / 2, lamps = (worldLayout()?.lamps || []).map((lx) => lx * 2);
    const total = segments.reduce((sum, [lo, hi]) => sum + hi - lo, 0);
    const pick = (u) => { for (const [lo, hi] of segments) { if (u <= hi - lo) return lo + u; u -= hi - lo; } return segments[segments.length - 1][1]; };
    const candidates = [Math.max(segments[0][0], Math.min(segments[segments.length - 1][1], at)), ...Array.from({ length: 40 }, () => pick(Math.random() * total))]
      .filter((x) => segments.some(([lo, hi]) => x >= lo && x <= hi))
      .map((x) => ({ x, side: at < x ? -1 : 1 }))
      .filter(({ x, side }) => lamps.every((lx) => Math.abs(x + side * DOCK_TIP - lx) > 36));
    return candidates.sort((a, b) => Math.abs(a.x - at) - Math.abs(b.x - at))[0] || null;
  }

  function start({ force = false } = {}) {
    if (!force && !canStart()) return false;
    const spot = pondSpot();
    if (!spot || !beginBuddyEvent("jellies")) return false;
    if (!force) saveNight({ ...readNight(), seen: true });
    freezeAtCurrentPosition();
    const { x, side } = spot;
    setJellies({ phase: "walk", x, side });
    updateMood("jellies");
    say(pickLine(LINES.jelliesSpot), 2400, { topic: "jellies" });
    const target = Math.max(4, Math.min(stageWidth() - SPRITE_WIDTH - 4, x + side * DOCK_TIP - SPRITE_WIDTH / 2));
    const distance = Math.abs(target - xRef.current), ms = distance < 4 ? 0 : walkDuration(distance);
    // (deja que la poza se abra antes de echar a andar)
    schedule(() => {
      if (activeEventRef.current !== "jellies") return;
      if (ms) { faceTravelDirection(target > xRef.current ? 1 : -1); setWalkMs(ms); moveTo(target); }
      const generation = moodGenRef.current;
      schedule(() => {
        if (activeEventRef.current !== "jellies" || moodGenRef.current !== generation) return;
        setWalkMs(0);
        // mirando a la poza (facing 1 mira a la izquierda)
        updateTravelDirection(side < 0 ? 1 : -1); updateFacing(side < 0 ? -1 : 1);
        setJellies({ phase: "watch", x, side });
        schedule(() => { if (activeEventRef.current === "jellies") say(pickLine(LINES.jelliesWatch), 3200, { topic: "jellies" }); }, 4500);
        schedule(() => { if (activeEventRef.current === "jellies") say(pickLine(LINES.jelliesWatch), 3200, { topic: "jellies" }); }, 15_000);
        schedule(() => {
          if (activeEventRef.current !== "jellies") return;
          setJellies({ phase: "leave", x, side });
          say(pickLine(LINES.jelliesBye), 2800, { topic: "jellies" });
          schedule(() => {
            if (activeEventRef.current !== "jellies") return;
            setJellies(null);
            updateMood("idle");
            endBuddyEvent("jellies");
            spawnParticles("heart", 2);
          }, LEAVE_MS);
        }, WATCH_MS);
      }, ms + 80);
    }, 900);
    return true;
  }

  return { canStart, start };
}
