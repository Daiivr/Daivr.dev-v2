import { useEffect, useMemo, useRef, useState } from "react";
import { useCabinetSignal } from "../lib/cabinetSignals";
import {
  arcPosition,
  CLOUD_SHAPES,
  cloudLayout,
  cloudPixels,
  daylightFrom,
  minutesOfDay,
  moonPhase,
  moonPixels,
  SKY_COVERS,
  SKY_STARS,
  skyClock,
  skyCover,
  skyPalette,
  skyPhase,
  sunPixels,
  windStrength
} from "../lib/footerSky";

/*
  Cielo del footer, detras del bosque (FooterScenery):
  - Degradado, sol y luna segun la hora del visitante. Con el tiempo de verdad
    (/api/weather) usa sus horas de salida y puesta del sol; si no, un dia de
    entretiempo. La luna sale con su fase real y las estrellas solo de noche.
  - Nubes de pixel art que cruzan con el viento (de derecha a izquierda, igual
    que la lluvia), en dos capas. Cuantas y de que color depende del tiempo de
    fuera: despejado, nubes sueltas, cubierto, niebla, lluvia, nieve, tormenta.
  - Cuando Buddy saca el paraguas (`daivr-footer-rain`), se forma una nube de
    lluvia justo encima y la lluvia de ScreenBuddy cae desde su base.
  `onPhase` avisa a SiteFooter de la fase del dia y del cielo para el resto del
  footer (luciernagas, estrellas del bosque, luz de los arboles).
  `daivr-sky-test` {minutes, cover} fuerza hora y cielo (comando `sky`).
*/

const SUN = sunPixels();
const STORM = cloudPixels("storm");
const STORM_PX = 2;
// Base de la nube de lluvia, en px sobre el riel: justo por encima del paraguas
// de Buddy (llega a 99px). .buddy-rain-field (screen-buddy.css) empieza aqui.
const STORM_BASE_PX = 106;
// Hueco entre la base de la nube y el borde de abajo de su svg.
const STORM_BOTTOM_PX = STORM_BASE_PX - (CLOUD_SHAPES.storm.height - CLOUD_SHAPES.storm.base) * STORM_PX;
// La nube se forma antes de la primera gota (la lluvia de Buddy empieza al 9%
// de su duracion: rain-arrives-and-clears) y se deshace cuando las gotas
// amainan (80-90%), no despues.
const STORM_CLEAR_AT = 0.82;
const STORM_CLEAR_MS = 2400;
const CLOCK_MS = 60_000;

const SNOWFLAKES = Array.from({ length: 30 }, (_, index) => {
  const value = (offset) => {
    const raw = Math.sin(index * 37.3 + offset) * 10_000;
    return raw - Math.floor(raw);
  };
  return { id: index, left: Number((value(1) * 100).toFixed(2)), seconds: Number((7 + value(2) * 6).toFixed(2)), delay: Number((-value(3) * 13).toFixed(2)), big: value(4) > 0.7 };
});

function PixelCloud({ shape, px, tone = "cloud", className = "", style, children }) {
  const art = cloudPixels(shape);
  const width = art.width * px;
  const height = art.height * px;
  return (
    <span className={className} style={{ ...style, width, height }}>
      <svg viewBox={`0 0 ${art.width} ${art.height}`} width={width} height={height} shapeRendering="crispEdges" aria-hidden="true">
        <path d={art.shadow} fill={`var(--${tone}-shadow)`} />
        <path d={art.shade} fill={`var(--${tone}-shade)`} />
        <path d={art.mid} fill={`var(--${tone}-mid)`} />
        <path d={art.light} fill={`var(--${tone}-light)`} />
        <path d={art.rim} fill={`var(--${tone}-rim)`} />
      </svg>
      {children}
    </span>
  );
}

