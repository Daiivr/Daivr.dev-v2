// Cielo del footer (FooterSky): la hora del dia, el sol y la luna, el tiempo de
// fuera y los eventos del cielo. Solo calculos: ni React ni DOM, los tests de
// Node lo importan tal cual. Lo dibuja el mundo del footer (pixelWorld/sky.js).

const MINUTES_PER_DAY = 1440;

// Sin el tiempo de verdad (o sin sus horas de sol), un dia de entretiempo.
export const DEFAULT_DAYLIGHT = { sunrise: 6 * 60 + 30, sunset: 19 * 60 + 30 };

export function minutesOfDay(date) {
  return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
}

// Horas de sol reales (/api/weather, en minutos locales) si llegaron y tienen
// sentido; si no, las de por defecto.
export function daylightFrom(weather) {
  const sunrise = Number(weather?.sunrise);
  const sunset = Number(weather?.sunset);
  const valid = Number.isFinite(sunrise) && Number.isFinite(sunset)
    && sunrise >= 0 && sunset <= MINUTES_PER_DAY && sunset - sunrise >= 120;
  return valid ? { sunrise, sunset } : DEFAULT_DAYLIGHT;
}

// Por donde va el dia: `sun` 0..1 de la salida a la puesta (null de noche),
// `moon` 0..1 de la puesta a la salida (null de dia), y `altitude` de -1
// (medianoche) a 1 (mediodia), que es lo que decide los colores.
export function skyClock(minutes, daylight = DEFAULT_DAYLIGHT) {
  const { sunrise, sunset } = daylight;
  const dayLength = sunset - sunrise;
  if (minutes >= sunrise && minutes < sunset) {
    const sun = (minutes - sunrise) / dayLength;
    return { sun, moon: null, altitude: Math.sin(Math.PI * sun) };
  }
  const moon = ((minutes - sunset + MINUTES_PER_DAY) % MINUTES_PER_DAY) / (MINUTES_PER_DAY - dayLength);
  return { sun: null, moon, altitude: -Math.sin(Math.PI * moon) };
}

// night / dawn / day / dusk, para las clases del footer (luciernagas,
// estrellas, luz del bosque).
export function skyPhase(clock) {
  if (clock.altitude >= 0.15) return "day";
  if (clock.altitude <= -0.12) return "night";
  const morning = clock.sun != null ? clock.sun < 0.5 : clock.moon > 0.5;
  return morning ? "dawn" : "dusk";
}

// Recorrido del sol y la luna: de un lado al otro, asomando tras el bosque al
// salir y al ponerse. x en % del ancho, y en px sobre el riel.
export const SKY_ARC = { left: 4, right: 96, low: 8, high: 118 };

export function arcPosition(progress, arc = SKY_ARC) {
  const p = Math.min(1, Math.max(0, progress));
  return {
    x: arc.left + (arc.right - arc.left) * p,
    y: arc.low + (arc.high - arc.low) * Math.sin(Math.PI * p)
  };
}

// --- Luna -----------------------------------------------------------------------

const SYNODIC_DAYS = 29.530588853;
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);

// 0 luna nueva, 0.25 cuarto creciente, 0.5 llena, 0.75 cuarto menguante.
export function moonPhase(date) {
  const cycles = (date.getTime() - KNOWN_NEW_MOON) / 86_400_000 / SYNODIC_DAYS;
  return ((cycles % 1) + 1) % 1;
}

// --- Tiempo de fuera ------------------------------------------------------------

export const SKY_COVERS = ["clear", "fair", "cloudy", "fog", "rain", "snow", "storm"];

// Codigo WMO (Open-Meteo) -> cielo. Sin dato, unas nubes sueltas.
export function skyCover(weather) {
  if (!weather?.available) return "fair";
  const code = Number(weather.code);
  if (!Number.isInteger(code)) return "fair";
  if (code === 0) return "clear";
  if (code <= 2) return "fair";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 95) return "storm";
  return "fair";
}

// Fuerza del viento: con el dato de verdad (km/h) si lo hay; con lluvia o
// tormenta, mas.
export function windStrength(weather, cover = "fair") {
  const speed = Number(weather?.available ? weather.wind : NaN);
  let strength = !Number.isFinite(speed) ? 1 : speed < 8 ? 0.6 : speed < 25 ? 1 : speed < 45 ? 1.5 : 2;
  if (cover === "rain") strength = Math.max(strength, 1.25);
  if (cover === "storm") strength = Math.max(strength, 1.8);
  return strength;
}

const between = (rng, min, max) => min + rng() * (max - min);

// --- Eventos del cielo ------------------------------------------------------------

// Luna llena: un dia a cada lado del pico (fase 0.5). Los raros pican mas.
export function isFullMoon(phase) {
  return Math.abs(phase - 0.5) < 0.034;
}

