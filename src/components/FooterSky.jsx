import { useEffect, useMemo, useRef, useState } from "react";
import { useCabinetSignal } from "../lib/cabinetSignals";
import {
  arcPosition,
  daylightFrom,
  isFullMoon,
  meteorShower,
  METEOR_SHOWERS,
  minutesOfDay,
  moonPhase,
  shootingStarDelay,
  shootingStarPath,
  SKY_COVERS,
  skyClock,
  skyCover,
  skyPhase,
  windStrength
} from "../lib/footerSky";
import { publishSky } from "../lib/pixelWorld/skyBus";

/*
  El cielo del footer: la hora, el tiempo y sus eventos. Lo dibuja el lienzo
  de FooterWorld (src/lib/pixelWorld/sky.js) con lo que aqui se publica
  (skyBus); en el DOM solo quedan los botones de las estrellas fugaces.
  - Sol y luna segun la hora del visitante. Con el tiempo de verdad
    (/api/weather) usa sus horas de salida y puesta del sol; si no, un dia de
    entretiempo. La luna sale con su fase real y las estrellas solo de noche.
  - Las nubes y el color del cielo van con el tiempo de fuera: despejado, nubes
    sueltas, cubierto, niebla, lluvia, nieve, tormenta.
  - Cuando Buddy saca el paraguas (`daivr-footer-rain`) llueve en todo el valle:
    mientras dure, el tiempo pasa a lluvia (cielo gris, nubes cargadas, charcos,
    la hoguera apagada, el sonido de la lluvia) y al escampar vuelve el de antes.
  - Eventos: estrellas fugaces de noche (con un clic se pide un deseo: Buddy
    da una moneda), lluvias de estrellas de verdad en sus fechas, la luna
    llena (mas brillante; los raros pican mas) y un arcoiris cuando escampa
    el chubasco de Buddy de dia.
  `onPhase` avisa a SiteFooter de la fase del dia y del cielo para el resto del
  footer (luz del mundo, sonidos, Buddy).
  `daivr-sky-test` {minutes, cover, shower, fullMoon} fuerza hora y cielo
  (comando `sky`).
*/

// El chaparron escampa un poco antes de que Buddy cierre el paraguas.
const STORM_CLEAR_AT = 0.9;
const STORM_CLEAR_MS = 2400;
const CLOCK_MS = 60_000;
const RAINBOW_MS = 7000;
const reduceMotion = () => typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

