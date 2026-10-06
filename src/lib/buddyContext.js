// Charla de contexto de Buddy: lo que pasa fuera del armario (el tiempo de
// verdad, la hora, el dia), cuanto llevas aqui, si vuelves, y como esta el
// arcade. Solo genera frases; ScreenBuddy decide cuando decirlas. Cada frase
// lleva un tema para que los buddies de visita sepan de que se habla.
// Sin React ni DOM: los tests de Node lo importan tal cual.

import { dailyChallenge, gameTitle } from "../../shared/player-catalog.mjs";

// --- Tiempo de fuera ------------------------------------------------------------

// Codigos WMO de Open-Meteo agrupados en lo que Buddy sabe comentar.
export function weatherCondition(code) {
  const value = Number(code);
  if (!Number.isInteger(value)) return "";
  if (value <= 1) return "clear";
  if (value <= 3) return "cloudy";
  if (value === 45 || value === 48) return "fog";
  if (value >= 51 && value <= 57) return "drizzle";
  if ((value >= 61 && value <= 67) || (value >= 80 && value <= 82)) return "rain";
  if ((value >= 71 && value <= 77) || value === 85 || value === 86) return "snow";
  if (value >= 95) return "storm";
  return "";
}

// Fahrenheit solo donde se usa de verdad, y solo si el idioma trae region
// ("en" a secas se queda en Celsius, como casi todo el mundo).
const FAHRENHEIT_REGIONS = new Set(["US", "LR", "MM", "BS", "BZ", "KY", "PW", "FM", "MH"]);

export function formatTemperature(celsius, locale = "") {
  let region = "";
  try {
    region = new Intl.Locale(locale || "und").region || "";
  } catch {
    region = "";
  }
  return FAHRENHEIT_REGIONS.has(region) ? `${Math.round((celsius * 9) / 5 + 32)}°F` : `${Math.round(celsius)}°C`;
}

const WEATHER_LINES = {
  clearDay: ["sunny out there, {temp}. perfect cabinet weather.", "clear skies outside. {temp}. my pixels approve.", "{temp} and sunny? and you're in here? respect."],
  clearNight: ["clear night outside, {temp}. good for stargazing.", "{temp} and clear tonight. the moon says hi."],
  cloudy: ["cloudy out there, {temp}. cozy lighting in here.", "grey skies outside. the footer glows anyway.", "{temp} and cloudy. classic indoor day."],
  fog: ["foggy out there. like a CRT warming up.", "fog outside. visibility: one footer."],
  drizzle: ["drizzle outside, {temp}. light rain, heavy vibes.", "a little drizzle out there. stay dry, player."],
  rain: ["it's raining out there, {temp}. glad we're indoors.", "rain outside. want me to fetch the umbrella?", "rainy day? perfect for exploring cartridges."],
  snow: ["it's snowing out there?! {temp}. stay warm.", "snow outside. the footer is warm, i checked.", "{temp} and snowy. hot chocolate protocol."],
  storm: ["thunder outside? good thing the cabinet is grounded.", "storm out there, {temp}. i'll hold the fort."],
  hot: ["{temp} out there?! the fans in here are on overtime.", "it's hot outside. stay hydrated, player."],
  cold: ["{temp} outside. brr. the cabinet is warmer.", "freezing out there. warm hands, cold code."],
  windy: ["windy out there. i'm holding my antenna.", "it's blowing hard outside. pixels secured."]
};

// Sin datos de fuera (desarrollo, o sin ubicacion): el parte del armario.
export const CABINET_WEATHER_LINES = [
  "forecast for the footer: 100% chance of pixels.",
  "weather report: scattered bytes, light static.",
  "cabinet humidity: low. vibes: high.",
  "no clouds in the footer today. checked.",
  "indoor forecast: warm glow, zero wind."
];

export function weatherLines(weather, locale = "") {
  if (!weather?.available) return CABINET_WEATHER_LINES;
  const temp = formatTemperature(weather.temperature, locale);
  const condition = weatherCondition(weather.code);
  const lines = [];
  if (condition === "clear") lines.push(...(weather.isDay === false ? WEATHER_LINES.clearNight : WEATHER_LINES.clearDay));
  else if (condition) lines.push(...WEATHER_LINES[condition]);
  if (weather.temperature >= 30) lines.push(...WEATHER_LINES.hot);
  if (weather.temperature <= 0) lines.push(...WEATHER_LINES.cold);
  if (weather.wind >= 35) lines.push(...WEATHER_LINES.windy);
  return lines.map((line) => line.replace("{temp}", temp));
}

export function isRainingOutside(weather) {
  return Boolean(weather?.available) && ["drizzle", "rain", "storm"].includes(weatherCondition(weather.code));
}

// --- Hora y dia -----------------------------------------------------------------

