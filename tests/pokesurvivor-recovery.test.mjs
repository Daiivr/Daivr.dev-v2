import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const recoverySource = readFileSync(new URL("../tools/pokesurvivor/extensions/coop-recovery.js", import.meta.url), "utf8");
// Exercise the same LevelUp and network modules shipped to players, without
// requiring an upstream checkout, Discord accounts, or real peer connections.
const bundle = readFileSync(new URL("../public/pokesurvivor/js/app.min.js", import.meta.url), "utf8");
function shippedModule(name, next) {
  const start = bundle.indexOf(`G.${name}=`), end = bundle.indexOf(`G.${next}=`, start + 1);
  assert.ok(start >= 0 && end > start, `Cannot locate shipped ${name} module`);
  return bundle.slice(start, end).replace(/[,;]\s*$/, ";");
}

function player(overrides = {}) {
  return {
    x: 0, y: 0, hp: 0, maxHp: 100, dead: true, level: 10, reviveT: 0,
    slots: [], maxMoves: 0, moves: [], statsTaken: {}, xpMul: 1, magnet: 78,
    moveAngle: 0, aim: 0, activeGroup: () => [],
    revive(frac) { this.dead = false; this.hp = this.maxHp * frac; this.invuln = 2; this.reviveT = 0; },
    ...overrides
  };
}
function mate(uid, overrides = {}) {
  return { uid, name: uid, connected: true, pl: player({ dead: false, hp: 100, x: 1000, ...overrides }) };
}
function setup() {
  let random = 0.5, draws = 0;
  const math = Object.create(Math);
  math.random = () => { draws++; return random; };
  const local = player(), a = mate("Ash"), b = mate("Misty", { x: -1000 });
  const G = {
    Game: { player: local }, Coop: { active: true, mates: [a, b] },
    Camera: { follow(x, y) { this.x = x; this.y = y; } },
    Moves: { poolFor: () => [], evoInfo: m => m.evo || null, nextUpText: () => null },
    U: { pickN: (list, count) => list.slice(0, count) }
  };
  const context = vm.createContext({ G, Math: math });
  vm.runInContext(recoverySource, context);
  return { G, local, a, b, context, random(value) { random = value; }, get draws() { return draws; } };
}

test("spectating switches living teammates without moving the downed body", () => {
  const { G, local, a, b } = setup();
  assert.equal(G.CoopRecovery.target(), a);
  G.CoopRecovery.follow(local, 0.016);
  assert.equal(G.Camera.x, a.pl.x);
  G.CoopRecovery.cycle(1);
  assert.equal(G.CoopRecovery.target(), b);
  G.CoopRecovery.follow(local, 0.016);
  assert.equal(G.Camera.x, b.pl.x);
  G.CoopRecovery.cycle(1);
  assert.equal(G.CoopRecovery.target(), a, "next wraps");
  G.CoopRecovery.cycle(-1);
  assert.equal(G.CoopRecovery.target(), b, "previous wraps");
  assert.equal(local.x, 0);
  assert.equal(local.y, 0);
  assert.equal(local.dead, true);
});

test("death and disconnect choose a survivor; revival returns the camera to you", () => {
  const { G, local, a, b } = setup();
  G.CoopRecovery.follow(local, 0.016);
  a.pl.dead = true;
  assert.equal(G.CoopRecovery.target(), b);
  b.connected = false;
  assert.equal(G.CoopRecovery.target(), null, "all down/disconnected has no spectator target");
  b.connected = true;
  G.CoopRecovery.follow(local, 0.016);
  local.revive(0.5);
  G.CoopRecovery.follow(local, 0.016);
  assert.equal(G.CoopRecovery.target(), null);
  assert.equal(G.Camera.x, local.x);
  local.dead = true;
  G.Coop.active = false;
  assert.equal(G.CoopRecovery.target(), null, "solo does not spectate");
});

