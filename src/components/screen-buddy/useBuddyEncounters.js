import { useEffect, useState } from "react";
import { AMBIENT_CREATURES, ENEMY_BUGS, FIELD_FINDS } from "../../data/buddyWorld";
import { LINES } from "./buddyLines";
import { clamp, randomBetween, SPRITE_WIDTH, WALK_MARGIN, WALK_SPEED_PX_S } from "./useBuddyCore";

/*
  Encuentros por el footer:
  - Hallazgos: Buddy encuentra algo brillante y el jugador lo recoge con un clic;
    si nadie lo recoge en unos segundos, Buddy va y lo coge el mismo.
  - Bichos de visita: un pajaro que se le posa en la antena, una polilla de
    fosforo, la rana (que trae lluvia) y el pez que salta (FooterWorld).
  - Caza de bugs: aparece un bug y Buddy lo borra con el martillo, la red o
    la pistola (la pesada si tiene la llave inglesa). El dibujo y la
    coreografia viven en src/lib/pixelWorld/events/hunt.js.
*/

export const BIRD_ARRIVAL_MS = 1600;
export const BIRD_LANDING_MS = 420;
const BIRD_PERCH_MS = 4300;
export const BIRD_DEPARTURE_MS = 1500;
const FIND_COOLDOWN_MS = 70000;
// Sin clic en este tiempo, Buddy recoge el hallazgo el mismo.
const FIND_AUTO_PICK_MS = 6000;
// Se para a un paso del hallazgo (que queda a 76 px de su centro) y se agacha.
const FIND_REACH_PX = 22;
const FIND_CROUCH_MS = 650;
const ENEMY_COOLDOWN_MS = 95000;
const CREATURE_COOLDOWN_MS = 45000;

export function useBuddyEncounters(core, { startRain }) {
  const [fieldFind, setFieldFind] = useState(null);
  const [creature, setCreature] = useState(null);
  const [enemy, setEnemy] = useState(null);
  const [api] = useState(() => createEncounters(core, { setFieldFind, setCreature, setEnemy, startRain }));

  useEffect(() => {
    const now = Date.now();
    api.findCooldownRef.current = now - FIND_COOLDOWN_MS + 35000;
    api.enemyCooldownRef.current = now - ENEMY_COOLDOWN_MS + 50000;
    api.creatureCooldownRef.current = now - CREATURE_COOLDOWN_MS + 18000;
    window.addEventListener("daivr-buddy-find", api.onFindSignal);
    window.addEventListener("daivr-buddy-creature", api.onCreatureSignal);
    window.addEventListener("daivr-buddy-enemy", api.onEnemySignal);
    // (el bicho numero 100: el secreto del pixel blaster; el ultimo pez del
    // valle: el traje de pescador, despues de anunciar la captura)
    let fisherTimer = 0;
    const onSecret = (event) => {
      if (event.detail?.id === "fisher-outfit") {
        window.clearTimeout(fisherTimer);
        fisherTimer = window.setTimeout(() => {
          core.spawnParticles("confetti", 14);
          core.say("VALLEY JOURNAL COMPLETE! every fish in the valley. the fisherman outfit is mine!", 4600, { topic: "fishing" });
        }, 5200);
        return;
      }
      if (event.detail?.id !== "pixel-blaster") return;
      core.spawnParticles("confetti", 14);
      core.say("SECRET UNLOCKED: the pixel blaster! 100 bugs deleted. pew pew.", 4200, { topic: "bugHunt" });
    };
    window.addEventListener("daivr-buddy-secret-unlock", onSecret);
    // El pescador ambulante asoma por el prado: Buddy avisa (solo si le ve llegar).
    let fisherTimer2 = 0;
    const onFisher = (event) => {
      if (event.detail?.phase !== "arriving") return;
      window.clearTimeout(fisherTimer2);
      fisherTimer2 = window.setTimeout(() => {
        if (core.visibleRef?.current === false || core.activeEventRef?.current) return;
        core.say("the traveling fisherman is here! he sells rods and lures, and buys fish.", 4200, { topic: "fishing" });
      }, 6000);
    };
    window.addEventListener("daivr-fisherman-state", onFisher);
    return () => {
      window.clearTimeout(fisherTimer2);
      window.removeEventListener("daivr-fisherman-state", onFisher);
      window.clearTimeout(fisherTimer);
      window.removeEventListener("daivr-buddy-secret-unlock", onSecret);
      window.removeEventListener("daivr-buddy-find", api.onFindSignal);
      window.removeEventListener("daivr-buddy-creature", api.onCreatureSignal);
      window.removeEventListener("daivr-buddy-enemy", api.onEnemySignal);
    };
  }, [api, core]);

  return { api, view: { fieldFind, creature, enemy } };
}

