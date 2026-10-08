import { nzpPlayerName } from "./player-name.mjs";
import { nzpStatsLine } from "./stats-line.mjs";
import { NZP_CUSTOM_MAPS } from "./custom-maps.mjs";

const upstream = "https://nzp.gay/";
const PROGS = ["menu.dat", "csprogs.dat", "qwprogs.dat"];
const $ = (id) => document.getElementById(id);
const canvas = $("canvas");
const loading = $("loading");
const stage = $("stage");
const percent = $("percent");
const meter = $("meter");
const detail = $("detail");
const tip = $("tip");
const retry = $("retry");
const marks = [...document.querySelectorAll(".tally .mark")];
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
retry.addEventListener("click", () => location.reload());
canvas.addEventListener("contextmenu", (event) => event.preventDefault());
// FTE listens on both document and canvas in capture phase. Let its document
// listener handle each key, then keep that same event from reaching the canvas
// listener a second time. Do not cancel defaults or filter repeat/key-up events.
for (const type of ["keydown", "keyup", "keypress"]) {
  document.addEventListener(type, (event) => {
    if (event.target === canvas) event.stopPropagation();
  }, true);
}

const TIPS = [
  "Co-op is in the main menu: Cooperative, then Create Game to host or Join Game to find one.",
  "Rebuild barricades between waves. Every board is worth points.",
  "Headshots earn bonus points.",
  "Keep moving. Corners are where runs end.",
  "Esc frees the mouse. The TV's Full Screen button gives the game the whole display."
];
let tipIndex = Math.floor(Math.random() * TIPS.length);
tip.textContent = TIPS[tipIndex];
const tipTimer = setInterval(() => {
  tip.classList.add("is-swapping");
  setTimeout(() => {
    tipIndex = (tipIndex + 1) % TIPS.length;
    tip.textContent = TIPS[tipIndex];
    tip.classList.remove("is-swapping");
  }, reduceMotion ? 0 : 400);
}, 5000);

let failed = false;
const megabytes = (bytes) => `${(bytes / 1048576).toFixed(1)} MB`;

// Tally marks fill in fifths; the slash (the fifth) only lands when the game is ready.
function drawMarks(count) {
  marks.forEach((mark, index) => {
    mark.classList.toggle("is-drawn", index < count);
    mark.classList.toggle("is-latest", index === count - 1 && count < marks.length);
  });
}

function setProgress(fraction) {
  loading.classList.toggle("is-indeterminate", fraction === null);
  if (fraction === null) return meter.removeAttribute("aria-valuenow");
  const value = Math.floor(fraction * 100);
  percent.textContent = `${value}%`;
  meter.style.setProperty("--progress", fraction);
  meter.setAttribute("aria-valuenow", value);
  drawMarks(Math.min(4, Math.floor(fraction * 5)));
}

function fail(text) {
  if (failed) return;
  failed = true;
  clearInterval(tipTimer);
  loading.hidden = false;
  loading.classList.remove("is-done", "is-indeterminate");
  loading.classList.add("is-failed");
  stage.textContent = text;
  retry.hidden = false;
}

function showMessage(text) {
  clearInterval(tipTimer);
  loading.classList.add("is-message");
  stage.textContent = text;
}

function finish() {
  if (failed) return;
  clearInterval(tipTimer);
  setProgress(1);
  drawMarks(marks.length);
  stage.textContent = "Here they come";
  detail.textContent = "";
  setTimeout(() => {
    loading.classList.add("is-done");
    canvas.focus();
    setTimeout(() => { loading.hidden = true; }, 600);
  }, reduceMotion ? 0 : 650);
}

// Downloads are counted together. Bytes arrive decompressed while
// Content-Length is the compressed size, so each file is capped at its total
// and the bar holds at 92% until the engine itself is up.
const downloads = new Map();
let frame = 0;
let downloading = true;
function render() {
  frame = 0;
  if (failed || !downloading) return;
  let loaded = 0, total = 0, known = true;
  for (const entry of downloads.values()) {
    if (!entry.total) known = false;
    loaded += entry.total ? Math.min(entry.loaded, entry.total) : entry.loaded;
    total += entry.total;
  }
  if (known && total) {
    setProgress(Math.min(loaded / total, 1) * 0.92);
    detail.textContent = `${megabytes(loaded)} of ${megabytes(total)}`;
  } else {
    setProgress(null);
    detail.textContent = `${megabytes(loaded)} downloaded`;
  }
}
function track(name) {
  const entry = { loaded: 0, total: 0 };
  downloads.set(name, entry);
  return (loaded, total) => {
    Object.assign(entry, { loaded, total });
    if (!frame) frame = requestAnimationFrame(render);
  };
}

