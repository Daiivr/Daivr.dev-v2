import { useEffect, useLayoutEffect, useMemo } from "react";
import { BuddyFishingPortal } from "./BuddyFishingPortal";
import { LURE_IDS, ROD_IDS } from "../hooks/useBuddyLoadout";
import { LeviathanEncounter } from "./LeviathanEncounter";
import { PipChute } from "./PipChute";
import { PipSprite } from "./PipSprite";
import { LINES } from "./screen-buddy/buddyLines";
import { clamp, desktopQuery, reduceMotionQuery, SPRITE_WIDTH, useBuddyCore, WALK_MARGIN, FALL_SPEED_PX_S } from "./screen-buddy/useBuddyCore";
import { useBuddyCampfire } from "./screen-buddy/useBuddyCampfire";
import { useBuddyChat } from "./screen-buddy/useBuddyChat";
import { useBuddySky } from "./screen-buddy/useBuddySky";
import { useBuddyDrag } from "./screen-buddy/useBuddyDrag";
import { useBuddyEncounters } from "./screen-buddy/useBuddyEncounters";
import { useBuddyFishing } from "./screen-buddy/useBuddyFishing";
import { useBuddyOutage } from "./screen-buddy/useBuddyOutage";
import { useBuddyWeather } from "./screen-buddy/useBuddyWeather";
import { dropActor, publishActor } from "../lib/pixelWorld/worldBus";
import { outfitFor } from "../lib/pixelWorld/pip/outfit";

const SLEEP_AFTER_MS = 5 * 60 * 1000;
const ATTRACT_WAKE_DELAY_MS = 1000;
const SLEEPY_SPEED_PX_S = 30;
const BRAIN_TICK_MS = 1100;
const CORNER_MARGIN = 12;
const PET_SPAM_WINDOW_MS = 2600;
const EYE_TRACK_RADIUS = 340;

