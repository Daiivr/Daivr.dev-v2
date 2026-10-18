import { FEET } from "../layout.js";

// Pip entra en su tienda y sale de ella (useBuddyLife publica `tent`: "enter",
// "in" o "exit"). Al entrar se agacha en la puerta y da un saltito hacia
// dentro: sube hasta el umbral (DOOR_LIFT, la fila donde apoya la tienda), la
// lona le tapa todo menos la entrada (life/tent.js la dibuja por delante) y se
// deshace en la oscuridad en cuatro pasos de trama (nada de escalar el pixel
// art), con polvo en la puerta. Al salir, al reves: aparece en la entrada,
// salta al sendero con otro poco de polvo y se despereza con los brazos en
// alto. Mientras esta dentro, el mundo no lo dibuja (la tienda se ilumina y
// asoman sus botas).
const ENTER = { crouch: 0.35, hop: 0.6, gone: 1.05 };
const EXIT = { appear: 0.45, hop: 0.7, land: 0.9, stretch: 1.6 };
export const DOOR_LIFT = 6;
// (cuando la lona va por delante de Pip: ya en el umbral)
export const behindTent = (phase, e) => (phase === "enter" ? e > ENTER.crouch + 0.12 : phase === "exit" ? e < EXIT.appear + 0.12 : false);
const step4 = (k) => Math.max(0, Math.min(1, Math.ceil(k * 4) / 4));

export function tentUpdate(actor, a, env) {
  const phase = typeof actor.tent === "string" ? actor.tent : "";
  if ((a.tentPhase ?? "") !== phase) { a.tentPhase = phase; a.tentSince = env.t; a.tentDust = false; }
  if (phase !== "enter" && phase !== "exit") return;
  const e = env.t - a.tentSince;
  // polvo en la puerta: al saltar dentro y al aterrizar fuera
  if (!a.tentDust && e > (phase === "enter" ? ENTER.crouch + 0.1 : EXIT.hop)) {
    a.tentDust = true;
    for (let i = 0; i < 6; i++) env.spawn({ k: "dust", x: actor.x + (Math.random() - 0.5) * 12, y: FEET - Math.random() * 2, vx: (Math.random() - 0.5) * 16, vy: -3 - Math.random() * 4, life: 0.5 + Math.random() * 0.2, c: Math.random() < 0.5 ? "#c8a878" : "#a8875a" });
  }
}

// `dissolve`: cuanto se ve de Pip (0..1, en pasos de trama); `hop`: lo que
// sube (hacia dentro de la tienda, al fondo).
export function tentPose(actor, a, t) {
  const phase = a.tentPhase;
  if (phase !== "enter" && phase !== "exit") return null;
  const e = t - a.tentSince;
  if (phase === "enter") {
    if (e < ENTER.crouch) return { pose: "crouch", expr: "blink" };
    // salta al umbral (con un arco) y alli se deshace
    const h = Math.min(1, (e - ENTER.crouch) / (ENTER.hop - ENTER.crouch));
    const k = Math.max(0, Math.min(1, (e - ENTER.hop + 0.1) / (ENTER.gone - ENTER.hop + 0.1)));
    return { pose: h < 1 ? "jump" : "crouch", expr: "sleep", hop: h * DOOR_LIFT + Math.sin(h * Math.PI) * 3, dissolve: step4(1 - k) };
  }
  if (e < EXIT.appear) return { pose: "crouch", expr: "blink", hop: DOOR_LIFT, dissolve: step4(e / EXIT.appear) };
  if (e < EXIT.hop) {
    const h = (e - EXIT.appear) / (EXIT.hop - EXIT.appear);
    return { pose: "jump", expr: "blink", hop: (1 - h) * DOOR_LIFT + Math.sin(h * Math.PI) * 3 };
  }
  if (e < EXIT.land) return { pose: "land", expr: "blink" };
  // se despereza: brazos arriba con los ojos cerrados, y luego contento
  if (e < EXIT.stretch) return { pose: "holdup", expr: "sleep", hop: Math.sin((e - EXIT.land) / (EXIT.stretch - EXIT.land) * Math.PI) };
  return { pose: "idle", expr: "happy" };
}
