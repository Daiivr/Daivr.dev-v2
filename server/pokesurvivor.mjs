import { randomBytes } from "node:crypto";
import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getSessionUser } from "./comments.mjs";
import { DEFAULT_AVATAR_URL, refreshLeaderboardProfiles } from "./discord-avatar.mjs";
import { readJsonBody, sameOrigin } from "./http-guards.mjs";
import { readJsonStore, writeJsonStore } from "./json-store.mjs";
import { apiPath, createRanking, createRateLimiter, createScoreStore, sendJson } from "./leaderboard.mjs";
import { recordDailyRun } from "./player-store.mjs";
import { checkRunDuration, sendRunToken } from "./run-tokens.mjs";
import { getDataDir } from "./storage.mjs";

// PokéSurvivor (cartucho 06, public/pokesurvivor). El juego original guarda
// la partida, los amigos, las salas y el ranking en Firebase; aqui lo hace la
// propia web con la sesion de Discord (tools/pokesurvivor/daivr.patch cambia
// db.js, social.js, net.js y ranking.js para hablar con esta API).
//
//   saves      un archivo por jugador en <datos>/pokesurvivor-saves/<id>.json;
//              al subir se FUSIONA con lo guardado (mergeSaves, la misma regla
//              que db.js), asi que dos pestañas u ordenadores no se pisan.
//   social     pokesurvivor-social.json: apodos unicos, perfiles publicos y
//              amistades.
//   ranking    pokesurvivor-ranking.json: las tablas del propio juego, tiempo
//              aguantado por modo (solo o grupo) y periodo (dia, semana y mes
//              en hora de Madrid, como el original, e historico), mas el
//              historico por Pokemon.
//   web        pokesurvivor-leaderboard.json: la mejor partida en solitario de
//              cada cuenta de Discord, con el mismo formato que los demas
//              cartuchos ({ scores: [...] }), para el trofeo de la tele, el
//              pasaporte y `rank` en la consola. Las partidas tambien cuentan
//              para el reto diario.
//   en memoria salas (hasta 4), invitaciones, en linea y el relevo de mensajes
//              de la partida en grupo. Todo llega al navegador por un unico
//              stream SSE por jugador; un reinicio del servidor cierra las salas.
//
// Este modulo no puede tener efectos al importarse (vite.config.js lo carga
// tambien durante el build): el servicio se crea con la primera peticion.
const GAME = "pokesurvivor";
export const POKESURVIVOR_DATA_ENVS = ["POKESURVIVOR_DATA_DIR", "GAME_DATA_DIR"];
const SOCIAL_FILE = "pokesurvivor-social.json";
const RANKING_FILE = "pokesurvivor-ranking.json";
export const POKESURVIVOR_LEADERBOARD_FILE = "pokesurvivor-leaderboard.json";
const SAVES_DIR = "pokesurvivor-saves";
export const POKESURVIVOR_MAX_PLAYERS = 4;
const NICK = /^[A-Za-z0-9_ñÑáéíóúÁÉÍÓÚ]{3,16}$/;
// Los ID de Discord son numeros; se usan como nombre de archivo de la partida.
const USER_ID = /^\d{1,25}$/;
const INVITE_TTL_MS = 3 * 60 * 1000;
// Un corte de red o una recarga reconecta el stream: hasta entonces sigues en
// linea y en tu sala (Firebase lo hacia con onDisconnect al momento).
const OFFLINE_GRACE_MS = 15_000;
const KEEP_ALIVE_MS = 25_000;
const TOP = 50;
// Dia, semana, mes y por Pokemon sólo guardan las mejores marcas, como el
// original (alli 50); el historico general guarda a todos.
const BOARD_CAP = 200;
const MAX_SAVE_BYTES = 1_000_000;
const MAX_RELAY_BYTES = 256 * 1024;
const MAX_DEX = 1025;
// Una partida en grupo cuenta para el ranking si empezo hace menos de esto.
const GROUP_RUN_MAX_MS = 7 * 60 * 60 * 1000;
const TZ = "Europe/Madrid";
const PERIODS = ["d", "w", "m", "a"];

// ---------------- partida ----------------

const isObject = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);

/**
 * Port de merge() de js/core/db.js. Nunca se pierde nada conseguido:
 * colecciones unidas, mejoras y estadisticas al maximo, y monedas, compañero
 * y pity de la version mas reciente. Idempotente.
 */
export function mergeSaves(a, b) {
  if (!a) return b;
  if (!b) return a;
  const newer = (a.updated || 0) >= (b.updated || 0) ? a : b;
  const older = newer === a ? b : a;
  const r = JSON.parse(JSON.stringify(newer));
  for (const coll of ["owned", "shiny"]) {
    r[coll] = r[coll] || {};
    for (const k in older[coll] || {}) {
      if (!r[coll][k] || (older[coll][k].at || 0) < (r[coll][k].at || 0)) r[coll][k] = older[coll][k];
    }
  }
  r.upgrades = r.upgrades || {};
  for (const k in older.upgrades || {}) r.upgrades[k] = Math.max(r.upgrades[k] || 0, older.upgrades[k]);
  r.pupg = r.pupg || {};
  for (const d in older.pupg || {}) {
    const mine = r.pupg[d] = r.pupg[d] || {};
    for (const k in older.pupg[d]) mine[k] = Math.max(mine[k] || 0, older.pupg[d][k]);
  }
  r.pupgDone = r.pupgDone || older.pupgDone;
  for (const coll of ["legends", "arenas", "itemsFound", "evoMoves", "ach"]) {
    r[coll] = r[coll] || {};
    for (const k in older[coll] || {}) if (!r[coll][k]) r[coll][k] = older[coll][k];
  }
  const mo = older.missions || {}, mr = r.missions = r.missions || {};
  for (const [per, list] of [["day", "daily"], ["week", "weekly"]]) {
    if (mr[per] !== mo[per] || !mr[list] || !mo[list]) continue;
    mr[list].forEach((m, i) => {
      const o = mo[list][i];
      if (!o || o.id !== m.id) return;
      m.prog = Math.max(m.prog || 0, o.prog || 0);
      m.claimed = m.claimed || o.claimed;
      m.told = m.told || o.told;
    });
  }
  r.stats = r.stats || {};
  for (const k in older.stats || {}) r.stats[k] = Math.max(r.stats[k] || 0, older.stats[k] || 0);
  if (r.starter == null) r.starter = older.starter;
  if (r.personality == null) r.personality = older.personality;
  if (r.partner == null || !r.owned[r.partner]) { r.partner = older.partner; r.partnerShiny = older.partnerShiny; }
  r.created = Math.min(a.created || Date.now(), b.created || Date.now());
  r.updated = Math.max(a.updated || 0, b.updated || 0);
  return r;
}