/*
  buddy.exe v3 — mascota del cabinet anclada al footer:
  - patrulla la barra, se detiene a comentar, baila, mira al cursor;
  - en desktop camina hasta una esquina libre del footer para dormir;
  - se puede agarrar y soltar: baja en paracaidas hasta el riel;
  - niveles de amistad (props) desbloquean cosmeticos: gorro, lentes, bufanda,
    LED dorado;
  - comenta la cancion de Spotify si hay una sonando.
  Cada humor lleva un contador de generacion para que timers viejos no pisen
  estados nuevos.

  Las piezas viven en screen-buddy/: el nucleo compartido (useBuddyCore), la
  pesca, el tiempo, los encuentros, el apagon, la charla y el arrastre. Aqui
  quedan el cerebro (que hacer en cada momento), las caricias y el dibujo.
*/
export function ScreenBuddy({ onPet, onPowerOutage, user = null, visitCount, friendshipLevel = 1, inventory = [], hiddenGear = [], unlockedGear = [], nowPlaying = null, skyPhase = "day", caughtFish = [], fullMoon = false, meteorShower = "" }) {
  const { core, view } = useBuddyCore();
  const fishing = useBuddyFishing(core);
  const weather = useBuddyWeather(core);
  const encounters = useBuddyEncounters(core, { startRain: weather.api.startRain });
  const outage = useBuddyOutage(core);
  const campfire = useBuddyCampfire(core);
  const chat = useBuddyChat(core);
  const sky = useBuddySky(core);
  const drag = useBuddyDrag(core);
  const { mood, fx, bubble, x, y, facing, travelDirection, walkMs, particles } = view;
  const { fieldFind, creature, enemy } = encounters.view;
  const { outagePhase } = outage.view;
  const fishingView = fishing.view;
  const {
    rootRef, moodRef, xRef, activeEventRef, lastActivityRef, visibleRef, bootedRef, dropInFlightRef, attractModeRef, moodGenRef, petTimesRef
  } = core;

  // Aparejo puesto (hiddenGear ya trae la exclusividad de slot resuelta):
  // el señuelo define las reglas de pesca, la caña solo el color.
  const equippedLure = LURE_IDS.find((id) => unlockedGear.includes(id) && !hiddenGear.includes(id)) || "";
  const equippedRod = ROD_IDS.find((id) => unlockedGear.includes(id) && !hiddenGear.includes(id)) || "";
  const hasMikuCostume = unlockedGear.includes("miku-costume") && !hiddenGear.includes("miku-costume");
  const hasRocketBoots = unlockedGear.includes("rocket-boots") && !hiddenGear.includes("rocket-boots");
  // Lo que lleva Pip (el sprite lo dibuja FooterWorld): mismas reglas que antes.
  const outfitKey = JSON.stringify([friendshipLevel, inventory, hiddenGear, unlockedGear]);
  const outfit = useMemo(() => outfitFor({ friendshipLevel, inventory, hiddenGear, unlockedGear }), [outfitKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lo que llega por props, a los refs que leen timers y listeners.
  useEffect(() => {
    core.onPowerOutageRef.current = onPowerOutage;
  }, [core, onPowerOutage]);

  useEffect(() => {
    const name = String(user?.username || "guest").trim().slice(0, 24) || "guest";
    core.userRef.current = { name, discord: Boolean(user?.username) };
  }, [core, user]);

  useEffect(() => {
    core.visitCountRef.current = typeof visitCount === "number" ? visitCount : null;
  }, [core, visitCount]);

  useEffect(() => {
    core.nowPlayingRef.current = nowPlaying?.song ? nowPlaying : null;
  }, [core, nowPlaying]);

  useEffect(() => {
    core.equippedGearRef.current = { lure: equippedLure, rod: equippedRod };
  }, [core, equippedLure, equippedRod]);

  useEffect(() => {
    core.mikuCostumeRef.current = hasMikuCostume;
    core.rocketBootsRef.current = hasRocketBoots;
  }, [core, hasMikuCostume, hasRocketBoots]);

  useEffect(() => {
    core.inventoryRef.current = inventory;
  }, [core, inventory]);

  useEffect(() => {
    core.skyPhaseRef.current = skyPhase;
    core.caughtFishRef.current = caughtFish;
    core.fullMoonRef.current = fullMoon;
    core.showerRef.current = meteorShower;
  }, [core, skyPhase, caughtFish, fullMoon, meteorShower]);

  function handlePet() {
    if (drag.draggedRef.current) return;
    if (activeEventRef.current) return;
    if (["held", "chute", "outage", "hunt"].includes(moodRef.current)) return;

    const wasAsleep = moodRef.current === "sleep" || moodRef.current === "sleepy";
    const wasFishing = moodRef.current === "fishing";
    lastActivityRef.current = Date.now();

    if (wasFishing) fishing.api.clearCatch();

    // Le acaban de saludar desde otro footer: el clic devuelve el saludo.
    if (!wasAsleep && !wasFishing && chat.api.waveBack()) {
      core.freezeAtCurrentPosition();
      core.updateMood("pet");
      core.spawnParticles("heart", 3);
      onPet?.();
      core.settleDown(1700);
      return;
    }

    if (wasAsleep) {
      const hour = new Date().getHours();
      if (hour >= 0 && hour < 6) {
        window.dispatchEvent(new CustomEvent("daivr-buddy-quest-progress", {
          detail: { type: "midnight-wakeup" }
        }));
      }
    }

    const now = Date.now();
    petTimesRef.current = [...petTimesRef.current.filter((t) => now - t < PET_SPAM_WINDOW_MS), now];

    core.freezeAtCurrentPosition();

    if (petTimesRef.current.length >= 4) {
      petTimesRef.current = [];
      core.updateMood("pet");
      core.playFx("dizzy", 1500);
      core.say(core.pickLine(LINES.petSpam), 2000, { key: "pet" });
      core.settleDown(1700);
      onPet?.();
      return;
    }

    core.updateMood("pet");
    core.spawnParticles("heart", 3);
    const identity = core.userRef.current;
    const petLine = !wasAsleep && !wasFishing && identity.discord && Math.random() < 0.35
      ? `${identity.name}! ${core.buddyLine("pet")}`
      : wasAsleep ? core.pickLine(LINES.wake) : wasFishing ? core.buddyLine("fishInterrupt") : core.buddyLine("pet");
    core.say(petLine, 1900, { key: "pet", topic: wasAsleep ? "wake" : wasFishing ? "fishInterrupt" : "pet" });
    onPet?.();
    core.settleDown(1700);
  }

  function handleFlip() {
    if (reduceMotionQuery?.matches) return;
    if (activeEventRef.current) return;
    if (["held", "chute", "hunt"].includes(moodRef.current)) return;
    core.playFx("flip", 800);
    core.say(core.pickLine(LINES.flip), 1800);
  }

  // --- Cerebro ---------------------------------------------------------------

  useEffect(() => {
    const timers = core.timersRef.current;
    const { reduceMotion } = core;
    const {
      updateMood, say, pickLine, buddyLine, schedule, settleDown, playFx, moveTo, liftTo, setWalkMs, stageWidth,
      freezeAtCurrentPosition, faceTravelDirection, updateFacing, facingForDirection, clearDialogue, endBuddyEvent,
      greetingPool, startWalk, announceAction
    } = core;
    const stage = rootRef.current?.parentElement;
    core.disposed = false;

    function bootUp() {
      bootedRef.current = true;
      moveTo(Math.min(Math.max(WALK_MARGIN, stageWidth() * 0.14), stageWidth() - WALK_MARGIN - SPRITE_WIDTH));

      if (reduceMotion) {
        updateMood("idle");
        say(pickLine(greetingPool()), 2600);
        return;
      }

      // Aterrizaje inaugural: continua el salto desde la puerta de bienvenida,
      // entrando en paracaidas desde arriba hasta tocar el riel.
      const parentTop = rootRef.current?.parentElement?.getBoundingClientRect().top ?? 300;
      const dropFrom = Math.round(Math.max(200, Math.min(320, parentTop - 30)));
      liftTo(-dropFrom);
      updateMood("chute");
      const generation = moodGenRef.current;
      const fallMs = clamp((dropFrom / FALL_SPEED_PX_S) * 1000, 900, 6500);

      // Un tick para que la posicion elevada pinte antes de iniciar la caida.
      schedule(() => {
        if (moodGenRef.current !== generation) return;
        setWalkMs(fallMs);
        liftTo(0);
      }, 60);

      schedule(() => {
        if (moodGenRef.current !== generation || moodRef.current !== "chute") return;
        setWalkMs(0);
        updateMood("idle");
        say(pickLine(greetingPool()), 2600);
      }, fallMs + 200);
    }

    // En desktop camina hasta la esquina mas cercana del footer y duerme ahi;
    // en mobile (o con motion reducido) se duerme donde este.
    function goToSleep() {
      function enterSleep() {
        updateMood("sleep");
        window.dispatchEvent(new CustomEvent("daivr-buddy-sleep"));
      }

      if (!desktopQuery?.matches || reduceMotion) {
        enterSleep();
        clearDialogue();
        return;
      }

      const width = stageWidth();
      const leftCorner = CORNER_MARGIN;
      const rightCorner = Math.max(leftCorner, width - SPRITE_WIDTH - CORNER_MARGIN);
      const target = xRef.current < width / 2 ? leftCorner : rightCorner;
      const distance = Math.abs(target - xRef.current);

      if (distance < 24) {
        enterSleep();
        clearDialogue();
        return;
      }

      faceTravelDirection(target > xRef.current ? 1 : -1);
      updateMood("sleepy");
      say(pickLine(LINES.sleepy), 2000);
      const generation = moodGenRef.current;
      const ms = Math.min(11000, (distance / SLEEPY_SPEED_PX_S) * 1000);
      setWalkMs(ms);
      moveTo(target);

      schedule(() => {
        if (moodGenRef.current !== generation || moodRef.current !== "sleepy") return;
        enterSleep();
        clearDialogue();
      }, ms + 80);
    }

    function brainTick() {
      if (!visibleRef.current) return;
      if (attractModeRef.current) return;
      if (activeEventRef.current) return;

      const currentMood = moodRef.current;
      if (["off", "walk", "pet", "party", "dance", "held", "chute", "fishing", "rain", "find", "hunt", "outage", "shoo", "campfire"].includes(currentMood)) return;

      const idleFor = Date.now() - lastActivityRef.current;

      if (currentMood === "sleepy") {
        // El usuario volvio antes de llegar a la cama: cancela la caminata.
        if (idleFor < SLEEP_AFTER_MS) {
          freezeAtCurrentPosition();
          updateMood("idle");
          say(pickLine(LINES.wake), 1700);
        }
        return;
      }

      if (idleFor > SLEEP_AFTER_MS) {
        if (currentMood !== "sleep") goToSleep();
        return;
      }

      if (currentMood === "sleep") {
        updateMood("idle");
        say(pickLine(LINES.wake), 1700);
        return;
      }

      if (currentMood === "talk") return;

      // Hay version nueva, o lleva un buen rato aqui: lo cuenta ahora.
      if (chat.api.announceUpdate()) return;
      if (chat.api.announceMilestone()) return;
      if (sky.api.announceNight()) return;

      const now = Date.now();
      const roll = Math.random();
      if (outage.api.canStart(now) && roll < 0.0007) {
        outage.api.start();
      } else if (encounters.api.canHunt(now) && roll < 0.025) {
        encounters.api.startBugHunt();
      } else if (encounters.api.canFind(now) && roll < 0.06) {
        encounters.api.startFind();
      } else if (weather.api.canRain(now) && roll < 0.09) {
        weather.api.startRain();
      } else if (fishing.api.canStart(now) && roll < 0.14) {
        fishing.api.start();
      } else if (campfire.api.canStart(now) && roll < 0.17) {
        campfire.api.start();
      } else if (encounters.api.canCreature(now) && roll < 0.2) {
        encounters.api.showCreature();
      } else if (roll < 0.3 && !reduceMotion) {
        startWalk();
      } else if (roll < 0.46) {
        chat.api.idleTalk();
      } else if (roll < 0.51 && !reduceMotion) {
        updateMood("dance");
        if (Math.random() < 0.5) say(buddyLine("dance"), 2200, { priority: "ambient", key: "ambient" });
        else announceAction("dance");
        settleDown(2600);
      } else if (roll < 0.58 && !reduceMotion) {
        playFx("static", 700);
        announceAction("glitch");
      } else if (roll < 0.66 && !reduceMotion) {
        playFx("scan", 1600);
        announceAction("scan");
      }
    }

    function markActivity() {
      // Coin interaction belongs to attract mode; Buddy wakes only after its
      // closing transition reports that the cabinet is visible again.
      if (attractModeRef.current) return;
      lastActivityRef.current = Date.now();
    }

    function reactToAttractMode(event) {
      const active = Boolean(event.detail?.active);
      attractModeRef.current = active;

      if (active) {
        if (activeEventRef.current) endBuddyEvent(activeEventRef.current);
        outage.api.abort();
        freezeAtCurrentPosition();
        clearDialogue();
        encounters.api.abortHunt();
        if (moodRef.current !== "sleep") updateMood("sleep");
        return;
      }

      lastActivityRef.current = Date.now();
      schedule(() => {
        if (attractModeRef.current || moodRef.current !== "sleep") return;
        updateMood("idle");
        say(pickLine(LINES.wake), 1800);
      }, ATTRACT_WAKE_DELAY_MS);
    }

    // Relevo con la caida de bienvenida (BuddyDrop): mientras el clon del
    // splash sigue en el aire, este buddy NO aparece (evita duplicados); al
    // tocar el riel, toma el control exactamente donde aterrizo.
    function onDropSignal(event) {
      const detail = event.detail || {};

      if (detail.phase === "start") {
        dropInFlightRef.current = true;
        return;
      }

      if (detail.phase === "land") {
        dropInFlightRef.current = false;
        if (bootedRef.current) return;
        bootedRef.current = true;

        const maxX = Math.max(4, stageWidth() - SPRITE_WIDTH - 4);
        setWalkMs(0);
        moveTo(clamp(Number(detail.x) || stageWidth() * 0.14, 4, maxX));
        liftTo(0);
        updateMood("idle");
        say(pickLine(greetingPool()), 2600);
      }
    }

    function clampToStage() {
      fishing.api.abort();
      const maxX = Math.max(WALK_MARGIN, stageWidth() - SPRITE_WIDTH - WALK_MARGIN);
      if (xRef.current > maxX) {
        setWalkMs(0);
        moveTo(maxX);
      }
    }

    // Ojos que siguen el cursor (via CSS vars, sin re-render). El giro del
    // cuerpo solo ocurre parado, para no torcerlo a mitad de un paseo.
    let eyeRaf = 0;
    function trackPointer(event) {
      if (!visibleRef.current || reduceMotion || eyeRaf) return;
      eyeRaf = window.requestAnimationFrame(() => {
        eyeRaf = 0;
        const node = rootRef.current;
        if (!node) return;
        const rect = node.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);

        if (Math.hypot(dx, dy) < EYE_TRACK_RADIUS) {
          node.style.setProperty("--buddy-eye-x", `${Math.max(-1.7, Math.min(1.7, dx / 70)).toFixed(2)}px`);
          node.style.setProperty("--buddy-eye-y", `${Math.max(-1.2, Math.min(1.2, dy / 90)).toFixed(2)}px`);
          if (["idle", "talk"].includes(moodRef.current)) updateFacing(facingForDirection(dx >= 0 ? 1 : -1));
        } else {
          node.style.setProperty("--buddy-eye-x", "0px");
          node.style.setProperty("--buddy-eye-y", "0px");
        }
      });
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);
        visibleRef.current = visible;
        if (visible && !bootedRef.current && !dropInFlightRef.current) bootUp();
        chat.api.onFooterVisibility(visible);
      },
      { threshold: 0.15 }
    );
    if (stage) observer.observe(stage);

    const brainTimer = window.setInterval(brainTick, BRAIN_TICK_MS);
    const activityEvents = ["pointerdown", "keydown", "wheel", "touchstart"];
    activityEvents.forEach((name) => window.addEventListener(name, markActivity, { passive: true }));
    window.addEventListener("pointermove", markActivity, { passive: true });
    window.addEventListener("pointermove", trackPointer, { passive: true });
    window.addEventListener("daivr-buddy-drop", onDropSignal);
    window.addEventListener("daivr-attract-mode", reactToAttractMode);
    window.addEventListener("resize", clampToStage);

    return () => {
      observer.disconnect();
      core.disposed = true;
      window.clearInterval(brainTimer);
      window.cancelAnimationFrame(eyeRaf);
      activityEvents.forEach((name) => window.removeEventListener(name, markActivity));
      window.removeEventListener("pointermove", markActivity);
      window.removeEventListener("pointermove", trackPointer);
      window.removeEventListener("daivr-buddy-drop", onDropSignal);
      window.removeEventListener("daivr-attract-mode", reactToAttractMode);
      window.removeEventListener("resize", clampToStage);
      clearDialogue(false);
      window.clearTimeout(core.fxTimerRef.current);
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
      if (activeEventRef.current) endBuddyEvent(activeEventRef.current);
    };
    // Las piezas (core y las api) no cambian en toda la vida del componente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isHappy = ["pet", "party", "dance"].includes(mood)
    || (mood === "fishing" && fishingView.phase === "catch")
    || (mood === "hunt" && enemy?.phase === "hit")
    || (mood === "outage" && outagePhase === "restore");
  const isAsleep = mood === "sleep";
  const isAirborne = y < -4;
  const fishingPhase = fishingView.phase;
  const leviathanResponse = fishingView.leviathanResponse;
  const currentStageWidth = core.stageWidth();
  const bubbleAnchor = x > currentStageWidth - 180 ? "anchor-right" : x < 116 ? "anchor-left" : "anchor-center";
  const eventSide = x < 132 ? 1 : x + SPRITE_WIDTH > currentStageWidth - 132 ? -1 : (facing > 0 ? -1 : 1);
  const expression = isHappy || (mood === "fishing" && leviathanResponse === "signal") ? "happy"
    : isAsleep ? "sleep"
      : ["bite", "omen", "monster"].includes(fishingPhase) && !leviathanResponse ? "surprised"
        : mood === "hunt" || outagePhase === "fix" || fishingPhase === "fight" || fishingPhase === "charge" || (fishingPhase === "monster" && leviathanResponse === "steady") ? "focus"
          : "idle";

  // Pip vive en el lienzo del footer (FooterWorld): se publica aqui donde esta,
  // que hace y que lleva, sin medir el DOM. El lienzo repite la misma
  // transicion lineal que el CSS de --buddy-x.
  useLayoutEffect(() => {
    publishActor("host", {
      x, y, walkMs, facing, mood, expression, outfit, visible: mood !== "off",
      fishing: mood === "fishing" ? fishingPhase : "", catchId: fishingView.catchId || "", catchTier: fishingView.catchTier || "", fightEscape: Boolean(fishingView.fightEscape),
      sea: fishingView.seaCreature || "", seaResponse: fishingView.leviathanResponse || "",
      hunt: enemy?.phase || "", enemy: enemy ? { id: enemy.id, weapon: enemy.weapon, side: enemy.side, phase: enemy.phase } : null,
      creature: creature ? { id: creature.id, phase: creature.phase || "active", side: creature.side || 0 } : null,
      find: fieldFind ? { id: fieldFind.id, side: fieldFind.side, picking: fieldFind.picking || "" } : null,
      outage: outagePhase || "", campfire: campfire.view.campfire?.phase || "", snack: campfire.view.campfire?.item || "", snackFish: campfire.view.campfire?.fish?.id || "",
      weather: weather.view.weather || "", rod: equippedRod, lure: equippedLure,
      portal: fishingView.portal ? { x: fishingView.portal.x, phase: fishingView.portal.phase } : null
    });
  });
  useEffect(() => () => dropActor("host"), []);

  return (
    <>
    <BuddyFishingPortal portal={fishingView.portal} onClosed={fishingView.closePortal} />
    <LeviathanEncounter phase={mood === "fishing" && ["omen", "monster", "retreat"].includes(fishingPhase) ? fishingPhase : ""} container={rootRef.current?.parentElement} creature={fishingView.seaCreature} buddyX={x} response={leviathanResponse} onInteract={fishing.api.interact} />
    <div
      className={`screen-buddy-root is-${mood} ${fishingPhase === "approach" ? "is-fishing-approach" : ""} ${fx ? `fx-${fx}` : ""} ${mood === "fishing" && fishingPhase === "fight" ? "is-fish-fight" : ""} ${weather.view.weather ? `weather-${weather.view.weather}` : ""} ${outagePhase ? `outage-${outagePhase}` : ""} ${isAirborne ? "is-airborne" : ""} ${hasRocketBoots ? "has-rocket-boots" : ""} ${hasMikuCostume ? "has-miku-costume" : ""}`}
      ref={rootRef}
      data-leviathan-response={mood === "fishing" ? leviathanResponse : ""}
      style={{
        "--buddy-x": `${x}px`,
        "--buddy-y": `${y}px`,
        "--buddy-walk-ms": `${walkMs}ms`,
        "--buddy-facing": facing,
        "--buddy-travel-direction": travelDirection,
        "--buddy-event-side": eventSide
      }}
    >
      <div className={`screen-buddy-bubble ${bubbleAnchor} ${bubble ? "is-visible" : ""}`} aria-hidden="true">
        {bubble}
      </div>

      {isAsleep ? (
        <span className="screen-buddy-zzz" aria-hidden="true">
          <i>z</i>
          <i>z</i>
          <i>z</i>
        </span>
      ) : null}

      <span className="screen-buddy-particles" aria-hidden="true">
        {particles.map((particle) =>
          particle.kind === "heart" ? (
            <i
              className="buddy-particle buddy-particle-heart"
              key={particle.id}
              style={{ "--px": `${particle.dx}px`, "--py": `${particle.dy}px`, "--pd": `${particle.delay}ms` }}
            >
              ♥
            </i>
          ) : particle.kind === "splash" ? (
            <i
              className="buddy-particle buddy-particle-splash"
              key={particle.id}
              style={{
                left: `${particle.ox}px`,
                bottom: `${particle.oy}px`,
                "--px": `${particle.dx}px`,
                "--py": `${particle.dy}px`,
                "--pd": `${particle.delay}ms`,
                background: particle.color
              }}
            />
          ) : (
            <i
              className="buddy-particle buddy-particle-confetti"
              key={particle.id}
              style={{
                "--px": `${particle.dx}px`,
                "--py": `${particle.dy}px`,
                "--rot": `${particle.rot}deg`,
                "--pd": `${particle.delay}ms`,
                background: particle.color
              }}
            />
          )
        )}
      </span>

      {fieldFind && !fieldFind.picking ? (
        <button
          className={`buddy-field-find is-${fieldFind.id}`}
          type="button"
          style={{ "--find-x": `${fieldFind.side * 76}px` }}
          onClick={encounters.api.collectFieldFind}
          aria-label={`Collect ${fieldFind.name}`}
        >
          {/* El hallazgo lo dibuja el mundo del footer; esto es lo que se pulsa. */}
          <i className="buddy-find-hitbox" aria-hidden="true" />
          <span>{fieldFind.name}</span>
        </button>
      ) : null}

      {/* Agarrado o en paracaidas por encima de lo que alcanza el lienzo del
          footer (FooterWorld pone data-aloft): aqui se pinta Pip, con la tela
          detras de el. */}
      {mood === "held" || mood === "chute" ? (
        <span className={`screen-buddy-aloft ${mood === "chute" && !hasRocketBoots ? "has-chute" : ""}`} aria-hidden="true">
          {mood === "chute" && !hasRocketBoots ? <PipChute className="screen-buddy-aloft-chute" upgraded={outfit.chute === "parachute-upgrade"} lines={14} /> : null}
          <PipSprite pose={mood === "chute" && hasRocketBoots ? "hover" : "hang"} expression={mood === "held" ? "surprised" : "happy"} facing={facing} friendshipLevel={friendshipLevel} inventory={inventory} hiddenGear={hiddenGear} unlockedGear={unlockedGear} width={72} height={80} />
        </span>
      ) : null}

      {/* Pajaro, polilla y bugs los dibuja el mundo del footer (src/lib/pixelWorld/events). */}
      {creature ? <span className="sr-only" role="img" aria-label={creature.name} /> : null}

      <button
        className="screen-buddy arcade-focus"
        type="button"
        aria-label="Pet Dai's screen buddy (drag to carry it)"
        onClick={handlePet}
        onDoubleClick={handleFlip}
        onPointerDown={drag.handlePointerDown}
        onPointerMove={drag.handlePointerMove}
        onPointerUp={drag.handlePointerRelease}
        onPointerCancel={drag.handlePointerRelease}
      >
        <span className="screen-buddy-body">
          {/* Pip se dibuja en el lienzo del footer; esto solo da la caja para
              acariciarlo, arrastrarlo y que choquen los peces. */}
          <span className="screen-buddy-sprite screen-buddy-hitbox" aria-hidden="true" />
        </span>
        <span className="screen-buddy-shadow" aria-hidden="true" />
      </button>
    </div>
  </>);
}
