import { randomBytes } from "node:crypto";
import { sanitizeVisitLook } from "../shared/buddy-visits.mjs";

// Registro de visitas de buddies, colgado de las conexiones del stream del
// libro de visitas (cada pestaña abierta es un cliente). Cada conexion recibe
// un id publico (el que ven los demas) y un token secreto (solo suyo) con el
// que publica el aspecto de su buddy. Sin efectos al importarse.

const LOOK_MIN_INTERVAL_MS = 1500;
const MAX_ID_LENGTH = 64;

export function attachVisitor(client) {
  client.visit = {
    id: randomBytes(9).toString("base64url"),
    token: randomBytes(18).toString("base64url"),
    look: null,
    browser: "",
    updatedAt: 0
  };
  return client.visit;
}

const cleanId = (value) => (typeof value === "string" && /^[\w-]{1,64}$/.test(value) ? value.slice(0, MAX_ID_LENGTH) : "");

// Publica (o retira, con look null) el aspecto del buddy de una conexion.
// Devuelve { status, error?, changed } para que el llamante conteste y decida
// si hay que avisar al resto.
export function applyVisitLook(clients, body, now = Date.now()) {
  const token = cleanId(body?.token);
  if (!token) return { status: 400, error: "Missing visit token." };
  const client = [...clients].find((entry) => entry.visit?.token === token);
  if (!client) return { status: 404, error: "That stream connection is gone." };
  const visit = client.visit;
  if (now - visit.updatedAt < LOOK_MIN_INTERVAL_MS) return { status: 429, error: "Slow down." };

  const look = body.look === null ? null : sanitizeVisitLook(body.look);
  if (body.look !== null && !look) return { status: 400, error: "Invalid buddy look." };
  const browser = cleanId(body.browser);
  const changed = JSON.stringify(look) !== JSON.stringify(visit.look) || browser !== visit.browser;
  visit.look = look;
  visit.browser = browser;
  visit.updatedAt = now;
  return { status: 200, changed };
}

// Los buddies que puede recibir `recipient`: todos los que publicaron aspecto,
// menos sus propias pestañas (misma conexion, misma cuenta de Discord o mismo
// navegador). El nombre sale de la sesion del servidor, nunca del cliente.
export function visitRosterFor(recipient, clients, getUser) {
  const me = recipient.visit;
  const myUser = getUser(recipient.request);
  const roster = [];
  for (const client of clients) {
    const visit = client.visit;
    if (!visit?.look || client === recipient) continue;
    if (me?.browser && visit.browser === me.browser) continue;
    const user = getUser(client.request);
    if (myUser && user && String(myUser.id) === String(user.id)) continue;
    roster.push({ id: visit.id, name: user?.username ? String(user.username).slice(0, 32) : null, look: visit.look });
  }
  return roster;
}

// Saludos entre jugadores: quien ve un buddy de visita puede saludarle y el
// saludo llega a la pestaña de ese jugador (`visits:wave`), que puede
// devolverlo. Solo a quien de verdad te puede visitar (el mismo filtro que la
// lista), uno cada pocos segundos y no al mismo buddy una y otra vez.
const WAVE_MIN_INTERVAL_MS = 3000;
const WAVE_PAIR_COOLDOWN_MS = 20_000;
const WAVE_MEMORY = 24;

export function applyVisitWave(clients, body, getUser, now = Date.now()) {
  const token = cleanId(body?.token);
  const to = cleanId(body?.to);
  if (!token || !to) return { status: 400, error: "Missing wave target." };
  const sender = [...clients].find((entry) => entry.visit?.token === token);
  if (!sender) return { status: 404, error: "That stream connection is gone." };
  const target = [...clients].find((entry) => entry.visit?.id === to);
  if (!target || !visitRosterFor(sender, [target], getUser).length) return { status: 404, error: "That buddy already went home." };

  const visit = sender.visit;
  visit.waves ||= new Map();
  if (visit.lastWaveAt && now - visit.lastWaveAt < WAVE_MIN_INTERVAL_MS) return { status: 429, error: "Slow down." };
  if (visit.waves.has(to) && now - visit.waves.get(to) < WAVE_PAIR_COOLDOWN_MS) return { status: 429, error: "You just waved at them." };
  visit.lastWaveAt = now;
  visit.waves.set(to, now);
  if (visit.waves.size > WAVE_MEMORY) visit.waves.delete(visit.waves.keys().next().value);

  const user = getUser(sender.request);
  return {
    status: 200,
    target,
    payload: { from: visit.id, name: user?.username ? String(user.username).slice(0, 32) : null, look: visit.look }
  };
}