export function validSave(save) {
  return isObject(save) && Number.isInteger(save.v) && isObject(save.owned) && isObject(save.stats) && typeof save.name === "string";
}

function atomicWrite(file, text) {
  const temp = `${file}.${process.pid}.tmp`;
  try {
    const fd = openSync(temp, "w", 0o600);
    try { writeFileSync(fd, text, "utf8"); fsyncSync(fd); }
    finally { closeSync(fd); }
    renameSync(temp, file);
  } finally {
    if (existsSync(temp)) unlinkSync(temp);
  }
}

// ---------------- periodos del ranking (hora de Madrid, como el original) ----------------

function madridDate(date) {
  const p = {};
  for (const x of new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date)) p[x.type] = x.value;
  return { y: +p.year, m: +p.month, d: +p.day };
}

function isoWeek(y, m, d) {
  const t = new Date(Date.UTC(y, m - 1, d));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return { year: t.getUTCFullYear(), week: Math.ceil(((t - y0) / 86400000 + 1) / 7) };
}

export function periodIds(date = new Date()) {
  const { y, m, d } = madridDate(date);
  const w = isoWeek(y, m, d);
  const p2 = (n) => String(n).padStart(2, "0");
  return { d: `d${y}${p2(m)}${p2(d)}`, w: `w${w.year}-${p2(w.week)}`, m: `m${y}${p2(m)}`, a: "all" };
}

const boardOf = (mode, period, dex, ids) => `${mode}_${ids[period]}${dex && period === "a" ? `_p${dex}` : ""}`;
// Todo lo que no es el historico general guarda solo las mejores marcas.
const capped = (board) => !/^[sg]_all$/.test(board);

// ---------------- validacion ----------------

const int = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
const dexOk = (value) => int(value, 1, MAX_DEX);

function profileFields(body) {
  const favs = body.favs ?? [];
  const best = body.best ?? {};
  const medals = body.medals ?? [];
  const title = body.title ?? "";
  if (!Array.isArray(favs) || favs.length > 3 || !favs.every((fav) => isObject(fav) && dexOk(fav.dex) && typeof (fav.shiny ?? false) === "boolean")) return null;
  if (typeof title !== "string" || title.length > 40) return null;
  if (!isObject(best) || Object.keys(best).length > 12 || !Object.values(best).every((value) => int(value, 0, 1e9))) return null;
  if (!Array.isArray(medals) || medals.length > 8 || !medals.every((id) => typeof id === "string" && /^[\w-]{1,40}$/.test(id))) return null;
  return { favs: favs.map((fav) => ({ dex: fav.dex, shiny: Boolean(fav.shiny) })), title, best, medals };
}

/**
 * El original quito sus cotas de nivel y derrotados (12-10-2026: las partidas
 * largas, con el "tiempo extra" desde el minuto 60, daban falsos positivos),
 * asi que aqui solo se comprueba que los numeros tengan sentido. Lo que sigue
 * vigilando la web es la duracion: la ficha de partida (run-tokens) impide que
 * una marca dure mas que el tiempo real, y no vive mas de 24 h.
 */
export function validateRun(body) {
  const t = body?.t, lv = body?.lv, kills = body?.kills;
  if (!["s", "g"].includes(body?.mode)) return null;
  if (!int(t, 5, 86_400) || !int(lv, 1, 9_999) || !int(kills, 0, 10_000_000)) return null;
  if (body.mode === "s") return dexOk(body.dex) ? { mode: "s", t, lv, kills, dex: body.dex, shiny: Boolean(body.shiny) } : null;
  const members = body.members;
  if (!Array.isArray(members) || members.length < 2 || members.length > POKESURVIVOR_MAX_PLAYERS) return null;
  if (!members.every((m) => isObject(m) && typeof m.uid === "string" && USER_ID.test(m.uid) && dexOk(m.dex))) return null;
  if (new Set(members.map((m) => m.uid)).size !== members.length) return null;
  return { mode: "g", t, lv, kills, members: members.map((m) => ({ uid: m.uid, dex: m.dex, shiny: Boolean(m.shiny) })) };
}

// ---------------- servicio ----------------

const emptySocial = () => ({ names: {}, profiles: {}, friendships: {} });
const validSocial = (data) => isObject(data) && isObject(data.names) && isObject(data.profiles) && isObject(data.friendships);
const validRanking = (data) => isObject(data) && isObject(data.boards);
const pairId = (a, b) => (a < b ? `${a}_${b}` : `${b}_${a}`);
const clean = (value) => JSON.parse(JSON.stringify(value));

