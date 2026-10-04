// Sonido ambiente del footer, sintetizado con Web Audio (sin archivos):
// grillos de noche, la lluvia, la hoguera que crepita, el zumbido de las
// farolas y un poco de viento. Empieza apagado; FooterSoundscape lo enciende
// con un clic y lo calla fuera de la vista o con la pestaña detras.

const MASTER = 0.42;
const RAMP_S = 1.4;
const LOOKAHEAD_S = 0.45;
const TICK_MS = 200;
// Volumen de cada capa con el mix a 1.
const BASE = { wind: 0.1, rain: 0.13, fire: 1, crickets: 0.09, hum: 0.018 };
export const SOUND_LAYERS = Object.keys(BASE);

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// Cuanto suena cada capa (0..1) segun el cielo: los grillos y las farolas
// solo al anochecer y de noche (y callan con lluvia), la hoguera siempre (mas
// de noche), la lluvia con lluvia de verdad o con el chubasco de Buddy, y el
// viento segun sople.
export function soundscapeMix({ phase = "day", cover = "fair", wind = 1, raining = false } = {}) {
  const night = phase === "night" ? 1 : phase === "dusk" || phase === "dawn" ? 0.5 : 0;
  const wet = raining ? 1 : cover === "storm" ? 0.9 : cover === "rain" ? 0.7 : 0;
  const chilly = cover === "snow" || cover === "fog" ? 0.35 : 1;
  return {
    wind: clamp(0.25 + wind * 0.35, 0.2, 1),
    rain: wet,
    fire: 0.45 + 0.55 * night,
    crickets: night * chilly * (wet ? 0.25 : 1),
    hum: night
  };
}

function noiseBuffer(ctx, seconds = 2) {
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1;
  return buffer;
}

function panner(ctx, pan) {
  if (typeof ctx.createStereoPanner !== "function") return ctx.createGain();
  const node = ctx.createStereoPanner();
  node.pan.value = pan;
  return node;
}

function filter(ctx, type, frequency, q = 0.7) {
  const node = ctx.createBiquadFilter();
  node.type = type;
  node.frequency.value = frequency;
  node.Q.value = q;
  return node;
}

// Espera exponencial: chasquidos y gotas a ritmo irregular, como de verdad.
const poisson = (mean) => -Math.log(1 - Math.random()) * mean;

