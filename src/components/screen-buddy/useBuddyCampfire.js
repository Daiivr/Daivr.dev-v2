import { useEffect, useState } from "react";
import { LINES } from "./buddyLines";
import { nightKey, SPRITE_WIDTH, WALK_SPEED_PX_S } from "./useBuddyCore";

/*
  Noches de hoguera: al anochecer Buddy va a la hoguera del mercado
  (FooterScenery), se sienta mirando al fuego y pone algo en un palo:
  - un pez que ya ha pescado (del diario): se asa y da monedas, como mucho
    unas pocas por noche (`campfire-meal` en useBuddyAdventure);
  - si no, una nube que se tuesta... o se prende.
  Luego se la come, se levanta y sigue la patrulla. `daivr-buddy-campfire`
  (comando `campfire`) lo fuerza a cualquier hora.
*/

const CAMPFIRE_COOLDOWN_MS = 200_000;
const MEALS_PER_NIGHT = 3;
const MEALS_KEY = "daivr.campfireMeals.v1";
const SIT_MS = 900;
const TOAST_MS = 6500;
const EAT_MS = 2400;
const STAND_MS = 1800;
const BURNT_CHANCE = 0.3;
// Donde queda la punta del palo respecto al borde izquierdo de Buddy: mirando
// a la izquierda (palo a la izquierda) o, espejado, a la derecha.
const TIP_LEFT = 20;
const TIP_RIGHT = 92;

function mealsTonight() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(MEALS_KEY) || "null");
    return saved?.night === nightKey() ? Number(saved.meals) || 0 : 0;
  } catch {
    return MEALS_PER_NIGHT;
  }
}

function rememberMeal() {
  try {
    window.localStorage.setItem(MEALS_KEY, JSON.stringify({ night: nightKey(), meals: mealsTonight() + 1 }));
  } catch {
    // Sin almacenamiento no hay limite que guardar: mealsTonight ya devuelve el tope.
  }
}

export function useBuddyCampfire(core) {
  const [campfire, setCampfire] = useState(null);
  const [api] = useState(() => createCampfire(core, { setCampfire }));

  useEffect(() => {
    core.eventEndHandlers.set("campfire", () => setCampfire(null));
    api.cooldownRef.current = Date.now() - CAMPFIRE_COOLDOWN_MS + 40_000;
    window.addEventListener("daivr-buddy-campfire", api.onCampfireSignal);
    return () => {
      core.eventEndHandlers.delete("campfire");
      window.removeEventListener("daivr-buddy-campfire", api.onCampfireSignal);
    };
  }, [api, core]);

  return { api, view: { campfire } };
}