export function timeLines(date = new Date()) {
  const day = date.getDay();
  const hour = date.getHours();
  const lines = [];
  if (day === 1) lines.push("monday again? i'll be gentle.", "new week, same footer.");
  else if (day === 5) lines.push("friday! the footer is in weekend mode.", "almost the weekend. hang in there.");
  else if (day === 0 || day === 6) lines.push("weekend browsing? respect.", "no work on weekends. only arcade.");
  else lines.push("midweek patrol. all quiet.", `${date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()} shift reporting.`);
  if (hour >= 12 && hour < 14) lines.push("lunch break? i'll guard your tabs.", "is it snack o'clock?");
  if (hour >= 18 && hour < 21) lines.push("evening shift. lights low, vibes high.", "dinner soon? i'll keep your seat.");
  if (hour >= 2 && hour < 5) lines.push("it's really late... or really early?", "the night owls are out. hi, owl.");
  return lines;
}

// --- Tu visita ------------------------------------------------------------------

const SESSION_MILESTONES = [
  { minutes: 5, line: "five minutes in. i like your style." },
  { minutes: 15, line: "15 minutes here! tip: press / for the terminal." },
  { minutes: 30, line: "half an hour! you basically live here now." },
  { minutes: 60, line: "an hour in the arcade. certified regular." }
];

// El hito que toca ahora, o null. `saidUpTo` son los minutos del ultimo hito
// dicho: si Buddy no estaba a la vista, salta al mas reciente y los anteriores
// ya no se dicen (nada de "cinco minutos" a los dieciseis).
export function sessionMilestone(elapsedMs, saidUpTo = 0) {
  const minutes = elapsedMs / 60_000;
  const due = SESSION_MILESTONES.filter((milestone) => minutes >= milestone.minutes && milestone.minutes > saidUpTo);
  return due.length ? due[due.length - 1] : null;
}

// Saludo segun cuando viniste por ultima vez (null = primera vez).
export function returnLines(lastSeenAt, now = Date.now()) {
  if (!lastSeenAt) return ["first time here? welcome! press / for the terminal.", "new player! i'm Buddy. pet me sometime."];
  const hours = (now - lastSeenAt) / 3_600_000;
  if (hours < 1) return [];
  const days = Math.floor(hours / 24);
  if (days < 1) return ["back again today? nice.", "round two! welcome back."];
  if (days === 1) return ["back again! good to see you.", "you came back! the footer missed you."];
  if (days <= 30) return [`it's been ${days} days! the footer missed you.`, `${days} days away? i kept your spot warm.`];
  return ["it's been ages! welcome back, player.", "long time no see. the arcade grew a bit."];
}

// --- El arcade ahora mismo -------------------------------------------------------

export function arcadeLines({ online = null, level = null, now = Date.now(), nzp = false } = {}) {
  const lines = [];
  if (online >= 3) lines.push({ topic: "arcade", line: `${online} players in the arcade right now.` }, { topic: "arcade", line: "busy arcade today. lots of footsteps." });
  else if (online === 2) lines.push({ topic: "arcade", line: "one other player is here right now. say hi?" });
  const daily = dailyChallenge(now, { nzp });
  const game = gameTitle(daily.game);
  if (game) lines.push({ topic: "daily", line: `today's daily is ${game}. you in?` }, { topic: "daily", line: `daily challenge: ${game}. i believe in you.` });
  if (level >= 2) lines.push({ topic: "level", line: `level ${level}! look at you go.` });
  return lines;
}

// Todo lo de contexto que puede entrar en la charla de relleno, con su tema.
export function contextLines({ date = new Date(), weather = null, locale = "", online = null, level = null, nzp = false } = {}) {
  const real = Boolean(weather?.available);
  return [
    // El tiempo de verdad pesa doble: es lo mas "de fuera" que puede decir.
    ...weatherLines(weather, locale).flatMap((line) => (real ? [line, line] : [line])).map((line) => ({ topic: "weather", line })),
    ...timeLines(date).map((line) => ({ topic: "time", line })),
    ...arcadeLines({ online, level, now: date.getTime(), nzp })
  ];
}

// --- Sucesos ----------------------------------------------------------------------

export const EVENT_LINES = {
  tabReturn: ["welcome back! i guarded the footer.", "oh, you're back! nothing exploded. probably.", "back already? i was about to nap."],
  offline: ["signal lost... is the internet napping?", "no signal. i'll wait right here."],
  online: ["signal's back! phew.", "reconnected. the arcade lives."],
  footer: ["oh hi! you scrolled all the way down.", "welcome to the footer. population: me."],
  rainBoth: ["rain in here AND outside? double umbrella.", "it's raining out there too. matching weather!"]
};

// Version nueva publicada (UpdateNotice): Buddy lo cuenta en cuanto esta libre.
// Con nota de parche nueva, dice cual; si solo son arreglos, lo dice en general.
export function updateLines({ version = "", codename = "", newRelease = false } = {}) {
  if (newRelease && version) {
    const name = codename ? `"${codename.toLowerCase()}"` : version;
    return [
      `psst. ${version} just shipped. reload when you're ready.`,
      `patch day! ${name} is out. reload to see it.`,
      `new build on the server: ${name}. my catches are saved, reload whenever.`
    ];
  }
  return [
    "psst. a fresh build just shipped. reload when you're ready.",
    "new build on the server. fewer bugs, probably. reload whenever.",
    "patch day! reload when your line's in."
  ];
}
