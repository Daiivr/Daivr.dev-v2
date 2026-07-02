import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const COMMENTS_FILE = join(process.cwd(), "data", "comments.json");
const PREFERENCES_FILE = join(process.cwd(), "data", "preferences.json");
const SESSION_COOKIE = "daivr_comment_session";
const STATE_COOKIE = "daivr_comment_state";
const DISCORD_AUTH_URL = "https://discord.com/oauth2/authorize";
const DISCORD_TOKEN_URL = "https://discord.com/api/oauth2/token";
const DISCORD_ME_URL = "https://discord.com/api/users/@me";
const DEFAULT_AVATAR = "https://cdn.discordapp.com/embed/avatars/0.png";
const DEFAULT_REACTIONS = [
  "smile",
  "laugh-tears",
  "heart-eyes",
  "surprised-hands",
  "simple-smile",
  "monocle",
  "sweat",
  "angry",
  "sparkle-heart",
  "thumbs-up",
  "thumbs-down",
  "blank",
  "fire",
  "party-popper",
  "sparkles",
  "skull"
];
const LEGACY_REACTION_ALIASES = {
  "😀": "smile",
  "😂": "laugh-tears",
  "😍": "heart-eyes",
  "😱": "surprised-hands",
  "😡": "angry",
  "💖": "sparkle-heart",
  "👍": "thumbs-up",
  "👎": "thumbs-down",
  "🎉": "party-popper",
  "🔥": "fire",
  "💀": "skull",
  "✨": "sparkles",
  "⚡": "sparkles",
  "💚": "sparkle-heart"
};
const KLIPY_LIMIT = 24;
const KLIPY_RATING = "pg-13";
const KLIPY_LOCALE = "us_US";
const THEME_VALUES = new Set(["crt", "glitch"]);

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function redirect(response, location, headers = {}) {
  response.writeHead(302, { Location: location, ...headers });
  response.end();
}

function ensureCommentsFile() {
  const dir = dirname(COMMENTS_FILE);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  if (existsSync(COMMENTS_FILE)) return;

  writeFileSync(
    COMMENTS_FILE,
    JSON.stringify(
      [
        {
          id: "seed-01",
          text: "First signal on the new cabinet. Drop build ideas, game-night tools, and weird web panels here.",
          createdAt: "2026-07-01T22:10:00.000Z",
          pinned: true,
          author: {
            id: "system",
            username: "Dai",
            avatarUrl: "/assets/reference/dai-peach-card.png",
            isAdmin: true
          },
          reactions: {
            "sparkle-heart": ["system"],
            "sparkles": ["system"]
          }
        },
        {
          id: "seed-02",
          text: "Guestbook stream online. Discord-auth messages will show up here once the gate is wired.",
          createdAt: "2026-07-01T22:22:00.000Z",
          pinned: false,
          author: {
            id: "terminal",
            username: "cabinet.node",
            avatarUrl: "",
            isAdmin: false
          },
          reactions: {
            "sparkles": ["system"]
          }
        }
      ],
      null,
      2
    ),
    "utf8"
  );
}

function readComments() {
  ensureCommentsFile();
  try {
    const data = JSON.parse(readFileSync(COMMENTS_FILE, "utf8"));
    if (!Array.isArray(data)) return [];
    return data.map((comment) => ({
      ...comment,
      pinned: !!comment.pinned,
      gifUrl: sanitizeGifUrl(comment.gifUrl),
      replies: Array.isArray(comment.replies)
        ? comment.replies.map((reply) => ({
            ...reply,
            gifUrl: sanitizeGifUrl(reply.gifUrl),
            author: {
              username: "Unknown signal",
              avatarUrl: DEFAULT_AVATAR,
              isAdmin: false,
              ...(reply.author || {})
            }
          }))
        : [],
      reactions: normalizeReactions(comment.reactions),
      author: {
        username: "Unknown signal",
        avatarUrl: DEFAULT_AVATAR,
        isAdmin: false,
        ...(comment.author || {})
      }
    }));
  } catch (error) {
    console.error("Comments read error", error.message || error);
    return [];
  }
}

function writeComments(comments) {
  ensureCommentsFile();
  writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2), "utf8");
}

