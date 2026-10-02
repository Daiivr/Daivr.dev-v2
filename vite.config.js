import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { defineConfig } from "vite";
import { startDiscordStreakPolling } from "./server/discord-streak.mjs";
import { loadLocalEnv } from "./server/env.mjs";
import { handleApiRequest } from "./server/routes.mjs";
import { BUILD_META, BUILD_STAMP_FILE, buildIdFromFiles, DEV_BUILD, encodeRelease, RELEASE_META, releaseFrom } from "./shared/build-stamp.mjs";

loadLocalEnv();

// Huella del build (shared/build-stamp.mjs): el id sale de los nombres con hash
// de lo que genera Vite y va al index.html (<meta>, lo que tiene cada pestaña)
// y a dist/version.json (lo que sirve /api/version). Si no coinciden, la
// pestaña es de un deploy anterior y avisa de que hay version nueva.
function buildStamp() {
  let buildId = DEV_BUILD;
  let outDir = "dist";

  // La ultima nota de parche, leida de nuevo si cambio (en desarrollo se edita).
  async function latestRelease() {
    const file = fileURLToPath(new URL("src/data/patchNotes.js", import.meta.url));
    const { mtimeMs } = await stat(file);
    const { patchNotes } = await import(`${pathToFileURL(file).href}?v=${Math.trunc(mtimeMs)}`);
    return releaseFrom(patchNotes);
  }

  return {
    name: "daivr-build-stamp",
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    transformIndexHtml: {
      // "post": en el build ya existe la lista final de archivos con hash.
      order: "post",
      async handler(html, context) {
        buildId = context.bundle ? buildIdFromFiles(Object.keys(context.bundle)) : DEV_BUILD;
        const release = await latestRelease();
        return [
          { tag: "meta", attrs: { name: BUILD_META, content: buildId }, injectTo: "head" },
          { tag: "meta", attrs: { name: RELEASE_META, content: encodeRelease(release) }, injectTo: "head" }
        ];
      }
    },
    async writeBundle() {
      const release = await latestRelease();
      await writeFile(join(outDir, BUILD_STAMP_FILE), `${JSON.stringify({ build: buildId, ...release, builtAt: new Date().toISOString() }, null, 2)}\n`);
    }
  };
}

export default defineConfig({
  assetsInclude: ["**/*.glb"],
  plugins: [
    react(),
    tailwindcss(),
    buildStamp(),
    {
      name: "daivr-local-api",
      configureServer(server) {
        startDiscordStreakPolling();
        // Misma tabla que server.mjs (server/routes.mjs). Sin ruta de montaje,
        // asi que los handlers reciben la URL completa igual que en produccion.
        server.middlewares.use(async (request, response, next) => {
          try {
            if (!(await handleApiRequest(request, response))) next();
          } catch (error) {
            console.error(`[dev api] ${request.method} ${request.url}`, error?.stack || error);
            if (response.headersSent) {
              response.end();
              return;
            }
            response.writeHead(500, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
            response.end(JSON.stringify({ error: "Server route failed." }));
          }
        });
      }
    }
  ],
  build: {
    manifest: true,
    // Los tres chunks que pasan de 500 kB son motores 3D detras de imports
    // perezosos: react-three-fiber+three (avatar VRM del splash) y
    // ProjectLanyard (rapier, que en su build -compat lleva el WASM en base64 y
    // no adelgaza sin cambiar de motor de fisica). El arranque real es solo
    // index (~250 kB gzip) y no lleva nada de 3D.
    //
    // Probado y descartado: manualChunks por paquete. Trocear a mano mete
    // three/drei en los modulepreload del index.html (arranque de 812 kB a
    // 1888 kB) o funde three+drei+rapier en un chunk de 3.2 MB que tambien
    // tendria que bajar el avatar. El troceo automatico de Rollup es mejor.
    chunkSizeWarningLimit: 2500
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    watch: {
      // Only the runtime score/state store at the repo root; src/data must stay watched.
      ignored: [`${fileURLToPath(new URL("data", import.meta.url)).replace(/\\/g, "/")}/**`]
    }
  }
});
