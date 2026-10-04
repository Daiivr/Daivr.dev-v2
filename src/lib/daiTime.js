// La hora de Dai (profile.timezone) para status.ini en Now.log: la hora y la
// zona, en que parte del dia esta, y cuanto le saca o le falta al visitante.
// Puro: se le pasa la fecha, asi se prueba con node.

export const DAY_PARTS = [
  { id: "night", label: "night mode", from: 0, to: 6 },
  { id: "morning", label: "morning boot", from: 6, to: 11 },
  { id: "day", label: "day shift", from: 11, to: 17 },
  { id: "evening", label: "evening build", from: 17, to: 20 },
  { id: "night", label: "night mode", from: 20, to: 24 }
];

export function dayPart(hour) {
  return DAY_PARTS.find((part) => hour >= part.from && hour < part.to) || DAY_PARTS[0];
}

function zonedParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
    timeZoneName: "short"
  }).formatToParts(date);
  const value = (type) => parts.find((part) => part.type === type)?.value || "";
  return {
    year: Number(value("year")),
    month: Number(value("month")),
    day: Number(value("day")),
    hour: Number(value("hour")) % 24,
    minute: Number(value("minute")),
    zone: value("timeZoneName")
  };
}

// Hora en esa zona: { hour, minute, label "03:41", zone "AKDT" }.
export function zonedClock(date, timeZone) {
  const { hour, minute, zone } = zonedParts(date, timeZone);
  return { hour, minute, zone, label: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}` };
}

// Horas que esa zona va por delante (+) o por detras (-) del reloj local del
// visitante, a la media hora.
export function hoursApart(date, timeZone) {
  const there = zonedParts(date, timeZone);
  const thereMs = Date.UTC(there.year, there.month - 1, there.day, there.hour, there.minute);
  const hereMs = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes());
  return Math.round((thereMs - hereMs) / 1_800_000) / 2;
}

export function offsetLabel(hours) {
  if (!hours) return "same time as you";
  const amount = `${Math.abs(hours)}h`;
  return hours < 0 ? `${amount} behind you` : `${amount} ahead of you`;
}
