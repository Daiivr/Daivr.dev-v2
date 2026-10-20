import { FEET } from "../layout.js";
import { CLOSE_S, PIP_HALF, PORTAL_RX, PORTAL_RY, createPortalPainter } from "../portal.js";

// Pip llega al sendero por el portal (la entrada rara de la puerta). Lo
// publica BuddyPortalTravel como un actor de paso con `portalTrip` {x (plano
// del portal, px de arte), side (+1: sale hacia la derecha), phase}:
// arrive-open (se abre, Pip aun no se ve), arrive-walk (sale del remolino:
// lo que sigue dentro es una silueta tramada) y arrive-close (se gira, dice
// adios con la mano mientras se cierra, mira al frente y da un saltito).
// Luego ScreenBuddy toma el relevo en el mismo sitio.

const painter = createPortalPainter();
// La base del ovalo, una fila por debajo de los pies.
const CY = FEET + 1 - PORTAL_RY;
const PHASE = { "arrive-open": "open", "arrive-walk": "steady", "arrive-close": "close" };

export function portalUpdate(actor, a, env) {
  const p = actor.portalTrip;
  if (!p) return;
  if (a.portalPhase !== p.phase) {
    a.portalPhase = p.phase; a.portalSince = env.t;
    if (p.phase === "arrive-walk") { a.portalRipples = []; a.portalOut = null; }
  }
  if (p.phase !== "arrive-walk") return;
  // Cuando la nariz asoma por el borde: ondas en el remolino y chispas.
  const ahead = (actor.x - p.x) * p.side + PIP_HALF;
  if (a.portalOut == null && ahead >= PORTAL_RX - 1) { a.portalOut = env.t; a.portalRipples.push({ dy: 2, at: env.t }); }
  if (a.portalRipples.length === 1 && ahead >= PORTAL_RX + 8) a.portalRipples.push({ dy: -6, at: env.t });
}

export function portalPose(actor, a, t) {
  const p = actor.portalTrip;
  if (!p || a.portalPhase !== p.phase) return null;
  const e = t - a.portalSince;
  if (p.phase === "arrive-open") return { pose: "idle", cut: { x: p.x + p.side * 99, keep: p.side }, shadow: 0, hidden: true };
  if (p.phase === "arrive-walk") {
    const out = Math.max(0, Math.min(1, ((actor.x - p.x) * p.side - 2) / 14));
    return { expr: e < 0.55 ? "surprised" : "happy", cut: { x: p.x, keep: p.side }, shadow: out };
  }
  // Fuera ya: se vuelve hacia el portal y saluda; al cerrarse, al frente y salto.
  if (e < 0.14) return { pose: "idle", expr: "happy" };
  if (e < 0.8) return { pose: e > 0.24 && e < 0.74 ? "wave" : "idle", frame: Math.floor(e * 6) % 2, expr: "happy", flip: true };
  if (e < 0.9) return { pose: "idle", expr: "happy" };
  if (e < 1.1) return { pose: "jump", expr: "happy", hop: Math.round(Math.sin((e - 0.9) / 0.2 * Math.PI) * 3) };
  if (e < 1.18) return { pose: "land", expr: "happy" };
  return { pose: "idle", expr: "happy" };
}

function shapeFor(p, a, t) {
  const e = t - a.portalSince;
  return { phase: PHASE[p.phase], e, shape: painter.shape(PHASE[p.phase], e, t) };
}

// Encima de la luz: brilla igual de dia que de noche.
export function portalDrawOverlay(g, actor, a, fr, env) {
  const p = actor.portalTrip;
  if (!p || a.portalPhase !== p.phase || !PHASE[p.phase]) return;
  const { phase, e } = shapeFor(p, a, env.t);
  if (phase === "close" && e > CLOSE_S) return;
  painter.draw(g, Math.round(p.x), CY, {
    phase, e, t: env.t, near: p.side, ground: FEET + 1, additive: true, flow: "out",
    traveler: p.phase === "arrive-walk" ? { img: fr.rig.c, left: fr.left, top: fr.top, flip: fr.flip } : null,
    emerge: a.portalOut != null ? env.t - a.portalOut : null,
    ripples: (a.portalRipples || []).map((r) => ({ dy: r.dy, age: env.t - r.at }))
  });
}

// De noche el portal alumbra el sendero y a Pip (lila, y cian a ras de suelo).
export function portalLight(actor, a, env) {
  const p = actor.portalTrip;
  if (!p || a.portalPhase !== p.phase || !PHASE[p.phase]) return null;
  const { shape } = shapeFor(p, a, env.t);
  if (!shape) return null;
  const k = Math.max(Math.min(1, shape.rx), (shape.seam || 0) * 0.35, shape.pop != null ? 0.3 * (1 - shape.pop) : 0);
  if (k <= 0.02) return null;
  return {
    dim: 0,
    lights: [
      { x: p.x, y: CY, r: 26, c: [0.62, 0.56, 1], s: 0.6 * k },
      { x: p.x + p.side * 8, y: FEET - 2, r: 16, c: [0.55, 0.85, 1], s: 0.45 * k }
    ]
  };
}
