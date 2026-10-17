// Donde estan Buddy y las visitas, para el lienzo del footer. ScreenBuddy
// publica su estado al renderizar (x/y en px del escenario y la duracion del
// paseo); el lienzo reproduce la misma transicion lineal que el CSS
// (`transition: transform var(--buddy-walk-ms) linear`) sin medir el DOM.
// Sin DOM: los tests de Node lo importan tal cual.

const actors = new Map();
const clock = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

// Posicion en un instante: la transicion va del punto donde estaba cuando
// cambio el destino hasta el destino, en walkMs.
export function actorPosition(actor, time = clock()) {
  if (!actor) return null;
  const p = actor.walkMs > 0 ? Math.min(1, Math.max(0, (time - actor.startedAt) / actor.walkMs)) : 1;
  return {
    x: actor.fromX + (actor.x - actor.fromX) * p,
    y: actor.fromY + (actor.y - actor.fromY) * p,
    moving: p < 1 && (actor.x !== actor.fromX || actor.y !== actor.fromY)
  };
}

export function publishActor(id, next, time = clock()) {
  const prev = actors.get(id);
  const x = Number(next.x) || 0, y = Number(next.y) || 0;
  let entry;
  if (prev && prev.x === x && prev.y === y) {
    // Mismo destino: la transicion en curso sigue con su duracion.
    entry = { ...prev, ...next, id, x, y, fromX: prev.fromX, fromY: prev.fromY, startedAt: prev.startedAt, walkMs: prev.walkMs };
  } else {
    const from = prev ? actorPosition(prev, time) : { x, y };
    entry = { ...next, id, x, y, fromX: from.x, fromY: from.y, startedAt: time, walkMs: Math.max(0, Number(next.walkMs) || 0) };
  }
  actors.set(id, entry);
  return entry;
}

export function dropActor(id) { actors.delete(id); }
export function getActor(id) { return actors.get(id) || null; }
export function listActors() { return [...actors.values()]; }
