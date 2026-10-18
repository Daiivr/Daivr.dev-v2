import { useEffect, useState } from "react";
import { LINES } from "./buddyLines";
import { SPRITE_WIDTH, WALK_SPEED_PX_S } from "./useBuddyCore";

/*
  La vida del valle que hace Pip (lo demas lo dibuja el mundo, life/):
  - Farolas: al anochecer va con su pertiga encendiendolas una a una, y al
    amanecer las apaga (FooterWorld avisa con `daivr-lamps-state`; cada una
    que cambia, `daivr-lamp-switch`). Si esta ocupado lo intenta mas tarde; si
    no llega, el mundo las cambia solas a los 90 s.
  - Forraje: de vez en cuando va a por una de las cosas de temporada del borde
    del prado, se agacha y la recoge (`daivr-forage-pick`): una moneda.
  - La tienda: de noche se va a dormir dentro (ScreenBuddy pregunta tentTarget
    al irse a dormir).
*/
const LAMP_GAP = 40;
const REACH_MS = 1300;
const SWITCH_AT_MS = 650;
const RETRY_MS = 6000;
const FORAGE_COOLDOWN_MS = 45_000;
const PICK_MS = 900;
const LAMP_MOODS = ["idle", "talk", "walk", "sleepy"];

export function useBuddyLife(core) {
  const [lamps, setLamps] = useState(null);
  const [forage, setForage] = useState(null);
  const [tent, setTent] = useState(false);
  const [api] = useState(() => createLife(core, { setLamps, setForage, setTent }));

  useEffect(() => {
    core.eventEndHandlers.set("lamps", () => setLamps(null));
    core.eventEndHandlers.set("forage", () => setForage(null));
    window.addEventListener("daivr-lamps-state", api.onLampsState);
    window.addEventListener("daivr-forage-state", api.onForageState);
    window.addEventListener("daivr-forage-picked", api.onForagePicked);
    // (consola/pruebas) que vaya ya a por el forraje
    const onForageSignal = () => { if (!core.activeEventRef.current) api.startForage(); };
    window.addEventListener("daivr-buddy-forage", onForageSignal);
    return () => {
      window.removeEventListener("daivr-buddy-forage", onForageSignal);
      core.eventEndHandlers.delete("lamps");
      core.eventEndHandlers.delete("forage");
      window.removeEventListener("daivr-lamps-state", api.onLampsState);
      window.removeEventListener("daivr-forage-state", api.onForageState);
      window.removeEventListener("daivr-forage-picked", api.onForagePicked);
    };
  }, [api, core]);

  return { api, view: { lamps, forage, tent } };
}

