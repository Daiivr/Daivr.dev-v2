import { useCallback, useEffect, useState } from "react";
import { fishingSpot } from "../../../shared/buddy-fishing-spot.mjs";
import { rareFishingEncounter } from "../../../shared/buddy-encounters.mjs";
import { KRAKEN, LEVIATHAN, weightedCatch } from "../../data/buddyWorld";
import { PORTAL_OPEN_MS } from "../BuddyFishingPortal";
import { clamp, SPRITE_WIDTH, WALK_SPEED_PX_S } from "./useBuddyCore";

/*
  Pesca de Buddy: el suelo del footer se abre, se acerca, lanza, espera,
  pica, pelea con los raros (que pueden escaparse) y muy de vez en cuando
  asoma el leviatan o el kraken. Tambien sus reacciones a los peces voladores
  del footer (los ve saltar, o le dan un golpe).
  El señuelo puesto cambia las reglas: espera, escapes y cada cuanto vuelve.
*/

const FISHING_COOLDOWN_MS = 100000;
const FISHING_SWIFT_COOLDOWN_MS = 55000;
const FISHING_CAST_MS = 560;

export function useBuddyFishing(core) {
  const [phase, setFishingPhase] = useState("");
  const [portal, setFishingPortal] = useState(null);
  const [catchTier, setFishingCatch] = useState("");
  const [catchId, setFishingCatchId] = useState("");
  const [leviathanResponse, setLeviathanResponse] = useState("");
  const [seaCreature, setSeaCreature] = useState("leviathan");
  const closePortal = useCallback((id) => {
    setFishingPortal((current) => current?.id === id ? null : current);
  }, []);
  const [api] = useState(() => createFishing(core, { setFishingPhase, setFishingPortal, setFishingCatch, setFishingCatchId, setLeviathanResponse, setSeaCreature }));

  useEffect(() => {
    // Al terminar la pesca (o cortarla) se cierra el agujero del suelo.
    core.eventEndHandlers.set("fishing", () => {
      setFishingPhase("");
      setFishingPortal((current) => current ? { ...current, phase: "closing" } : null);
    });
    // Primera pesca posible ~45s despues de montar; luego manda el cooldown.
    api.cooldownRef.current = Date.now() - FISHING_COOLDOWN_MS + 45000;
    const onAdminLeviathan = (event) => void core.runAdmin(event, () => api.start({ forceCreature: "leviathan" }));
    const onAdminKraken = (event) => void core.runAdmin(event, () => api.start({ forceCreature: "kraken" }));
    window.addEventListener("daivr-buddy-fish", api.onFishSignal);
    window.addEventListener("daivr-footer-fish-seen", api.reactToFishJump);
    window.addEventListener("daivr-footer-fish-bump", api.reactToFishBump);
    window.addEventListener("daivr-footer-wildlife-event", api.onWildlifeEvent);
    window.addEventListener("daivr-buddy-leviathan", onAdminLeviathan);
    window.addEventListener("daivr-buddy-kraken", onAdminKraken);
    return () => {
      core.eventEndHandlers.delete("fishing");
      window.removeEventListener("daivr-buddy-fish", api.onFishSignal);
      window.removeEventListener("daivr-footer-fish-seen", api.reactToFishJump);
      window.removeEventListener("daivr-footer-fish-bump", api.reactToFishBump);
      window.removeEventListener("daivr-footer-wildlife-event", api.onWildlifeEvent);
      window.removeEventListener("daivr-buddy-leviathan", onAdminLeviathan);
      window.removeEventListener("daivr-buddy-kraken", onAdminKraken);
    };
  }, [api, core]);

  return { api, view: { phase, portal, catchTier, catchId, leviathanResponse, seaCreature, closePortal } };
}

