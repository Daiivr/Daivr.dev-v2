import { createHash } from "node:crypto";

export async function readJsonBody(request, limit = 16_384) {
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > limit) throw Object.assign(new Error("Request is too large."), { status: 413 });
    chunks.push(chunk);
  }
  try {
    const value = chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {};
    if (!value || Array.isArray(value) || typeof value !== "object") throw new Error();
    return value;
  } catch { throw Object.assign(new Error("Send a valid JSON object."), { status: 400 }); }
}

export function sameOrigin(request) {
  const origin = request.headers?.origin;
  if (!origin) return request.headers?.["sec-fetch-site"] !== "cross-site";
  try {
    const host = String(request.headers?.["x-forwarded-host"] || request.headers?.host || "").split(",")[0].trim();
    return new URL(origin).host === host;
  } catch { return false; }
}

// Produccion va detras del edge de Cloudflare de Render, que sobrescribe
// cf-connecting-ip con la IP real. X-Forwarded-For queda de respaldo para
// otros despliegues: su primera entrada la puede inventar el cliente, asi que
// solo sirve para limites de cortesia, nunca para autorizar nada.
export function clientAddress(request) {
  const header = (name) => String(request.headers?.[name] || "").split(",")[0].trim();
  return header("cf-connecting-ip") || header("true-client-ip") || header("x-forwarded-for") || request.socket?.remoteAddress || "unknown";
}

// Clave opaca por visitante para limites en memoria: no se guarda la IP en claro.
export function clientKey(request, ...parts) {
  return createHash("sha256").update([clientAddress(request), ...parts].join("\0")).digest("base64url").slice(0, 22);
}

export function assertSessionConfiguration(production = process.env.NODE_ENV === "production") {
  const secret = process.env.COMMENTS_SESSION_SECRET || process.env.JWT_SECRET;
  if (production && (!secret || secret === "daivr-dev-comment-secret")) {
    throw new Error("Set COMMENTS_SESSION_SECRET before starting in production.");
  }
}

export function postingDelay(comments, userId, text, gifUrl, now = Date.now()) {
  const recent = comments.flatMap((comment) => [comment, ...(comment.replies || [])])
    .filter((entry) => String(entry.author?.id) === String(userId) && now - Date.parse(entry.createdAt) < 3_600_000)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  if (recent.length >= 30) return Math.max(1, Math.ceil((Date.parse(recent[recent.length - 1].createdAt) + 3_600_000 - now) / 1000));
  const duplicate = recent.find((entry) => entry.text === text && (entry.gifUrl || "") === gifUrl && now - Date.parse(entry.createdAt) < 60_000);
  const wait = Math.max(recent.length ? Date.parse(recent[0].createdAt) + 8000 - now : 0, duplicate ? Date.parse(duplicate.createdAt) + 60_000 - now : 0);
  return Math.max(0, Math.ceil(wait / 1000));
}