function ensurePreferencesFile() {
  const dir = dirname(PREFERENCES_FILE);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  if (!existsSync(PREFERENCES_FILE)) writeFileSync(PREFERENCES_FILE, "{}", "utf8");
}

function readPreferences() {
  ensurePreferencesFile();
  try {
    const data = JSON.parse(readFileSync(PREFERENCES_FILE, "utf8"));
    return data && typeof data === "object" && !Array.isArray(data) ? data : {};
  } catch (error) {
    console.error("Preferences read error", error.message || error);
    return {};
  }
}

function writePreferences(preferences) {
  ensurePreferencesFile();
  writeFileSync(PREFERENCES_FILE, JSON.stringify(preferences, null, 2), "utf8");
}

function getUserPreferences(user) {
  if (!user) return { theme: "" };
  const preferences = readPreferences();
  const entry = preferences[String(user.id)] || {};
  return {
    theme: THEME_VALUES.has(entry.theme) ? entry.theme : ""
  };
}

function sortComments(comments) {
  return [...comments].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function sanitizeGifUrl(value) {
  const url = String(value || "").trim();
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return "";
    return parsed.toString().slice(0, 700);
  } catch {
    return "";
  }
}

function normalizeReactionKey(value) {
  const key = String(value || "").trim();
  return LEGACY_REACTION_ALIASES[key] || key;
}

function normalizeReactions(reactions) {
  if (!reactions || typeof reactions !== "object" || Array.isArray(reactions)) return {};

  return Object.entries(reactions).reduce((normalized, [rawKey, ids]) => {
    const key = normalizeReactionKey(rawKey);
    if (!DEFAULT_REACTIONS.includes(key) || !Array.isArray(ids)) return normalized;

    const current = Array.isArray(normalized[key]) ? normalized[key] : [];
    normalized[key] = [...new Set([...current, ...ids.map((id) => String(id)).filter(Boolean)])];
    return normalized;
  }, {});
}

function hasAdminReply(comment) {
  const adminIds = getAdminIds();
  return (comment.replies || []).some((reply) => !!reply.author?.isAdmin || adminIds.has(String(reply.author?.id)));
}

function canReplyToComment(user, comment) {
  if (!user || !comment) return false;
  if (user.isAdmin) return true;
  return String(comment.author?.id) === String(user.id) && hasAdminReply(comment);
}

function parseCookies(request) {
  const source = request.headers?.cookie || "";
  return Object.fromEntries(
    source
      .split(";")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const index = entry.indexOf("=");
        if (index === -1) return [entry, ""];
        return [decodeURIComponent(entry.slice(0, index)), decodeURIComponent(entry.slice(index + 1))];
      })
  );
}

function serializeCookie(name, value, options = {}) {
  const parts = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`, "Path=/", "SameSite=Lax"];
  if (options.httpOnly !== false) parts.push("HttpOnly");
  if (options.maxAge != null) parts.push(`Max-Age=${options.maxAge}`);
  if (options.secure) parts.push("Secure");
  return parts.join("; ");
}

function firstHeaderValue(value) {
  return String(value || "").split(",")[0].trim();
}

function getSecret() {
  return process.env.COMMENTS_SESSION_SECRET || process.env.JWT_SECRET || "daivr-dev-comment-secret";
}

function signPayload(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", getSecret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function verifyPayload(token) {
  if (!token || !token.includes(".")) return null;
  const [body, signature] = token.split(".");
  const expected = createHmac("sha256", getSecret()).update(body).digest("base64url");
  const left = Buffer.from(signature || "");
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;

  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  if (!payload?.id || (payload.exp && payload.exp < Date.now())) return null;
  return payload;
}

function getAdminIds() {
  return new Set(
    String(process.env.ADMIN_IDS || process.env.ADMIN_ID || process.env.ADMIN_DISCORD_IDS || "")
      .split(/[,\s]+/g)
      .map((id) => id.trim())
      .filter(Boolean)
  );
}

function getUser(request) {
  const session = verifyPayload(parseCookies(request)[SESSION_COOKIE]);
  if (!session) return null;
  return {
    id: String(session.id),
    username: session.username || "Discord user",
    avatarUrl: session.avatarUrl || DEFAULT_AVATAR,
    isAdmin: getAdminIds().has(String(session.id))
  };
}

function getBaseUrl(request) {
  const host = firstHeaderValue(request.headers?.["x-forwarded-host"]) || request.headers?.host || "127.0.0.1:5173";
  const forwardedProto = firstHeaderValue(request.headers?.["x-forwarded-proto"]);
  const protocol = forwardedProto || (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https");
  return process.env.SITE_URL || process.env.FRONTEND_URL || `${protocol}://${host}`;
}