function createLife(core, { setLamps, setForage, setTent }) {
  const { rootRef, moodRef, moodGenRef, xRef, activeEventRef, skyPhaseRef, reduceMotion } = core;
  const { beginBuddyEvent, endBuddyEvent, freezeAtCurrentPosition, updateMood, updateFacing, updateTravelDirection, faceTravelDirection, moveTo, schedule, say, pickLine, stageWidth, setWalkMs, spawnParticles } = core;
  const lampState = { want: null, lamps: [], retry: 0 };
  const forageState = { items: [], last: Date.now() - FORAGE_COOLDOWN_MS + 20_000 };

  const maxX = () => Math.max(4, stageWidth() - SPRITE_WIDTH - 4);
  const walkMsTo = (target) => { const d = Math.abs(target - xRef.current); return d < 4 ? 0 : Math.min(9000, (d / WALK_SPEED_PX_S) * 1000); };

  // --- Farolas ---------------------------------------------------------------
  function onLampsState(event) {
    lampState.want = Boolean(event.detail?.want);
    lampState.lamps = Array.isArray(event.detail?.lamps) ? event.detail.lamps : [];
    if (lampState.lamps.length) queueLamps(1800);
  }
  function queueLamps(ms) {
    if (lampState.retry) return;
    lampState.retry = schedule(() => { lampState.retry = 0; tryLamps(); }, ms);
  }
  function tryLamps() {
    if (!lampState.lamps.length) return;
    if (reduceMotion) {
      for (const lamp of lampState.lamps) window.dispatchEvent(new CustomEvent("daivr-lamp-switch", { detail: { i: lamp.i, on: lampState.want } }));
      return;
    }
    if (activeEventRef.current || !LAMP_MOODS.includes(moodRef.current) || !startLamps()) queueLamps(RETRY_MS);
  }
  function startLamps() {
    if (!rootRef.current?.parentElement) return false;
    if (!beginBuddyEvent("lamps")) return false;
    if (!["idle", "talk"].includes(moodRef.current)) updateMood("idle");
    freezeAtCurrentPosition();
    say(pickLine(lampState.want ? LINES.lampsOn : LINES.lampsOff), 2400, { topic: "lamps" });
    // Siempre a la farola pendiente mas cercana, mirando en cada parada lo
    // que pide el mundo ahora (si cambia la hora a medio camino, se adapta).
    const visited = new Set();
    let lastOn = lampState.want;
    const nextLamp = () => {
      const at = xRef.current + SPRITE_WIDTH / 2;
      return lampState.lamps.filter((lamp) => !visited.has(lamp.i)).sort((a, b) => Math.abs(a.x - at) - Math.abs(b.x - at))[0];
    };
    const visit = () => {
      if (activeEventRef.current !== "lamps") return;
      const lamp = nextLamp();
      if (!lamp) { finishLamps(lastOn); return; }
      visited.add(lamp.i);
      const on = lampState.want;
      lastOn = on;
      // Se pone a un lado (a la izquierda si cabe) mirando a la farola.
      let side = lamp.x - LAMP_GAP - SPRITE_WIDTH / 2 >= 4 ? -1 : 1;
      let target = lamp.x + side * LAMP_GAP - SPRITE_WIDTH / 2;
      if (target > maxX()) { side = -1; target = lamp.x - LAMP_GAP - SPRITE_WIDTH / 2; }
      target = Math.max(4, Math.min(maxX(), target));
      const ms = walkMsTo(target);
      setLamps({ phase: "walk", x: lamp.x, on });
      if (ms) { faceTravelDirection(target > xRef.current ? 1 : -1); updateMood("lamps"); setWalkMs(ms); moveTo(target); }
      else updateMood("lamps");
      const generation = moodGenRef.current;
      schedule(() => {
        if (activeEventRef.current !== "lamps" || moodGenRef.current !== generation) return;
        setWalkMs(0);
        // mirar a la farola (facing 1 mira a la izquierda)
        updateTravelDirection(side < 0 ? 1 : -1); updateFacing(side < 0 ? -1 : 1);
        setLamps({ phase: "reach", x: lamp.x, on });
        schedule(() => { if (activeEventRef.current === "lamps") window.dispatchEvent(new CustomEvent("daivr-lamp-switch", { detail: { i: lamp.i, on } })); }, SWITCH_AT_MS);
        schedule(visit, REACH_MS);
      }, ms + 80);
    };
    visit();
    return true;
  }
  function finishLamps(on) {
    setLamps(null);
    updateMood("idle");
    endBuddyEvent("lamps");
    spawnParticles("heart", 1);
    say(pickLine(on ? LINES.lampsDone : LINES.lampsMorning), 2400, { topic: "lamps" });
  }

  // --- Forraje -----------------------------------------------------------------
  function onForageState(event) { forageState.items = Array.isArray(event.detail?.items) ? event.detail.items : []; }
  function onForagePicked(event) {
    const name = event.detail?.name;
    if (name) say(pickLine(LINES.forage).replace("{item}", name.toLowerCase()), 2600, { topic: "find" });
  }
  function canForage(now = Date.now()) {
    return !reduceMotion && forageState.items.length > 0 && now - forageState.last > FORAGE_COOLDOWN_MS && Boolean(rootRef.current?.parentElement);
  }
  function startForage() {
    const items = forageState.items.slice().sort((a, b) => Math.abs(a.x - (xRef.current + SPRITE_WIDTH / 2)) - Math.abs(b.x - (xRef.current + SPRITE_WIDTH / 2)));
    const item = items[0];
    if (!item || !beginBuddyEvent("forage")) return false;
    forageState.last = Date.now();
    freezeAtCurrentPosition();
    // de pie justo al lado, mirando hacia la cosa
    const side = item.x - SPRITE_WIDTH / 2 > xRef.current ? -1 : 1;
    const target = Math.max(4, Math.min(maxX(), item.x + side * 16 - SPRITE_WIDTH / 2));
    const ms = walkMsTo(target);
    setForage({ phase: "walk", x: item.x });
    if (ms) { faceTravelDirection(target > xRef.current ? 1 : -1); updateMood("forage"); setWalkMs(ms); moveTo(target); }
    else updateMood("forage");
    if (Math.random() < 0.6) say(pickLine(LINES.forageSpot), 2000, { topic: "find" });
    const generation = moodGenRef.current;
    const stillHere = () => activeEventRef.current === "forage" && moodGenRef.current === generation;
    schedule(() => {
      if (!stillHere()) return;
      setWalkMs(0);
      updateTravelDirection(side < 0 ? 1 : -1); updateFacing(side < 0 ? -1 : 1);
      setForage({ phase: "pick", x: item.x });
      schedule(() => { if (stillHere()) window.dispatchEvent(new CustomEvent("daivr-forage-pick", { detail: { slot: item.slot } })); }, PICK_MS * 0.6);
      schedule(() => {
        if (!stillHere()) return;
        setForage(null);
        updateMood("idle");
        endBuddyEvent("forage");
        spawnParticles("heart", 2);
      }, PICK_MS + 700);
    }, ms + 80);
    return true;
  }

  // --- La tienda -----------------------------------------------------------------
  // Donde dormir esta noche (x del escenario), o null si no toca tienda.
  function tentTarget() {
    if (skyPhaseRef.current !== "night") return null;
    const anchor = document.querySelector(".footer-tent"), stage = rootRef.current?.parentElement;
    const rect = anchor?.getBoundingClientRect();
    if (!stage || !rect?.width) return null;
    return Math.max(4, Math.min(maxX(), rect.left + rect.width / 2 - stage.getBoundingClientRect().left - SPRITE_WIDTH / 2));
  }

  return { onLampsState, onForageState, onForagePicked, canForage, startForage, tentTarget, setTent };
}
