import { useCallback, useEffect, useRef } from "react";

// Live signal for the cabinet music player: a log-spaced spectrum drawn on the
// scrubber canvas, L/R meter levels, and a bass "energy" CSS variable that the
// record, play button and docked blob glow with.
const BARS = 44;
const MIN_HZ = 45;
const MAX_HZ = 15000;
const TILT_DB_PER_OCTAVE = 3.5;
const RANGE_DB = 34;
const REF_FLOOR_DB = -62;
const VU_RANGE_DB = 14;
const VU_REF_FLOOR_DB = -46;
const VU_SEGMENTS = 10;
const GRAPH_KEY = Symbol.for("daivr.musicGraph");

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
// Frame-rate independent approach toward a target.
const ease = (from, to, dt, tau) => from + (to - from) * (1 - Math.exp(-dt / tau));
const hash = (a, b) => {
  const value = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

// Real analysis only where routing the music through Web Audio is safe. A phone
// can suspend the context (lock screen, a call) and that would silence the song,
// so touch screens animate a synthetic signal instead.
function canAnalyse() {
  return typeof window !== "undefined"
    && Boolean(window.AudioContext || window.webkitAudioContext)
    && Boolean(window.matchMedia?.("(hover: hover) and (pointer: fine)").matches);
}

// The graph belongs to the <audio> element: an element can feed only one
// MediaElementSource ever, so it must outlive effect re-runs (Strict Mode, HMR).
function graphFor(audio) {
  if (audio[GRAPH_KEY]) return audio[GRAPH_KEY];
  const Context = window.AudioContext || window.webkitAudioContext;
  let ctx;
  try { ctx = new Context(); } catch { return null; }
  const graph = { ctx, ready: false, failed: false };
  graph.attach = () => {
    // Never route the element into a context that isn't running: it would go quiet.
    if (graph.ready || graph.failed || ctx.state !== "running") return;
    try {
      const source = ctx.createMediaElementSource(audio);
      source.connect(ctx.destination);
      // Analysers are side taps; the browser pulls them without an output.
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0.5;
      const splitter = ctx.createChannelSplitter(2);
      const left = ctx.createAnalyser();
      const right = ctx.createAnalyser();
      left.fftSize = 512;
      right.fftSize = 512;
      source.connect(analyser);
      source.connect(splitter);
      splitter.connect(left, 0);
      splitter.connect(right, 1);
      Object.assign(graph, {
        ready: true,
        analyser,
        left,
        right,
        freq: new Float32Array(analyser.frequencyBinCount),
        wave: new Float32Array(left.fftSize),
      });
    } catch {
      graph.failed = true;
    }
  };
  ctx.addEventListener?.("statechange", graph.attach);
  audio[GRAPH_KEY] = graph;
  return graph;
}

function bandsFor(sampleRate, binCount) {
  const binHz = sampleRate / (binCount * 2);
  const span = MAX_HZ / MIN_HZ;
  return Array.from({ length: BARS }, (_, bar) => {
    const from = MIN_HZ * span ** (bar / BARS);
    const to = MIN_HZ * span ** ((bar + 1) / BARS);
    const lo = Math.max(1, Math.floor(from / binHz));
    const hi = Math.max(lo, Math.min(binCount - 1, Math.ceil(to / binHz) - 1));
    // Music falls off with frequency; tilt it so the treble bars still move.
    return [lo, hi, Math.log2(Math.sqrt(from * to) / MIN_HZ) * TILT_DB_PER_OCTAVE];
  });
}

function rmsDb(analyser, wave) {
  analyser.getFloatTimeDomainData(wave);
  let sum = 0;
  for (let i = 0; i < wave.length; i += 1) sum += wave[i] * wave[i];
  return 20 * Math.log10(Math.sqrt(sum / wave.length) || 1e-9);
}

function createMusicSignal({ audio, root, canvas, vuRef }) {
  const levels = new Float32Array(BARS);
  const targets = new Float32Array(BARS);
  const peaks = new Float32Array(BARS);
  const holds = new Float32Array(BARS);
  const meters = [0, 1].map(() => ({ target: 0, level: 0, peak: 0, hold: 0 }));
  const written = new Map();
  let graph = audio[GRAPH_KEY] || null;
  let bands = null;
  let refDb = REF_FLOOR_DB;
  let vuRefDb = VU_REF_FLOOR_DB;
  let playing = false;
  let open = false;
  let still = false;
  let color = "#3fff97";
  let accent = "#3fff97";
  let frame = 0;
  let last = 0;
  let clock = 0;
  let energy = 0;
  let bassAverage = 0;
  let width = 0;
  let height = 0;
  let painter = null;
  let source = "idle";

  const live = () => Boolean(graph?.ready && graph.ctx.state === "running");

  function writeVar(element, name, value) {
    if (!element) return;
    const text = value.toFixed(2);
    if (written.get(name) === text) return;
    written.set(name, text);
    element.style.setProperty(name, text);
  }

  function measure() {
    if (!canvas) return;
    const nextWidth = canvas.clientWidth;
    const nextHeight = canvas.clientHeight;
    if (!nextWidth || !nextHeight) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(nextWidth * dpr);
    canvas.height = Math.round(nextHeight * dpr);
    width = nextWidth;
    height = nextHeight;
    painter = canvas.getContext("2d");
    painter?.setTransform(dpr, 0, 0, dpr, 0, 0);
    accent = getComputedStyle(root).getPropertyValue("--music-accent").trim() || accent;
  }

  function readSpectrum(dt) {
    const { analyser, freq } = graph;
    bands ??= bandsFor(graph.ctx.sampleRate, analyser.frequencyBinCount);
    analyser.getFloatFrequencyData(freq);
    let loudest = -Infinity;
    for (let bar = 0; bar < BARS; bar += 1) {
      const [lo, hi, tilt] = bands[bar];
      let db = -Infinity;
      for (let bin = lo; bin <= hi; bin += 1) if (freq[bin] > db) db = freq[bin];
      targets[bar] = db + tilt;
      if (targets[bar] > loudest) loudest = targets[bar];
    }
    // Running peak keeps the bars readable at any volume or mastering level.
    refDb = loudest > refDb ? loudest : Math.max(REF_FLOOR_DB, refDb - dt * 5);
    for (let bar = 0; bar < BARS; bar += 1) targets[bar] = clamp((targets[bar] - (refDb - RANGE_DB)) / RANGE_DB) ** 2;

    const dbs = [rmsDb(graph.left, graph.wave), rmsDb(graph.right, graph.wave)];
    // A mono file reaches the splitter as L + silence; mirror it.
    if (dbs[1] < -120 && dbs[0] > -120) dbs[1] = dbs[0];
    const loudestChannel = Math.max(dbs[0], dbs[1]);
    vuRefDb = loudestChannel > vuRefDb ? loudestChannel : Math.max(VU_REF_FLOOR_DB, vuRefDb - dt * 6);
    meters.forEach((meter, channel) => {
      meter.target = clamp((dbs[channel] - (vuRefDb - VU_RANGE_DB)) / (VU_RANGE_DB + 1.5));
    });
  }

  function synthesise(time) {
    const kick = Math.exp(-(time % 0.5) / 0.09);
    const hat = Math.exp(-((time + 0.25) % 0.25) / 0.04);
    const tick = Math.floor(time * 14);
    let sum = 0;
    for (let bar = 0; bar < BARS; bar += 1) {
      const x = bar / (BARS - 1);
      const sway = 0.5 + 0.5 * Math.sin(time * (1.3 + x * 2.4) + bar * 1.7) * Math.sin(time * 0.9 + bar * 0.37);
      targets[bar] = clamp(0.14 + sway * 0.48 * (1 - x * 0.5) + kick * 0.5 * (1 - x) ** 3 + hat * 0.3 * x ** 2.5 + hash(bar, tick) * 0.1);
      sum += targets[bar];
    }
    const mean = sum / BARS;
    meters[0].target = clamp(mean * 1.3 + kick * 0.25 + Math.sin(time * 3.1) * 0.05);
    meters[1].target = clamp(mean * 1.3 + kick * 0.25 + Math.sin(time * 2.7 + 1) * 0.05);
  }

  function step(dt) {
    clock += dt;
    if (playing && !still) {
      if (live()) {
        source = "analyser";
        readSpectrum(dt);
      } else {
        source = "synthetic";
        synthesise(clock);
      }
    } else {
      source = "idle";
      targets.fill(0);
      meters.forEach((meter) => { meter.target = 0; });
    }

    let bass = 0;
    for (let bar = 0; bar < 7; bar += 1) bass += targets[bar] / 7;
    // Kicks read as the bass jumping over its own recent average.
    bassAverage = ease(bassAverage, bass, dt, 0.9);
    const pulse = playing && !still ? clamp(0.15 + (bass - bassAverage) / 0.14) * clamp(bass * 3) : 0;
    energy = ease(energy, pulse, dt, pulse > energy ? 0.035 : 0.2);

    for (let bar = 0; bar < BARS; bar += 1) {
      levels[bar] = ease(levels[bar], targets[bar], dt, targets[bar] > levels[bar] ? 0.03 : 0.15);
      if (levels[bar] >= peaks[bar]) {
        peaks[bar] = levels[bar];
        holds[bar] = 0.3;
      } else if (holds[bar] > 0) holds[bar] -= dt;
      else peaks[bar] = Math.max(levels[bar], peaks[bar] - dt * 0.7);
    }

    meters.forEach((meter) => {
      meter.level = ease(meter.level, meter.target, dt, meter.target > meter.level ? 0.03 : 0.2);
      if (meter.level >= meter.peak) {
        meter.peak = meter.level;
        meter.hold = 0.8;
      } else if (meter.hold > 0) meter.hold -= dt;
      else meter.peak = Math.max(meter.level, meter.peak - dt * 0.6);
    });
  }

  function draw() {
    if (!width) measure();
    if (!painter) return;
    painter.clearRect(0, 0, width, height);
    const gap = 2;
    const barWidth = (width - gap * (BARS - 1)) / BARS;
    const usable = height - 5;
    const duration = audio.duration;
    const split = Number.isFinite(duration) && duration > 0 ? clamp(audio.currentTime / duration) * width : 0;
    const lit = painter.createLinearGradient(0, height, 0, 0);
    lit.addColorStop(0, accent);
    lit.addColorStop(1, color);
    for (let bar = 0; bar < BARS; bar += 1) {
      const x = bar * (barWidth + gap);
      const barHeight = Math.max(2, levels[bar] * usable);
      // The spectrum doubles as the progress readout: played bars are lit.
      const played = x + barWidth / 2 <= split;
      painter.globalAlpha = played ? 1 : 0.24;
      painter.fillStyle = played ? lit : accent;
      painter.fillRect(x, height - barHeight, barWidth, barHeight);
      if (peaks[bar] > 0.04) {
        painter.globalAlpha = played ? 0.95 : 0.38;
        painter.fillStyle = color;
        painter.fillRect(x, height - Math.max(2, peaks[bar] * usable) - 3, barWidth, 2);
      }
    }
    painter.globalAlpha = 1;
  }

  function render() {
    writeVar(root, "--music-energy", energy);
    if (!open) return;
    const quantise = (value) => Math.round(value * VU_SEGMENTS) / VU_SEGMENTS;
    const vu = vuRef.current;
    writeVar(vu,"--vu-l", quantise(meters[0].level));
    writeVar(vu, "--vu-r", quantise(meters[1].level));
    writeVar(vu, "--vu-lp", quantise(meters[0].peak));
    writeVar(vu, "--vu-rp", quantise(meters[1].peak));
    draw();
  }

  const settled = () => energy < 0.004
    && meters.every((meter) => meter.peak < 0.004)
    && peaks.every((peak) => peak < 0.004);

  function tick(now) {
    frame = 0;
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 1 / 60;
    last = now;
    step(dt);
    render();
    if (!still && (playing || !settled())) frame = requestAnimationFrame(tick);
    else last = 0;
  }

  function wake() {
    if (frame || still || (!playing && settled())) return;
    last = 0;
    frame = requestAnimationFrame(tick);
  }

  // Reduced motion: one frozen frame, repainted only as the progress moves.
  function freeze() {
    cancelAnimationFrame(frame);
    frame = 0;
    if (playing) synthesise(1.3);
    else targets.fill(0);
    for (let bar = 0; bar < BARS; bar += 1) levels[bar] = targets[bar] * 0.8;
    peaks.fill(0);
    meters.forEach((meter) => { meter.level = 0; meter.peak = 0; });
    energy = playing ? 0.3 : 0;
    render();
  }

  function sync(next) {
    const opening = next.open && !open;
    ({ playing, open, still } = next);
    color = next.color || "#3fff97";
    if (opening) measure();
    if (still) return freeze();
    wake();
    if (open && !frame) render();
  }

  function connect() {
    if (!canAnalyse()) return;
    graph = graphFor(audio);
    if (!graph) return;
    if (graph.ctx.state !== "running") graph.ctx.resume?.().then(graph.attach, () => {});
    graph.attach();
  }

  function seek(clientX) {
    const duration = audio.duration;
    if (!canvas || !Number.isFinite(duration) || !duration) return;
    const rect = canvas.getBoundingClientRect();
    audio.currentTime = clamp((clientX - rect.left) / rect.width) * duration;
  }

  // Paused or frozen, the canvas still follows seeks and track changes.
  const repaint = () => { if (open && !frame) draw(); };
  const resize = () => { if (open) { measure(); repaint(); } };
  const events = ["timeupdate", "seeked", "durationchange", "emptied"];
  events.forEach((name) => audio.addEventListener(name, repaint));
  window.addEventListener("resize", resize);

  function destroy() {
    cancelAnimationFrame(frame);
    frame = 0;
    events.forEach((name) => audio.removeEventListener(name, repaint));
    window.removeEventListener("resize", resize);
    // A real unmount takes the element out of the page; then the graph can go.
    if (!audio.isConnected && audio[GRAPH_KEY]) {
      audio[GRAPH_KEY].ctx.close?.().catch(() => {});
      delete audio[GRAPH_KEY];
    }
  }

  const summary = () => ({
    source,
    playing,
    open,
    still,
    running: Boolean(frame),
    context: graph?.ctx.state || "none",
    analysing: live(),
    energy: Number(energy.toFixed(3)),
    refDb: Number(refDb.toFixed(1)),
    meters: meters.map((meter) => [Number(meter.level.toFixed(2)), Number(meter.peak.toFixed(2))]),
    levels: Array.from(levels, (level) => Number(level.toFixed(2))),
    canvas: [width, height],
  });

  return {
    sync,
    connect,
    seek,
    destroy,
    debug: {
      step(ms = 16) {
        step(ms / 1000);
        render();
        return summary();
      },
      summary,
      measure,
      draw,
      connect,
    },
  };
}

export function useMusicSignal({ audioRef, rootRef, playing, open, reducedMotion, color }) {
  const canvasRef = useRef(null);
  const vuRef = useRef(null);
  const engineRef = useRef(null);
  const latestRef = useRef(null);
  const scrubbingRef = useRef(false);

  useEffect(() => {
    const engine = createMusicSignal({ audio: audioRef.current, root: rootRef.current, canvas: canvasRef.current, vuRef });
    engineRef.current = engine;
    if (latestRef.current) engine.sync(latestRef.current);
    if (import.meta.env.DEV) window.__daivrMusic = engine.debug;
    return () => {
      engine.destroy();
      engineRef.current = null;
      if (import.meta.env.DEV && window.__daivrMusic === engine.debug) delete window.__daivrMusic;
    };
  }, [audioRef, rootRef]);

  useEffect(() => {
    latestRef.current = { playing, open, still: Boolean(reducedMotion), color };
    engineRef.current?.sync(latestRef.current);
  }, [playing, open, reducedMotion, color]);

  // Call from inside user gestures: that's when browsers let audio contexts start.
  const connect = useCallback(() => engineRef.current?.connect(), []);

  const scrubProps = {
    onPointerDown: (event) => {
      if (event.button !== 0) return;
      scrubbingRef.current = true;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      engineRef.current?.seek(event.clientX);
    },
    onPointerMove: (event) => { if (scrubbingRef.current) engineRef.current?.seek(event.clientX); },
    onPointerUp: () => { scrubbingRef.current = false; },
    onPointerCancel: () => { scrubbingRef.current = false; },
  };

  return { canvasRef, vuRef, connect, scrubProps };
}