function getRedirectUri(request) {
  return process.env.DISCORD_REDIRECT_URI || `${getBaseUrl(request)}/api/comments/auth/callback`;
}

function isSecureRequest(request) {
  return getBaseUrl(request).startsWith("https://");
}

function getAuthStatus(request) {
  const clientId = process.env.DISCORD_CLIENT_ID || "";
  const clientSecret = process.env.DISCORD_CLIENT_SECRET || "";
  return {
    configured: !!clientId && !!clientSecret,
    loginUrl: "/api/comments/auth/discord",
    logoutUrl: "/api/comments/auth/logout",
    user: getUser(request)
  };
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return Object.fromEntries(new URLSearchParams(raw));
  }
}

function getAvatarUrl(user) {
  if (user.avatar) {
    const extension = String(user.avatar).startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${extension}?size=128`;
  }
  return DEFAULT_AVATAR;
}

function publicComments(request) {
  const user = getUser(request);
  return sortComments(readComments()).map((comment) => ({
    ...comment,
    mine: !!user && String(comment.author?.id) === String(user.id),
    replies: (comment.replies || []).map((reply) => ({
      ...reply,
      mine: !!user && String(reply.author?.id) === String(user.id),
      author: {
        ...reply.author,
        isAdmin: !!reply.author?.isAdmin || getAdminIds().has(String(reply.author?.id))
      }
    })),
    author: {
      ...comment.author,
      isAdmin: !!comment.author?.isAdmin || getAdminIds().has(String(comment.author?.id))
    }
  }));
}

async function handleDiscordStart(request, response) {
  if (!process.env.DISCORD_CLIENT_ID || !process.env.DISCORD_CLIENT_SECRET) {
    sendJson(response, 501, { error: "Discord OAuth is not configured yet." });
    return;
  }

  const state = randomBytes(18).toString("base64url");
  const url = new URL(DISCORD_AUTH_URL);
  url.searchParams.set("client_id", process.env.DISCORD_CLIENT_ID);
  url.searchParams.set("redirect_uri", getRedirectUri(request));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "identify");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "consent");

  redirect(response, url.toString(), {
    "Set-Cookie": serializeCookie(STATE_COOKIE, state, { maxAge: 10 * 60, secure: isSecureRequest(request) })
  });
}

async function handleDiscordCallback(request, response) {
  const requestUrl = new URL(request.url || "/", getBaseUrl(request));
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const storedState = parseCookies(request)[STATE_COOKIE];

  if (!code || !state || !storedState || state !== storedState) {
    sendJson(response, 400, { error: "Discord login state did not match." });
    return;
  }

  try {
    const tokenBody = new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID || "",
      client_secret: process.env.DISCORD_CLIENT_SECRET || "",
      grant_type: "authorization_code",
      code,
      redirect_uri: getRedirectUri(request)
    });

    const tokenResponse = await fetch(DISCORD_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenBody
    });

    if (!tokenResponse.ok) throw new Error(`Discord token returned ${tokenResponse.status}`);
    const token = await tokenResponse.json();

    const meResponse = await fetch(DISCORD_ME_URL, {
      headers: { Authorization: `Bearer ${token.access_token}` }
    });

    if (!meResponse.ok) throw new Error(`Discord user returned ${meResponse.status}`);
    const discordUser = await meResponse.json();
    const username = discordUser.global_name || discordUser.username || "Discord user";
    const session = signPayload({
      id: discordUser.id,
      username,
      avatarUrl: getAvatarUrl(discordUser),
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000
    });

    redirect(response, `${getBaseUrl(request)}/#contact`, {
      "Set-Cookie": [
        serializeCookie(SESSION_COOKIE, session, { maxAge: 7 * 24 * 60 * 60, secure: isSecureRequest(request) }),
        serializeCookie(STATE_COOKIE, "", { maxAge: 0, secure: isSecureRequest(request) })
      ]
    });
  } catch (error) {
    console.error("Discord comments auth error", error.message || error);
    sendJson(response, 500, { error: "Discord login failed." });
  }
}

