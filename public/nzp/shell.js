import { unpackPrograms } from "./menu-cleanup.mjs";
import { nzpPlayerName } from "./player-name.mjs";

const upstream = "https://nzp.gay/";
const canvas = document.getElementById("canvas");
const loading = document.getElementById("loading");
const status = document.getElementById("status");
const progress = document.getElementById("progress");
const retry = document.getElementById("retry");
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
const setStatus = (text) => { status.textContent = text; loading.hidden = !text; };
const fail = (text) => { setStatus(text); progress.hidden = true; retry.hidden = false; };

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
  if (matchMedia("(max-width: 760px)").matches && window === window.top) {
    setStatus("NZ:P is available in the desktop library.");
    return;
  }
  const [response, name] = await Promise.all([fetch(`${upstream}nzp/progs.pk3`), discordName()]);
  if (!response.ok) throw new Error("NZ:P's program download is unavailable.");
  const programs = await unpackPrograms(await response.arrayBuffer());
  const room = new URLSearchParams(location.search).get("room") || "";
  const args = [...(name ? ["+set", "name", name] : []), ...(/^\/[0-9]{1,12}$/.test(room) ? ["+connect", room] : [])];
  window.Module = {
    canvas,
    arguments: args,
    files: { "default.fmf": `${upstream}default.fmf`, "nzp/game.pk3": `${upstream}nzp/game.pk3`, ...programs },
    locateFile: (path) => new URL(path, upstream).href,
    print: (text) => console.log(text),
    printErr: (text) => console.warn(text),
    setStatus,
    monitorRunDependencies(left) { if (left) setStatus("Downloading NZ:P game assets…"); },
    onAbort: () => fail("NZ:P could not start. Retry the download."),
    postRun: [() => {
      if (window.Module.sched === undefined) return fail("NZ:P could not initialize WebGL. Try another desktop browser.");
      setStatus("");
      canvas.hidden = false;
      canvas.focus();
    }]
  };
  const script = document.createElement("script");
  script.src = `${upstream}ftewebgl.js`;
  script.addEventListener("error", () => fail("NZ:P's engine could not download. Check your connection and retry."));
  document.head.appendChild(script);
}
boot().catch((error) => fail(error.message || "NZ:P could not load. Please retry."));