// Streams a file into one buffer sized from Content-Length (with room for the
// decompressed overshoot), then trims it without a second full copy where the
// browser supports ArrayBuffer.prototype.transfer.
async function download(url, onProgress) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("NZ:P's game files are unavailable right now. Check your connection and retry.");
  const total = Number(response.headers.get("Content-Length")) || 0;
  if (!response.body) {
    const buffer = await response.arrayBuffer();
    onProgress(buffer.byteLength, buffer.byteLength);
    return buffer;
  }
  const reader = response.body.getReader();
  let data = new Uint8Array(total ? Math.ceil(total * 1.02) + (1 << 20) : 8 << 20);
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (loaded + value.length > data.length) {
      const grown = new Uint8Array(Math.max(loaded + value.length, Math.ceil(data.length * 1.5)));
      grown.set(data.subarray(0, loaded));
      data = grown;
    }
    data.set(value, loaded);
    loaded += value.length;
    onProgress(loaded, total);
  }
  onProgress(loaded, total && loaded);
  return data.buffer.transfer ? data.buffer.transfer(loaded) : data.buffer.slice(0, loaded);
}

// Same-origin Discord session (display name only, never tokens). Guests and
// slow or failed checks keep the name saved in NZ:P's own config.
async function discordName() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch("/api/comments/me", { credentials: "include", cache: "no-store", headers: { Accept: "application/json" }, signal: controller.signal });
    return response.ok ? nzpPlayerName((await response.json())?.user?.username) : "";
  } catch {
    return "";
  } finally {
    clearTimeout(timer);
  }
}

async function boot() {
  if (matchMedia("(max-width: 760px)").matches && window === window.top) return showMessage("NZ:P is available in the desktop library.");
  stage.textContent = "Downloading the horde";
  // The engine accepts a promise per file, so it starts while the big archive streams in.
  const game = download(`${upstream}nzp/game.pk3`, track("game"));
  // Mount complete packages before the native menu scans maps/*.bsp. Every
  // player receives the same assets, including when joining a co-op host.
  const maps = Object.fromEntries(NZP_CUSTOM_MAPS.map(({ archive, name }) => [
    `nzp/${archive}`, download(`./custom-maps/${archive}`, track(archive)).catch(() => {
      throw new Error(`${name} could not download. Check your connection and retry.`);
    })
  ]));
  // Menu, client and server programs are daivr.dev's own build (tools/nzp-qc).
  const programs = Object.fromEntries(PROGS.map((file) => [`nzp/${file}`, download(`./progs/${file}`, track(file))]));
  Promise.all([game, ...Object.values(maps), ...Object.values(programs)]).then(() => {
    downloading = false;
    if (!failed) {
      stage.textContent = "Waking the engine";
      setProgress(0.96);
      detail.textContent = "";
    }
  }).catch((error) => fail(error.message || "NZ:P's game files could not download. Retry."));
  const name = await discordName();
  // FTE writes its console straight to console.log (_emscriptenfte_print in
  // ftewebgl.js), never through Module.print, so the stats lines are read there.
  // This page is the game frame alone, so the tap touches nothing else.
  const log = console.log.bind(console);
  console.log = (...args) => {
    log(...args);
    const stats = typeof args[0] === "string" ? nzpStatsLine(args[0]) : null;
    if (stats && window.parent !== window) window.parent.postMessage({ type: "nzp:stats", ...stats }, location.origin);
  };
  window.Module = {
    canvas,
    arguments: name ? ["+set", "name", name] : [],
    files: { "default.fmf": `${upstream}default.fmf`, "nzp/game.pk3": game, ...maps, ...programs },
    locateFile: (path) => new URL(path, upstream).href,
    print: (text) => console.log(text),
    printErr: (text) => console.warn(text),
    // Engine status lines ("nzp/game.pk3 (…)", "Running...") stay off screen.
    setStatus: () => {},
    onAbort: () => fail("NZ:P could not start. Retry the download."),
    postRun: [() => {
      if (window.Module.sched === undefined) return fail("NZ:P could not initialize WebGL. Try another desktop browser.");
      canvas.hidden = false;
      finish();
    }]
  };
  const script = document.createElement("script");
  script.src = `${upstream}ftewebgl.js`;
  script.addEventListener("error", () => fail("NZ:P's engine could not download. Check your connection and retry."));
  document.head.appendChild(script);
}
boot().catch((error) => fail(error.message || "NZ:P could not load. Please retry."));

// Leave a co-op match properly before this page goes away. As the host this
// shuts the server down, which sends the other players back to the menu; as a
// guest it drops us from the match instead of leaving a frozen player behind
// until the server times us out. One engine frame runs straight away so the
// disconnect is sent before the cartridge removes the frame. The cartridge
// calls this directly (same origin) when it closes.
let left = false;
window.daivrNzpLeave = () => {
  const ftec = window.FTEC;
  if (left || !ftec?.cbufadd) return;
  left = true;
  // cbufadd queues the command, then throws because ftewebgl.js doesn't export _free.
  try { ftec.cbufadd("disconnect\n"); } catch {}
  try { ftec.step(performance.now()); } catch {}
};
addEventListener("pagehide", () => window.daivrNzpLeave());