async function handleCreateComment(request, response) {
  const user = getUser(request);
  if (!user) {
    sendJson(response, 401, { error: "Connect Discord before posting." });
    return;
  }

  const body = await readBody(request);
  const text = String(body.text || "").trim().slice(0, 700);
  const gifUrl = sanitizeGifUrl(body.gifUrl);
  if (!text && !gifUrl) {
    sendJson(response, 400, { error: "Comment is empty." });
    return;
  }

  const comments = readComments();
  const comment = {
    id: `${Date.now()}-${randomBytes(3).toString("hex")}`,
    text,
    createdAt: new Date().toISOString(),
    pinned: false,
    author: user,
    gifUrl,
    replies: [],
    reactions: {}
  };
  comments.push(comment);
  writeComments(comments);
  sendJson(response, 201, { comment, comments: publicComments(request) });
}

async function handleReply(request, response, id) {
  const user = getUser(request);
  if (!user) {
    sendJson(response, 401, { error: "Connect Discord before replying." });
    return;
  }

  const body = await readBody(request);
  const text = String(body.text || "").trim().slice(0, 700);
  const gifUrl = sanitizeGifUrl(body.gifUrl);
  if (!text && !gifUrl) {
    sendJson(response, 400, { error: "Reply is empty." });
    return;
  }

  const comments = readComments();
  const comment = comments.find((entry) => String(entry.id) === String(id));
  if (!comment) {
    sendJson(response, 404, { error: "Comment not found." });
    return;
  }

  if (!canReplyToComment(user, comment)) {
    sendJson(response, 403, { error: "Only admins can reply unless an admin has answered your own comment." });
    return;
  }

  const reply = {
    id: `${Date.now()}-${randomBytes(3).toString("hex")}`,
    text,
    gifUrl,
    createdAt: new Date().toISOString(),
    author: user
  };

  comment.replies = Array.isArray(comment.replies) ? [...comment.replies, reply] : [reply];
  writeComments(comments);
  sendJson(response, 201, { reply, comments: publicComments(request) });
}

async function handleDeleteComment(request, response, id) {
  const user = getUser(request);
  if (!user) {
    sendJson(response, 401, { error: "Connect Discord before deleting." });
    return;
  }

  const comments = readComments();
  const comment = comments.find((entry) => String(entry.id) === String(id));
  if (!comment) {
    sendJson(response, 404, { error: "Comment not found." });
    return;
  }

  const canDelete = user.isAdmin || String(comment.author?.id) === String(user.id);
  if (!canDelete) {
    sendJson(response, 403, { error: "You can only delete your own comments." });
    return;
  }

  writeComments(comments.filter((entry) => String(entry.id) !== String(id)));
  sendJson(response, 200, { success: true, comments: publicComments(request) });
}

async function handleDeleteReply(request, response, commentId, replyId) {
  const user = getUser(request);
  if (!user) {
    sendJson(response, 401, { error: "Connect Discord before deleting." });
    return;
  }

  const comments = readComments();
  const comment = comments.find((entry) => String(entry.id) === String(commentId));
  if (!comment) {
    sendJson(response, 404, { error: "Comment not found." });
    return;
  }

  const reply = (comment.replies || []).find((entry) => String(entry.id) === String(replyId));
  if (!reply) {
    sendJson(response, 404, { error: "Reply not found." });
    return;
  }

  const canDelete = user.isAdmin || String(reply.author?.id) === String(user.id);
  if (!canDelete) {
    sendJson(response, 403, { error: "You can only delete your own replies." });
    return;
  }

  comment.replies = (comment.replies || []).filter((entry) => String(entry.id) !== String(replyId));
  writeComments(comments);
  sendJson(response, 200, { success: true, comments: publicComments(request) });
}