function createCampfire(core, { setCampfire }) {
  const { rootRef, moodRef, moodGenRef, xRef, activeEventRef, skyPhaseRef, caughtFishRef, reduceMotion } = core;
  const {
    beginBuddyEvent, endBuddyEvent, freezeAtCurrentPosition, updateMood, updateFacing, updateTravelDirection, faceTravelDirection,
    moveTo, schedule, say, pickLine, spawnParticles, stageWidth, setWalkMs, announceAction
  } = core;
  const cooldownRef = { current: 0 };

  // Centro de la hoguera en el escenario de Buddy, o null si no se ve.
  function campfireX() {
    const fire = document.querySelector(".footer-campfire");
    const stage = rootRef.current?.parentElement;
    if (!fire || !stage) return null;
    const rect = fire.getBoundingClientRect();
    if (!rect.width) return null;
    return rect.left + rect.width / 2 - stage.getBoundingClientRect().left;
  }

  function pickSnack() {
    const fish = caughtFishRef.current || [];
    if (fish.length && mealsTonight() < MEALS_PER_NIGHT && Math.random() < 0.6) {
      return { item: "fish", fish: fish[Math.floor(Math.random() * fish.length)] };
    }
    return { item: "marshmallow", fish: null };
  }

  function startCampfire() {
    const fireX = campfireX();
    if (fireX == null) return false;
    if (!beginBuddyEvent("campfire")) return false;
    cooldownRef.current = Date.now();
    freezeAtCurrentPosition();

    // A la derecha del fuego mirando hacia el; si no cabe, a la izquierda.
    const maxX = Math.max(4, stageWidth() - SPRITE_WIDTH - 4);
    let side = 1;
    let target = fireX + TIP_LEFT;
    if (target > maxX) {
      side = -1;
      target = Math.max(4, fireX - TIP_RIGHT);
    }
    const snack = pickSnack();
    const distance = Math.abs(target - xRef.current);
    const walkMs = distance < 4 ? 0 : Math.min(9000, (distance / WALK_SPEED_PX_S) * 1000);

    say(pickLine(LINES.campfire), 2400, { topic: "campfire" });
    announceAction("campfire", { targetX: target });
    if (walkMs) {
      faceTravelDirection(target > xRef.current ? 1 : -1);
      updateMood("walk");
      setWalkMs(walkMs);
      moveTo(target);
    }
    const walkGeneration = moodGenRef.current;

    schedule(() => {
      if (activeEventRef.current !== "campfire" || moodGenRef.current !== walkGeneration) return;
      setWalkMs(0);
      // Sentado, mirando al fuego (facing 1 mira a la izquierda).
      updateTravelDirection(side > 0 ? -1 : 1);
      updateFacing(side > 0 ? 1 : -1);
      updateMood("campfire");
      const generation = moodGenRef.current;
      const stillHere = () => activeEventRef.current === "campfire" && moodGenRef.current === generation;
      setCampfire({ phase: "sit", ...snack });

      schedule(() => {
        if (!stillHere()) return;
        setCampfire({ phase: "toast", ...snack });
        say(snack.item === "fish" ? `roasting a ${snack.fish.name.toLowerCase()}...` : pickLine(LINES.marshmallow), 2400, { topic: snack.item === "fish" ? "campfireCook" : "marshmallow" });
      }, SIT_MS);

      schedule(() => {
        if (stillHere() && Math.random() < 0.6) say(pickLine(LINES.campfireWait), 2000, { topic: "end" });
      }, SIT_MS + TOAST_MS * 0.5);

      schedule(() => {
        if (!stillHere()) return;
        if (snack.item === "fish") {
          setCampfire({ phase: "done", ...snack });
          rememberMeal();
          window.dispatchEvent(new CustomEvent("daivr-buddy-quest-progress", { detail: { type: "campfire-meal", id: snack.fish.id } }));
          spawnParticles("heart", 3);
          say(`${snack.fish.name}: grilled to perfection! +2 coins.`, 2800, { topic: "campfireCook" });
          return;
        }
        const burnt = Math.random() < BURNT_CHANCE;
        setCampfire({ phase: burnt ? "burnt" : "golden", ...snack });
        say(pickLine(burnt ? LINES.marshmallowBurnt : LINES.marshmallowGood), 2600, { topic: burnt ? "marshmallowBurnt" : "marshmallow" });
      }, SIT_MS + TOAST_MS);

      // Se lo come.
      schedule(() => {
        if (!stillHere()) return;
        setCampfire((current) => current ? { ...current, phase: "eaten" } : current);
      }, SIT_MS + TOAST_MS + EAT_MS);

      schedule(() => {
        if (!stillHere()) return;
        setCampfire(null);
        updateMood("idle");
        endBuddyEvent("campfire");
        if (Math.random() < 0.5) say(pickLine(LINES.campfireLeave), 2200, { priority: "ambient", key: "ambient", topic: "end" });
      }, SIT_MS + TOAST_MS + EAT_MS + STAND_MS);
    }, walkMs + 80);
    return true;
  }

  // De noche (o al anochecer), con la hoguera a la vista y sin prisa.
  function canStart(now = Date.now()) {
    return !reduceMotion
      && ["night", "dusk"].includes(skyPhaseRef.current)
      && now - cooldownRef.current > CAMPFIRE_COOLDOWN_MS
      && campfireX() != null;
  }

  // Gatillo manual (consola/tests): a cualquier hora, mismas reglas que la lluvia.
  function onCampfireSignal() {
    if (activeEventRef.current || reduceMotion) return;
    if (["outage", "hunt", "held", "chute"].includes(moodRef.current)) return;
    if (!["idle", "talk"].includes(moodRef.current)) {
      freezeAtCurrentPosition();
      updateMood("idle");
    }
    startCampfire();
  }

  return { cooldownRef, start: startCampfire, canStart, onCampfireSignal };
}
