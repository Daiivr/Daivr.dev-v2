import { useEffect, useState } from "react";
import { contextLines, EVENT_LINES, isRainingOutside } from "../../lib/buddyContext";
import { LINES } from "./buddyLines";
import { clamp, randomBetween, SPRITE_WIDTH, WALK_MARGIN, WALK_SPEED_PX_S } from "./useBuddyCore";

/*
  El tiempo de Buddy:
  - Su chubasco: abre el paraguas, llueve en todo el valle (FooterSky,
    `daivr-footer-rain`) y pasea un rato bajo la lluvia, parandose a mirar.
  - El tiempo de verdad donde esta el jugador (/api/weather): lo carga cada
    media hora, lo pasa al cielo (`daivr-outside-weather`) y lo usa en su
    charla. El comando `weather` lo fija o pide que lo comente.
*/

export const RAIN_DURATION_MS = 26000;
const RAIN_COOLDOWN_MS = 120000;
// Paseo bajo la lluvia: tramos cortos con pausas para mirar.
const RAIN_STROLL_PX = [50, 150];
const RAIN_PAUSE_MS = [1400, 3200];
const WEATHER_REFRESH_MS = 30 * 60_000;

export function useBuddyWeather(core) {
  const [weather, setWeather] = useState("");
  const [api] = useState(() => createWeather(core, { setWeather }));

  useEffect(() => {
    let disposed = false;
    let weatherTimer = 0;
    api.cooldownRef.current = Date.now() - RAIN_COOLDOWN_MS + 20000;

    async function loadWeather() {
      try {
        const response = await fetch("/api/weather", { cache: "no-store", headers: { Accept: "application/json" } });
        if (response.ok) {
          const outside = await response.json();
          if (!disposed && outside?.available) {
            core.weatherRef.current = outside;
            // El cielo del footer pinta este mismo tiempo.
            window.dispatchEvent(new CustomEvent("daivr-outside-weather", { detail: outside }));
          }
        }
      } catch {
        // Sin el tiempo de fuera, Buddy usa el parte del armario.
      }
      if (!disposed) weatherTimer = window.setTimeout(loadWeather, WEATHER_REFRESH_MS);
    }

    loadWeather();
    window.addEventListener("daivr-buddy-rain", api.onRainSignal);
    window.addEventListener("daivr-buddy-weather", api.onWeatherSignal);
    return () => {
      disposed = true;
      window.clearTimeout(weatherTimer);
      window.removeEventListener("daivr-buddy-rain", api.onRainSignal);
      window.removeEventListener("daivr-buddy-weather", api.onWeatherSignal);
    };
  }, [api, core]);

  return { api, view: { weather } };
}

function createWeather(core, { setWeather }) {
  const { moodRef, moodGenRef, xRef, activeEventRef, weatherRef, skyPhaseRef, reduceMotion } = core;
  const { beginBuddyEvent, endBuddyEvent, freezeAtCurrentPosition, updateMood, schedule, say, pickLine, chat } = core;
  const { moveTo, setWalkMs, faceTravelDirection, stageWidth } = core;
  const cooldownRef = { current: 0 };

  function startRain() {
    if (!beginBuddyEvent("rain")) return;
    cooldownRef.current = Date.now();
    freezeAtCurrentPosition();
    setWeather("rain");
    updateMood("rain");
    const generation = moodGenRef.current;
    // Si tambien llueve de verdad donde esta el jugador, Buddy lo nota.
    say(isRainingOutside(weatherRef.current) ? pickLine(EVENT_LINES.rainBoth) : pickLine(LINES.rain), 2600, { topic: "rain" });
    // Llueve en todo el valle (FooterSky) mientras dure.
    window.dispatchEvent(new CustomEvent("daivr-footer-rain", { detail: { active: true, x: xRef.current + SPRITE_WIDTH / 2, duration: RAIN_DURATION_MS } }));
    const startedAt = Date.now();

    // Pasea con el paraguas: un tramo, una pausa, otro tramo... hasta que
    // queda poco de lluvia (sigue con el humor "rain": el paraguas no se cierra).
    function stroll() {
      if (moodGenRef.current !== generation || moodRef.current !== "rain") return;
      if (Date.now() - startedAt > RAIN_DURATION_MS - 3500) return;
      const maxX = Math.max(WALK_MARGIN, stageWidth() - SPRITE_WIDTH - WALK_MARGIN);
      let direction = Math.random() < 0.5 ? -1 : 1;
      if (xRef.current < WALK_MARGIN + 80) direction = 1;
      if (xRef.current > maxX - 80) direction = -1;
      const target = clamp(xRef.current + direction * randomBetween(...RAIN_STROLL_PX), WALK_MARGIN, maxX);
      const ms = Math.max(200, (Math.abs(target - xRef.current) / (WALK_SPEED_PX_S * 0.8)) * 1000);
      faceTravelDirection(target > xRef.current ? 1 : -1);
      setWalkMs(ms);
      moveTo(target);
      schedule(() => {
        if (moodGenRef.current !== generation || moodRef.current !== "rain") return;
        setWalkMs(0);
        if (Math.random() < 0.35) say(pickLine(LINES.rain), 2200, { topic: "rain" });
        schedule(stroll, randomBetween(...RAIN_PAUSE_MS));
      }, ms + 60);
    }
    schedule(stroll, 2200);

    schedule(() => {
      setWeather("");
      window.dispatchEvent(new CustomEvent("daivr-footer-rain", { detail: { active: false } }));
      if (moodGenRef.current === generation && moodRef.current === "rain") {
        updateMood("idle");
        // De dia escampa con arcoiris (FooterSky lo pinta encima).
        if (skyPhaseRef.current !== "night") say(pickLine(["a rainbow! worth the rain.", "look up! a rainbow.", "rainbow.exe deployed."]), 2400, { topic: "rainbow" });
        else say("rain stopped. patrol resumed.", 2000, { topic: "rainEnd" });
      }
      endBuddyEvent("rain");
    }, RAIN_DURATION_MS);
  }

  // Sin motion la lluvia quedaria congelada en el aire: mejor ni llueve.
  function canRain(now = Date.now()) {
    return !reduceMotion && now - cooldownRef.current > RAIN_COOLDOWN_MS;
  }

  // Gatillo manual de lluvia (consola/tests), mismas reglas.
  function onRainSignal() {
    if (activeEventRef.current) return;
    if (reduceMotion || moodRef.current === "outage") return;
    if (moodRef.current === "hunt") return;
    if (!["idle", "talk"].includes(moodRef.current)) {
      freezeAtCurrentPosition();
      updateMood("idle");
    }
    startRain();
  }

  // `weather` en la consola (o pruebas): pone el tiempo y Buddy lo comenta.
  function onWeatherSignal(event) {
    const detail = event.detail || {};
    if (detail.weather?.available) {
      weatherRef.current = detail.weather;
      window.dispatchEvent(new CustomEvent("daivr-outside-weather", { detail: detail.weather }));
    }
    if (!detail.announce) return;
    const lines = contextLines({ weather: weatherRef.current, locale: navigator.language }).filter((entry) => entry.topic === "weather").map((entry) => entry.line);
    chat(lines, "weather", 3200);
  }

  return { cooldownRef, startRain, canRain, onRainSignal, onWeatherSignal };
}
