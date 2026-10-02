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