function createEncounters(core, { setFieldFind, setCreature, setEnemy, startRain }) {
  const { moodRef, moodGenRef, xRef, activeEventRef, inventoryRef, reduceMotion } = core;
  const {
    beginBuddyEvent, endBuddyEvent, freezeAtCurrentPosition, updateMood, updateFacing, updateTravelDirection, faceTravelDirection,
    facingForDirection, inwardEventDirection, moveTo, schedule, say, pickLine, spawnParticles, settleDown, stageWidth, setWalkMs
  } = core;
  const findCooldownRef = { current: 0 };
  const enemyCooldownRef = { current: 0 };
  const enemyEncounterRef = { current: 0 };
  const creatureCooldownRef = { current: 0 };
  // Copias de lo que se pinta, para leerlo desde timers y clics.
  const fieldFindRef = { current: null };
  const creatureRef = { current: null };

  function updateFieldFind(next) {
    fieldFindRef.current = next;
    setFieldFind(next);
  }

  function updateCreature(next) {
    creatureRef.current = typeof next === "function" ? next(creatureRef.current) : next;
    setCreature(creatureRef.current);
  }

  function startFind() {
    if (!beginBuddyEvent("find")) return;
    findCooldownRef.current = Date.now();
    const item = FIELD_FINDS[Math.floor(Math.random() * FIELD_FINDS.length)];
    const direction = inwardEventDirection(Math.random() < 0.5 ? -1 : 1);
    const maxX = Math.max(WALK_MARGIN, stageWidth() - SPRITE_WIDTH - WALK_MARGIN);
    const target = clamp(xRef.current + direction * randomBetween(70, 140), WALK_MARGIN, maxX);
    const distance = Math.abs(target - xRef.current);
    const ms = Math.min(3600, (distance / WALK_SPEED_PX_S) * 1000);
    faceTravelDirection(target > xRef.current ? 1 : -1);
    updateMood("walk");
    const generation = moodGenRef.current;
    setWalkMs(ms);
    moveTo(target);

    schedule(() => {
      if (moodGenRef.current !== generation || moodRef.current !== "walk") return;
      setWalkMs(0);
      updateMood("find");
      const findSide = inwardEventDirection(direction, target, 104);
      updateTravelDirection(findSide);
      updateFacing(facingForDirection(findSide));
      updateFieldFind({ ...item, side: findSide });
      say(pickLine(LINES.find), 2400);
      const findGeneration = moodGenRef.current;
      schedule(() => {
        if (moodGenRef.current === findGeneration && moodRef.current === "find" && fieldFindRef.current?.id === item.id) pickUpFind(findSide);
      }, FIND_AUTO_PICK_MS);
      // Si algo le interrumpe (le cogen, le asustan) el hallazgo caduca.
      schedule(() => {
        if (fieldFindRef.current?.id !== item.id || fieldFindRef.current.picking) return;
        updateFieldFind(null);
        if (moodGenRef.current === findGeneration && moodRef.current === "find") {
          updateMood("idle");
          say("loot signal expired...", 1600, { topic: "findMiss" });
        }
        endBuddyEvent("find");
      }, 11000);
    }, ms + 80);
  }

  // Nadie lo ha recogido: se acerca, se agacha y lo coge. El boton se quita
  // (`picking`) para que no se mueva con el; el mundo deja el hallazgo donde
  // estaba y lo hace saltar a sus manos.
  function pickUpFind(side) {
    const find = fieldFindRef.current;
    if (!find) return;
    updateFieldFind({ ...find, picking: "walk" });
    const maxX = Math.max(WALK_MARGIN, stageWidth() - SPRITE_WIDTH - WALK_MARGIN);
    const target = clamp(xRef.current + side * (76 - FIND_REACH_PX), WALK_MARGIN, maxX);
    const ms = Math.max(120, (Math.abs(target - xRef.current) / WALK_SPEED_PX_S) * 1000);
    faceTravelDirection(side);
    updateMood("walk");
    const generation = moodGenRef.current;
    setWalkMs(ms);
    moveTo(target);
    schedule(() => {
      if (moodGenRef.current !== generation || fieldFindRef.current?.id !== find.id) return;
      setWalkMs(0);
      updateMood("find");
      updateFacing(facingForDirection(side));
      updateFieldFind({ ...find, picking: "crouch" });
      say(pickLine(LINES.findSelf), 1600, { topic: "find" });
      schedule(() => {
        if (fieldFindRef.current?.id === find.id) collectFieldFind({ self: true });
      }, FIND_CROUCH_MS);
    }, ms + 60);
  }

  function collectFieldFind({ self = false } = {}) {
    const fieldFind = fieldFindRef.current;
    if (moodRef.current === "hunt") return;
    if (!fieldFind) return;
    // Un clic mientras va a por el no lo recoge dos veces.
    if (fieldFind.picking && !self) return;
    window.dispatchEvent(new CustomEvent("daivr-buddy-quest-progress", {
      detail: { type: "field-find", id: fieldFind.id }
    }));
    updateFieldFind(null);
    updateMood("party");
    spawnParticles("confetti", 10);
    say(`${fieldFind.name} added to collection!`, 2600);
    settleDown(2800);
    schedule(() => endBuddyEvent("find"), 2900);
  }

  function showCreature(forcedId = "", options = {}) {
    creatureCooldownRef.current = Date.now();
    const pool = AMBIENT_CREATURES.filter((item) => item.id !== "frog");
    const item = forcedId
      ? AMBIENT_CREATURES.find((entry) => entry.id === forcedId)
      : pool[Math.floor(Math.random() * pool.length)];
    if (!item) return;
    if (item.id === "frog") {
      startRain();
      return;
    }
    if (item.id === "leap-fish") {
      window.dispatchEvent(new CustomEvent("daivr-footer-fish", {
        detail: { forceCollision: Boolean(options.forceCollision) }
      }));
      return;
    }
    if (!beginBuddyEvent(`creature:${item.id}`)) return;
    if (item.id !== "bird") {
      updateCreature({ ...item, side: inwardEventDirection(Math.random() < 0.5 ? -1 : 1), phase: "active" });
      schedule(() => {
        updateCreature((current) => current?.id === item.id ? null : current);
        endBuddyEvent(`creature:${item.id}`);
      }, 6200);
      return;
    }

    freezeAtCurrentPosition();
    updateMood("idle");
    updateCreature({ ...item, side: inwardEventDirection(Math.random() < 0.5 ? -1 : 1), phase: "fly-in" });
    schedule(() => {
      updateCreature((current) => current?.id === "bird" ? { ...current, phase: "landing" } : current);
    }, BIRD_ARRIVAL_MS);
    schedule(() => {
      updateCreature((current) => current?.id === "bird" ? { ...current, phase: "perched" } : current);
      if (["idle", "talk"].includes(moodRef.current)) say(pickLine(LINES.birdHello), 2400);
    }, BIRD_ARRIVAL_MS + BIRD_LANDING_MS);

    schedule(() => {
      updateCreature((current) => current?.id === "bird" ? { ...current, phase: "fly-out" } : current);
      if (["idle", "talk"].includes(moodRef.current)) {
        updateMood("shoo");
        say(pickLine(LINES.birdShoo), 2400);
      }
    }, BIRD_ARRIVAL_MS + BIRD_LANDING_MS + BIRD_PERCH_MS);

    schedule(() => {
      updateCreature((current) => current?.id === "bird" ? null : current);
      if (moodRef.current === "shoo") updateMood("idle");
      endBuddyEvent("creature:bird");
    }, BIRD_ARRIVAL_MS + BIRD_LANDING_MS + BIRD_PERCH_MS + BIRD_DEPARTURE_MS);
  }

  function startBugHunt(forcedWeapon = "") {
    if (!beginBuddyEvent("hunt")) return;
    enemyCooldownRef.current = Date.now();
    const encounterId = enemyEncounterRef.current + 1;
    enemyEncounterRef.current = encounterId;
    const bug = ENEMY_BUGS[Math.floor(Math.random() * ENEMY_BUGS.length)];
    // Martillo, red o pistola; con la llave inglesa, la pistola pesada. Los
    // nombres viejos (consola) siguen valiendo.
    const tools = inventoryRef.current.includes("wrench") ? ["heavy"] : ["hammer", "net", "gun"];
    const legacy = { wrench: "heavy", laser: "gun", flyswatter: "hammer" };
    const forced = legacy[forcedWeapon] || forcedWeapon;
    const weapon = ["hammer", "net", "gun", "heavy"].includes(forced)
      ? forced
      : tools[Math.floor(Math.random() * tools.length)];
    const side = inwardEventDirection(Math.random() < 0.5 ? -1 : 1);
    setEnemy({ ...bug, weapon, side, phase: "stalk" });
    updateFacing(side > 0 ? -1 : 1);
    updateMood("hunt");
    say(pickLine(LINES.bugHunt), 2200);

    const encounterIsActive = () => enemyEncounterRef.current === encounterId;

    schedule(() => {
      if (!encounterIsActive()) return;
      setEnemy((current) => current ? { ...current, phase: "ready" } : current);
    }, 900);

    schedule(() => {
      if (!encounterIsActive()) return;
      setEnemy((current) => current ? { ...current, phase: "attack" } : current);
    }, 1800);

    schedule(() => {
      if (!encounterIsActive()) return;
      setEnemy((current) => current ? { ...current, phase: "hit" } : current);
    }, 3300);

    schedule(() => {
      if (!encounterIsActive()) return;
      enemyEncounterRef.current = encounterId + 1;
      setEnemy(null);
      spawnParticles("confetti", 8);
      window.dispatchEvent(new CustomEvent("daivr-buddy-quest-progress", { detail: { type: "bug-defeated" } }));
      updateMood("party");
      say(`${bug.name}: ${pickLine(LINES.bugWin)}`, 2400);
      settleDown(2600);
      schedule(() => endBuddyEvent("hunt"), 2700);
    }, 4700);

    // Last-resort cleanup: even an exceptional interruption can never leave
    // a live bug parked beside Buddy after the encounter window has ended.
    schedule(() => {
      if (!encounterIsActive()) return;
      enemyEncounterRef.current = encounterId + 1;
      setEnemy(null);
      if (moodRef.current === "hunt") updateMood("idle");
      endBuddyEvent("hunt");
    }, 6500);
  }

  // El modo attract corta la caza a medias.
  function abortHunt() {
    enemyEncounterRef.current += 1;
    setEnemy(null);
  }

  const canFind = (now = Date.now()) => now - findCooldownRef.current > FIND_COOLDOWN_MS;
  const canHunt = (now = Date.now()) => !reduceMotion && now - enemyCooldownRef.current > ENEMY_COOLDOWN_MS;
  const canCreature = (now = Date.now()) => !reduceMotion && !creatureRef.current && now - creatureCooldownRef.current > CREATURE_COOLDOWN_MS;

  function onFindSignal() {
    if (activeEventRef.current) return;
    if (moodRef.current === "outage") return;
    if (moodRef.current === "hunt") return;
    if (!["idle", "talk"].includes(moodRef.current)) {
      freezeAtCurrentPosition();
      updateMood("idle");
    }
    startFind();
  }

  function onCreatureSignal(event) {
    if (activeEventRef.current) return;
    if (reduceMotion || moodRef.current === "outage") return;
    if (moodRef.current === "hunt") return;
    if (["off", "chute", "held", "sleep", "sleepy"].includes(moodRef.current)) {
      freezeAtCurrentPosition();
      updateMood("idle");
    }
    showCreature(event.detail?.id || "", event.detail || {});
  }

  function onEnemySignal(event) {
    if (activeEventRef.current) return;
    if (reduceMotion) return;
    if (moodRef.current === "outage") return;
    if (moodRef.current === "hunt") return;
    if (!["idle", "talk"].includes(moodRef.current)) {
      freezeAtCurrentPosition();
      updateMood("idle");
    }
    startBugHunt(event.detail?.weapon || "");
  }

  return {
    findCooldownRef,
    enemyCooldownRef,
    creatureCooldownRef,
    startFind,
    collectFieldFind,
    showCreature,
    startBugHunt,
    abortHunt,
    canFind,
    canHunt,
    canCreature,
    onFindSignal,
    onCreatureSignal,
    onEnemySignal
  };
}