test("self-revive is a one-percent roll, only for downed co-op players", () => {
  const s = setup(), { G, local } = s;
  let wins = 0;
  for (let i = 0; i < 10000; i++) {
    s.random((i + 0.5) / 10000);
    if (G.CoopRecovery.reviveCard(local, i)) wins++;
  }
  assert.equal(wins, 100);
  s.random(0);
  local.dead = false;
  assert.equal(G.CoopRecovery.reviveCard(local, 10001), null);
  local.dead = true; G.Coop.active = false;
  assert.equal(G.CoopRecovery.reviveCard(local, 10002), null);
  G.Coop.active = true; s.a.pl.dead = s.b.pl.dead = true;
  assert.equal(G.CoopRecovery.reviveCard(local, 10003), null, "no escape from a full team wipe");
});

test("spectator controls switch friends, show revive progress, and hide outside spectating", () => {
  const { G, local, b, context } = setup();
  const elements = new Map();
  for (const id of ["spectator-controls", "spectate-name", "spectate-prev", "spectate-next", "spectate-revive"]) {
    const classes = new Set();
    elements.set(id, { classList: { toggle(name, enabled) { enabled ? classes.add(name) : classes.delete(name); } }, classes });
  }
  context.document = { getElementById: id => elements.get(id) };
  G.Player = { REVIVE_TIME: 4 };
  G.CoopRecovery.init();
  local.reviveT = 2;
  G.CoopRecovery.syncUI(true);
  assert.equal(elements.get("spectate-name").textContent, "Ash");
  assert.equal(elements.get("spectate-revive").value, 0.5);
  elements.get("spectate-next").onclick();
  G.CoopRecovery.syncUI(true);
  assert.equal(elements.get("spectate-name").textContent, "Misty");
  b.connected = false;
  G.CoopRecovery.syncUI(true);
  assert.equal(elements.get("spectate-name").textContent, "Ash");
  assert.equal(elements.get("spectate-next").disabled, true);
  G.CoopRecovery.syncUI(false);
  assert.equal(elements.get("spectator-controls").classes.has("hidden"), true);
  G.CoopRecovery.syncUI(true);
  assert.equal(elements.get("spectator-controls").classes.has("hidden"), false);
  local.revive(0.5);
  G.CoopRecovery.syncUI(true);
  assert.equal(elements.get("spectator-controls").classes.has("hidden"), true);
});

test("rerolls and duplicate level messages cannot farm or consume extra revive rolls", () => {
  const s = setup(), { G, local } = s;
  s.random(0.5);
  assert.equal(G.CoopRecovery.reviveCard(local, 10), null);
  s.random(0);
  for (let i = 0; i < 20; i++) assert.equal(G.CoopRecovery.reviveCard(local, 10), null);
  assert.equal(s.draws, 1);
  const card = G.CoopRecovery.reviveCard(local, 11);
  assert.equal(card.type, "revive");
  assert.equal(G.CoopRecovery.reviveCard(local, 11).key, card.key);
  assert.equal(s.draws, 2);
  assert.equal(local.dead, true, "offering the card never revives automatically");
  card.apply(local);
  assert.equal(local.dead, false);
  assert.equal(local.hp, 50);
  local.hp = 20;
  card.apply(local);
  assert.equal(local.hp, 20, "duplicate click has no effect");
  local.dead = true;
  assert.equal(G.CoopRecovery.reviveCard(local, 11), null, "spent card cannot revive twice");
});

test("revive occupies one of three choices and keeps guaranteed evolutions", () => {
  const s = setup(), { G, local, context } = s;
  vm.runInContext(shippedModule("LevelUp", "Gacha"), context);
  s.random(0);
  local.moves = [{ id: "tackle", name: "Tackle", evo: { ready: true, name: "Evolved", text: "Evolution" } }];
  const cards = G.LevelUp.offer(local, 3, 12);
  assert.equal(cards.length, 3);
  assert.equal(cards[0].type, "evo");
  assert.equal(cards.filter(c => c.type === "revive").length, 1);
  assert.equal(new Set(cards.map(c => c.key)).size, 3);
  cards.find(c => c.type === "revive").apply(local);
  assert.equal(local.hp, 50);
  assert.equal(local.moves.length, 1, "revive does not grant an additional move");
});

