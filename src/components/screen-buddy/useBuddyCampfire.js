import { useEffect, useState } from "react";
import { LINES } from "./buddyLines";
import { nightKey, SPRITE_WIDTH, WALK_SPEED_PX_S } from "./useBuddyCore";

/*
  Noches de hoguera: al anochecer Buddy va a la hoguera del mercado
  (FooterWorld), se sienta mirando al fuego y pone algo en un palo:
  - un pez que ya ha pescado (del diario): se asa y da monedas, como mucho
    unas pocas por noche (`campfire-meal` en useBuddyAdventure);
  - si no, una nube que se tuesta... o se prende.
  Luego se la come, se levanta y sigue la patrulla. `daivr-buddy-campfire`
  (comando `campfire`) lo fuerza a cualquier hora.

  La lluvia apaga la hoguera (FooterWorld avisa con `daivr-campfire-state`)
  y ya no se enciende sola: cuando escampa, Buddy va, se agacha a su lado y la
  prende con una cerilla (`daivr-campfire-relight`). Si estaba asando algo
  cuando se apago, lo deja.
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
// Encender: agachado a esta distancia del centro del fuego (la cerilla llega a
// los troncos), cuanto espera tras escampar, cada cuanto lo reintenta si esta
// ocupado, cuando prende (tras la tercera rascada) y cuando se levanta.
const LIGHT_GAP = 22;
const RELIGHT_DELAY_MS = 2600;
const RELIGHT_RETRY_MS = 5000;
const STRIKE_MS = 2300;
const RELIT_MS = 3600;
const HOP_BACK_PX = 16;
const HOP_BACK_MS = 320;
const RELIGHT_MOODS = ["idle", "talk", "walk", "sleepy"];

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
    core.eventEndHandlers.set("campfire", api.onEventEnd);
    api.cooldownRef.current = Date.now() - CAMPFIRE_COOLDOWN_MS + 40_000;
    window.addEventListener("daivr-buddy-campfire", api.onCampfireSignal);
    window.addEventListener("daivr-campfire-state", api.onFireState);
    return () => {
      core.eventEndHandlers.delete("campfire");
      window.removeEventListener("daivr-buddy-campfire", api.onCampfireSignal);
      window.removeEventListener("daivr-campfire-state", api.onFireState);
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
  // Lo que cuenta el mundo de la hoguera, y el reintento de encenderla.
  const fire = { out: false, raining: false, retry: 0, lighting: false };

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

  // Escampo y la hoguera sigue apagada: Buddy va a encenderla.
  function startRelight() {
    const fireX = campfireX();
    if (fireX == null) return false;
    if (!beginBuddyEvent("campfire")) return false;
    if (!["idle", "talk"].includes(moodRef.current)) updateMood("idle");
    freezeAtCurrentPosition();
    fire.lighting = true;

    // Del lado en el que ya esta; si no cabe, del otro.
    const maxX = Math.max(4, stageWidth() - SPRITE_WIDTH - 4);
    const half = SPRITE_WIDTH / 2;
    let side = xRef.current + half >= fireX ? 1 : -1;
    let target = fireX + side * LIGHT_GAP - half;
    if (target > maxX || target < 4) {
      side = -side;
      target = Math.min(maxX, Math.max(4, fireX + side * LIGHT_GAP - half));
    }
    const distance = Math.abs(target - xRef.current);
    const walkMs = distance < 4 ? 0 : Math.min(9000, (distance / WALK_SPEED_PX_S) * 1000);

    // (misma clave: si aun no ha salido cuando prende, la de "ya esta" la quita de la cola)
    say(pickLine(LINES.campfireRelight), 2400, { topic: "campfire", key: "campfire-relight" });
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
      // Si ha vuelto a llover por el camino, lo deja para luego.
      if (fire.raining) {
        updateMood("idle");
        endBuddyEvent("campfire");
        return;
      }
      updateTravelDirection(side > 0 ? -1 : 1);
      updateFacing(side > 0 ? 1 : -1);
      updateMood("campfire");
      const generation = moodGenRef.current;
      const stillHere = () => activeEventRef.current === "campfire" && moodGenRef.current === generation;
      setCampfire({ phase: "light" });

      // A la tercera rascada prende la cerilla y la acerca a los troncos.
      schedule(() => {
        if (!stillHere()) return;
        fire.out = false;
        window.dispatchEvent(new CustomEvent("daivr-campfire-relight"));
      }, STRIKE_MS);

      // Al prender, un saltito hacia atras para no quedarse pegado a las llamas.
      schedule(() => {
        if (!stillHere()) return;
        setWalkMs(HOP_BACK_MS);
        moveTo(Math.min(maxX, Math.max(4, target + side * HOP_BACK_PX)));
      }, STRIKE_MS + 300);

      schedule(() => {
        if (!stillHere()) return;
        setCampfire(null);
        updateMood("idle");
        endBuddyEvent("campfire");
        spawnParticles("heart", 2);
        say(pickLine(LINES.campfireRelit), 2400, { topic: "campfire", key: "campfire-relight" });
      }, RELIT_MS);
    }, walkMs + 80);
    return true;
  }

  function queueRelight(ms) {
    if (fire.retry) return;
    fire.retry = schedule(() => {
      fire.retry = 0;
      tryRelight();
    }, ms);
  }

  // Si esta ocupado (otro evento, durmiendo, pescando...), lo vuelve a
  // intentar mas tarde. Sin movimiento, la hoguera se enciende sola.
  function tryRelight() {
    if (!fire.out || fire.raining) return;
    if (reduceMotion) {
      fire.out = false;
      window.dispatchEvent(new CustomEvent("daivr-campfire-relight"));
      return;
    }
    if (activeEventRef.current || !RELIGHT_MOODS.includes(moodRef.current) || !startRelight()) queueRelight(RELIGHT_RETRY_MS);
  }

  // `daivr-campfire-state` (FooterWorld): { out, raining }.
  function onFireState(event) {
    const wasOut = fire.out;
    fire.out = Boolean(event.detail?.out);
    fire.raining = Boolean(event.detail?.raining);
    if (fire.out && !wasOut) {
      // Se apago mientras asaba algo: se levanta y lo deja.
      if (activeEventRef.current === "campfire" && !fire.lighting) {
        setCampfire(null);
        updateMood("idle");
        endBuddyEvent("campfire");
        say(pickLine(LINES.campfireOut), 2400, { topic: "rain" });
      } else if (Math.random() < 0.7) {
        say(pickLine(LINES.campfireOut), 2200, { priority: "ambient", key: "ambient", topic: "rain" });
      }
    }
    if (fire.out && !fire.raining) queueRelight(RELIGHT_DELAY_MS);
  }

  // Al acabar el evento (o si lo corta el modo arcade): si la hoguera sigue
  // apagada, ya lo intentara luego.
  function onEventEnd() {
    setCampfire(null);
    fire.lighting = false;
    if (fire.out && !fire.raining) queueRelight(RELIGHT_RETRY_MS);
  }

  // De noche (o al anochecer), con la hoguera encendida y a la vista, y sin prisa.
  function canStart(now = Date.now()) {
    return !reduceMotion
      && !fire.out
      && ["night", "dusk"].includes(skyPhaseRef.current)
      && now - cooldownRef.current > CAMPFIRE_COOLDOWN_MS
      && campfireX() != null;
  }

  // Gatillo manual (consola/tests): a cualquier hora, mismas reglas que la lluvia.
  function onCampfireSignal() {
    if (activeEventRef.current || reduceMotion) return;
    if (["outage", "hunt", "held", "chute"].includes(moodRef.current)) return;
    // Con la hoguera apagada: si llueve no hay nada que hacer; si no, la enciende.
    if (fire.out && fire.raining) {
      say("too wet for a fire right now.", 2200, { topic: "rain" });
      return;
    }
    if (!["idle", "talk"].includes(moodRef.current)) {
      freezeAtCurrentPosition();
      updateMood("idle");
    }
    if (fire.out) startRelight();
    else startCampfire();
  }

  return { cooldownRef, start: startCampfire, canStart, onCampfireSignal, onFireState, onEventEnd };
}