async function handleReaction(request, response, id) {
  const user = getUser(request);
  if (!user) {
    sendJson(response, 401, { error: "Connect Discord before reacting." });
    return;
  }

  const body = await readBody(request);
  const reaction = normalizeReactionKey(body.emoji || body.reaction);
  if (!DEFAULT_REACTIONS.includes(reaction)) {
    sendJson(response, 400, { error: "Reaction is not allowed." });
    return;
  }

  const comments = readComments();
  const comment = comments.find((entry) => String(entry.id) === String(id));
  if (!comment) {
    sendJson(response, 404, { error: "Comment not found." });
    return;
  }

  const reactions = normalizeReactions(comment.reactions);
  const current = Array.isArray(reactions[reaction]) ? [...reactions[reaction]] : [];
  const index = current.indexOf(user.id);
  if (index >= 0) current.splice(index, 1);
  else current.push(user.id);
  if (current.length) reactions[reaction] = current;
  else delete reactions[reaction];
  comment.reactions = reactions;
  writeComments(comments);
  sendJson(response, 200, { comment, comments: publicComments(request) });
}

async function handlePin(request, response, id) {
  const user = getUser(request);
  if (!user) {
    sendJson(response, 401, { error: "Connect Discord before pinning." });
    return;
  }

  if (!user.isAdmin) {
    sendJson(response, 403, { error: "Only Dai can pin comments." });
    return;
  }

  const comments = readComments();
  const comment = comments.find((entry) => String(entry.id) === String(id));
  if (!comment) {
    sendJson(response, 404, { error: "Comment not found." });
    return;
  }

  comment.pinned = !comment.pinned;
  writeComments(comments);
  sendJson(response, 200, { comment, comments: publicComments(request) });
}

function pickGifRendition(images) {
  if (!images || typeof images !== "object") return "";

  const preferredKeys = [
    "fixed_width",
    "fixed_height",
    "downsized",
    "downsized_medium",
    "preview_gif",
    "original",
    "gif"
  ];

  for (const key of preferredKeys) {
    const url = sanitizeGifUrl(images[key]?.url || images[key]?.gif_url || images[key]?.media_url);
    if (url) return url;
  }

  for (const value of Object.values(images)) {
    const url = sanitizeGifUrl(value?.url || value?.gif_url || value?.media_url);
    if (url) return url;
  }

  return "";
}

function pickKlipyFileUrl(file) {
  if (!file || typeof file !== "object") return "";

  for (const size of ["md", "sm", "xs", "hd"]) {
    const url = sanitizeGifUrl(file[size]?.gif?.url);
    if (url) return url;
  }

  for (const value of Object.values(file)) {
    const url = sanitizeGifUrl(value?.gif?.url || value?.url);
    if (url) return url;
  }

  return "";
}

function extractGifUrl(item) {
  if (typeof item === "string") return sanitizeGifUrl(item);
  if (!item || typeof item !== "object") return "";

  const directUrl = sanitizeGifUrl(item.gif_url || item.gifUrl || item.media_url || item.content_url);
  if (directUrl) return directUrl;

  const klipyFileUrl = pickKlipyFileUrl(item.file);
  if (klipyFileUrl) return klipyFileUrl;

  const imageUrl = pickGifRendition(item.images || item.media || item.renditions || item.assets);
  if (imageUrl) return imageUrl;

  return sanitizeGifUrl(
    item.media_formats?.tinygif?.url ||
      item.media_formats?.nanogif?.url ||
      item.media_formats?.mediumgif?.url ||
      item.gif?.url ||
      item.preview?.url
  );
}

function getGifResults(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.gifs)) return payload.gifs;
  return [];
}

