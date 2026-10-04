import { useEffect, useState } from "react";
import { AMBIENT_CREATURES, ENEMY_BUGS, FIELD_FINDS } from "../../data/buddyWorld";
import { LINES } from "./buddyLines";
import { clamp, randomBetween, SPRITE_WIDTH, WALK_MARGIN, WALK_SPEED_PX_S } from "./useBuddyCore";

/*
  Encuentros por el footer:
  - Hallazgos: Buddy encuentra algo brillante y el jugador lo recoge con un clic.
  - Bichos de visita: un pajaro que se le posa en la antena, una polilla de
    fosforo, la rana (que trae lluvia) y el pez que salta (FooterWildlife).
  - Caza de bugs: aparece un bug y Buddy lo borra con red, laser, matamoscas
    o la llave inglesa si la tiene.
*/

export const BIRD_ARRIVAL_MS = 1600;
export const BIRD_LANDING_MS = 420;
const BIRD_PERCH_MS = 4300;
export const BIRD_DEPARTURE_MS = 1500;
const FIND_COOLDOWN_MS = 70000;
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
    return () => {
      window.removeEventListener("daivr-buddy-find", api.onFindSignal);
      window.removeEventListener("daivr-buddy-creature", api.onCreatureSignal);
      window.removeEventListener("daivr-buddy-enemy", api.onEnemySignal);
    };
  }, [api]);

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
        updateFieldFind(null);
        if (moodGenRef.current === findGeneration && moodRef.current === "find") {
          updateMood("idle");
          say("loot signal expired...", 1600, { topic: "findMiss" });
        }
        endBuddyEvent("find");
      }, 11000);
    }, ms + 80);
  }

  function collectFieldFind() {
    const fieldFind = fieldFindRef.current;
    if (moodRef.current === "hunt") return;
    if (!fieldFind) return;
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
    const tools = inventoryRef.current.includes("wrench") ? ["wrench"] : ["net", "laser", "flyswatter"];
    const weapon = ["wrench", "net", "laser", "flyswatter"].includes(forcedWeapon)
      ? forcedWeapon
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
