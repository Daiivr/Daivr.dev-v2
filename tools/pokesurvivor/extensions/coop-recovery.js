/* Co-op recovery: spectate living friends without moving the downed body. */
G.CoopRecovery = (() => {
  const REVIVE_CHANCE = 0.01;
  let selected = null, followed = null;
  let rolls = new WeakMap();

  function livingMates() {
    return G.Coop.mates.filter(m => m.connected && m.pl && !m.pl.dead);
  }

  function target(pl = G.Game.player) {
    if (!G.Coop.active || !pl || !pl.dead) { selected = null; return null; }
    const mates = livingMates();
    const mate = mates.find(m => m.uid === selected) || mates[0] || null;
    selected = mate ? mate.uid : null;
    return mate;
  }

  function cycle(step) {
    const current = target();
    if (!current) return;
    const mates = livingMates(), index = mates.findIndex(m => m.uid === current.uid);
    selected = mates[(index + step + mates.length) % mates.length].uid;
  }

  function follow(pl, dt) {
    const mate = target(pl), focus = mate ? mate.pl : pl;
    // Switch immediately, including returning to the body after a revive.
    if (followed !== focus && (mate || followed)) {
      G.Camera.x = focus.x; G.Camera.y = focus.y;
    }
    followed = focus;
    G.Camera.follow(focus.x, focus.y, dt);
  }

  function reset() { selected = followed = null; rolls = new WeakMap(); }

  function init() {
    document.getElementById('spectate-prev').onclick = () => cycle(-1);
    document.getElementById('spectate-next').onclick = () => cycle(1);
  }

  function syncUI(visible) {
    const box = document.getElementById('spectator-controls');
    const mate = visible ? target() : null;
    box.classList.toggle('hidden', !mate);
    if (!mate) return;
    const name = document.getElementById('spectate-name');
    if (name.textContent !== mate.name) name.textContent = mate.name;
    const multiple = livingMates().length > 1;
    document.getElementById('spectate-prev').disabled = !multiple;
    document.getElementById('spectate-next').disabled = !multiple;
    document.getElementById('spectate-revive').value = Math.min(1, (G.Game.player.reviveT || 0) / G.Player.REVIVE_TIME);
  }

  function eligible(pl) {
    return G.Coop.active && pl.dead && livingMates().length > 0;
  }

  // One roll per shared level, not per reroll, packet or host migration.
  // Keep a winning offer on rerolls; selecting it consumes the level choice.
  function reviveCard(pl, level = pl.level) {
    let record = rolls.get(pl);
    if (!record || record.level !== level) {
      record = { level, lucky: eligible(pl) && Math.random() < REVIVE_CHANCE, used: false };
      rolls.set(pl, record);
    }
    if (!record.lucky || record.used || !eligible(pl)) return null;
    return {
      type: 'revive', key: 'coop:self-revive', icon: 'heart', color: '#ffd23f',
      tag: 'ULTRARRARO', title: 'Segunda oportunidad',
      desc: 'Revive ahora con el 50% de vida. Sustituye tu mejora de este nivel.',
      apply(p) {
        if (p !== pl || record.used || !eligible(p)) return;
        record.used = true;
        p.revive(0.5);
      }
    };
  }

  return { target, cycle, follow, reset, init, syncUI, reviveCard, REVIVE_CHANCE };
})();
