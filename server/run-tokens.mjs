import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { assertSessionConfiguration } from "./http-guards.mjs";

// Ficha de partida firmada por el servidor. El navegador la pide al abrir el
// juego y la devuelve con cada marcador: asi la duracion que declara una
// partida se compara con el tiempo que el servidor ha visto pasar de verdad,
// en vez de creerse un durationMs inventado. Un tramposo tiene que esperar al
// menos lo que tardaria una partida real al ritmo maximo permitido.
//
// No guarda estado: la firma basta para saber que la emitio este servidor, y
// una misma ficha sirve para varias partidas seguidas dentro del mismo juego.
export const RUN_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
// Holgura para la latencia entre emitir la ficha y que arranque el juego, que
// a veces empieza a contar antes de que la respuesta llegue al navegador.
export const RUN_CLOCK_SLACK_MS = 10_000;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,200}\.[A-Za-z0-9_-]{43}$/;
// Prefijo de dominio: la ficha comparte secreto con la cookie de sesion, asi que
// las firmas tienen que ser imposibles de intercambiar entre ambas.
const SIGNING_DOMAIN = "daivr-run-token:v1:";

function secret() {
  assertSessionConfiguration();
  return process.env.COMMENTS_SESSION_SECRET || process.env.JWT_SECRET || "daivr-dev-comment-secret";
}

function sign(body) {
  return createHmac("sha256", secret()).update(`${SIGNING_DOMAIN}${body}`).digest("base64url");
}

export function issueRunToken(game, now = Date.now()) {
  const body = Buffer.from(JSON.stringify({ g: game, t: now, n: randomBytes(9).toString("base64url") })).toString("base64url");
  return `${body}.${sign(body)}`;
}

// Devuelve el instante de emision, o null si la ficha no es valida para este juego.
export function readRunToken(token, game, now = Date.now()) {
  if (typeof token !== "string" || !TOKEN_PATTERN.test(token)) return null;
  const [body, signature] = token.split(".");
  const expected = Buffer.from(sign(body));
  const received = Buffer.from(signature);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
  let payload;
  try { payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")); } catch { return null; }
  const issuedAt = Number(payload?.t);
  if (payload?.g !== game || !Number.isFinite(issuedAt)) return null;
  if (issuedAt > now + RUN_CLOCK_SLACK_MS || now - issuedAt > RUN_TOKEN_TTL_MS) return null;
  return issuedAt;
}

// Comprueba que la partida no dure mas que el tiempo transcurrido desde la ficha.
export function checkRunDuration(token, game, durationMs, now = Date.now()) {
  const issuedAt = readRunToken(token, game, now);
  if (issuedAt === null) return { ok: false, status: 400, error: "Run token missing or expired. Reopen the game and try again." };
  if (durationMs > now - issuedAt + RUN_CLOCK_SLACK_MS) return { ok: false, status: 422, error: "Run lasted longer than the server has been watching." };
  return { ok: true, issuedAt };
}

export function sendRunToken(response, game) {
  response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify({ token: issueRunToken(game), ttlMs: RUN_TOKEN_TTL_MS }));
}
