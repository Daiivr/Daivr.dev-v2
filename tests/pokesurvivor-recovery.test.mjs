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
    Camera: { x: 0, y: 0, follow(x, y) { this.x = x; this.y = y; } },
    Moves: { poolFor: () => [], evoInfo: m => m.evo || null, nextUpText: () => null },
    U: { pickN: (list, count) => list.slice(0, count), dist: (x, y, x2, y2) => Math.hypot(x - x2, y - y2) },
    Audio: { sfx() {} },
    // The shipped modules translate move names (upstream 803125d): Spanish stays as is here.
    T: s => s
  };
  const context = vm.createContext({ G, Math: math, performance: { now: () => 0 } });
  vm.runInContext(recoverySource, context);
  return { G, local, a, b, context, random(value) { random = value; }, get draws() { return draws; } };
}
// Longer than CoopRecovery.WATCH_DELAY: your own faint has played out.
const FAINTED = 1.2;

test("spectating waits for your faint, then switches living teammates without moving the body", () => {
  const { G, local, a, b } = setup();
  assert.equal(G.CoopRecovery.target(), a);
  G.CoopRecovery.follow(local, 0.5);
  assert.equal(G.CoopRecovery.watching(), null, "your Pokémon faints on screen first");
  assert.equal(G.Camera.x, local.x);
  G.CoopRecovery.follow(local, FAINTED - 0.5);
  assert.equal(G.CoopRecovery.watching(), a);
  assert.equal(G.Camera.x, a.pl.x, "a far teammate is a cut");
  assert.ok(G.CoopRecovery.shutter() > 0, "the cut plays the shutter");
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

test("a nearby teammate is reached with a short pan instead of a cut", () => {
  const { G, local, a } = setup();
  a.pl.x = 300;
  G.CoopRecovery.follow(local, 1);
  G.CoopRecovery.follow(local, 0.12);
  assert.ok(G.Camera.x > 0 && G.Camera.x < 300, `mid-pan, got ${G.Camera.x}`);
  assert.equal(G.CoopRecovery.shutter(), 0);
  G.CoopRecovery.follow(local, 0.3);
  assert.equal(G.Camera.x, 300);
  G.CoopRecovery.cycle(1);
  G.CoopRecovery.follow(local, 0.016);
  assert.equal(G.Camera.x, -1000, "Misty is 1300 away: cut");
});

test("death and disconnect choose a survivor; revival returns the camera to you", () => {
  const { G, local, a, b } = setup();
  G.CoopRecovery.follow(local, FAINTED);
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

test("the revive card starts at 20% and each level you stay down adds 15%, up to 65%", () => {
  const s = setup(), { G, local } = s;
  s.random(0.99);
  const seen = [];
  for (let level = 1; level <= 6; level++) {
    seen.push(Math.round(G.CoopRecovery.nextChance() * 100));
    assert.equal(G.CoopRecovery.reviveCard(local, level), null);
  }
  assert.deepEqual(seen, [20, 35, 50, 65, 65, 65]);
  local.revive(0.5);
  G.CoopRecovery.follow(local, 0.016);
  local.dead = true;
  assert.equal(Math.round(G.CoopRecovery.nextChance() * 100), 20, "every downing starts over");
  s.random(0.3);
  assert.equal(G.CoopRecovery.reviveCard(local, 7), null, "0.3 misses 20%");
  assert.equal(G.CoopRecovery.reviveCard(local, 8).type, "revive", "0.3 wins 35%");
  s.random(0);
  local.dead = false;
  assert.equal(G.CoopRecovery.reviveCard(local, 20), null);
  assert.equal(G.CoopRecovery.nextChance(), 0);
  local.dead = true; G.Coop.active = false;
  assert.equal(G.CoopRecovery.reviveCard(local, 21), null);
  G.Coop.active = true; s.a.pl.dead = s.b.pl.dead = true;
  assert.equal(G.CoopRecovery.reviveCard(local, 22), null, "no escape from a full team wipe");
});

test("about one downing in five sees the card on its first level, most within three", () => {
  const s = setup(), { G, local } = s;
  let first = 0, byThird = 0, seed = 12345;
  // Seeded rolls (mulberry32), so the test is repeatable.
  const roll = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const N = 3000;
  for (let i = 0; i < N; i++) {
    // Up to three levels per downing.
    let won = 0;
    for (let k = 0; k < 3 && !won; k++) {
      s.random(roll());
      if (G.CoopRecovery.reviveCard(local, i * 3 + k)) won = k + 1;
    }
    if (won === 1) first++;
    if (won) byThird++;
    local.revive(0.5); G.CoopRecovery.follow(local, 0.016); local.dead = true;
  }
  assert.ok(Math.abs(first / N - 0.2) < 0.03, `first level ${first / N}`);
  assert.ok(Math.abs(byThird / N - (1 - 0.8 * 0.65 * 0.5)) < 0.04, `within three ${byThird / N}`);
});

test("the spectator panel shows who you watch, how many you can pick, and the next revive chance", () => {
  const { G, local, b } = setup();
  assert.equal(G.CoopRecovery.view(), null, "nothing while your Pokémon faints");
  G.CoopRecovery.follow(local, FAINTED);
  let v = G.CoopRecovery.view();
  assert.equal(v.mate.name, "Ash");
  assert.equal(v.index, 0);
  assert.equal(v.count, 2);
  assert.equal(Math.round(v.chance * 100), 20);
  G.CoopRecovery.cycle(1);
  v = G.CoopRecovery.view();
  assert.equal(v.mate.name, "Misty");
  assert.equal(v.index, 1);
  assert.equal(v.cycledDir, 1);
  b.connected = false;
  v = G.CoopRecovery.view();
  assert.equal(v.mate.name, "Ash");
  assert.equal(v.count, 1);
  G.CoopRecovery.cycle(1);
  assert.equal(G.CoopRecovery.view().mate.name, "Ash", "one teammate: nothing to switch to");
  local.revive(0.5);
  G.CoopRecovery.follow(local, 0.016);
  assert.equal(G.CoopRecovery.view(), null);
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
    DEX_BY: { 25: { dex: 25 } }, startMoveOf: () => "tackle", baseStartOf: () => "tackle", T: s => s,
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