export function createSoundscape({ context = null } = {}) {
  let ctx = context;
  let master = null;
  let noise = null;
  const layers = {};
  const levels = Object.fromEntries(SOUND_LAYERS.map((name) => [name, 0]));
  let timer = 0;
  let built = false;
  // Proximo evento de cada cosa que se programa a golpes.
  const next = { pop: 0, drop: 0, gust: 0, flicker: 0 };
  const crickets = [];

  function build() {
    if (built) return;
    built = true;
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    noise = noiseBuffer(ctx);

    for (const name of SOUND_LAYERS) {
      const gain = ctx.createGain();
      gain.gain.value = 0;
      gain.connect(master);
      layers[name] = gain;
    }

    // Viento: ruido grave y suave, con rachas.
    const windSource = ctx.createBufferSource();
    windSource.buffer = noise;
    windSource.loop = true;
    const windShape = filter(ctx, "bandpass", 420, 0.6);
    const windGust = ctx.createGain();
    windGust.gain.value = 0.7;
    windSource.connect(windShape).connect(filter(ctx, "lowpass", 1100)).connect(windGust).connect(layers.wind);
    windSource.start();
    layers.wind.gust = windGust;

    // Lluvia: siseo continuo (las gotas sueltas van aparte).
    const rainSource = ctx.createBufferSource();
    rainSource.buffer = noise;
    rainSource.loop = true;
    rainSource.connect(filter(ctx, "highpass", 500)).connect(filter(ctx, "lowpass", 6500)).connect(layers.rain);
    rainSource.start(0, 0.7);

    // Hoguera: rumor grave de las llamas, a la izquierda (como en el footer);
    // los chasquidos se programan aparte.
    const fireBus = panner(ctx, -0.45);
    fireBus.connect(layers.fire);
    layers.fire.bus = fireBus;
    const roarSource = ctx.createBufferSource();
    roarSource.buffer = noise;
    roarSource.loop = true;
    const roar = ctx.createGain();
    roar.gain.value = 0.09;
    roarSource.connect(filter(ctx, "lowpass", 240)).connect(roar).connect(fireBus);
    roarSource.start(0, 1.3);
    layers.fire.crackle = filter(ctx, "highpass", 1700);
    layers.fire.crackle.connect(fireBus);

    // Farolas: zumbido electrico muy bajito, que parpadea un poco.
    const humGain = ctx.createGain();
    humGain.gain.value = 1;
    const humFilter = filter(ctx, "lowpass", 420);
    for (const [frequency, amount] of [[120, 1], [240, 0.35], [360, 0.12]]) {
      const osc = ctx.createOscillator();
      osc.frequency.value = frequency;
      const gain = ctx.createGain();
      gain.gain.value = amount;
      osc.connect(gain).connect(humFilter);
      osc.start();
    }
    humFilter.connect(humGain).connect(layers.hum);
    layers.hum.flicker = humGain;

    // Grillos: dos, a cada lado, cada uno con su tono; cri-cri-cri a pulsos.
    for (const [frequency, pan] of [[4450, -0.55], [5150, 0.6]]) {
      const osc = ctx.createOscillator();
      osc.frequency.value = frequency;
      const pulse = ctx.createGain();
      pulse.gain.value = 0;
      osc.connect(pulse).connect(panner(ctx, pan)).connect(layers.crickets);
      osc.start();
      crickets.push({ pulse, next: 0 });
    }
  }

  // Programa lo que toca entre ahora y `until` (segundos del contexto).
  function scheduleUntil(until) {
    const now = ctx.currentTime;

    if (levels.crickets > 0.01) {
      for (const cricket of crickets) {
        if (cricket.next < now) cricket.next = now + Math.random() * 0.8;
        while (cricket.next < until) {
          const pulses = 3 + Math.floor(Math.random() * 2);
          for (let index = 0; index < pulses; index += 1) {
            const at = cricket.next + index * 0.048;
            cricket.pulse.gain.setValueAtTime(0, at);
            cricket.pulse.gain.linearRampToValueAtTime(1, at + 0.007);
            cricket.pulse.gain.linearRampToValueAtTime(0, at + 0.03);
          }
          // De vez en cuando se callan un rato.
          cricket.next += Math.random() < 0.12 ? 2.5 + Math.random() * 3 : 0.65 + Math.random() * 0.7;
        }
      }
    }

    if (levels.fire > 0.01) {
      if (next.pop < now) next.pop = now;
      while (next.pop < until) {
        const pop = ctx.createBufferSource();
        pop.buffer = noise;
        const env = ctx.createGain();
        const peak = 0.05 + Math.random() * Math.random() * 0.55;
        const length = 0.006 + Math.random() * 0.04;
        env.gain.setValueAtTime(peak, next.pop);
        env.gain.exponentialRampToValueAtTime(0.0001, next.pop + length);
        pop.connect(env).connect(layers.fire.crackle);
        pop.start(next.pop, Math.random() * 1.8, length + 0.02);
        // A rafagas: a veces varios chasquidos seguidos.
        next.pop += Math.random() < 0.25 ? 0.02 + Math.random() * 0.05 : poisson(0.22);
      }
    }

    if (levels.rain > 0.01) {
      if (next.drop < now) next.drop = now;
      while (next.drop < until) {
        const drop = ctx.createOscillator();
        drop.frequency.value = 1800 + Math.random() * 2600;
        const env = ctx.createGain();
        env.gain.setValueAtTime(0.18 + Math.random() * 0.25, next.drop);
        env.gain.exponentialRampToValueAtTime(0.0001, next.drop + 0.03);
        drop.connect(env).connect(layers.rain);
        drop.start(next.drop);
        drop.stop(next.drop + 0.05);
        next.drop += poisson(0.09);
      }
    }

    if (next.gust < until) {
      layers.wind.gust.gain.setTargetAtTime(0.45 + Math.random() * 0.8, Math.max(now, next.gust), 1.1);
      next.gust = Math.max(now, next.gust) + 1.5 + Math.random() * 2.5;
    }

    if (next.flicker < until) {
      layers.hum.flicker.gain.setTargetAtTime(0.75 + Math.random() * 0.35, Math.max(now, next.flicker), 0.08);
      next.flicker = Math.max(now, next.flicker) + 0.6 + Math.random() * 1.6;
    }
  }

  function tick() {
    scheduleUntil(ctx.currentTime + LOOKAHEAD_S);
  }

  function setMix(mix) {
    for (const name of SOUND_LAYERS) {
      levels[name] = clamp(Number(mix?.[name]) || 0, 0, 1);
      if (built) layers[name].gain.setTargetAtTime(levels[name] * BASE[name], ctx.currentTime, RAMP_S / 3);
    }
  }

  // Desde un clic (o cualquier gesto): crea el contexto si hace falta.
  function unlock() {
    if (!ctx) {
      const Context = typeof window !== "undefined" ? window.AudioContext || window.webkitAudioContext : null;
      if (!Context) return false;
      ctx = new Context();
    }
    build();
    if (ctx.state === "suspended" && typeof ctx.resume === "function") ctx.resume().catch(() => {});
    return true;
  }

  function start() {
    if (!unlock()) return false;
    setMix(levels);
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(MASTER, ctx.currentTime, 0.4);
    if (!timer) {
      tick();
      timer = window.setInterval(tick, TICK_MS);
    }
    return true;
  }

  function stop() {
    window.clearInterval(timer);
    timer = 0;
    if (!built) return;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
  }

  function close() {
    stop();
    if (ctx && !context && typeof ctx.close === "function") ctx.close().catch(() => {});
    ctx = null;
    built = false;
  }

  // Para pruebas (OfflineAudioContext): monta, fija el mix y programa ya.
  function prime(mix, seconds) {
    unlock();
    setMix(mix);
    master.gain.value = MASTER;
    for (const name of SOUND_LAYERS) layers[name].gain.value = levels[name] * BASE[name];
    scheduleUntil(seconds);
  }

  return { unlock, start, stop, close, setMix, prime, get state() { return ctx?.state || "closed"; } };
}