// Lluvias de estrellas de verdad: el dia del pico (hora local) y dos a cada
// lado, cada vez mas flojas.
// `radiant`: de donde salen sus estrellas en nuestro cielo (left en %, top en px).
export const METEOR_SHOWERS = [
  { id: "quadrantids", name: "Quadrantids", month: 1, day: 3, radiant: { left: 30, top: 2 } },
  { id: "lyrids", name: "Lyrids", month: 4, day: 22, radiant: { left: 72, top: 4 } },
  { id: "eta-aquariids", name: "Eta Aquariids", month: 5, day: 6, radiant: { left: 18, top: 10 } },
  { id: "perseids", name: "Perseids", month: 8, day: 12, radiant: { left: 84, top: 2 } },
  { id: "orionids", name: "Orionids", month: 10, day: 21, radiant: { left: 62, top: 6 } },
  { id: "leonids", name: "Leonids", month: 11, day: 17, radiant: { left: 44, top: 3 } },
  { id: "geminids", name: "Geminids", month: 12, day: 14, radiant: { left: 26, top: 5 } }
];
const SHOWER_STRENGTH = [1, 0.6, 0.3];

export function meteorShower(date) {
  const day = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  for (const shower of METEOR_SHOWERS) {
    for (const year of [date.getFullYear() - 1, date.getFullYear(), date.getFullYear() + 1]) {
      const away = Math.abs(Math.round((day - Date.UTC(year, shower.month - 1, shower.day)) / 86_400_000));
      if (away < SHOWER_STRENGTH.length) return { id: shower.id, name: shower.name, radiant: shower.radiant, strength: SHOWER_STRENGTH[away] };
    }
  }
  return null;
}

// Cada cuanto cruza una estrella fugaz (ms): de vez en cuando una noche
// cualquiera, cada pocos segundos en el pico de una lluvia.
export function shootingStarDelay(shower, rng = Math.random) {
  const strength = shower?.strength || 0;
  if (!strength) return Math.round(between(rng, 25_000, 70_000));
  return Math.round(between(rng, 3_000 + (1 - strength) * 6_000, 8_000 + (1 - strength) * 14_000));
}

// En una lluvia de estrellas salen todas del radiante, en abanico hacia abajo
// (cada una un poco apartada de el), y alguna es una bola de fuego: mas
// grande, mas lenta y con estela de color, y su deseo vale mas.
export function showerStarPath(shower, rng = Math.random) {
  const radiant = shower?.radiant || { left: 60, top: 4 };
  const side = radiant.left < 40 ? 1 : radiant.left > 60 ? -1 : rng() < 0.5 ? -1 : 1;
  const angle = (side > 0 ? between(rng, 12, 60) : between(rng, 120, 168)) * Math.PI / 180;
  const start = between(rng, 3, 14), len = between(rng, 170, 320);
  const fireball = rng() < 0.08 + 0.07 * (shower?.strength || 0);
  return {
    left: Number(Math.max(4, Math.min(96, radiant.left + Math.cos(angle) * start)).toFixed(1)),
    top: Math.round(radiant.top + Math.sin(angle) * start * 0.6),
    dx: Math.round(Math.cos(angle) * len),
    dy: Math.round(Math.max(18, Math.min(46, Math.sin(angle) * len * 0.22))),
    ms: Math.round(fireball ? between(rng, 2600, 3300) : between(rng, 1500, 2300)),
    ...(fireball ? { fireball: true } : {})
  };
}

// De donde sopla el viento (0 = norte, en grados) cuando no hay tiempo de
// verdad: cambia poco a poco a lo largo del dia, igual para todos.
export function fallbackWindDir(date = new Date()) {
  const day = Math.floor(date.getTime() / 86_400_000), hour = date.getUTCHours();
  const base = ((day * 2654435761) >>> 0) % 360;
  return Math.round((base + Math.sin(hour / 24 * Math.PI * 2) * 50 + 360) % 360);
}
// En octavos (0 = norte, 2 = este, 4 = sur, 6 = oeste).
export const windOctant = (deg) => ((Math.round(deg / 45) % 8) + 8) % 8;

// Recorrido de una estrella fugaz: entra por arriba, de derecha a izquierda y
// bajando (como el viento del cielo). left en %, top y desplazamiento en px.
export function shootingStarPath(rng = Math.random) {
  return {
    left: Number(between(rng, 18, 92).toFixed(1)),
    top: Math.round(between(rng, 4, 24)),
    dx: -Math.round(between(rng, 150, 300)),
    dy: Math.round(between(rng, 20, 38)),
    ms: Math.round(between(rng, 1700, 2500))
  };
}
