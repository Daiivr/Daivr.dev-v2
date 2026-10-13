// PokéSurvivor (cartucho 06): compila public/pokesurvivor desde el juego
// original, https://github.com/JPTER78/pokesurvivor (codigo MIT; sprites de
// SpriteCollab, CC BY-NC 4.0: LICENSE y CREDITS.md viajan con el juego).
//
//   corepack pnpm build:pokesurvivor            descarga el commit fijado
//   corepack pnpm build:pokesurvivor --src DIR  usa una copia local de ese commit
//
// 1. Toma el arbol de UPSTREAM_COMMIT (se guarda en tools/pokesurvivor/.cache).
// 2. Aplica daivr.patch: el original guarda en Firebase; el parche cambia
//    db.js, social.js, net.js y ranking.js para usar la sesion de Discord y la
//    API de la web (server/pokesurvivor.mjs), y avisa a la tele de la web
//    (partidas, reto diario, login).
// 3. Une los scripts de dev.html en js/app.min.js (como su tools/build.js, con
//    el esbuild de Vite en vez de terser) y genera index.html sin lo de SEO.
// 4. Copia solo lo que usa el juego: css, fuentes, iconos y los sprites.
//
// Para cambiar el parche: extrae el commit en un repo git aparte, aplica
// daivr.patch, edita, `git diff > tools/pokesurvivor/daivr.patch` (con
// `git add -N` para los archivos nuevos) y vuelve a compilar. Los archivos del
// original usan CRLF: el parche tambien.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";

export const UPSTREAM_REPO = "JPTER78/pokesurvivor";
export const UPSTREAM_COMMIT = "89ee17ad60f0c9ccb516fc026b93d3c5e3f9f1f0";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const OUT = join(ROOT, "public", "pokesurvivor");
const CACHE = join(HERE, ".cache");
const PATCH = join(HERE, "daivr.patch");
// Lo que necesita el juego (el resto del repositorio son paginas de SEO,
// Firebase, Cloudflare, videos y herramientas).
const SOURCES = ["dev.html", "js", "css", "assets/fonts", "assets/icons", "assets/pokemon", "favicon.ico", "LICENSE", "CREDITS.md"];
const OUTPUTS = ["css", "assets/fonts", "assets/icons", "assets/pokemon", "favicon.ico", "LICENSE", "CREDITS.md"];

// Lector minimo de tar (ustar + cabeceras pax de GitHub), para no depender del
// tar del sistema: en Windows el de Git toma "C:" por un servidor remoto.
export function extractTar(buffer, target) {
  let offset = 0, paxPath = null;
  const text = (start, length) => buffer.toString("utf8", start, start + length).replace(/\0.*$/s, "");
  while (offset + 512 <= buffer.length) {
    const header = buffer.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) break;
    const size = parseInt(text(offset + 124, 12).trim() || "0", 8);
    const type = String.fromCharCode(header[156] || 48);
    const prefix = text(offset + 345, 155);
    let name = paxPath || (prefix ? `${prefix}/${text(offset, 100)}` : text(offset, 100));
    const body = buffer.subarray(offset + 512, offset + 512 + size);
    offset += 512 + Math.ceil(size / 512) * 512;
    if (type === "x") {
      const path = /(?:^|\n)\d+ path=([^\n]*)\n/.exec(body.toString("utf8"));
      paxPath = path ? path[1] : null;
      continue;
    }
    paxPath = null;
    if (type === "g") continue;
    // GitHub mete todo en <repo>-<commit>/: se quita esa carpeta.
    name = name.split("/").slice(1).join("/");
    if (!name || name.split("/").includes("..")) continue;
    const destination = join(target, name);
    if (type === "5") mkdirSync(destination, { recursive: true });
    else if (type === "0" || type === "\0") {
      mkdirSync(dirname(destination), { recursive: true });
      writeFileSync(destination, body);
    }
  }
}