async function handleGifSearch(request, response, requestUrl) {
  const query = String(requestUrl.searchParams.get("q") || "").trim();
  const key = process.env.KLIPY_API_KEY || process.env.VITE_KLIPY_API_KEY || "";

  if (!query) {
    sendJson(response, 400, { error: "Missing GIF query.", gifs: [] });
    return;
  }

  if (!key) {
    sendJson(response, 200, { source: "fallback", error: "Klipy API key is not configured.", gifs: [] });
    return;
  }

  try {
    const klipyUrl = new URL(`https://api.klipy.com/api/v1/${encodeURIComponent(key)}/gifs/search`);
    klipyUrl.searchParams.set("q", query);
    klipyUrl.searchParams.set("per_page", String(KLIPY_LIMIT));
    klipyUrl.searchParams.set("rating", KLIPY_RATING);
    klipyUrl.searchParams.set("locale", KLIPY_LOCALE);

    const klipyResponse = await fetch(klipyUrl);
    if (!klipyResponse.ok) throw new Error(`Klipy returned ${klipyResponse.status}`);

    const payload = await klipyResponse.json();
    const results = getGifResults(payload);
    const gifs = results
      .map(extractGifUrl)
      .filter(Boolean);

    sendJson(response, 200, { source: "klipy", gifs });
  } catch (error) {
    console.error("Klipy search error", error.message || error);
    sendJson(response, 200, { source: "fallback", error: "GIF search is unavailable.", gifs: [] });
  }
}

async function handlePreferences(request, response) {
  const user = getUser(request);

  if (request.method === "GET") {
    sendJson(response, 200, getUserPreferences(user));
    return;
  }

  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Preferences method not allowed." });
    return;
  }

  if (!user) {
    sendJson(response, 401, { error: "Connect Discord before saving preferences." });
    return;
  }

  const body = await readBody(request);
  const theme = String(body.theme || "").trim().toLowerCase();
  if (!THEME_VALUES.has(theme)) {
    sendJson(response, 400, { error: "Theme preference is not valid." });
    return;
  }

  const preferences = readPreferences();
  preferences[String(user.id)] = {
    ...(preferences[String(user.id)] || {}),
    theme,
    updatedAt: new Date().toISOString()
  };
  writePreferences(preferences);
  sendJson(response, 200, { theme });
}

export async function handleCommentsRequest(request, response) {
  const requestUrl = new URL(request.url || "/api/comments", getBaseUrl(request));
  const pathname = requestUrl.pathname.replace(/^\/api\/comments\/?/, "");
  const parts = pathname.split("/").filter(Boolean);

  if (request.method === "GET" && parts[0] === "auth" && parts[1] === "discord") {
    await handleDiscordStart(request, response);
    return;
  }

  if (request.method === "GET" && parts[0] === "auth" && parts[1] === "callback") {
    await handleDiscordCallback(request, response);
    return;
  }

  if (request.method === "GET" && parts[0] === "auth" && parts[1] === "logout") {
    redirect(response, `${getBaseUrl(request)}/#contact`, {
      "Set-Cookie": serializeCookie(SESSION_COOKIE, "", { maxAge: 0, secure: isSecureRequest(request) })
    });
    return;
  }

  if (request.method === "GET" && parts[0] === "me") {
    sendJson(response, 200, getAuthStatus(request));
    return;
  }

  if (request.method === "GET" && parts[0] === "gifs") {
    await handleGifSearch(request, response, requestUrl);
    return;
  }

  if (parts[0] === "preferences") {
    await handlePreferences(request, response);
    return;
  }

  if (request.method === "GET" && parts.length === 0) {
    sendJson(response, 200, {
      comments: publicComments(request),
      reactions: DEFAULT_REACTIONS,
      auth: getAuthStatus(request)
    });
    return;
  }

  if (request.method === "POST" && parts.length === 0) {
    await handleCreateComment(request, response);
    return;
  }

  if (request.method === "POST" && parts.length === 2 && parts[1] === "reactions") {
    await handleReaction(request, response, parts[0]);
    return;
  }

  if (request.method === "POST" && parts.length === 2 && parts[1] === "replies") {
    await handleReply(request, response, parts[0]);
    return;
  }

  if (request.method === "POST" && parts.length === 2 && parts[1] === "pin") {
    await handlePin(request, response, parts[0]);
    return;
  }

  if (request.method === "DELETE" && parts.length === 1) {
    await handleDeleteComment(request, response, parts[0]);
    return;
  }

  if (request.method === "DELETE" && parts.length === 3 && parts[1] === "replies") {
    await handleDeleteReply(request, response, parts[0], parts[2]);
    return;
  }

  sendJson(response, 404, { error: "Comments route not found." });
}