class ApiError extends Error {
  constructor(status, code, message = code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
const fail = (status, code) => { throw new ApiError(status, code); };

export function createPokesurvivorService({ now = () => Date.now() } = {}) {
  let social = null, ranking = null;
  const loadSocial = () => (social ??= readJsonStore(SOCIAL_FILE, emptySocial(), POKESURVIVOR_DATA_ENVS, validSocial));
  const storeSocial = () => writeJsonStore(SOCIAL_FILE, social, emptySocial(), POKESURVIVOR_DATA_ENVS, validSocial);
  const loadRanking = () => (ranking ??= readJsonStore(RANKING_FILE, { boards: {} }, POKESURVIVOR_DATA_ENVS, validRanking));
  const storeRanking = () => writeJsonStore(RANKING_FILE, ranking, { boards: {} }, POKESURVIVOR_DATA_ENVS, validRanking);

  const streams = new Map();       // uid -> { send(event, data), close() }
  const offlineTimers = new Map(); // uid -> temporizador de la gracia de reconexion
  const lastSeen = new Map();      // uid -> ms
  const playing = new Set();
  const rooms = new Map();         // id -> { id, host, open, at, members: Map(uid -> miembro), started }
  const roomOf = new Map();        // uid -> id de sala
  const invites = new Map();       // para -> Map(de -> { from, name, room, at })
  const groupStarts = new Map();   // uid -> { uids, host, at } de la ultima partida en grupo

  // ---------------- partidas guardadas ----------------

  function savePath(uid) {
    const dir = join(getDataDir(POKESURVIVOR_DATA_ENVS), SAVES_DIR);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    return join(dir, `${uid}.json`);
  }

  function readSave(uid) {
    const file = savePath(uid);
    for (const path of [file, `${file}.bak`]) {
      if (!existsSync(path)) continue;
      try {
        const data = JSON.parse(readFileSync(path, "utf8"));
        if (validSave(data?.save)) return data.save;
      } catch { /* se prueba la copia anterior */ }
    }
    return null;
  }

  function writeSave(uid, save) {
    const file = savePath(uid);
    if (existsSync(file)) atomicWrite(`${file}.bak`, readFileSync(file, "utf8"));
    atomicWrite(file, JSON.stringify({ save, updatedAt: new Date(now()).toISOString(), v: save.v }));
  }

  function storeSave(uid, incoming) {
    if (!validSave(incoming)) fail(400, "bad-save");
    const merged = mergeSaves(readSave(uid), clean(incoming));
    writeSave(uid, merged);
    return merged;
  }

  // ---------------- apodos y perfiles ----------------

  const nickOf = (uid) => loadSocial().profiles[uid]?.name || null;
  const needNick = (uid) => nickOf(uid) || fail(409, "need-nick");

  function claimNick(uid, name) {
    name = String(name || "").trim();
    if (!NICK.test(name)) fail(400, "bad-nick");
    const data = loadSocial();
    const lower = name.toLowerCase();
    const owner = data.names[lower];
    if (owner && owner !== uid) fail(409, "taken");
    const previous = data.profiles[uid];
    if (previous?.lower && previous.lower !== lower && data.names[previous.lower] === uid) delete data.names[previous.lower];
    data.names[lower] = uid;
    data.profiles[uid] = { ...(previous || {}), name, lower, at: new Date(now()).toISOString() };
    storeSocial();
    const room = rooms.get(roomOf.get(uid));
    if (room?.members.has(uid)) { room.members.get(uid).name = name; pushRoom(room); }
    for (const other of friendUids(uid, false)) pushFriends(other);
    return name;
  }

  function publishProfile(uid, body) {
    needNick(uid);
    const fields = profileFields(body);
    if (!fields) fail(400, "bad-profile");
    const data = loadSocial();
    data.profiles[uid] = { ...data.profiles[uid], ...fields, at: new Date(now()).toISOString() };
    storeSocial();
  }

  function profileOf(uid) {
    const p = loadSocial().profiles[uid];
    return p ? { name: p.name, favs: p.favs || [], title: p.title || "", best: p.best || {}, medals: p.medals || [] } : null;
  }

  // ---------------- amigos y en linea ----------------

  const isOnline = (uid) => streams.has(uid) || offlineTimers.has(uid);

  /** Los amigos de uid (confirmados, o tambien las solicitudes con all). */
  function friendUids(uid, okOnly = true) {
    const out = [];
    for (const f of Object.values(loadSocial().friendships)) {
      if (!f.users.includes(uid) || (okOnly && f.status !== "ok")) continue;
      out.push(f.users[0] === uid ? f.users[1] : f.users[0]);
    }
    return out;
  }
  const areFriends = (a, b) => loadSocial().friendships[pairId(a, b)]?.status === "ok";

  function friendsView(uid) {
    const list = [];
    for (const f of Object.values(loadSocial().friendships)) {
      if (!f.users.includes(uid)) continue;
      const other = f.users[0] === uid ? f.users[1] : f.users[0];
      const ok = f.status === "ok";
      const online = ok && isOnline(other);
      list.push({
        uid: other, name: nickOf(other) || "???",
        status: ok ? "ok" : f.to === uid ? "in" : "out",
        online, play: online && playing.has(other), room: online ? roomOf.get(other) || "" : "",
        seen: ok ? (online ? now() : lastSeen.get(other) || 0) : 0
      });
    }
    return list;
  }

  function requestFriend(uid, name) {
    needNick(uid);
    const data = loadSocial();
    const other = data.names[String(name || "").trim().toLowerCase()];
    if (!other) fail(404, "no-player");
    if (other === uid) fail(400, "self");
    const key = pairId(uid, other);
    const f = data.friendships[key];
    if (f?.status === "ok") fail(409, "already");
    if (f && f.from === uid) fail(409, "sent");
    if (f && f.to === uid) return acceptFriend(uid, other);
    data.friendships[key] = { users: [uid, other].sort(), from: uid, to: other, status: "pending", at: new Date(now()).toISOString() };
    storeSocial();
    pushFriends(uid); pushFriends(other);
    return { name: nickOf(other), accepted: false };
  }

  function acceptFriend(uid, other) {
    needNick(uid);
    const data = loadSocial();
    const f = data.friendships[pairId(uid, String(other || ""))];
    if (!f || f.to !== uid || f.status !== "pending") fail(404, "no-request");
    f.status = "ok";
    f.at = new Date(now()).toISOString();
    storeSocial();
    pushFriends(uid); pushFriends(f.from);
    return { name: nickOf(f.from), accepted: true };
  }

  function removeFriend(uid, other) {
    const data = loadSocial();
    const key = pairId(uid, String(other || ""));
    const f = data.friendships[key];
    if (!f || !f.users.includes(uid)) fail(404, "no-friend");
    delete data.friendships[key];
    storeSocial();
    pushFriends(uid); pushFriends(f.users[0] === uid ? f.users[1] : f.users[0]);
  }

  function setPlaying(uid, value) {
    if (Boolean(value) === playing.has(uid)) return;
    if (value) playing.add(uid); else playing.delete(uid);
    notifyFriends(uid);
  }

  // ---------------- stream ----------------

  function push(uid, event, data) { streams.get(uid)?.send(event, data); }
  function pushFriends(uid) { push(uid, "friends", { list: friendsView(uid) }); }
  /** Avisa a los amigos de uid de que ha cambiado su estado (en linea, jugando, sala). */
  function notifyFriends(uid) { for (const other of friendUids(uid)) pushFriends(other); }

  function snapshot(uid) {
    const room = rooms.get(roomOf.get(uid));
    return { nick: nickOf(uid), friends: friendsView(uid), invites: invitesView(uid), room: room ? roomView(room) : null, rooms: sessionsList() };
  }

  function attachStream(uid, sink) {
    streams.get(uid)?.replaced();
    const wasOnline = isOnline(uid);
    clearTimeout(offlineTimers.get(uid));
    offlineTimers.delete(uid);
    streams.set(uid, sink);
    lastSeen.set(uid, now());
    sink.send("hello", { uid, ...snapshot(uid) });
    if (!wasOnline) notifyFriends(uid);
    return () => {
      if (streams.get(uid) !== sink) return;
      streams.delete(uid);
      lastSeen.set(uid, now());
      const timer = setTimeout(() => {
        offlineTimers.delete(uid);
        if (streams.has(uid)) return;
        lastSeen.set(uid, now());
        playing.delete(uid);
        leaveRoom(uid);
        notifyFriends(uid);
      }, OFFLINE_GRACE_MS);
      timer.unref?.();
      offlineTimers.set(uid, timer);
    };
  }

  // ---------------- salas ----------------
  // Como las partidas de NZ:P (Create Game / Join Game): cada sala tiene
  // nombre, contraseña opcional y tamaño (2 a 4), y las que aun no han
  // empezado salen en una lista que ve cualquiera con sesion. Con contraseña
  // solo entra quien la sepa o a quien invite el anfitrion.

  function member(uid, info) {
    return { uid, name: nickOf(uid) || "???", dex: dexOk(info?.dex) ? info.dex : 25, shiny: Boolean(info?.shiny), at: now() };
  }

  const roomName = (value, uid) => String(value ?? "").replace(/[\u0000-\u001f\u007f<>]/g, "").trim().slice(0, 32) || `${nickOf(uid) || "Trainer"} co-op`;
  const roomPassword = (value) => String(value ?? "").slice(0, 32);

  function roomView(room) {
    // El anfitrion primero; el resto por orden de llegada.
    const members = [...room.members.values()].sort((a, b) => (a.uid === room.host ? -1 : b.uid === room.host ? 1 : a.at - b.at));
    return { id: room.id, host: room.host, open: room.open, name: room.name, max: room.max, locked: Boolean(room.password), members };
  }

  function pushRoom(room, extra) { const view = roomView(room); for (const uid of room.members.keys()) push(uid, "room", { room: view, ...extra }); }

  /** La lista de partidas abiertas (las que aun no han empezado). */
  function sessionsList() {
    return [...rooms.values()].filter((room) => room.open).sort((a, b) => b.at - a.at).slice(0, 50)
      .map((room) => ({ id: room.id, name: room.name, host: nickOf(room.host) || "???", players: room.members.size, max: room.max, locked: Boolean(room.password) }));
  }

  // Cualquier cambio en las salas llega a todos los que tienen el juego
  // abierto (agrupado: un anfitrion que entra y sale no manda diez listas).
  let sessionsTimer = null;
  function broadcastSessions() {
    if (sessionsTimer) return;
    sessionsTimer = setTimeout(() => {
      sessionsTimer = null;
      const list = sessionsList();
      for (const sink of streams.values()) sink.send("rooms", { list });
    }, 250);
    sessionsTimer.unref?.();
  }

  function createRoom(uid, info) {
    needNick(uid);
    leaveRoom(uid);
    const room = {
      id: randomBytes(9).toString("base64url"), host: uid, open: true, at: now(), members: new Map(), started: null,
      name: roomName(info?.name, uid), password: roomPassword(info?.password),
      max: int(info?.max, 2, POKESURVIVOR_MAX_PLAYERS) ? info.max : POKESURVIVOR_MAX_PLAYERS
    };
    room.members.set(uid, member(uid, info));
    rooms.set(room.id, room);
    roomOf.set(uid, room.id);
    notifyFriends(uid);
    broadcastSessions();
    return roomView(room);
  }

  function joinRoom(uid, id, info) {
    needNick(uid);
    const room = rooms.get(String(id || ""));
    if (!room) fail(404, "room-gone");
    if (room.members.has(uid)) return roomView(room);
    if (!room.open) fail(409, "room-started");
    const invited = invites.get(uid)?.get(room.host)?.room === room.id;
    if (room.password && !invited && roomPassword(info?.password) !== room.password) fail(403, info?.password ? "room-password" : "room-locked");
    if (room.members.size >= room.max) fail(409, "room-full");
    leaveRoom(uid);
    room.members.set(uid, member(uid, info));
    roomOf.set(uid, room.id);
    if (invites.get(uid)?.delete(room.host)) push(uid, "invites", { list: invitesView(uid) });
    pushRoom(room);
    notifyFriends(uid);
    broadcastSessions();
    return roomView(room);
  }

  function leaveRoom(uid) {
    const id = roomOf.get(uid);
    if (!id) return;
    roomOf.delete(uid);
    const room = rooms.get(id);
    if (!room) return;
    const others = [...room.members.values()].filter((m) => m.uid !== uid).sort((a, b) => a.at - b.at);
    if (room.host === uid && !room.open && others.length >= 2) {
      // Partida en marcha con dos o mas compañeros: sigue, y el anfitrion pasa
      // al que lleva mas tiempo en la sala. Su marca de grupo la sube el nuevo
      // (con el equipo que empezo, como cuando se va un invitado).
      room.members.delete(uid);
      setHost(room, others[0].uid, { migrated: { from: uid, to: others[0].uid } });
    } else if (room.host === uid) {
      // Si no (sala de espera, o solo quedaba uno), la sala se cierra para todos.
      rooms.delete(id);
      for (const other of room.members.keys()) {
        if (other === uid) continue;
        roomOf.delete(other);
        push(other, "room", { room: null, id, closed: true });
        notifyFriends(other);
      }
      retractInvites(uid);
    } else {
      room.members.delete(uid);
      pushRoom(room);
    }
    push(uid, "room", { room: null, id });
    notifyFriends(uid);
    broadcastSessions();
  }

  function hostedRoom(uid) {
    const room = rooms.get(roomOf.get(uid));
    if (!room || room.host !== uid) fail(403, "not-host");
    return room;
  }

  /** Cambia el anfitrion (las invitaciones del anterior caducan; la partida en marcha la sube el nuevo). */
  function setHost(room, to, extra) {
    const from = room.host;
    room.host = to;
    if (room.started) room.started.host = to;
    retractInvites(from);
    pushRoom(room, extra);
    broadcastSessions();
  }

  /** El anfitrion le pasa la sala a otro jugador (solo en la sala de espera). */
  function transferHost(uid, to) {
    const room = hostedRoom(uid);
    to = String(to || "");
    if (!room.open) fail(409, "room-started");
    if (to === uid || !room.members.has(to)) fail(400, "not-member");
    setHost(room, to, { transferred: { from: uid, to } });
    return roomView(room);
  }

  /** El anfitrion cierra la sala al empezar la partida y la reabre al volver. */
  function setRoomOpen(uid, open) {
    const room = hostedRoom(uid);
    room.open = Boolean(open);
    if (!room.open) {
      // Quien empieza la partida queda apuntado: es el equipo que el anfitrion
      // podra subir al ranking de grupo.
      const start = { uids: [...room.members.keys()].sort(), host: uid, at: now() };
      room.started = start;
      for (const m of start.uids) groupStarts.set(m, start);
    }
    pushRoom(room);
    broadcastSessions();
  }

  function updateMember(uid, info) {
    const room = rooms.get(roomOf.get(uid));
    const m = room?.members.get(uid);
    if (!m) return;
    if (dexOk(info?.dex)) m.dex = info.dex;
    m.shiny = Boolean(info?.shiny);
    pushRoom(room);
  }

  // ---------------- invitaciones ----------------

  function invitesView(uid) {
    const box = invites.get(uid);
    if (!box) return [];
    for (const [from, invite] of box) if (now() - invite.at > INVITE_TTL_MS || rooms.get(invite.room)?.host !== from) box.delete(from);
    if (!box.size) invites.delete(uid);
    return [...box.values()];
  }

  function invite(uid, to) {
    to = String(to || "");
    if (!areFriends(uid, to)) fail(403, "not-friends");
    const room = hostedRoom(uid);
    if (room.members.size >= room.max) fail(409, "room-full");
    let box = invites.get(to);
    if (!box) invites.set(to, box = new Map());
    box.set(uid, { from: uid, name: nickOf(uid), room: room.id, at: now() });
    push(to, "invites", { list: invitesView(to) });
  }

  function declineInvite(uid, from) {
    if (invites.get(uid)?.delete(String(from || ""))) push(uid, "invites", { list: invitesView(uid) });
  }

  function retractInvites(from) {
    for (const [to, box] of invites) if (box.delete(from)) push(to, "invites", { list: invitesView(to) });
  }

  // ---------------- relevo de la partida en grupo ----------------

  /**
   * Negociacion de WebRTC y, si la conexion directa no es posible, los
   * mensajes de la partida (lo que hacia rooms/{sala}/q en Firebase). Solo
   * entre jugadores de la misma sala.
   */
  function relay(uid, to, items) {
    const id = roomOf.get(uid);
    if (!id || roomOf.get(String(to || "")) !== id) fail(403, "not-in-room");
    if (!Array.isArray(items) || !items.length || items.length > 200) fail(400, "bad-relay");
    push(to, "relay", { f: uid, items });
  }

  // ---------------- ranking ----------------

  function submitRun(user, body) {
    const uid = user.id;
    const nick = needNick(uid);
    const run = validateRun(body);
    if (!run) fail(400, "bad-run");
    const check = checkRunDuration(body.runToken, GAME, run.t * 1000, now());
    if (!check.ok) fail(check.status, check.status === 422 ? "run-too-long" : "run-token");
    let entry, id;
    if (run.mode === "s") {
      entry = { t: run.t, uids: [uid], names: [nick], dex: [run.dex], shiny: [run.shiny], lv: run.lv, kills: run.kills };
      id = uid;
    } else {
      // Solo el anfitrion sube la marca del grupo, y solo con el equipo con el
      // que empezo de verdad la partida (setRoomOpen).
      const start = groupStarts.get(uid);
      const uids = run.members.map((m) => m.uid).sort();
      if (!start || start.host !== uid || now() - start.at > GROUP_RUN_MAX_MS || start.uids.join("_") !== uids.join("_")) fail(403, "bad-team");
      const team = [...run.members].sort((a, b) => (a.uid < b.uid ? -1 : 1));
      entry = { t: run.t, uids, names: team.map((m) => nickOf(m.uid) || "???"), dex: team.map((m) => m.dex), shiny: team.map((m) => m.shiny), lv: run.lv, kills: run.kills };
      id = uids.join("_");
    }
    const ids = periodIds(new Date(now()));
    const targets = PERIODS.map((period) => [boardOf(run.mode, period, null, ids), period]);
    for (const dex of new Set(entry.dex)) targets.push([`${run.mode}_all_p${dex}`, "p"]);
    const data = loadRanking();
    const at = new Date(now()).toISOString();
    const better = [];
    let changed = false;
    for (const [board, period] of targets) {
      const rows = data.boards[board] ||= {};
      if (rows[id] && rows[id].t >= entry.t) continue;
      rows[id] = { ...entry, at };
      changed = true;
      if (period !== "p") better.push(period);
      if (capped(board)) trimBoard(rows);
    }
    // Los periodos que ya han pasado no los lee nadie.
    const current = new Set(Object.values(ids));
    for (const board of Object.keys(data.boards)) {
      const period = board.split("_")[1];
      if (/^[dwm]/.test(period) && !current.has(period)) { delete data.boards[board]; changed = true; }
    }
    if (changed) storeRanking();
    // La mejor partida en solitario es la marca de la web (tele, pasaporte,
    // consola) y cuenta para el reto diario si hoy toca PokéSurvivor.
    if (run.mode === "s") {
      recordSiteRun(user, run, nick);
      recordDailyRun(user, GAME, run.t, now());
    }
    return { better, score: siteScore(uid) };
  }

  // ---------------- ranking de la web (cuentas de Discord) ----------------

  const siteStore = createScoreStore(POKESURVIVOR_LEADERBOARD_FILE, POKESURVIVOR_DATA_ENVS);
  const siteRanking = createRanking({
    compare: (a, b) => (b.bestScore || 0) - (a.bestScore || 0) || new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0),
    toPublic: (score, rank) => ({
      rank,
      discordId: String(score.discordId),
      username: score.username || "Trainer",
      avatarUrl: score.avatarUrl || DEFAULT_AVATAR_URL,
      // Segundos aguantados en la mejor partida en solitario.
      bestScore: Number(score.bestScore) || 0,
      bestDurationMs: Number.isFinite(score.bestDurationMs) ? score.bestDurationMs : null,
      bestLevel: Number(score.bestLevel) || 1,
      bestKills: Number(score.bestKills) || 0,
      dex: Number(score.dex) || null,
      shiny: Boolean(score.shiny),
      nick: score.nick || "",
      updatedAt: score.updatedAt || null
    })
  });

  function recordSiteRun(user, run, nick) {
    const scores = siteStore.read();
    const index = scores.findIndex((entry) => String(entry.discordId) === String(user.id));
    const current = index >= 0 ? scores[index] : null;
    const improves = run.t > Number(current?.bestScore || 0);
    const at = new Date(now()).toISOString();
    const next = {
      ...(current || { discordId: String(user.id), createdAt: at }),
      username: user.username,
      avatarUrl: user.avatarUrl || DEFAULT_AVATAR_URL,
      nick,
      bestScore: improves ? run.t : current.bestScore,
      bestDurationMs: improves ? run.t * 1000 : current.bestDurationMs,
      bestLevel: improves ? run.lv : current.bestLevel,
      bestKills: improves ? run.kills : current.bestKills,
      dex: improves ? run.dex : current.dex,
      shiny: improves ? run.shiny : current.shiny,
      lastScore: run.t,
      lastSeenAt: at,
      updatedAt: improves ? at : current.updatedAt,
      submissions: (Number(current?.submissions) || 0) + 1
    };
    if (index >= 0) scores[index] = next; else scores.push(next);
    siteStore.write(scores);
  }

  const siteLeaderboard = (limit) => siteRanking.leaderboard(siteStore.read(), limit);
  const siteScore = (uid) => siteRanking.forUser(siteStore.read(), uid);

  /**
   * El aviso del reto diario de la tele manda el tiempo aguantado a mitad de
   * partida (también en grupo, cada uno el suyo): sólo cuenta para el reto.
   */
  function checkChallenge(user, body) {
    const score = body?.score, durationMs = Math.round(Number(body?.durationMs));
    // El reloj del juego no puede ir más deprisa que el real (guard.js).
    if (!int(score, 0, 86_400) || !Number.isFinite(durationMs) || durationMs < 0 || score * 1000 > durationMs + 5000) fail(400, "bad-run");
    const check = checkRunDuration(body.runToken, GAME, durationMs, now());
    if (!check.ok) fail(check.status, check.status === 422 ? "run-too-long" : "run-token");
    return { daily: recordDailyRun(user, GAME, score, now()) || null };
  }

  function trimBoard(rows) {
    const ids = Object.keys(rows);
    if (ids.length <= BOARD_CAP) return;
    ids.sort((a, b) => rows[b].t - rows[a].t).slice(BOARD_CAP).forEach((id) => delete rows[id]);
  }

  function sortedRows(board) {
    return Object.entries(loadRanking().boards[board] || {})
      .map(([id, v]) => ({ id, t: v.t, uids: v.uids, names: v.names, dex: v.dex, shiny: v.shiny, lv: v.lv, kills: v.kills, at: v.at }))
      .sort((a, b) => b.t - a.t || String(a.at).localeCompare(String(b.at)));
  }

  function rankingView(uid, query) {
    const mode = query.get("mode") === "g" ? "g" : "s";
    const period = PERIODS.includes(query.get("period")) ? query.get("period") : "w";
    const dex = Number(query.get("dex")) || null;
    if (dex && !dexOk(dex)) fail(400, "bad-dex");
    const board = boardOf(mode, period, dex, periodIds(new Date(now())));
    const rows = sortedRows(board);
    const pub = ({ at, ...row }) => row;
    let list = rows;
    if (query.get("friends") === "1" && uid) {
      const circle = new Set([uid, ...friendUids(uid)]);
      list = rows.filter((row) => row.uids.some((u) => circle.has(u)));
    }
    let me = null;
    if (uid) {
      const index = rows.findIndex((row) => row.uids.includes(uid));
      if (index >= 0) me = { pos: index + 1, t: rows[index].t, row: pub(rows[index]) };
      else if (capped(board) && rows.length >= BOARD_CAP) me = { out: true };
    }
    return { board, rows: list.slice(0, TOP).map(pub), me };
  }

  // ---------------- medallas del pasaporte ----------------

  /**
   * Lo que miran las medallas secretas de PokéSurvivor del pasaporte
   * (server/player-progression.mjs): Pokédex, shinies y legendarios de la
   * partida guardada, y el mejor tiempo en grupo del historico de grupo (que,
   * como el de solo, pasa por la ficha de partida).
   */
  function passportStats(uid) {
    const id = String(uid);
    const save = USER_ID.test(id) ? readSave(id) : null;
    const count = (collection) => Object.keys(collection || {}).filter((key) => dexOk(Number(key))).length;
    const squads = Object.values(loadRanking().boards.g_all || {}).filter((row) => row.uids.includes(id));
    return { dex: count(save?.owned), shinies: count(save?.shiny), legends: count(save?.legends), groupBest: Math.max(0, ...squads.map((row) => row.t)), squadRuns: squads.length };
  }

  // ---------------- borrar la cuenta ----------------

  function deleteAccount(uid) {
    leaveRoom(uid);
    retractInvites(uid);
    invites.delete(uid);
    playing.delete(uid);
    groupStarts.delete(uid);
    const file = savePath(uid);
    for (const path of [file, `${file}.bak`]) if (existsSync(path)) unlinkSync(path);
    const data = loadSocial();
    const friends = friendUids(uid, false);
    for (const [key, f] of Object.entries(data.friendships)) if (f.users.includes(uid)) delete data.friendships[key];
    const lower = data.profiles[uid]?.lower;
    if (lower && data.names[lower] === uid) delete data.names[lower];
    delete data.profiles[uid];
    storeSocial();
    for (const other of friends) pushFriends(other);
    const boards = loadRanking().boards;
    let changed = false;
    for (const rows of Object.values(boards)) {
      for (const [id, row] of Object.entries(rows)) if (row.uids.includes(uid)) { delete rows[id]; changed = true; }
    }
    if (changed) storeRanking();
    const site = siteStore.read();
    if (site.some((entry) => String(entry.discordId) === uid)) siteStore.write(site.filter((entry) => String(entry.discordId) !== uid));
    push(uid, "hello", { uid, ...snapshot(uid) });
  }

  return {
    readSave, storeSave, claimNick, publishProfile, profileOf, requestFriend, acceptFriend, removeFriend, setPlaying,
    attachStream, snapshot, sessionsList, createRoom, joinRoom, leaveRoom, setRoomOpen, transferHost, updateMember, invite, declineInvite, relay,
    submitRun, checkChallenge, rankingView, siteLeaderboard, siteScore, passportStats, deleteAccount, nickOf, isOnline
  };
}

// ---------------- HTTP ----------------

let service = null;
const getService = () => (service ??= createPokesurvivorService());
// Medallas secretas del pasaporte (server/player.mjs).
export const pokesurvivorPassportStats = (uid) => getService().passportStats(uid);
const isRateLimited = createRateLimiter(60_000, 240);
const isRelayLimited = createRateLimiter(10_000, 600);
const isSaveLimited = createRateLimiter(60_000, 30);
// Probar contraseñas de salas a ciegas lleva su tiempo.
const isJoinLimited = createRateLimiter(60_000, 20);

function openEventStream(request, response, uid, svc) {
  response.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-store",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no"
  });
  response.write(": connected\n\n");
  let open = true;
  const sink = {
    send(event, data) {
      if (!open) return;
      try { response.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); } catch { /* se cierra abajo */ }
    },
    // Otra pestaña abrio el juego con la misma cuenta: esta deja de reconectar.
    replaced() { sink.send("replaced", {}); open = false; clearInterval(keepAlive); try { response.end(); } catch { /* ya cerrado */ } }
  };
  const keepAlive = setInterval(() => { if (open) try { response.write(": keep-alive\n\n"); } catch { /* nada */ } }, KEEP_ALIVE_MS);
  keepAlive.unref?.();
  const detach = svc.attachStream(uid, sink);
  request.on("close", () => { open = false; clearInterval(keepAlive); detach(); });
}