function createFishing(core, set) {
  const {
    moodRef, moodGenRef, xRef, activeEventRef, equippedGearRef, mikuCostumeRef, visibleRef, rootRef, fullMoonRef, reduceMotion
  } = core;
  const {
    beginBuddyEvent, endBuddyEvent, freezeAtCurrentPosition, updateMood, updateFacing, updateTravelDirection, faceTravelDirection,
    facingForDirection, moveTo, liftTo, schedule, say, clearDialogue, buddyLine, spawnParticles, playFx, settleDown, stageWidth, setWalkMs
  } = core;
  const { setFishingPhase, setFishingPortal, setFishingCatch, setFishingCatchId, setLeviathanResponse, setSeaCreature } = set;
  const cooldownRef = { current: 0 };
  const fishSightCommentRef = { current: 0 };
  // Lo que hace el jugador durante el leviatan (mantenerse firme, saludar).
  const leviathanInteractionRef = { current: null };

  // The opening belongs to the footer. Buddy notices it, approaches, then casts.
  function startFishing({ forceCreature = "" } = {}) {
    const spot = fishingSpot(stageWidth(), { miku: mikuCostumeRef.current });
    if (!spot) return;
    if (!beginBuddyEvent("fishing")) return;
    cooldownRef.current = Date.now();
    leviathanInteractionRef.current = null;
    setLeviathanResponse("");
    freezeAtCurrentPosition();
    const { target, castLeft, portalX } = spot;
    const distance = Math.abs(target - xRef.current);
    const portalId = cooldownRef.current;
    setFishingPortal({ id: portalId, x: portalX, phase: "opening" });
    setFishingPhase("approach");
    updateMood("talk");
    const noticeGeneration = moodGenRef.current;
    clearDialogue();
    say("the floor cracked... there's water underneath!", 2600, { topic: "fishCast" });

    function beginSession() {
      // En el sprite base facing 1 apunta a la izquierda. Cerca de un borde
      // lanza hacia dentro; en el centro puede elegir cualquiera de los lados.
      updateTravelDirection(castLeft ? -1 : 1);
      updateFacing(castLeft ? 1 : -1);
      updateMood("fishing");
      const generation = moodGenRef.current;
      const stillFishing = () => moodGenRef.current === generation && moodRef.current === "fishing";

      setFishingPhase("cast");
      setFishingCatch("");
      setFishingCatchId("");
      // Con luna llena los raros pican mas, y Buddy lo sabe.
      const fullMoon = fullMoonRef.current;
      say(fullMoon && Math.random() < 0.5 ? "full moon. the rare ones are biting tonight." : buddyLine("fishCast"), 2000, fullMoon ? { topic: "fullMoon" } : {});

      schedule(() => {
        if (stillFishing()) setFishingPhase("wait");
      }, FISHING_CAST_MS);

      // El señuelo puesto define las reglas de la sesion.
      const lure = equippedGearRef.current.lure;
      const waitMs = forceCreature ? 0 : lure === "lure-swift" ? 3200 + Math.random() * 2800 : 7000 + Math.random() * 6000;

      schedule(() => {
        if (stillFishing() && !forceCreature) say(buddyLine("fishWait"), 2200);
      }, 2600 + Math.random() * 2400);

      if (waitMs > 9500) {
        schedule(() => {
          if (stillFishing()) say(buddyLine("fishWait"), 2200);
        }, 7800);
      }

      schedule(() => {
        if (!stillFishing()) return;
        setFishingPhase("bite");
        say("!", 900, { topic: "fishFight" });
      }, FISHING_CAST_MS + waitMs);

      function landCatch(catchItem) {
        const tier = catchItem.rarity;
        setFishingPhase("catch");
        setFishingCatch(tier);
        setFishingCatchId(catchItem.id);
        spawnParticles("splash", 7);
        const prefix = catchItem.kind === "treasure" ? "TREASURE" : tier === "mythic" ? "MYTHIC" : tier === "legendary" ? "LEGENDARY" : tier === "rare" ? "RARE" : "caught";
        const rareEncore = mikuCostumeRef.current && ["rare", "legendary", "mythic"].includes(tier)
          ? ` ${buddyLine("fishRare")}`
          : "";
        say(`${prefix}: ${catchItem.name}!${rareEncore}`, 3300);

        // Toda captura suma al total (desbloquea aparejos); las raras
        // ademas avanzan la quest Void angler.
        window.dispatchEvent(new CustomEvent("daivr-buddy-quest-progress", {
          detail: { type: "fishing-haul", tier, catchId: catchItem.id }
        }));
      }

      function endSessionAfter(ms) {
        schedule(() => {
          if (!stillFishing()) return;
          setFishingPhase("");
          setFishingCatch("");
          setFishingCatchId("");
          updateMood("idle");
          endBuddyEvent("fishing");
        }, ms);
      }

      schedule(() => {
        if (!stillFishing()) return;

        // Muy rara vez la sombra no es una captura: es algo que puede tirar
        // del propio Buddy al agua antes de soltar la linea.
        const encounter = forceCreature || rareFishingEncounter();
        if (encounter) {
          const monster = encounter === "kraken" ? KRAKEN : LEVIATHAN;
          setSeaCreature(encounter);
          setFishingPhase("omen");
          setFishingCatch("mythic");
          setFishingCatchId(monster.id);
          clearDialogue();
          say("the water went quiet. something is coming.", 5000, { topic: "leviathan" });
          schedule(() => {
            if (!stillFishing()) return;
            setFishingPhase("monster");
            const interactions = new Set();
            leviathanInteractionRef.current = (action) => {
              if (!stillFishing() || interactions.has(action) || !["steady", "signal"].includes(action)) return;
              interactions.add(action);
              setLeviathanResponse(action);
              liftTo(action === "steady" ? 0 : 5);
              clearDialogue();
              say(action === "steady" ? "feet on the ground. we've got this, together." : encounter === "kraken" ? "eight arms... and one is waving at me!" : "hey, big friend... it blinked back!", 3600);
              spawnParticles(action === "steady" ? "splash" : "heart", 6);
            };
            clearDialogue();
            say(encounter === "kraken" ? "that's a lot of arms. please don't take my rod!" : buddyLine("leviathan"), 5000);
            spawnParticles("splash", 14);
            liftTo(12);
            window.dispatchEvent(new CustomEvent("daivr-buddy-quest-progress", {
              detail: { type: "fishing-sighting", id: monster.id }
            }));
          }, 5500);

          schedule(() => {
            if (!stillFishing()) return;
            liftTo(0);
            leviathanInteractionRef.current = null;
            setFishingPhase("retreat");
            clearDialogue();
            say("until next time, big friend.", 2600, { topic: "fishEscape" });
            endSessionAfter(3500);
          }, 19000);
          return;
        }

        const catchItem = weightedCatch(lure, { fullMoon });
        const fightsBack = ["rare", "legendary", "mythic"].includes(catchItem.rarity);

        if (!fightsBack) {
          landCatch(catchItem);
          endSessionAfter(2400);
          return;
        }

        // Los raros pelean: tira de la linea un rato y puede escaparse
        // (el lucky lure tambien ayuda a no perderlos).
        setFishingPhase("fight");
        say(buddyLine("fishFight"), 2000);
        const fightMs = 2600 + Math.random() * 1400;

        schedule(() => {
          if (stillFishing()) say(buddyLine("fishFight"), 1700);
        }, fightMs * 0.55);

        schedule(() => {
          if (!stillFishing()) return;
          const escaped = Math.random() < (lure === "lure" ? 0.15 : lure === "lure-anchor" ? 0.05 : 0.35);

          if (escaped) {
            setFishingPhase("escape");
            spawnParticles("splash", 9);
            playFx("dizzy", 900);
            say(buddyLine("fishEscape"), 2400);
            endSessionAfter(2000);
            return;
          }

          landCatch(catchItem);
          endSessionAfter(2400);
        }, fightMs);
      }, FISHING_CAST_MS + waitMs + 880);
    }

    schedule(() => {
      if (moodGenRef.current !== noticeGeneration || activeEventRef.current !== "fishing") return;
      setFishingPortal((current) => current?.id === portalId ? { ...current, phase: "open" } : current);
      faceTravelDirection(target > xRef.current ? 1 : -1);
      updateMood("walk");
      const generation = moodGenRef.current;
      const ms = Math.max(120, distance / WALK_SPEED_PX_S * 1000);
      setWalkMs(ms);
      moveTo(target);
      schedule(() => {
        if (moodGenRef.current !== generation || activeEventRef.current !== "fishing") return;
        setWalkMs(0);
        beginSession();
      }, ms + 80);
    }, PORTAL_OPEN_MS + 200);
  }

  // El swift lure acorta tambien la espera entre sesiones.
  function canStart(now = Date.now()) {
    const cooldownMs = equippedGearRef.current.lure === "lure-swift" ? FISHING_SWIFT_COOLDOWN_MS : FISHING_COOLDOWN_MS;
    return !reduceMotion && now - cooldownRef.current > cooldownMs;
  }

  // Le tocan mientras pesca: se suelta la captura.
  function clearCatch() {
    setFishingPhase("");
    setFishingCatch("");
    setFishingCatchId("");
  }

  // La ventana cambia de tamaño a mitad de pesca: el agujero ya no esta
  // donde estaba, asi que se deja.
  function abort() {
    if (activeEventRef.current !== "fishing") return;
    freezeAtCurrentPosition();
    endBuddyEvent("fishing");
    setFishingCatch("");
    setFishingCatchId("");
    liftTo(0);
    updateMood("idle");
  }

  // Gatillo manual de pesca (consola/tests): respeta humor y motion.
  function onFishSignal() {
    if (!visibleRef.current || reduceMotion) return;
    if (!["idle", "talk"].includes(moodRef.current)) return;
    startFishing();
  }

  function reactToFishJump(event) {
    if (!visibleRef.current) return;
    if (activeEventRef.current !== "flying-fish") return;
    if (!["idle", "talk", "walk", "rain"].includes(moodRef.current)) return;
    if (Date.now() - fishSightCommentRef.current < 38000 || Math.random() > 0.34) return;
    const fishX = clamp(Number(event.detail?.x || 50), 0, 100) / 100 * stageWidth();
    fishSightCommentRef.current = Date.now();
    updateFacing(facingForDirection(fishX >= xRef.current ? 1 : -1));
    say(buddyLine("fishSight"), 2300);
  }

  function reactToFishBump(event) {
    if (!visibleRef.current) return;
    if (activeEventRef.current !== "flying-fish") return;
    if (["off", "sleep", "sleepy", "held", "chute", "outage", "hunt"].includes(moodRef.current)) return;
    const direction = Number(event.detail?.direction) < 0 ? -1 : 1;
    freezeAtCurrentPosition();
    updateMood("talk");
    const maxX = Math.max(4, stageWidth() - SPRITE_WIDTH - 4);
    const nudge = clamp((Number(event.detail?.speed) || 120) * .065, 5, 12);
    setWalkMs(160);
    moveTo(clamp(xRef.current + direction * nudge, 4, maxX));
    rootRef.current?.style.setProperty("--buddy-bump-lean", `${direction * 9}deg`);
    updateFacing(facingForDirection(-direction));
    playFx("bump", 620);
    spawnParticles("splash", 5);
    say(buddyLine("fishBump"), 2200);
    const generation = moodGenRef.current;
    schedule(() => { if (moodGenRef.current === generation) setWalkMs(0); }, 200);
    settleDown(2300);
  }

  function onWildlifeEvent(event) {
    const detail = event.detail || {};
    if (detail.active) beginBuddyEvent("flying-fish");
    else endBuddyEvent("flying-fish");
  }

  return {
    cooldownRef,
    start: startFishing,
    canStart,
    clearCatch,
    abort,
    interact: (action) => leviathanInteractionRef.current?.(action),
    onFishSignal,
    reactToFishJump,
    reactToFishBump,
    onWildlifeEvent
  };
}
