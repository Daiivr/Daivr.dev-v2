import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { handleBuddyRequest } from "./server/buddy.mjs";
import { handleCommentsRequest } from "./server/comments.mjs";
import { handleDiscordStreakRequest } from "./server/discord-streak.mjs";
import { handleMadraceRequest } from "./server/madrace.mjs";
import { loadLocalEnv } from "./server/env.mjs";
import { handleSteamPlaytimeRequest } from "./server/steam-playtime.mjs";
import { handleTradeDexVirusTotalRequest } from "./server/virustotal.mjs";
import { handleVisitsRequest } from "./server/visits.mjs";

loadLocalEnv();

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "daivr-local-api",
      configureServer(server) {
        server.middlewares.use("/api/tradedex", (request, response, next) => {
          if (request.url?.startsWith("/info") || request.url?.startsWith("/scan")) {
            request.url = `/api/tradedex${request.url}`;
            handleTradeDexVirusTotalRequest(request, response);
            return;
          }

          next();
        });

        server.middlewares.use("/api/discord-streak", (request, response) => {
          handleDiscordStreakRequest(request, response);
        });

        server.middlewares.use("/api/steam-playtime", (request, response) => {
          handleSteamPlaytimeRequest(request, response);
        });

        server.middlewares.use("/api/madrace", (request, response) => {
          request.url = `/api/madrace${request.url}`;
          handleMadraceRequest(request, response);
        });

        server.middlewares.use("/api/drive-mad", (request, response) => {
          request.url = `/api/drive-mad${request.url}`;
          handleMadraceRequest(request, response);
        });

        server.middlewares.use("/api/comments", (request, response) => {
          handleCommentsRequest(request, response);
        });

        server.middlewares.use("/api/visits", (request, response) => {
          handleVisitsRequest(request, response);
        });

        server.middlewares.use("/api/buddy", (request, response) => {
          handleBuddyRequest(request, response);
        });
      }
    }
  ],
  server: {
    host: "0.0.0.0",
    port: 5173,
    watch: {
      ignored: ["**/data/**"]
    }
  }
});