export async function handlePokesurvivorRequest(request, response, svc = getService()) {
  const { url, path } = apiPath(request, [GAME]);
  const method = request.method || "GET";
  if (method !== "GET" && !sameOrigin(request)) return sendJson(response, 403, { error: "Cross-origin request rejected.", code: "cross-origin" });
  const user = getSessionUser(request);
  const uid = user && USER_ID.test(user.id) ? user.id : null;
  const account = uid ? { id: uid, username: user.username, avatarUrl: user.avatarUrl } : null;

  try {
    // /me es tambien el "me" del trofeo de la tele (como en los demas
    // cartuchos); la partida sólo viaja cuando la pide el juego (?save=1).
    if (method === "GET" && path === "me") {
      return sendJson(response, 200, {
        authenticated: Boolean(uid), user: account, nick: uid ? svc.nickOf(uid) : null, score: uid ? svc.siteScore(uid) : null,
        ...(url.searchParams.get("save") === "1" ? { save: uid ? svc.readSave(uid) : null } : {})
      });
    }
    if (method === "GET" && path === "leaderboard") return sendJson(response, 200, { leaderboard: await refreshLeaderboardProfiles(svc.siteLeaderboard(url.searchParams.get("limit"))) });
    if (method === "GET" && path === "ranking") return sendJson(response, 200, svc.rankingView(uid, url.searchParams));
    // Como en los demas cartuchos, la ficha de partida se da a cualquiera (la tele
    // la pide al abrir); guardar marcas ya exige sesion.
    if (method === "POST" && path === "run") return sendRunToken(response, GAME);
    if (!uid) return sendJson(response, 401, { error: "Connect Discord to play online.", code: "signed-out" });
    if (method === "GET" && path === "stream") return openEventStream(request, response, uid, svc);
    if (method === "GET" && path === "social") return sendJson(response, 200, svc.snapshot(uid));
    if (method === "GET" && path === "rooms") return sendJson(response, 200, { list: svc.sessionsList() });
    if (method === "GET" && path === "profile") return sendJson(response, 200, { profile: svc.profileOf(String(url.searchParams.get("uid") || "")) });
    if (method === "DELETE" && path === "account") { svc.deleteAccount(uid); return sendJson(response, 200, { ok: true }); }
    if (method !== "POST") return sendJson(response, 404, { error: "PokéSurvivor endpoint not found.", code: "not-found" });

    const relaying = path === "relay";
    if (relaying ? isRelayLimited(uid) : path === "save" ? isSaveLimited(uid) : path === "room/join" ? isJoinLimited(uid) || isRateLimited(uid) : isRateLimited(uid)) return sendJson(response, 429, { error: "Too many requests.", code: "rate-limited" });
    let body;
    try {
      body = await readJsonBody(request, path === "save" ? MAX_SAVE_BYTES : relaying ? MAX_RELAY_BYTES : 16_384);
    } catch (error) {
      return sendJson(response, error.status || 400, { error: error.message, code: error.status === 413 ? "too-large" : "bad-json" });
    }

    switch (path) {
      case "save": return sendJson(response, 200, { save: svc.storeSave(uid, body.save) });
      case "nick": return sendJson(response, 200, { nick: svc.claimNick(uid, body.name) });
      case "profile": svc.publishProfile(uid, body); return sendJson(response, 200, { ok: true });
      case "presence": svc.setPlaying(uid, body.play); return sendJson(response, 200, { ok: true });
      case "friends/request": return sendJson(response, 200, svc.requestFriend(uid, body.name));
      case "friends/accept": return sendJson(response, 200, svc.acceptFriend(uid, body.uid));
      case "friends/remove": svc.removeFriend(uid, body.uid); return sendJson(response, 200, { ok: true });
      case "room/create": return sendJson(response, 200, { room: svc.createRoom(uid, body) });
      case "room/join": return sendJson(response, 200, { room: svc.joinRoom(uid, body.id, body) });
      case "room/leave": svc.leaveRoom(uid); return sendJson(response, 200, { ok: true });
      case "room/open": svc.setRoomOpen(uid, body.open); return sendJson(response, 200, { ok: true });
      case "room/host": return sendJson(response, 200, { room: svc.transferHost(uid, body.to) });
      case "room/member": svc.updateMember(uid, body); return sendJson(response, 200, { ok: true });
      case "invite": svc.invite(uid, body.to); return sendJson(response, 200, { ok: true });
      case "invite/decline": svc.declineInvite(uid, body.from); return sendJson(response, 200, { ok: true });
      case "relay": svc.relay(uid, body.to, body.items); return sendJson(response, 200, { ok: true });
      case "score": return sendJson(response, 200, svc.submitRun(account, body));
      case "challenge": return sendJson(response, 200, svc.checkChallenge(account, body));
      default: return sendJson(response, 404, { error: "PokéSurvivor endpoint not found.", code: "not-found" });
    }
  } catch (error) {
    if (error instanceof ApiError) return sendJson(response, error.status, { error: error.message, code: error.code });
    console.error("[pokesurvivor]", error);
    return sendJson(response, 500, { error: "PokéSurvivor server error.", code: "server" });
  }
}
