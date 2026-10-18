// De lo que esta haciendo Buddy (su humor en ScreenBuddy y la fase del evento)
// a una pose del rig de Pip. Sin DOM: los tests de Node comprueban que todos
// los humores tienen pose.

export const MOODS = ["off", "idle", "walk", "talk", "pet", "party", "dance", "sleep", "sleepy", "held", "chute", "rain", "fishing", "find", "hunt", "shoo", "outage", "campfire", "lamps", "forage", "garden", "jellies"];

const FISHING_POSES = {
  approach: "ready", cast: "cast", wait: "ready", bite: "jump", fight: "reel", catch: "holdup",
  escape: "crouch", omen: "ready", monster: "reel", retreat: "land"
};
const HUNT_POSES = { stalk: "ready", ready: "ready", attack: "cast", hit: "holdup" };
const OUTAGE_POSES = { flicker: "crouch", search: "ready", fix: "reel", restore: "jump", stow: "idle" };

// `now`: segundos del reloj del mundo; `since`: cuando empezo este humor.
// `walkFrame`: fotograma del paso segun la distancia andada. Devuelve la pose,
// el fotograma, la cara, un salto (`hop`, en px de arte) y si las manos estan
// ocupadas (entonces no se dibuja lo que lleva en la mano).
export function pipPose({
  mood = "idle", expression = "idle", moving = false, airborne = false, blink = false,
  now = 0, since = 0, walkFrame = 0, fishing = "", hunt = "", outage = "", campfire = ""
} = {}) {
  const t = Math.max(0, now - since);
  const calm = expression === "idle" || expression === "happy" || expression === "focus";
  const face = blink && calm ? "blink" : expression;
  const base = { pose: "idle", frame: Math.floor(now * 1.25) % 2, expr: face, hop: 0, handUp: false, handsBusy: false, zzz: false, flip: false };
  if (moving && mood !== "held" && mood !== "chute") {
    return { ...base, pose: "walk", frame: walkFrame, handUp: mood === "rain", handsBusy: mood === "rain" || mood === "fishing" };
  }
  switch (mood) {
    case "talk":
      return { ...base, expr: expression === "idle" && !blink && Math.floor(now * 7) % 2 ? "talk" : face };
    case "pet":
      return t < 0.55 ? { ...base, pose: "jump", expr: "happy", hop: Math.sin(t / 0.55 * Math.PI) * 4 } : { ...base, expr: "happy" };
    case "party": {
      const c = (now * 2.2) % 1;
      return { ...base, pose: c < 0.5 ? "jump" : "land", expr: "happy", hop: c < 0.5 ? Math.sin(c / 0.5 * Math.PI) * 5 : 0 };
    }
    case "dance": {
      const f = Math.floor(now * 4) % 4;
      return { ...base, pose: ["wave", "land", "wave", "jump"][f], frame: f, expr: "happy", hop: f === 3 ? 3 : 0, flip: Math.floor(now) % 2 === 1 };
    }
    case "sleep":
      return { ...base, pose: "sit", expr: "sleep", zzz: true };
    case "sleepy":
      return { ...base, expr: Math.sin(now * 1.3) > -0.2 ? "sleep" : "blink" };
    case "held":
      return { ...base, pose: "hang", frame: Math.floor(now * 4) % 2, expr: expression === "idle" ? "surprised" : expression, handsBusy: true };
    case "chute":
      return { ...base, pose: "hang", frame: Math.floor(now * 2) % 2, handsBusy: true };
    case "rain":
      return { ...base, handUp: true, handsBusy: true };
    case "fishing":
      return { ...base, pose: fishing === "fight" || fishing === "monster" ? "reel" : FISHING_POSES[fishing] || "ready", frame: Math.floor(now * 10) % 2, handsBusy: true };
    case "find":
      return { ...base, pose: t < 0.8 ? "crouch" : "holdup", expr: "happy", handsBusy: t >= 0.8 };
    case "hunt":
      return { ...base, pose: HUNT_POSES[hunt] || "ready", handsBusy: true };
    case "shoo":
      return { ...base, pose: Math.floor(now * 8) % 2 ? "jump" : "crouch", expr: "surprised", hop: Math.floor(now * 8) % 2 ? 2 : 0 };
    case "outage":
      return { ...base, pose: OUTAGE_POSES[outage] || "idle", frame: Math.floor(now * 6) % 2, handsBusy: outage === "fix" };
    case "lamps":
      return { ...base, handsBusy: true };
    case "forage":
      return { ...base, pose: "crouch", lookY: 1, handsBusy: true };
    // (regar y cosechar: lo afina events/garden.js)
    case "garden":
      return { ...base, handsBusy: true };
    // (en el embarcadero, mirando las medusas: lo afina events/jellies.js)
    case "jellies":
      return { ...base, expr: "happy" };
    case "campfire":
      if (campfire === "light") return { ...base, pose: "crouch", expr: "focus", handsBusy: true };
      return campfire && campfire !== "walk" ? { ...base, pose: "stick", handsBusy: true } : base;
    default:
      return airborne ? { ...base, pose: "hang" } : base;
  }
}