async function upstreamTree() {
  const work = mkdtempSync(join(tmpdir(), "pokesurvivor-"));
  const srcArg = process.argv.indexOf("--src");
  if (srcArg > 0) {
    const source = resolve(process.argv[srcArg + 1]);
    for (const path of SOURCES) cpSync(join(source, path), join(work, path), { recursive: true });
    return work;
  }
  mkdirSync(CACHE, { recursive: true });
  const archive = join(CACHE, `${UPSTREAM_COMMIT}.tar.gz`);
  if (!existsSync(archive)) {
    console.log(`[pokesurvivor] downloading ${UPSTREAM_REPO}@${UPSTREAM_COMMIT.slice(0, 7)}...`);
    const response = await fetch(`https://codeload.github.com/${UPSTREAM_REPO}/tar.gz/${UPSTREAM_COMMIT}`);
    if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
    writeFileSync(archive, Buffer.from(await response.arrayBuffer()));
  }
  const all = mkdtempSync(join(tmpdir(), "pokesurvivor-src-"));
  extractTar(gunzipSync(readFileSync(archive)), all);
  for (const path of SOURCES) cpSync(join(all, path), join(work, path), { recursive: true });
  rmSync(all, { recursive: true, force: true });
  return work;
}

async function bundle(work) {
  const BEGIN = "<!-- scripts:begin -->", END = "<!-- scripts:end -->";
  const dev = readFileSync(join(work, "dev.html"), "utf8");
  const i = dev.indexOf(BEGIN), j = dev.indexOf(END);
  if (i < 0 || j < 0) throw new Error("dev.html has no scripts:begin / scripts:end markers");
  const files = [...dev.slice(i, j).matchAll(/<script[^>]*src="(js\/[^"]+\.js)"/g)].map((match) => match[1]);
  // Cada archivo separado por ';' por si alguno no acaba en punto y coma (como su build.js).
  const joined = files.map((file) => `/* ${file} */\n${readFileSync(join(work, file), "utf8")}`).join("\n;\n");
  const { transformWithEsbuild } = await import("vite");
  const { code } = await transformWithEsbuild(joined, "app.js", { loader: "js", minify: true, target: "es2020", legalComments: "none", charset: "utf8" });
  const hash = createHash("sha1").update(code).digest("hex").slice(0, 10);
  let html = dev.slice(0, i) + `<script defer src="js/app.min.js?v=${hash}"></script>` + dev.slice(j + END.length);
  html = html.replace(/<!-- seo:begin -->[\s\S]*?<!-- seo:end -->\r?\n?/g, "");
  html = html.replace(/<!-- dev\.html:[^>]*-->/, "<!-- GENERADO por tools/pokesurvivor/build.mjs (daivr.dev). No editar a mano. -->");
  return { html, code, files: files.length };
}

// Primer fotograma de Idle de cada Pokemon ({dex: [w, h]}; [w, h, 0] si no
// tiene shiny; [w, h, ws, hs] si el shiny tiene otra medida). Con esto la web
// pinta los equipos del ranking de grupo de la tele sin cargar el juego
// (src/components/PokesurvivorCoopRanking.jsx). Sale de js/data/sprites-meta.js,
// que es una linea JSON por Pokemon.
export function idleFrames(source) {
  const frames = {};
  for (const line of source.split(/\r?\n/)) {
    const match = /^\s*(\d+):\s*(\{.*\}),?\s*$/.exec(line);
    if (!match) continue;
    const meta = JSON.parse(match[2]);
    const idle = meta.a?.Idle, shiny = meta.sa?.Idle;
    if (!idle) continue;
    frames[match[1]] = !meta.sh ? [idle.w, idle.h, 0] : shiny ? [idle.w, idle.h, shiny.w, shiny.h] : [idle.w, idle.h];
  }
  return frames;
}

async function main() {
  const work = await upstreamTree();
  try {
    execFileSync("git", ["apply", "--whitespace=nowarn", PATCH], { cwd: work, stdio: "inherit" });
    const { html, code, files } = await bundle(work);
    rmSync(OUT, { recursive: true, force: true });
    mkdirSync(join(OUT, "js"), { recursive: true });
    writeFileSync(join(OUT, "index.html"), html);
    writeFileSync(join(OUT, "js", "app.min.js"), code);
    cpSync(join(HERE, "discord-done.html"), join(OUT, "discord-done.html"));
    writeFileSync(join(OUT, "idle-frames.json"), JSON.stringify(idleFrames(readFileSync(join(work, "js", "data", "sprites-meta.js"), "utf8"))));
    for (const path of OUTPUTS) cpSync(join(work, path), join(OUT, path), { recursive: true });
    console.log(`[pokesurvivor] ${files} scripts -> js/app.min.js (${Math.round(code.length / 1024)} KB), public/pokesurvivor ready`);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error); process.exit(1); });
}
