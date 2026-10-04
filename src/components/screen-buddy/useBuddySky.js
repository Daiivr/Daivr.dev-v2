import { useEffect, useState } from "react";
import { rememberTopic } from "./buddyLines";
import { nightKey } from "./useBuddyCore";

/*
  Buddy y el cielo del footer (FooterSky):
  - Estrella fugaz pulsada (`daivr-shooting-star` wish): deseo concedido y una
    moneda (`star-wish` en useBuddyAdventure), unas pocas por noche.
  - Estrella fugaz vista: a veces la señala.
  - Lluvia de estrellas o luna llena: lo cuenta una vez por noche.
*/

const WISHES_PER_NIGHT = 5;
const WISHES_KEY = "daivr.starWishes.v1";
const SEEN_COMMENT_MS = 45_000;
// Lo ya anunciado esta carga de pagina (por noche y tipo).
const announced = new Set();

function wishesTonight() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(WISHES_KEY) || "null");
    return saved?.night === nightKey() ? Number(saved.wishes) || 0 : 0;
  } catch {
    return WISHES_PER_NIGHT;
  }
}

function rememberWish() {
  try {
    window.localStorage.setItem(WISHES_KEY, JSON.stringify({ night: nightKey(), wishes: wishesTonight() + 1 }));
  } catch {
    // Sin almacenamiento wishesTonight ya devuelve el tope.
  }
}

export function useBuddySky(core) {
  const [api] = useState(() => createSky(core));
  useEffect(() => {
    window.addEventListener("daivr-shooting-star", api.onShootingStar);
    return () => window.removeEventListener("daivr-shooting-star", api.onShootingStar);
  }, [api]);
  return { api };
}

function createSky(core) {
  const { xRef, visibleRef, skyPhaseRef, fullMoonRef, showerRef } = core;
  const { canChat, chat, say, pickLine, updateMood, updateFacing, facingForDirection, spawnParticles, settleDown, freezeAtCurrentPosition, stageWidth } = core;
  let seenCommentAt = 0;

  function onShootingStar(event) {
    const detail = event.detail || {};
    if (detail.phase === "wish") {
      const rewarded = wishesTonight() < WISHES_PER_NIGHT;
      if (rewarded) {
        rememberWish();
        window.dispatchEvent(new CustomEvent("daivr-buddy-quest-progress", { detail: { type: "star-wish" } }));
      }
      if (canChat()) {
        freezeAtCurrentPosition();
        if (Number.isFinite(detail.x)) updateFacing(facingForDirection(detail.x > xRef.current ? 1 : -1));
        updateMood("party");
        spawnParticles("confetti", 8);
        settleDown(2800);
      }
      const line = rewarded
        ? pickLine(["wish granted! +1 coin.", "you caught a shooting star! +1 coin.", "a wish! i won't tell. +1 coin."])
        : pickLine(["another wish! the wish jar is full tonight, though.", "wishes are free. coins are capped. still counts!"]);
      say(rememberTopic(line, "shootingStar"), 2800, { key: "wish", topic: "shootingStar" });
      return;
    }
    // La ha visto pasar: a veces la señala (menos en plena lluvia de estrellas).
    const now = Date.now();
    if (!visibleRef.current || !canChat() || now - seenCommentAt < SEEN_COMMENT_MS) return;
    if (Math.random() > (detail.shower ? 0.12 : 0.3)) return;
    seenCommentAt = now;
    const starX = (Number(detail.left) || 50) / 100 * stageWidth();
    updateFacing(facingForDirection(starX > xRef.current ? 1 : -1));
    const lines = detail.shower
      ? [`another one! the ${detail.shower} are busy tonight.`, "so many wishes, so little time.", "click one! quick!"]
      : ["did you see that? shooting star!", "quick, make a wish!", "a shooting star! click it next time."];
    say(rememberTopic(pickLine(lines), "shootingStar"), 2400, { priority: "ambient", key: "ambient", topic: "shootingStar" });
  }

  // De noche, la primera vez que puede: lluvia de estrellas o luna llena.
  // Lo llama el cerebro; devuelve si dijo algo.
  function announceNight() {
    if (skyPhaseRef.current !== "night" || !canChat()) return false;
    const night = nightKey();
    const shower = showerRef.current;
    if (shower && !announced.has(`${night}:shower`)) {
      announced.add(`${night}:shower`);
      chat([`the ${shower} are peaking tonight! watch the sky.`, `meteor shower tonight: the ${shower}. click one to make a wish!`], "meteorShower", 3400);
      return true;
    }
    if (fullMoonRef.current && !announced.has(`${night}:moon`)) {
      announced.add(`${night}:moon`);
      chat(["full moon tonight. the rare fish are restless.", "big moon tonight. good night for fishing."], "fullMoon", 3200);
      return true;
    }
    return false;
  }

  return { onShootingStar, announceNight };
}
