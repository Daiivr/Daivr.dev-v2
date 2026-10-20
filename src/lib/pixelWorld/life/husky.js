import { blit, px, rect } from "../core.js";
import { catchSprite } from "../catches.js";
import { CRITTER_SPRITES } from "../critters.js";
import { FEET } from "../layout.js";
import { ALL_CATCHES } from "../../../../shared/buddy-catches.mjs";

// El husky de Pip (el que duerme en su cuarto) sale al valle. Va detras de
// Pip a su paso: arranca un momento despues que el, acelera y frena poco a
// poco, y mientras Pip anda le sigue al mismo ritmo (corre si se ha quedado
// atras). Con Pip quieto no se mueve por nada: solo si se aleja de verdad.
// Si Pip viene hacia el, le deja pasar. Al pararse se queda de pie, luego se
// sienta y, si tarda, se tumba. De dia a veces se lanza a por una mariposa y,
// al escampar, se sacude el agua. De noche sigue a Pip igual, pero al rato le
// entra sueño: se va a dormir hecho una bola delante del puesto del mercado,
// duerme un poco, se despereza y vuelve con Pip. Si Pip duerme en su tienda,
// el husky duerme delante del puesto (o, de dia, se tumba junto a la tienda).
// Y de vez en cuando ladra hacia algo (la cartera, los cuervos del huerto o lo
// que haya oido), va a olisquear por ahi, o sale corriendo a un sitio, escarba
// y desentierra chatarra o, con suerte, un cofre de fichas (unos pocos al dia:
// `state.dogFinds`). Cuando Pip se pone a pescar no se queda pegado a el: se
// busca algo que hacer (escarbar, una mariposa, olisquear) sin pisar la poza.
const WALK = 19, RUN = 46, ACCEL = 4;
const GAP = 20;             // a cuanto se pone de Pip (px de arte)
const LEASH = 38;           // con Pip quieto, cuanto le deja alejarse
const REACT = [0.35, 0.9];  // lo que tarda en arrancar
const NIGHT_AWAKE = [45, 90], NIGHT_SLEEP = [30, 60];
// (2026-10-20: escarba y persigue mas a menudo, y escarba tambien de noche)
const BARK_GAP = [40, 90], BARK_S = 1.7, DIG_GAP = [55, 120], DIG_S = 3.2, FIND_SHOW_S = 2.4, HOLE_S = 45;
const CHASE_GAP = [20, 40], CHASE_S = 5.5, CHASE_REACH = 140, CHASE_REACH_FISHING = 200;
const SNIFF_GAP = [25, 60], SNIFF_S = [2.2, 3.6];
const CHEST_CHANCE = 0.12;
// Una poza de pesca abierta (ctx.holes): ni la pisa ni la cruza; se queda en
// su lado, a esta distancia del centro, sentado esperando a Pip.
const HOLE_R = 27;
const JUNK = ALL_CATCHES.filter((item) => item.kind === "junk").map((item) => item.id);
const between = ([a, b]) => a + Math.random() * (b - a);

