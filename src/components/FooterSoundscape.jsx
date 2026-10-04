import { useEffect, useRef, useState } from "react";
import { createSoundscape, soundscapeMix } from "../lib/footerSoundscape";

/*
  Interruptor del sonido ambiente del footer (lib/footerSoundscape): grillos,
  lluvia, hoguera, farolas y viento, a juego con el cielo. Apagado por
  defecto; la eleccion se recuerda. Solo suena con el footer a la vista y la
  pestaña delante. El comando `sound` lo enciende o apaga
  (`daivr-footer-sound`), y avisa a Buddy al cambiar (`daivr-footer-sound-state`).
*/

const SOUND_KEY = "daivr.footerSound.v1";

function readEnabled() {
  try {
    return window.localStorage.getItem(SOUND_KEY) === "on";
  } catch {
    return false;
  }
}

export function FooterSoundscape({ phase, cover, wind }) {
  const [enabled, setEnabled] = useState(readEnabled);
  const [inView, setInView] = useState(false);
  const [visible, setVisible] = useState(() => typeof document === "undefined" || document.visibilityState === "visible");
  const [raining, setRaining] = useState(false);
  const engineRef = useRef(null);
  const buttonRef = useRef(null);
  const toggleRef = useRef(null);

  const engine = () => {
    if (!engineRef.current) engineRef.current = createSoundscape();
    return engineRef.current;
  };

  function toggle(next) {
    setEnabled(next);
    try {
      window.localStorage.setItem(SOUND_KEY, next ? "on" : "off");
    } catch {
      // Sin almacenamiento dura lo que la pestaña.
    }
    // Dentro del clic: el navegador solo deja arrancar el audio con un gesto.
    if (next) engine().unlock();
    window.dispatchEvent(new CustomEvent("daivr-footer-sound-state", { detail: { enabled: next } }));
  }
  toggleRef.current = toggle;

  // Footer a la vista, pestaña delante, chubasco de Buddy y el comando `sound`.
  useEffect(() => {
    const zone = buttonRef.current?.closest(".app-footer-zone");
    const observer = zone && typeof IntersectionObserver === "function"
      ? new IntersectionObserver(([entry]) => setInView(entry.isIntersecting))
      : null;
    if (observer) observer.observe(zone);
    else setInView(true);
    const onVisibility = () => setVisible(document.visibilityState === "visible");
    const onRain = (event) => setRaining(Boolean(event.detail?.active));
    const onCommand = (event) => toggleRef.current?.(Boolean(event.detail?.enabled));
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("daivr-footer-rain", onRain);
    window.addEventListener("daivr-footer-sound", onCommand);
    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("daivr-footer-rain", onRain);
      window.removeEventListener("daivr-footer-sound", onCommand);
    };
  }, []);

  const playing = enabled && inView && visible;

  useEffect(() => {
    if (playing) engine().start();
    else engineRef.current?.stop();
  }, [playing]);

  useEffect(() => {
    engineRef.current?.setMix(soundscapeMix({ phase, cover, wind, raining }));
  }, [phase, cover, wind, raining, playing]);

  // Al volver con el sonido encendido, el navegador no deja sonar hasta el
  // primer gesto: el primer clic o tecla lo desbloquea.
  useEffect(() => {
    if (!enabled) return undefined;
    const resume = () => engineRef.current?.unlock();
    window.addEventListener("pointerdown", resume, { once: true });
    window.addEventListener("keydown", resume, { once: true });
    return () => {
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
    };
  }, [enabled]);

  useEffect(() => () => engineRef.current?.close(), []);

  return (
    <button
      ref={buttonRef}
      className={`footer-pill footer-pill-sound ${enabled ? "is-on" : ""}`}
      type="button"
      aria-pressed={enabled}
      aria-label={enabled ? "Footer ambience is on. Turn it off" : "Footer ambience is off. Turn it on"}
      onClick={() => toggle(!enabled)}
    >
      <span className="footer-pill-led footer-pill-led-amber" aria-hidden="true">
        <span className="footer-pill-led-core" />
        <span className="footer-pill-led-ping" />
      </span>
      <span className="footer-pill-label">ambience</span>
      <span className="footer-pill-value">{enabled ? "on" : "off"}</span>
    </button>
  );
}