function network(uid) {
  const sent = [], received = {};
  class FakePlayer {
    constructor() { Object.assign(this, player({ dead: false, hp: 100 })); }
  }
  const local = player({ dead: uid === "guest", hp: uid === "guest" ? 0 : 100 });
  const G = {
    Game: { player: local }, Player: FakePlayer,
    Camera: { fov: 1, FOV_MAX: 2, follow() {} },
    Net: { uid, on(fn) { received.frame = fn; }, onPeer() {}, slow: () => false, viaTurn: () => false,
      send(to, frame) { sent.push({ to, frame }); }, toHost(frame) { sent.push({ to: "host", frame }); } },
    Social: { on() {}, me: { name: uid } }, Sprites: { preload() {} },
    DEX_BY: { 25: { dex: 25 } }, startMoveOf: () => "tackle",
    U: { clamp: (x, min, max) => Math.max(min, Math.min(max, x)), dist2: (x, y, a, b) => (x-a)**2 + (y-b)**2 },
    Judgment: { netState: () => null }, EnemyMgr: { all: () => [] },
    Projectiles: { clearOrbs() {} }, Spawner: { say() {} }
  };
  const context = vm.createContext({ G, performance: { now: () => 0 }, document: { addEventListener() {} }, clearTimeout() {}, setTimeout() {} });
  vm.runInContext(shippedModule("Coop", "CoopRecovery"), context);
  vm.runInContext(recoverySource, context);
  G.Coop.begin({ host: "host", members: ["host", "guest", "friend"].map(uid => ({ uid, name: uid, dex: 25 })) }, local, {
    team: () => ({ time: 10, level: 5, xp: 0, xpNext: 100, kills: 0, bosses: 0, coins: 0 })
  });
  return { G, local, sent, received };
}

test("dead clients request their watched teammate while their body stays in place", () => {
  const { G, local, sent } = network("guest");
  const body = [local.x, local.y];
  G.Coop.tick(1);
  assert.equal(sent.at(-1).frame.sp, "host");
  assert.deepEqual(Array.from(sent.at(-1).frame.p.slice(0, 2)), body);
  G.CoopRecovery.cycle(1);
  G.Coop.tick(1);
  assert.equal(sent.at(-1).frame.sp, "friend");
  local.revive(0.5);
  G.Coop.tick(1);
  assert.equal(sent.at(-1).frame.sp, undefined);
  assert.equal(sent.at(-1).frame.p[6], 0, "revival is sent through normal co-op state");
});

test("host sends nearby enemies and hit effects around a valid spectator target", () => {
  const { G, sent, received } = network("host");
  const friend = G.Coop.mate("friend");
  friend.pl.x = 5000;
  const enemies = [0, 5000].map((x, i) => ({ id: i + 1, x, y: 0, hp: 10, dead: false, anim: { cur: "Idle", dir: 0 } }));
  G.EnemyMgr.all = () => enemies;
  function send(dead, sp) {
    received.frame("guest", { k: "f", p: [0, 0, 0, 0, dead ? 0 : 100, 100, dead ? 1 : 0, "", 1, 78, 0, 1, 0], sp, ev: [] });
    G.Coop.tick(1);
    return sent.filter(e => e.to === "guest").at(-1).frame;
  }
  assert.deepEqual(Array.from(send(true, "friend").e, e => e[0]), [2]);
  G.Coop.hurtShown(enemies[1], 5, "red");
  G.Coop.tick(1);
  assert.ok(sent.filter(e => e.to === "guest").at(-1).frame.ev.some(e => e[0] === "hn"));
  assert.deepEqual(Array.from(send(false, "friend").e, e => e[0]), [1], "living players cannot use spectator requests");
  assert.deepEqual(Array.from(send(true, "stranger").e, e => e[0]), [1]);
  friend.connected = false;
  assert.deepEqual(Array.from(send(true, "friend").e, e => e[0]), [1], "disconnected targets are ignored");
});