// `others`: los modulos de la cartera y los cuervos (para ladrarles).
export function createHusky(others = {}) {
  let L = null, x = 0, v = 0, dir = 1, walked = 0;
  let rest = 0, startAt = -1, moving = false;
  let hostX = null, hostSpeed = 0;
  let chase = null, nextChase = 0, wasRain = false, shakeUntil = -1, nextZ = 0;
  // de noche: despierto (siguiendo a Pip) o a dormir delante del puesto
  let plan = "follow", awake = 0, awakeFor = between(NIGHT_AWAKE), sleepUntil = 0, asleep = false, settled = "rest";
  // ladrar y escarbar: lo que esta haciendo, el hoyo, lo que ha salido de el
  let act = null, nextBark = 0, nextDig = 0, nextSniff = 0, hole = null, find = null, lastCourier = "", wasFishing = false;
  // sentado en el borde de una poza, esperando a Pip
  let waiting = false;
  const events = [];
  const clampX = (value, W) => Math.max(10, Math.min(W - 10, value));
  const bedX = () => L.standX + 46;

  function wake(t) { asleep = false; plan = "follow"; awake = 0; awakeFor = between(NIGHT_AWAKE); shakeUntil = t + 1; }
  // Con una poza abierta: si el sitio cae dentro o al otro lado, se queda en
  // el borde de su lado (si la poza se abre debajo, sale por el lado mas cerca).
  function avoidHoles(target, ctx) {
    for (const hx of ctx.holes || []) {
      const side = x < hx ? -1 : 1, edge = hx + side * HOLE_R;
      if (Math.abs(target - hx) < HOLE_R || Math.sign(target - hx) !== side) target = side < 0 ? Math.min(target, edge) : Math.max(target, edge);
    }
    return target;
  }
  const waitingAtHole = (ctx) => (ctx.holes || []).some((hx) => Math.abs(Math.abs(x - hx) - HOLE_R) < 4);
  // Un sitio para escarbar: cerca, en hierba (ni el puesto, ni la hoguera, ni
  // el huerto, ni la tienda, ni el buzon, ni un agujero de agua).
  function digSpot(ctx) {
    const blocked = (sx) => (L.clear || []).some(([a, b]) => sx > a - 4 && sx < b + 4) || Math.abs(sx - L.tentX) < 20 || Math.abs(sx - L.mailX) < 9
      || L.lamps.some((lx) => Math.abs(lx - sx) < 14) || (ctx.holes || []).some((hx) => Math.abs(hx - sx) < HOLE_R + 8);
    for (let i = 0; i < 14; i++) {
      const sx = Math.round(clampX(x + (Math.random() < 0.5 ? -1 : 1) * (24 + Math.random() * 60), ctx.W));
      if (!blocked(sx)) return sx;
    }
    return null;
  }
  // Ladra hacia algo: la cartera que llega, los cuervos o lo que sea.
  function interest(ctx) {
    const courier = others.courier, crows = others.crows?.raid;
    if (courier && ["in", "drop", "wave"].includes(courier.phase) && Math.abs(courier.x - x) < 140) return courier.x;
    if (crows && Math.abs(crows.x - x) < 160) return crows.x;
    return null;
  }

  return {
    setup(ctx) { L = ctx.L; x = clampX(L.fireX + 34, ctx.W); v = 0; rest = 0; nextChase = ctx.t + 10; nextBark = ctx.t + between([15, 40]); nextDig = ctx.t + between([20, 45]); nextSniff = ctx.t + between(SNIFF_GAP); plan = "follow"; asleep = false; act = null; },
    update(ctx) {
      if (!L) return;
      const { t, dt } = ctx, host = ctx.actors.find((a) => !a.ghost && !a.aloft);
      waiting = false;
      const night = ctx.light.dark > 0.62, napping = host?.tent === "in" || host?.tent === "enter";
      // lo que anda Pip (px de arte por segundo, suavizado)
      if (host) {
        const step = hostX == null || !dt ? 0 : (host.x - hostX) / dt;
        hostSpeed += (Math.max(-80, Math.min(80, step)) - hostSpeed) * Math.min(1, dt * 6);
        hostX = host.x;
      }
      const walking = Boolean(host) && (host.moving || Math.abs(hostSpeed) > 3);
      // lo desenterrado: sale en arco del hoyo, se queda un momento y se va
      if (find) {
        find.vy += 140 * dt; find.y += find.vy * dt;
        if (find.y >= FEET - 1) { find.y = FEET - 1; find.vy = 0; if (!find.landed) { find.landed = true; find.at = t; events.push({ type: "found", id: find.id }); } }
        if (find.landed && t - find.at > FIND_SHOW_S) {
          for (let i = 0; i < 6; i++) ctx.spawn({ k: "star", x: find.x, y: FEET - 4, vx: (Math.random() - 0.5) * 30, vy: -10 - Math.random() * 14, g: 40, life: 0.45 });
          find = null;
        }
      }
      if (hole && t - hole.t0 > HOLE_S) hole = null;
      // al escampar se sacude; al despertar se despereza (la misma sacudida)
      if (wasRain && !ctx.rain && !night) shakeUntil = t + 1.2;
      wasRain = ctx.rain;
      if (t < shakeUntil) { v = 0; return; }

      // La poza de pesca: si se abre debajo, deja lo que hacia y sale; y en
      // cuanto Pip se pone a pescar, se busca algo que hacer en su lado.
      const holes = ctx.holes || [], fishingHole = holes.length > 0;
      if (act && holes.some((hx) => Math.abs(x - hx) < HOLE_R - 2 || (act.x != null && Math.abs(act.x - hx) < HOLE_R + 4))) act = null;
      if (fishingHole && !wasFishing) {
        nextChase = Math.min(nextChase, t + between([3, 8]));
        nextDig = Math.min(nextDig, t + between([5, 12]));
        nextSniff = Math.min(nextSniff, t + between([4, 10]));
      }
      wasFishing = fishingHole;

      // ladrando: quieto, mirando hacia lo que le llama la atencion
      if (act?.kind === "bark") {
        v *= Math.max(0, 1 - dt * 8); x += v * dt;
        if (t > act.until) { act = null; nextBark = t + between(BARK_GAP); }
        return;
      }
      // escarbando: tierra para atras y, al final, lo que haya
      if (act?.kind === "dig" && act.phase === "dig") {
        v = 0; dir = act.dir;
        if (t > act.next) {
          act.next = t + 0.08;
          ctx.spawn({ k: "pix1", x: x + dir * 6, y: FEET - 1, vx: -dir * (14 + Math.random() * 30), vy: -14 - Math.random() * 18, g: 90, life: 0.5 + Math.random() * 0.25, c: Math.random() < 0.5 ? "#8a5a34" : "#b07a4a" });
        }
        if (t > act.until) {
          const hx = x + dir * 9;
          hole = { x: hx, t0: t };
          if (act.finds) find = { id: Math.random() < CHEST_CHANCE ? "token-chest" : JUNK[Math.floor(Math.random() * JUNK.length)], x: hx, y: FEET - 3, vy: -46, landed: false, at: 0 };
          // (sin hallazgos por hoy: un ultimo puñado de tierra y nada mas)
          else for (let i = 0; i < 5; i++) ctx.spawn({ k: "pix1", x: hx, y: FEET - 2, vx: (Math.random() - 0.5) * 24, vy: -10 - Math.random() * 12, g: 90, life: 0.45, c: "#8a5a34" });
          act = null; nextDig = t + between(DIG_GAP); rest = 1;
        }
        return;
      }
      // olisqueando: el hocico en la hierba un rato
      if (act?.kind === "sniff" && act.phase === "sniff") {
        v = 0; dir = act.dir;
        if (t > act.until) { act = null; nextSniff = t + between(SNIFF_GAP); rest = 1; }
        return;
      }
      // ¿ladrar, escarbar u olisquear? (despierto, sin perseguir nada y con Pip quieto)
      const free = !act && !asleep && plan === "follow" && !napping && !chase && !ctx.reduceMotion && host && !walking;
      const courierKey = others.courier?.phase === "in" ? "in" : "";
      if (free && courierKey && courierKey !== lastCourier && interest(ctx) != null) { nextBark = 0; }
      lastCourier = courierKey;
      if (free && rest > 2.5 && t > nextBark) {
        const at = interest(ctx);
        act = { kind: "bark", until: t + BARK_S + Math.random() * 0.8, dir: at != null ? Math.sign(at - x) || dir : Math.random() < 0.5 ? -1 : 1 };
        dir = act.dir;
        events.push({ type: "bark" });
        return;
      }
      // Escarba de dia y de noche; lo que sale cuenta para los hallazgos del dia
      // (3); gastados, sigue escarbando pero no sale nada.
      if (free && rest > 3 && t > nextDig) {
        const spot = digSpot(ctx);
        if (spot != null) { act = { kind: "dig", phase: "go", x: spot, finds: (ctx.state?.dogFinds ?? 0) > 0 }; events.push({ type: "dig" }); }
        else nextDig = t + 20;
      } else if (free && rest > 3 && t > nextSniff) {
        const spot = digSpot(ctx);
        if (spot != null) act = { kind: "sniff", phase: "go", x: spot };
        else nextSniff = t + 15;
      }

      // ¿a donde va y que hace al llegar?
      let target = null, run = false, settle = "rest";
      if (act?.kind === "dig" || act?.kind === "sniff") { target = act.x; run = act.kind === "dig"; }
      else if (napping) { target = night ? bedX() : L.tentX + 20; settle = night ? "sleep" : "lie"; plan = "follow"; }
      else if (night && plan === "bed") { target = bedX(); settle = "sleep"; }
      else if (plan === "bed") wake(t);
      if (asleep && plan === "bed" && t > sleepUntil) wake(t);
      if (target == null && host) {
        const away = x - host.x, hostDir = Math.abs(hostSpeed) > 3 ? Math.sign(hostSpeed) : (host.dir || 1);
        // una mariposa baja cerca: a por ella un rato (de dia)
        if (!chase && !act && t > nextChase && !walking && !night && !ctx.rain && !ctx.reduceMotion) {
          // (mientras Pip pesca, va a por una mas lejos)
          const reach = fishingHole ? CHASE_REACH_FISHING : CHASE_REACH;
          const fly = (ctx.butterflies || []).filter((b) => b.y > 50 && Math.abs(b.x - x) < reach).sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0];
          if (fly) chase = { fly, until: t + CHASE_S };
          // (si no habia ninguna cerca, vuelve a mirar enseguida)
          nextChase = t + (fly ? between(CHASE_GAP) : 5);
        }
        if (chase && (t > chase.until || walking)) chase = null;
        if (chase) { target = chase.fly.x; run = true; settle = "rest"; }
        else if (walking) {
          // Pip anda: detras de el, a su paso (si viene hacia el, le deja pasar)
          const ahead = Math.sign(away) === hostDir && Math.abs(away) > 4;
          target = ahead ? x : host.x - hostDir * GAP;
          run = Math.abs(target - x) > 46;
        } else {
          // Pip quieto: solo se acerca si se ha alejado (o se aparta si esta encima)
          const side = Math.sign(away) || -(host.dir || 1);
          if (moving || Math.abs(away) > LEASH || Math.abs(away) < 9) target = host.x + side * GAP;
          else target = x;
        }
        // de noche, despues de un rato despierto, se va a dormir
        if (night && !walking) { awake += dt; if (awake > awakeFor && !moving) { plan = "bed"; target = bedX(); settle = "sleep"; } }
      }
      if (target == null) target = x;
      target = clampX(avoidHoles(target, ctx), ctx.W);
      // (si la poza se abre debajo, sale corriendo)
      const escape = (ctx.holes || []).some((hx) => Math.abs(x - hx) < HOLE_R - 2);
      if (escape) run = true;

      // arrancar (con un momento de reaccion), andar a su paso y frenar suave
      const err = target - x;
      if (!moving && Math.abs(err) > 3) {
        if (startAt < 0) startAt = t + (ctx.reduceMotion || act || escape ? 0.05 : between(REACT));
        if (t >= startAt) { moving = true; startAt = -1; asleep = false; }
      } else if (moving || Math.abs(err) <= 3) startAt = -1;
      let want = 0;
      if (moving) {
        const pace = host && walking && !chase && !act && plan === "follow" ? Math.abs(hostSpeed) : 0;
        const top = run ? RUN : Math.max(WALK, pace + 4);
        want = Math.sign(err) * Math.min(top, Math.max(pace, Math.abs(err) * 1.8));
        if (Math.abs(err) < 2.5 && pace < 3) { moving = false; want = 0; }
      }
      v += (want - v) * Math.min(1, dt * ACCEL);
      if (!moving && Math.abs(v) < 1.5) v = 0;
      if (ctx.reduceMotion) { x = target; v = 0; moving = false; }
      // (y nunca se mete en una poza: frena en el borde)
      const before = x;
      x += v * dt;
      for (const hx of ctx.holes || []) {
        const a = hx - HOLE_R, b = hx + HOLE_R;
        if (before <= a && x > a) { x = a; v = 0; }
        else if (before >= b && x < b) { x = b; v = 0; }
      }
      walked += Math.abs(x - before);
      if (Math.abs(v) > 2) { dir = Math.sign(v); rest = 0; }
      else {
        rest += dt;
        // llego a donde escarbar u olisquear: a ello
        if ((act?.kind === "dig" || act?.kind === "sniff") && act.phase === "go" && Math.abs(err) <= 4) {
          act.phase = act.kind; act.until = t + (act.kind === "dig" ? DIG_S : between(SNIFF_S)); act.next = t; act.dir = dir;
        }
        // quieto, mira hacia Pip
        else if (host && rest > 0.6 && settle === "rest") dir = host.x >= x ? 1 : -1;
        if (settle === "sleep" && !asleep && Math.abs(err) <= 3) { asleep = true; sleepUntil = t + between(NIGHT_SLEEP); }
      }
      settled = settle;
      waiting = !moving && Math.abs(v) < 2 && waitingAtHole(ctx);
      if (asleep && t > nextZ) { nextZ = t + 1.8; ctx.spawn({ k: "z", x: x + dir * 3, y: FEET - 10, vx: -2, vy: -3.5, life: 2.4, max: 2.4, wob: Math.random() * 6 }); }
    },
    // el hoyo recien escarbado (con el fondo, detras de todo)
    ground(g, ctx) {
      if (!hole) return;
      const k = Math.min(1, (HOLE_S - (ctx.t - hole.t0)) / 8), hx = Math.round(hole.x);
      g.globalAlpha = Math.max(0, k);
      rect(g, hx - 3, FEET, 7, 1, "#4a2e18"); rect(g, hx - 2, FEET - 1, 5, 1, "#6a4226");
      px(g, hx - 5, FEET, "#8a5a34"); px(g, hx + 4, FEET - 1, "#8a5a34"); px(g, hx + 5, FEET, "#b07a4a"); px(g, hx - 4, FEET - 1, "#b07a4a");
      g.globalAlpha = 1;
    },
    // en el sendero, un poco por detras de Pip
    under(g, ctx) {
      if (!L) return;
      const S = CRITTER_SPRITES().husky, t = ctx.t;
      let img;
      if (t < shakeUntil) img = S.shake[Math.floor(t * 12) % 2];
      else if (act?.kind === "bark") img = S.bark[Math.floor(t * 6) % 2];
      else if (act?.kind === "dig" && act.phase === "dig") img = S.dig[Math.floor(t * 9) % 2];
      // (olisqueando: el hocico abajo y, a ratos, la cabeza arriba)
      else if (act?.kind === "sniff" && act.phase === "sniff") img = (t - act.until) % 1.3 > -0.35 ? S.walk[1] : S.dig[0];
      else if (asleep) img = S.sleep[Math.floor(t * 0.8) % 2];
      else if (Math.abs(v) > 30) img = S.run[Math.floor(walked / 5) % 2];
      else if (Math.abs(v) > 2) img = S.walk[Math.floor(walked / 3) % 4];
      else if (settled === "lie" || (rest > 18 && !waiting)) img = S.lie[0];
      else if (rest > 1.4 || (waiting && rest > 0.5)) img = S.sit[Math.floor(t * 3) % 2];
      else img = S.walk[1];
      blit(g, img, Math.round(x) - Math.floor(img.width / 2), FEET - 1 - img.height + 1, dir < 0);
      // lo desenterrado, junto al hoyo
      if (find) {
        const item = catchSprite(find.id);
        g.drawImage(item, Math.round(find.x) - Math.floor(item.width / 2), Math.round(find.y) - item.height + 1);
      }
    },
    // los ladridos (ondas delante del hocico) y el brillo de lo desenterrado
    glow(g, ctx) {
      if (act?.kind === "bark" && Math.floor(ctx.t * 6) % 2 === 0) {
        const mx = Math.round(x) + dir * 11, my = FEET - 11;
        for (const [d, a] of [[0, 0.95], [3, 0.6]]) {
          g.globalAlpha = a;
          px(g, mx + dir * (1 + d), my - 1 - (d ? 1 : 0), "#fff6cf"); px(g, mx + dir * (2 + d), my, "#fff6cf"); px(g, mx + dir * (1 + d), my + 1 + (d ? 1 : 0), "#fff6cf");
          if (d) { px(g, mx + dir * (2 + d), my - 1, "#fff6cf"); px(g, mx + dir * (2 + d), my + 1, "#fff6cf"); }
        }
        g.globalAlpha = 1;
      }
      if (find?.landed) {
        const c = ((ctx.t - find.at) % 0.9) / 0.9, item = catchSprite(find.id);
        if (c < 0.35) { const sx = Math.round(find.x) + (c < 0.17 ? -item.width / 2 : item.width / 2), sy = FEET - item.height + 1; px(g, Math.round(sx), sy, "#ffffff"); px(g, Math.round(sx) - 1, sy, "#fff0af"); px(g, Math.round(sx) + 1, sy, "#fff0af"); }
      }
    },
    // FooterWorld los recoge: ladridos, escarbadas y hallazgos
    takeEvents() { return events.splice(0, events.length); },
    get x() { return x; },
    // (pruebas) como esta ahora
    get state() { return { x: Math.round(x), v: Math.round(v), plan, asleep, moving, rest: Math.round(rest * 10) / 10, act: act ? `${act.kind}:${act.phase || ""}` : chase ? "chase:" : "", find: find?.id || "", waiting }; },
    // (pruebas) que le entre el sueño ya, que ladre ya, que escarbe ya
    sleepy() { awake = awakeFor + 1; },
    bark() { nextBark = 0; rest = 3; },
    dig() { nextDig = 0; rest = 5; },
    place(at) { x = at; v = 0; moving = false; startAt = -1; }
  };
}