export function FooterSky({ onPhase }) {
  const skyRef = useRef(null);
  const outside = useCabinetSignal("weather");
  const [now, setNow] = useState(() => new Date());
  const [test, setTest] = useState(null);
  const [squall, setSquall] = useState(null);
  // En estado de React (no con classList): al cambiar de clase por la lluvia,
  // React reescribia el className y se perdia, y el cielo entero se quedaba
  // en pausa (la nube de lluvia, invisible en su primer fotograma).
  const [inView, setInView] = useState(true);

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

  // Lluvia de Buddy: la nube se forma encima de el, y al parar se deshace con
  // el viento.
  useEffect(() => {
    function onRain(event) {
      const { active, x, duration } = event.detail || {};
      if (active) {
        const width = skyRef.current?.clientWidth || 640;
        setSquall({ id: Date.now(), x: Number.isFinite(x) ? x : width / 2, ms: Number(duration) || 9000, state: "gather" });
      } else {
        setSquall((current) => (current?.state === "gather" ? { ...current, state: "clear" } : current));
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
        cover: SKY_COVERS.includes(detail.cover) ? detail.cover : current?.cover ?? null
      }));
    }
    window.addEventListener("daivr-footer-rain", onRain);
    window.addEventListener("daivr-sky-test", onTest);
    return () => {
      window.removeEventListener("daivr-footer-rain", onRain);
      window.removeEventListener("daivr-sky-test", onTest);
    };
  }, []);

  // Se deshace cuando amaina la lluvia; y cuando acaba de deshacerse, se quita.
  useEffect(() => {
    if (!squall) return undefined;
    const id = squall.id;
    const timer = squall.state === "gather"
      ? window.setTimeout(() => setSquall((current) => (current?.id === id ? { ...current, state: "clear" } : current)), squall.ms * STORM_CLEAR_AT)
      : window.setTimeout(() => setSquall((current) => (current?.id === id ? null : current)), STORM_CLEAR_MS);
    return () => window.clearTimeout(timer);
  }, [squall]);

  // Fuera de la vista no se anima nada.
  useEffect(() => {
    const sky = skyRef.current;
    if (!sky || typeof IntersectionObserver !== "function") return undefined;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    observer.observe(sky);
    return () => observer.disconnect();
  }, []);

  const minutes = test?.minutes ?? minutesOfDay(now);
  const clock = skyClock(minutes, daylightFrom(outside));
  const phase = skyPhase(clock);
  const cover = test?.cover ?? skyCover(outside);
  // Lo que sopla: mece el bosque y se lleva hojas (FooterScenery, via SiteFooter).
  const wind = windStrength(test?.cover ? null : outside, cover);
  // Los colores cambian poco de un minuto a otro: se recalculan por centesimas.
  const altitudeKey = Math.round(clock.altitude * 100);
  const palette = useMemo(() => skyPalette(altitudeKey / 100), [altitudeKey]);
  const dayKey = now.toDateString();
  const moon = useMemo(() => moonPixels(moonPhase(new Date(dayKey))), [dayKey]);
  const clouds = useMemo(() => cloudLayout(cover), [cover]);
  const body = clock.sun != null ? arcPosition(clock.sun) : arcPosition(clock.moon);

  useEffect(() => {
    onPhase?.({ phase, cover, wind });
  }, [onPhase, phase, cover, wind]);

  return (
    <div
      className={`footer-sky phase-${phase} cover-${cover} ${body.x > 52 ? "light-right" : ""} ${squall?.state === "gather" ? "is-squall" : ""} ${inView ? "is-in-view" : ""}`}
      style={{ ...palette, "--glow-x": `${body.x}%` }}
      ref={skyRef}
      aria-hidden="true"
    >
      <span className="footer-sky-gradient" />
      <span className="footer-sky-glow" />
      <span className="footer-sky-stars">
        {SKY_STARS.map((star) => (
          <i
            className={star.big ? "is-big" : ""}
            key={star.id}
            style={{ left: `${star.left}%`, top: `${star.top}px`, "--twinkle": `${star.seconds}s`, "--twinkle-delay": `${star.delay}s` }}
          />
        ))}
      </span>

      {clock.sun != null ? (
        <span className="footer-sky-sun" style={{ left: `${body.x}%`, bottom: `${body.y}px` }}>
          <i className="footer-sky-halo" />
          <svg viewBox={`0 0 ${SUN.size} ${SUN.size}`} width={SUN.size * 2} height={SUN.size * 2} shapeRendering="crispEdges">
            <path d={SUN.edge} fill="var(--sun-edge)" />
            <path d={SUN.core} fill="var(--sun-core)" />
            <path d={SUN.shine} fill="#fffef4" />
          </svg>
        </span>
      ) : (
        <span className="footer-sky-moon" style={{ left: `${body.x}%`, bottom: `${body.y}px`, "--moon-light": moon.litShare.toFixed(2) }}>
          <i className="footer-sky-halo" />
          <svg viewBox={`0 0 ${moon.size} ${moon.size}`} width={moon.size * 2} height={moon.size * 2} shapeRendering="crispEdges">
            <path d={moon.dark} fill="var(--moon-dark)" />
            <path d={moon.lit} fill="var(--moon-lit)" />
            <path d={moon.craters} fill="var(--moon-crater)" />
          </svg>
        </span>
      )}

      <span className="footer-sky-veil" />

      <span className="footer-sky-clouds">
        {clouds.map((cloud) => (
          <PixelCloud
            className={`footer-cloud is-${cloud.layer} ${cloud.mobile ? "" : "is-optional"}`}
            key={cloud.id}
            px={cloud.px}
            shape={cloud.shape}
            style={{ top: `${cloud.top}px`, "--layer-alpha": cloud.alpha, "--drift": `${cloud.seconds}s`, "--drift-delay": `${(-cloud.start * cloud.seconds).toFixed(1)}s`, "--start": cloud.start }}
          >
            {cloud.veil ? <i className="footer-cloud-veil" /> : null}
          </PixelCloud>
        ))}
      </span>

      {cover === "fog" ? <span className="footer-sky-fog" /> : null}
      {cover === "snow" ? (
        <span className="footer-sky-snow">
          {SNOWFLAKES.map((flake) => (
            <i
              className={flake.big ? "is-big" : ""}
              key={flake.id}
              style={{ left: `${flake.left}%`, "--fall": `${flake.seconds}s`, "--fall-delay": `${flake.delay}s` }}
            />
          ))}
        </span>
      ) : null}
      {cover === "storm" ? <span className="footer-sky-flash" /> : null}

      {squall ? (
        <PixelCloud
          className={`footer-sky-storm is-${squall.state}`}
          key={squall.id}
          px={STORM_PX}
          shape="storm"
          tone="storm"
          style={{
            left: `${squall.x - (STORM.width * STORM_PX) / 2}px`,
            bottom: `${STORM_BOTTOM_PX}px`,
            "--squall-ms": `${squall.ms}ms`,
            "--loiter-ms": `${Math.round(squall.ms * STORM_CLEAR_AT)}ms`
          }}
        >
          <i className="footer-sky-storm-shaft" />
        </PixelCloud>
      ) : null}
    </div>
  );
}