export function FooterSky({ onPhase }) {
  const outside = useCabinetSignal("weather");
  const [now, setNow] = useState(() => new Date());
  const [test, setTest] = useState(null);
  const [squall, setSquall] = useState(null);
  // Fuera de la vista no salen estrellas fugaces.
  const [inView, setInView] = useState(true);
  const [stars, setStars] = useState([]);
  const [rainbow, setRainbow] = useState(null);
  const wishesRef = useRef(null);
  // Fase actual para los timers (el arcoiris solo sale con sol).
  const phaseRef = useRef("night");

  // Reloj: el sol y la luna avanzan cada minuto, y al volver a la pestaña se
  // ponen al dia de golpe.
  useEffect(() => {
    const tick = () => setNow(new Date());
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    const timer = window.setInterval(tick, CLOCK_MS);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // Lluvia de Buddy: llueve en todo el valle hasta que escampa (`clear`, que
  // trae el arcoiris de dia).
  useEffect(() => {
    function onRain(event) {
      const { active, x, duration } = event.detail || {};
      if (active) {
        const width = wishesRef.current?.clientWidth || 640;
        setSquall({ id: Date.now(), x: Number.isFinite(x) ? x : width / 2, ms: Number(duration) || 9000, state: "gather", at: performance.now() });
      } else {
        setSquall((current) => (current?.state === "gather" ? { ...current, state: "clear", at: performance.now() } : current));
      }
    }
    function onTest(event) {
      const detail = event.detail || {};
      if (detail.reset) {
        setTest(null);
        return;
      }
      setTest((current) => ({
        minutes: Number.isFinite(detail.minutes) ? detail.minutes : current?.minutes ?? null,
        cover: SKY_COVERS.includes(detail.cover) ? detail.cover : current?.cover ?? null,
        shower: detail.shower !== undefined ? detail.shower : current?.shower,
        fullMoon: detail.fullMoon !== undefined ? Boolean(detail.fullMoon) : current?.fullMoon
      }));
    }
    window.addEventListener("daivr-footer-rain", onRain);
    window.addEventListener("daivr-sky-test", onTest);
    return () => {
      window.removeEventListener("daivr-footer-rain", onRain);
      window.removeEventListener("daivr-sky-test", onTest);
    };
  }, []);

  // Al escampar de dia sale un arcoiris donde estaba la nube.
  const squallId = squall?.id;
  const squallClearing = squall?.state === "clear";
  const squallX = squall?.x;
  useEffect(() => {
    if (!squallClearing || phaseRef.current === "night") return;
    setRainbow((current) => (current?.id === squallId ? current : { id: squallId, x: squallX, born: performance.now() }));
  }, [squallId, squallClearing, squallX]);

  // Y se va solo, aunque la nube ya se haya ido antes.
  const rainbowId = rainbow?.id;
  useEffect(() => {
    if (!rainbowId) return undefined;
    const timer = window.setTimeout(() => setRainbow((current) => (current?.id === rainbowId ? null : current)), RAINBOW_MS);
    return () => window.clearTimeout(timer);
  }, [rainbowId]);

  // Se deshace cuando amaina la lluvia; y cuando acaba de deshacerse, se quita.
  useEffect(() => {
    if (!squall) return undefined;
    const id = squall.id;
    const timer = squall.state === "gather"
      ? window.setTimeout(() => setSquall((current) => (current?.id === id ? { ...current, state: "clear", at: performance.now() } : current)), squall.ms * STORM_CLEAR_AT)
      : window.setTimeout(() => setSquall((current) => (current?.id === id ? null : current)), STORM_CLEAR_MS);
    return () => window.clearTimeout(timer);
  }, [squall]);

  // Fuera de la vista no se anima nada.
  useEffect(() => {
    const sky = wishesRef.current;
    if (!sky || typeof IntersectionObserver !== "function") return undefined;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    observer.observe(sky);
    return () => observer.disconnect();
  }, []);

  const minutes = test?.minutes ?? minutesOfDay(now);
  const clock = skyClock(minutes, daylightFrom(outside));
  const phase = skyPhase(clock);
  const outsideCover = test?.cover ?? skyCover(outside);
  // Mientras llueve el chaparron de Buddy, el valle entero tiene lluvia (si ya
  // habia tormenta o nieve, se queda).
  const cover = squall?.state === "gather" && !["rain", "storm", "snow"].includes(outsideCover) ? "rain" : outsideCover;
  // Lo que sopla: mece el bosque y la hierba (FooterWorld, via SiteFooter).
  const wind = windStrength(test?.cover ? null : outside, cover);
  // Los colores cambian poco de un minuto a otro: se recalculan por centesimas.
  const altitudeKey = Math.round(clock.altitude * 100);
  const dayKey = now.toDateString();
  const lunarPhase = moonPhase(new Date(dayKey));
  const fullMoon = test?.fullMoon ?? isFullMoon(lunarPhase);
  // Lluvia de estrellas de hoy (o la del comando `sky meteors`).
  const shower = useMemo(() => {
    if (test?.shower === null) return null;
    if (test?.shower) return { ...(METEOR_SHOWERS.find((entry) => entry.id === test.shower) || METEOR_SHOWERS[3]), strength: 1 };
    return meteorShower(new Date(dayKey));
  }, [dayKey, test?.shower]);
  const starry = phase === "night" && ["clear", "fair"].includes(cover);
  phaseRef.current = phase;
  const body = clock.sun != null ? arcPosition(clock.sun) : arcPosition(clock.moon);
  const bodyX = body.x, bodyY = body.y, sunUp = clock.sun != null;

  // Lo que dibuja el lienzo del footer.
  useEffect(() => {
    publishSky({ sun: sunUp ? 1 : null, body: { x: bodyX, y: bodyY }, moonPhase: fullMoon ? 0.5 : lunarPhase, fullMoon, stars, rainbow });
  }, [sunUp, bodyX, bodyY, lunarPhase, fullMoon, stars, rainbow]);

  const nightShower = phase === "night" ? shower : null;
  // La altura del sol (en centesimas) le dice al mundo del footer cuanta luz hay.
  useEffect(() => {
    onPhase?.({ phase, cover, wind, altitude: altitudeKey / 100, fullMoon: fullMoon && phase === "night", shower: nightShower?.name || "" });
  }, [onPhase, phase, cover, wind, altitudeKey, fullMoon, nightShower]);

  // Estrellas fugaces: de noche y con el cielo despejado, mas a menudo en una
  // lluvia de estrellas. Solo con el footer a la vista y la pestaña delante.
  useEffect(() => {
    if (!starry || !inView || reduceMotion()) return undefined;
    let timer = 0;
    function spawn() {
      if (document.visibilityState === "visible") {
        const star = { id: `${Date.now()}-${Math.random()}`, ...shootingStarPath(), born: performance.now() };
        setStars((current) => [...current.slice(-6), star]);
        window.dispatchEvent(new CustomEvent("daivr-shooting-star", { detail: { phase: "seen", left: star.left, shower: shower?.name || "" } }));
        window.setTimeout(() => setStars((current) => current.filter((entry) => entry.id !== star.id)), star.ms + 300);
      }
      timer = window.setTimeout(spawn, shootingStarDelay(shower));
    }
    timer = window.setTimeout(spawn, Math.min(12_000, shootingStarDelay(shower)));
    return () => window.clearTimeout(timer);
  }, [starry, inView, shower]);

  // Clic en una estrella fugaz: deseo pedido (Buddy da la recompensa y el
  // lienzo suelta chispas donde estaba; x e y en px dentro de la capa).
  function wish(star, event) {
    const layer = wishesRef.current?.getBoundingClientRect();
    const rect = event.currentTarget.getBoundingClientRect();
    const x = layer ? rect.left + rect.width / 2 - layer.left : 0;
    const y = layer ? rect.top + rect.height / 2 - layer.top : 0;
    setStars((current) => current.filter((entry) => entry.id !== star.id));
    window.dispatchEvent(new CustomEvent("daivr-shooting-star", { detail: { phase: "wish", x, y, shower: shower?.name || "" } }));
  }

  // Solo los botones: invisibles, siguen el mismo recorrido que la estrella
  // que pinta el lienzo.
  return (
    <div className="footer-sky-wishes" ref={wishesRef}>
      {stars.map((star) => (
        <button
          className="footer-shooting-star"
          key={star.id}
          type="button"
          aria-label="Make a wish on the shooting star"
          onClick={(event) => wish(star, event)}
          style={{ left: `${star.left}%`, top: `${star.top}px`, "--dx": `${star.dx}px`, "--dy": `${star.dy}px`, "--ms": `${star.ms}ms` }}
        />
      ))}
    </div>
  );
}
