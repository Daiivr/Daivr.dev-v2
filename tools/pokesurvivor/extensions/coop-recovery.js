/* Co-op recovery: spectate living friends without moving the downed body. */
G.CoopRecovery = (() => {
  // Self-revive card: the first team level while you are down has a 20% chance,
  // and every further level you stay down adds 15% (35%, 50%, then 65% at most).
  const REVIVE_BASE = 0.2, REVIVE_STEP = 0.15, REVIVE_MAX = 0.65;
  // Watch your own Pokémon faint before the camera leaves for a teammate.
  const WATCH_DELAY = 1.1;
  // Switching teammates: a quick pan when they are close, a shutter cut otherwise.
  const PAN_T = 0.38, PAN_MAX = 900, CUT_T = 0.32;
  let selected = null, followed = null, deadT = 0, wasDead = false, downs = 0;
  let pan = null, cutAt = -1e9, cycledAt = -1e9, cycledDir = 0;
  let rolls = new WeakMap();

  function livingMates() {
    return G.Coop.mates.filter(m => m.connected && m.pl && !m.pl.dead);
  }

  // Counts each time you go down, so the revive chance starts over every downing.
  function note(pl) {
    if (!pl) return;
    if (pl.dead && !wasDead) downs++;
    wasDead = !!pl.dead;
  }

  function target(pl = G.Game.player) {
    note(pl);
    if (!G.Coop.active || !pl || !pl.dead) { selected = null; return null; }
    const mates = livingMates();
    const mate = mates.find(m => m.uid === selected) || mates[0] || null;
    selected = mate ? mate.uid : null;
    return mate;
  }

  /** The teammate on screen: target() once your faint has played out. */
  function watching(pl = G.Game.player) {
    const mate = target(pl);
    return mate && deadT >= WATCH_DELAY ? mate : null;
  }

  function cycle(step) {
    const current = target();
    if (!current) return;
    const mates = livingMates(), index = mates.findIndex(m => m.uid === current.uid);
    if (mates.length < 2) return;
    selected = mates[(index + step + mates.length) % mates.length].uid;
    cycledAt = performance.now(); cycledDir = step;
    if (G.Audio) G.Audio.sfx('select');
  }

  const ease = k => 1 - Math.pow(1 - k, 3);

  function follow(pl, dt) {
    note(pl);
    deadT = pl.dead ? deadT + dt : 0;
    const mate = watching(pl), focus = mate ? mate.pl : pl;
    if (followed && followed !== focus) {
      // Includes going back to your body after a revive (a teammate beside you: a pan).
      if (G.U.dist(G.Camera.x, G.Camera.y, focus.x, focus.y) > PAN_MAX) {
        pan = null; cutAt = performance.now(); G.Camera.x = focus.x; G.Camera.y = focus.y;
      } else pan = { x: G.Camera.x, y: G.Camera.y, t: 0 };
    }
    followed = focus;
    if (pan) {
      pan.t += dt;
      const k = ease(Math.min(1, pan.t / PAN_T));
      G.Camera.x = pan.x + (focus.x - pan.x) * k;
      G.Camera.y = pan.y + (focus.y - pan.y) * k;
      if (k >= 1) pan = null;
      return;
    }
    G.Camera.follow(focus.x, focus.y, dt);
  }

  function reset() {
    selected = followed = pan = null; deadT = 0; wasDead = false; downs = 0;
    cutAt = cycledAt = -1e9; cycledDir = 0; rolls = new WeakMap();
  }

  function eligible(pl) {
    return G.Coop.active && pl.dead && livingMates().length > 0;
  }

  /** Chance for the n-th level (0 = first) of the same downing. */
  function chanceAt(n) { return Math.min(REVIVE_MAX, REVIVE_BASE + REVIVE_STEP * n); }

  /** Chance the next team level offers the card (for the spectator panel). */
  function nextChance(pl = G.Game.player) {
    note(pl);
    const record = rolls.get(pl);
    if (!pl || !eligible(pl)) return 0;
    return chanceAt(record && record.down === downs ? record.n + 1 : 0);
  }

  // One roll per shared level, not per reroll, packet or host migration.
  // Keep a winning offer on rerolls; selecting it consumes the level choice.
  function reviveCard(pl, level = pl.level) {
    note(pl);
    let record = rolls.get(pl);
    if (!record || record.level !== level) {
      // n = how many levels of this downing have rolled before (-1 = none yet).
      const before = record && record.down === downs ? record.n : -1, ok = eligible(pl);
      const n = ok ? before + 1 : before;
      record = { level, down: downs, n, lucky: ok && Math.random() < chanceAt(n), used: false };
      rolls.set(pl, record);
    }
    if (!record.lucky || record.used || !eligible(pl)) return null;
    return {
      type: 'revive', key: 'coop:self-revive', icon: 'heart', color: '#5fe08a',
      tag: 'REVIVIR', title: 'Segunda oportunidad',
      desc: 'Revive ahora con el 50% de vida. Sustituye tu mejora de este nivel.',
      apply(p) {
        if (p !== pl || record.used || !eligible(p)) return;
        record.used = true;
        p.revive(0.5);
      }
    };
  }

  /** What the spectator panel and the screen transitions need (hud.js). */
  function view(pl = G.Game.player) {
    const mate = watching(pl);
    if (!mate) return null;
    const mates = livingMates();
    return {
      mate, index: mates.findIndex(m => m.uid === mate.uid), count: mates.length,
      age: deadT - WATCH_DELAY, chance: nextChance(pl),
      cycledAt, cycledDir
    };
  }

  /** 0..1 while the shutter of a far switch is opening (1 = just cut), else 0. */
  function shutter(now = performance.now()) {
    const k = (now - cutAt) / 1000 / CUT_T;
    return k >= 0 && k < 1 ? 1 - k : 0;
  }

  return { target, watching, cycle, follow, reset, reviveCard, nextChance, chanceAt, view, shutter,
           REVIVE_BASE, REVIVE_STEP, REVIVE_MAX, WATCH_DELAY };
})();
