import { Activity, BarChart3, Gamepad2, Globe, Headphones, Maximize2, Minimize2, Monitor, Radio, Smartphone, Users, WifiOff, X, Zap } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { discord, profile } from "../data/site";
import {
  discordStatusMeta,
  getAvatarDecorationUrl,
  getDiscordAvatarUrl,
  getDiscordDisplayName,
  getEmojiUrl,
  useLanyardPresence
} from "../hooks/useLanyardPresence";
import { cn } from "../lib/cn";

// Un Set vacio y estable: sirve de estado inicial a los dos marcos que se
// pintan, sin crear uno nuevo en cada render.
const EMPTY_LAYERS = new Set();

const BADGE_BASE = "https://raw.githubusercontent.com/merlinfuchs/discord-badges/main/SVG";
const ACTIVITY_EXIT_DURATION = 220;
const IDLE_TREX_PATH = "M24 0h17v2H24zM22 2h4v3h-4zM28 2h16v3H28zM22 5h22v7H22zM22 12h11v2H22zM22 14h17v2H22zM0 16h2v3H0zM20 16h11v3H20zM0 19h2v2H0zM16 19h15v2H16zM0 21h4v2H0zM13 21h22v2H13zM0 23h6v2H0zM11 23h20v2H11zM33 23h2v2H33zM0 25h31v4H0zM2 29h29v2H2zM4 31h24v2H4zM9 33h17v3H9zM9 36h15v2H9zM11 38h6v3h-6zM20 38h4v3h-4zM11 41h4v2h-4zM22 41h2v4h-2zM11 43h2v2h-2zM11 45h5v2h-5zM22 45h5v2h-5z";
// Copyright (c) 2014 The Chromium Authors. Sprite extracted from the user-supplied BSD-licensed runner.
const IDLE_TREX_SPRITE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQgAAAAvAgMAAABiRrxWAAAADFBMVEX///9TU1P39/f///+TS9URAAAAAXRSTlMAQObYZgAAAPpJREFUeF7d0jFKRkEMhdGLMM307itNLALyVmHvJuzTDMjdn72E95PGFEZSmeoU4YMMgxhskvQec8YSVFX1NhGcS5ywtbmC8khcZeKq+ZWJ4F8Sr2+ZCErjkJFEfcjAc/6/BMlfcz6xHdhRthYzIZhIHMcTVY1scUUiAphK8CMSPUbieTBhvD9Lj0vyV4wklEGzHpciKGOJoBp7XDcFs4kWxxM7Ey3iZ8JbzASAvMS7XLOJHTTvEkEZSeQl7DMuwVyCasqK5+XzQRYLUJlMbPXjFcn3m8eKBSjWZMJwvGIOvViAzCbUj1VEDoqFOEQGE3SyInJQLOQMJL4B7enP1UbLXJQAAAAASUVORK5CYII=";

const DISCORD_FLAG_BADGES = [
  { flag: 1 << 0, icon: `${BADGE_BASE}/discord_employee.svg`, label: "Discord Staff" },
  { flag: 1 << 1, icon: `${BADGE_BASE}/partnered_server_owner.svg`, label: "Partnered Server Owner" },
  { flag: 1 << 2, icon: `${BADGE_BASE}/hypesquad_events.svg`, label: "HypeSquad Events" },
  { flag: 1 << 3, icon: `${BADGE_BASE}/bug_hunter_level_1.svg`, label: "Bug Hunter" },
  { flag: 1 << 6, icon: `${BADGE_BASE}/hypesquad_bravery.svg`, label: "HypeSquad Bravery" },
  { flag: 1 << 7, icon: `${BADGE_BASE}/hypesquad_brilliance.svg`, label: "HypeSquad Brilliance" },
  { flag: 1 << 8, icon: `${BADGE_BASE}/hypesquad_balance.svg`, label: "HypeSquad Balance" },
  { flag: 1 << 9, icon: `${BADGE_BASE}/early_supporter.svg`, label: "Early Supporter" },
  { flag: 1 << 14, icon: `${BADGE_BASE}/bug_hunter_level_2.svg`, label: "Bug Hunter Level 2" },
  { flag: 1 << 17, icon: `${BADGE_BASE}/early_verified_bot_developer.svg`, label: "Early Verified Bot Developer" },
  { flag: 1 << 18, icon: `${BADGE_BASE}/discord_certified_moderator.svg`, label: "Moderator Programs Alumni" },
  { flag: 1 << 22, icon: `${BADGE_BASE}/active_developer.svg`, label: "Active Developer" }
];

const CUSTOM_BADGES = [
  {
    icon: "/discord-badges/discord-badge-nitro-ruby-card.png",
    label: "Nitro Ruby",
    sublabel: "Subscriber since 9/6/20"
  },
  {
    icon: "/discord-badges/discord-badge-boost.svg",
    label: "Server Boosting",
    sublabel: "Since Sep 12, 2020"
  },
  {
    icon: "/discord-badges/discord-badge-originally-known-as.png",
    label: "Originally Known As",
    sublabel: "Dai #4505"
  }
];

function getCustomStatus(activities = []) {
  return activities.find((item) => item.type === 4) || null;
}

function getUserBadges(user) {
  if (!user) return CUSTOM_BADGES;

  const flags = user.public_flags || 0;
  const flagBadges = DISCORD_FLAG_BADGES.filter((badge) => (flags & badge.flag) !== 0);
  return [...flagBadges, ...CUSTOM_BADGES];
}

function getActivityAssetUrl(activity, image, size = 256) {
  if (!image) return null;
  if (image.startsWith("mp:")) return `https://media.discordapp.net/${image.slice(3)}`;
  if (image.startsWith("external/")) return `https://media.discordapp.net/${image}`;
  if (image.startsWith("spotify:")) return `https://i.scdn.co/image/${image.slice("spotify:".length)}`;
  if (image.startsWith("http")) return image;
  if (!activity?.application_id) return null;
  return `https://cdn.discordapp.com/app-assets/${activity.application_id}/${image}.png?size=${size}`;
}

function getActivityImage(activity) {
  const image = activity?.assets?.large_image || activity?.assets?.small_image;
  return getActivityAssetUrl(activity, image, 256);
}

function getActivityAppIcon(activity) {
  const largeImage = activity?.assets?.large_image;
  const smallImage = activity?.assets?.small_image;
  if (!largeImage || !smallImage || smallImage === largeImage) return null;
  return getActivityAssetUrl(activity, smallImage, 96);
}

function getActivityTypeLabel(type) {
  const labels = {
    0: "playing",
    1: "streaming",
    2: "listening",
    3: "watching",
    5: "competing"
  };

  return labels[type] || "activity";
}

function getVisibleActivities(presence) {
  const activities = [];

  if (presence?.listening_to_spotify && presence.spotify) {
    activities.push({
      activityKey: "spotify",
      detail: presence.spotify.artist,
      icon: "spotify",
      image: presence.spotify.album_art_url,
      isSpotify: true,
      meta: "spotify",
      name: presence.spotify.song,
      state: presence.spotify.album,
      timestamps: presence.spotify.timestamps,
      type: 2,
      typeLabel: "listening"
    });
  }

  for (const activity of presence?.activities || []) {
    if (activity.type === 4 || activity.name === "Spotify") continue;

    activities.push({
      activityKey: activity.id ? `discord:${activity.id}` : `discord:${activity.type}:${activity.name}`,
      appIcon: getActivityAppIcon(activity),
      appIconAlt: activity.assets?.small_text || `${activity.name} icon`,
      createdAt: activity.created_at,
      detail: activity.details || "",
      icon: activity.type === 2 ? "audio" : "activity",
      image: getActivityImage(activity),
      meta: activity.assets?.large_text || activity.assets?.small_text || getActivityTypeLabel(activity.type),
      name: activity.name,
      party: activity.party,
      state: activity.state || "",
      timestamps: activity.timestamps,
      type: activity.type,
      typeLabel: getActivityTypeLabel(activity.type)
    });
  }

  return activities.slice(0, 4);
}

function useMobilePresenceLayout() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 760px)");
    const updateViewport = (event) => setIsMobile(event.matches);

    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", updateViewport);
    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  return isMobile;
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = (event) => setPrefersReducedMotion(event.matches);

    setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  return prefersReducedMotion;
}

function getMobileActivities(activities) {
  const priorityActivity =
    activities.find((activity) => activity.type === 0) ||
    activities.find((activity) => activity.isSpotify) ||
    activities[0];

  return priorityActivity ? [priorityActivity] : [];
}

function useAnimatedActivities(nextActivities, prefersReducedMotion) {
  const [renderedActivities, setRenderedActivities] = useState(() =>
    nextActivities.map((activity) => ({ ...activity, motionState: "visible" }))
  );

  useEffect(() => {
    const nextByKey = new Map(nextActivities.map((activity) => [activity.activityKey, activity]));

    if (prefersReducedMotion) {
      setRenderedActivities(nextActivities.map((activity) => ({ ...activity, motionState: "visible" })));
      return undefined;
    }

    setRenderedActivities((current) => {
      const currentKeys = new Set(current.map((activity) => activity.activityKey));
      const merged = current.map((activity) => {
        const nextActivity = nextByKey.get(activity.activityKey);

        if (!nextActivity) return { ...activity, motionState: "exiting" };
        return {
          ...nextActivity,
          motionState: activity.motionState === "exiting" ? "entering" : activity.motionState
        };
      });

      nextActivities.forEach((activity, index) => {
        if (currentKeys.has(activity.activityKey)) return;
        merged.splice(Math.min(index, merged.length), 0, { ...activity, motionState: "entering" });
      });

      return merged;
    });

    let settleFrame;
    const startFrame = window.requestAnimationFrame(() => {
      settleFrame = window.requestAnimationFrame(() => {
        setRenderedActivities((current) => current.map((activity) => (
          nextByKey.has(activity.activityKey) && activity.motionState === "entering"
            ? { ...activity, motionState: "visible" }
            : activity
        )));
      });
    });

    const exitTimer = window.setTimeout(() => {
      setRenderedActivities((current) => current.filter((activity) => nextByKey.has(activity.activityKey)));
    }, ACTIVITY_EXIT_DURATION);

    return () => {
      window.cancelAnimationFrame(startFrame);
      if (settleFrame) window.cancelAnimationFrame(settleFrame);
      window.clearTimeout(exitTimer);
    };
  }, [nextActivities, prefersReducedMotion]);

  return renderedActivities;
}

function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return "0:00";

  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

// Lanyard dice en que clientes esta conectado; la tarjeta tiraba ese dato.
function getActivePlatforms(presence) {
  const platforms = [
    { active: !!presence?.active_on_discord_desktop, id: "desktop", label: "desktop" },
    { active: !!presence?.active_on_discord_mobile, id: "mobile", label: "mobile" },
    { active: !!presence?.active_on_discord_web, id: "web", label: "web" }
  ];

  if (presence?.active_on_discord_embedded) platforms.push({ active: true, id: "embedded", label: "consola" });
  if (presence?.active_on_discord_vr) platforms.push({ active: true, id: "vr", label: "vr" });

  return platforms;
}

function PlatformIcon({ id }) {
  if (id === "mobile") return <Smartphone size={12} aria-hidden="true" />;
  if (id === "web") return <Globe size={12} aria-hidden="true" />;
  if (id === "vr" || id === "embedded") return <Gamepad2 size={12} aria-hidden="true" />;
  return <Monitor size={12} aria-hidden="true" />;
}

// Total acumulado en formato humano: el panel de estadisticas habla de horas,
// no de milisegundos.
function formatPlaytime(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return "0m";

  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours >= 1) return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  if (totalMinutes >= 1) return `${totalMinutes}m`;
  return "<1m";
}

// Las estadisticas por juego viven en la biblioteca del endpoint; el juego en
// curso ademas trae la racha ya filtrada por si sigue viva.
function getGameStats(streak, name) {
  if (!streak || !name) return null;

  const entry = (streak.library || []).find((game) => game.name === name);
  const isCurrent = streak.game === name;

  if (!entry && !isCurrent) return null;

  return {
    bestStreak: entry?.bestStreak ?? streak.bestStreak ?? 0,
    days: entry?.days ?? streak.days ?? 0,
    firstDay: entry?.firstDay ?? streak.firstDay ?? null,
    streak: isCurrent ? (streak.streak ?? 0) : (entry?.streak ?? 0),
    totalMs: entry?.totalMs ?? streak.totalMs ?? 0
  };
}

function getSpotifyProgress(timestamps, now) {
  const start = Number(timestamps?.start);
  const end = Number(timestamps?.end);
  if (!start || !end || end <= start) return null;

  const clampedNow = Math.min(Math.max(now, start), end);
  const total = end - start;
  const current = clampedNow - start;

  return {
    currentLabel: formatDuration(current),
    percent: (current / total) * 100,
    remainingLabel: formatDuration(total - current),
    totalLabel: formatDuration(total)
  };
}

function formatSessionDuration(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return null;

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function getActivityPartySize(activity) {
  const size = activity?.party?.size;
  if (!Array.isArray(size) || size.length < 2) return null;

  const current = Number(size[0]);
  const maximum = Number(size[1]);
  if (!Number.isFinite(current) || !Number.isFinite(maximum) || current < 0 || maximum <= 0) return null;

  return { current, maximum };
}

function getActivitySessionMs(activity, presence, now, mainGameName) {
  if (activity?.type !== 0) return 0;

  const lanyardSessionMs = Number(presence?.kv?.session_duration_ms || 0);
  if (lanyardSessionMs > 0 && activity.name === mainGameName) return lanyardSessionMs;

  const start = Number(activity.timestamps?.start ?? activity.createdAt);
  if (!start || start > now) return 0;

  return now - start;
}

function formatUpdatedAt(date) {
  if (!date) return "sync pending";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function ActivityIcon({ icon }) {
  if (icon === "spotify" || icon === "audio") return <Headphones size={16} aria-hidden="true" />;
  return <Activity size={16} aria-hidden="true" />;
}

function drawIdleCactus(context, obstacle, groundY, colors) {
  const { height, type, width, x } = obstacle;
  const top = groundY - height;

  context.save();
  context.fillStyle = colors.phosphor;
  context.shadowColor = colors.phosphor;
  context.shadowBlur = 7;
  context.fillRect(Math.round(x + width * 0.38), Math.round(top), 6, height);
  context.fillRect(Math.round(x + width * 0.12), Math.round(top + height * 0.34), 6, height * 0.28);
  context.fillRect(Math.round(x + width * 0.12), Math.round(top + height * 0.55), width * 0.38, 6);
  context.fillRect(Math.round(x + width * 0.58), Math.round(top + height * 0.2), 6, height * 0.24);
  context.fillRect(Math.round(x + width * 0.46), Math.round(top + height * 0.38), width * 0.38, 6);

  if (type === "cluster") {
    context.fillStyle = colors.cyan;
    context.globalAlpha = 0.72;
    context.fillRect(Math.round(x + width * 0.75), Math.round(top + height * 0.28), 5, height * 0.72);
    context.fillRect(Math.round(x + width * 0.62), Math.round(top + height * 0.5), width * 0.36, 5);
  }

  context.restore();
}

function drawIdleCloud(context, x, y, scale) {
  // Nube pixelada del runner clasico, rehecha con bloques para el cabinet.
  const block = (offsetX, offsetY, width, height) => context.fillRect(
    Math.round(x + offsetX * scale),
    Math.round(y + offsetY * scale),
    Math.max(1, Math.round(width * scale)),
    Math.max(1, Math.round(height * scale))
  );

  block(5, 0, 10, 2);
  block(2, 2, 16, 2);
  block(0, 4, 21, 3);
  block(4, 7, 13, 2);
}

function drawIdleSkylineBlock(context, item, baseY, colors) {
  context.fillRect(
    Math.round(item.x),
    Math.round(baseY - item.height),
    Math.round(item.width),
    Math.round(item.height)
  );

  if (!item.mast) return;

  const mastX = Math.round(item.x + item.width * 0.5);
  const mastTop = Math.round(baseY - item.height - item.mastHeight);
  context.fillRect(mastX, mastTop, 1, item.mastHeight);
  context.fillRect(mastX - 2, mastTop + 4, 5, 1);

  if (!item.lit) return;

  context.save();
  context.fillStyle = colors.glitch;
  context.globalAlpha = 0.5 + Math.sin(item.blinkPhase) * 0.34;
  context.fillRect(mastX - 1, mastTop - 3, 3, 2);
  context.restore();
}

function drawIdleDrone(context, drone, groundY, colors) {
  const bodyX = Math.round(drone.x);
  const bodyY = Math.round(groundY - drone.altitude - drone.bob);

  context.save();
  context.fillStyle = drone.blocking ? colors.glitch : colors.cyan;
  context.shadowColor = context.fillStyle;
  context.shadowBlur = 6;
  // Paquete con dos fotogramas de aleteo: la senal que el rastreador persigue.
  context.fillRect(bodyX + 5, bodyY, 12, 6);
  context.fillRect(bodyX + 2, bodyY + 2, 3, 2);
  context.fillRect(bodyX + 17, bodyY + 1, 3, 3);
  context.fillRect(bodyX + 6, drone.wing ? bodyY - 4 : bodyY + 6, 9, 3);
  context.restore();
}

function drawIdleBlip(context, blip, groundY, colors) {
  const centerX = Math.round(blip.x);
  const centerY = Math.round(groundY - blip.y - Math.sin(blip.phase) * 3);

  context.save();
  context.fillStyle = colors.cabinet;
  context.shadowColor = colors.cabinet;
  context.shadowBlur = 8;
  context.globalAlpha = 0.58 + Math.sin(blip.phase * 2) * 0.3;
  context.fillRect(centerX - 1, centerY - 4, 3, 9);
  context.fillRect(centerX - 4, centerY - 1, 9, 3);
  context.restore();
}

function DiscordIdleRunner({ prefersReducedMotion }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion) return undefined;

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return undefined;

    const trexPath = new Path2D(IDLE_TREX_PATH);
    const trexSprite = new Image();

    // La escena se arma por capas de parallax para que el cielo del panel deje
    // de ser un rectangulo vacio: nubes al fondo, horizonte de cabinas a media
    // distancia y el carril del rastreador delante.
    const blips = [];
    const clouds = [];
    const obstacles = [];
    const pebbles = [];
    const skyline = [];
    const sparks = [];
    const stars = [];

    let animationFrame = 0;
    let blipTimer = 2.4;
    let laneSlots = 4;
    let dinoScale = 1.7;
    let dinoX = 28;
    let distance = 0;
    let distanceFlash = 0;
    let drone = null;
    let skyDroneTimer = 5.5;
    let gameTime = 0;
    let groundOffset = 0;
    let groundY = 0;
    let isGrounded = true;
    let isVisible = false;
    let jumpOffset = 0;
    let jumpVelocity = 0;
    let lastTime = 0;
    let manualClock = null;
    let spawnCooldown = 160;
    let sceneSpan = 320;
    let signalFlash = 0;
    let signals = 0;
    let stageHeight = 0;
    let stageWidth = 0;
    let tintedTrexSprite = null;

    const styles = getComputedStyle(canvas);
    const colors = {
      cabinet: styles.getPropertyValue("--color-cabinet").trim() || "#ffd45d",
      cyan: styles.getPropertyValue("--color-cyan-arcade").trim() || "#45d8ff",
      glitch: styles.getPropertyValue("--color-glitch").trim() || "#ff3ba7",
      phosphor: styles.getPropertyValue("--color-phosphor").trim() || "#39ff9c"
    };

    trexSprite.onload = () => {
      const spriteCanvas = document.createElement("canvas");
      const spriteContext = spriteCanvas.getContext("2d", { willReadFrequently: true });
      if (!spriteContext) return;

      spriteCanvas.width = trexSprite.naturalWidth;
      spriteCanvas.height = trexSprite.naturalHeight;
      spriteContext.drawImage(trexSprite, 0, 0);

      const resolveColor = (value) => {
        const colorCanvas = document.createElement("canvas");
        const colorContext = colorCanvas.getContext("2d", { willReadFrequently: true });
        if (!colorContext) return [57, 255, 156];

        colorCanvas.width = 1;
        colorCanvas.height = 1;
        colorContext.fillStyle = value;
        colorContext.fillRect(0, 0, 1, 1);
        return Array.from(colorContext.getImageData(0, 0, 1, 1).data.slice(0, 3));
      };

      const spritePixels = spriteContext.getImageData(
        0,
        0,
        spriteCanvas.width,
        spriteCanvas.height
      );
      const phosphorRgb = resolveColor(colors.phosphor);
      const cyanRgb = resolveColor(colors.cyan);

      for (let index = 0; index < spritePixels.data.length; index += 4) {
        const alpha = spritePixels.data[index + 3];
        if (alpha === 0) continue;

        const red = spritePixels.data[index];
        const green = spritePixels.data[index + 1];
        const blue = spritePixels.data[index + 2];
        const luminance = (red + green + blue) / 3;

        if (luminance >= 252) {
          spritePixels.data[index] = cyanRgb[0];
          spritePixels.data[index + 1] = cyanRgb[1];
          spritePixels.data[index + 2] = cyanRgb[2];
          spritePixels.data[index + 3] = 255;
        } else if (luminance > 180) {
          spritePixels.data[index + 3] = 0;
        } else {
          spritePixels.data[index] = phosphorRgb[0];
          spritePixels.data[index + 1] = phosphorRgb[1];
          spritePixels.data[index + 2] = phosphorRgb[2];
          spritePixels.data[index + 3] = 255;
        }
      }

      spriteContext.clearRect(0, 0, spriteCanvas.width, spriteCanvas.height);
      spriteContext.putImageData(spritePixels, 0, 0);
      tintedTrexSprite = spriteCanvas;
    };
    trexSprite.src = IDLE_TREX_SPRITE;

    function randomBetween(min, max) {
      return min + Math.random() * (max - min);
    }

    function seedScenery() {
      sceneSpan = Math.max(stageWidth * 2, 360);
      clouds.length = 0;
      skyline.length = 0;
      pebbles.length = 0;
      stars.length = 0;

      const starCount = Math.max(26, Math.round(stageWidth / 5));
      for (let index = 0; index < starCount; index += 1) {
        stars.push({
          ping: index % 6 === 0,
          phase: randomBetween(0, Math.PI * 2),
          twinkle: randomBetween(0.5, 1.9),
          x: randomBetween(0, sceneSpan),
          y: randomBetween(stageHeight * 0.04, stageHeight * 0.64)
        });
      }

      const cloudCount = Math.max(5, Math.round(stageWidth / 62));
      for (let index = 0; index < cloudCount; index += 1) {
        clouds.push({
          scale: randomBetween(0.65, 1.4),
          x: randomBetween(0, sceneSpan),
          y: randomBetween(stageHeight * 0.06, stageHeight * 0.52)
        });
      }

      let cursor = randomBetween(0, 24);
      while (cursor < sceneSpan) {
        const width = randomBetween(13, 32);
        skyline.push({
          blinkPhase: randomBetween(0, Math.PI * 2),
          height: randomBetween(stageHeight * 0.06, stageHeight * 0.19),
          lit: Math.random() > 0.6,
          mast: Math.random() > 0.52,
          mastHeight: randomBetween(7, 16),
          width,
          x: cursor
        });
        cursor += width + randomBetween(5, 18);
      }

      const pebbleCount = Math.max(8, Math.round(stageWidth / 24));
      for (let index = 0; index < pebbleCount; index += 1) {
        pebbles.push({
          size: Math.random() > 0.72 ? 3 : 2,
          x: randomBetween(0, sceneSpan),
          y: randomBetween(6, 16)
        });
      }
    }

    function spawnObstacle(spawnX) {
      const cluster = Math.random() > 0.58;
      obstacles.push({
        height: cluster ? randomBetween(38, 45) : randomBetween(29, 37),
        type: cluster ? "cluster" : "single",
        width: cluster ? 29 : 19,
        x: spawnX
      });
    }

    function spawnDrone(high) {
      drone = {
        altitude: high
          ? randomBetween(47 * dinoScale + 14, 47 * dinoScale + 38)
          : randomBetween(9, 21),
        blocking: !high,
        bob: 0,
        height: 12,
        phase: 0,
        width: 22,
        wing: false,
        x: stageWidth + 6
      };
    }

    function resizeCanvas() {
      const bounds = canvas.getBoundingClientRect();
      const density = Math.min(window.devicePixelRatio || 1, 2);
      const nextWidth = Math.max(1, bounds.width);
      const nextHeight = Math.max(1, bounds.height);
      const resized = Math.abs(nextWidth - stageWidth) > 0.5 || Math.abs(nextHeight - stageHeight) > 0.5;

      stageWidth = nextWidth;
      stageHeight = nextHeight;
      canvas.width = Math.round(stageWidth * density);
      canvas.height = Math.round(stageHeight * density);
      context.setTransform(density, 0, 0, density, 0, 0);
      context.imageSmoothingEnabled = false;
      dinoScale = Math.max(1.42, Math.min(1.9, stageWidth / 155));
      dinoX = Math.max(22, stageWidth * 0.13);
      groundY = stageHeight - Math.max(27, stageHeight * 0.14);
      if (resized || !stars.length) seedScenery();

      if (!obstacles.length) {
        spawnObstacle(stageWidth * 0.82);
        spawnCooldown = Math.max(150, stageWidth * 0.6);
        laneSlots = Math.round(randomBetween(3, 6));
      }
    }

    function drawSky() {
      context.save();
      for (const star of stars) {
        // Unos pocos puntos son "pings" mas marcados: dan lectura al cielo sin
        // convertirlo en un campo de estrellas denso.
        context.fillStyle = star.ping ? colors.cabinet : colors.phosphor;
        context.globalAlpha = star.ping
          ? 0.18 + Math.abs(Math.sin(star.phase)) * 0.42
          : 0.1 + Math.abs(Math.sin(star.phase)) * 0.2;
        const size = star.ping ? 2 : 1;
        context.fillRect(Math.round(star.x), Math.round(star.y), size, size);
      }

      context.fillStyle = colors.cyan;
      context.globalAlpha = 0.2;
      for (const cloud of clouds) drawIdleCloud(context, cloud.x, cloud.y, cloud.scale);
      context.restore();
    }

    function drawSkyline() {
      const baseY = groundY - 5;

      context.save();
      context.fillStyle = colors.phosphor;
      context.globalAlpha = 0.16;
      for (const item of skyline) drawIdleSkylineBlock(context, item, baseY, colors);
      context.restore();
    }

    function drawGround() {
      context.save();
      context.strokeStyle = colors.phosphor;
      context.globalAlpha = 0.3;
      context.setLineDash([7, 7]);
      context.beginPath();
      context.moveTo(12, Math.round(groundY) + 0.5);
      context.lineTo(stageWidth - 12, Math.round(groundY) + 0.5);
      context.stroke();
      context.setLineDash([]);

      for (let x = -groundOffset; x < stageWidth; x += 22) {
        context.fillStyle = Math.round(x / 22) % 3 === 0 ? colors.glitch : colors.cyan;
        context.globalAlpha = 0.72;
        context.fillRect(Math.round(x), Math.round(groundY + 7), 4, 3);
      }

      context.fillStyle = colors.phosphor;
      context.globalAlpha = 0.26;
      for (const pebble of pebbles) {
        context.fillRect(Math.round(pebble.x), Math.round(groundY + pebble.y), pebble.size, 1);
      }
      context.restore();
    }

    function drawHud() {
      const runLabel = `AUTO_RUN // ${String(Math.floor(distance)).padStart(5, "0")}`;
      const signalLabel = `SIG x${String(signals).padStart(2, "0")}`;

      context.save();
      context.font = "700 8px monospace";
      context.fillStyle = colors.cabinet;
      context.globalAlpha = distanceFlash > 0 && Math.floor(distanceFlash * 12) % 2 === 0 ? 1 : 0.7;
      context.fillText(runLabel, 12, 17);

      context.fillStyle = signalFlash > 0 ? colors.cabinet : colors.phosphor;
      context.globalAlpha = signalFlash > 0 ? 1 : 0.62;
      context.fillText(signalLabel, stageWidth - 12 - context.measureText(signalLabel).width, 17);
      context.restore();
    }

    function drawScene() {
      context.clearRect(0, 0, stageWidth, stageHeight);

      drawSky();
      drawSkyline();
      drawGround();

      for (const blip of blips) drawIdleBlip(context, blip, groundY, colors);
      for (const item of obstacles) drawIdleCactus(context, item, groundY, colors);
      if (drone) drawIdleDrone(context, drone, groundY, colors);

      const dinoHeight = 47 * dinoScale;
      const dinoWidth = 44 * dinoScale;
      const dinoY = groundY - dinoHeight + jumpOffset;
      const spriteFrame = isGrounded ? (Math.floor(gameTime * 12) % 2 === 0 ? 2 : 3) : 0;

      context.save();
      context.shadowColor = colors.phosphor;
      context.shadowBlur = 4;

      if (tintedTrexSprite) {
        context.imageSmoothingEnabled = false;
        context.drawImage(
          tintedTrexSprite,
          spriteFrame * 44,
          0,
          44,
          47,
          Math.round(dinoX),
          Math.round(dinoY),
          Math.round(dinoWidth),
          Math.round(dinoHeight)
        );
      } else {
        context.translate(Math.round(dinoX), Math.round(dinoY));
        context.scale(dinoScale, dinoScale);
        context.fillStyle = colors.phosphor;
        context.shadowBlur = 7 / dinoScale;
        context.fill(trexPath);
      }
      context.restore();

      context.save();
      context.fillStyle = colors.cabinet;
      context.shadowColor = colors.cabinet;
      context.shadowBlur = 6;
      for (const spark of sparks) {
        context.globalAlpha = Math.max(0, spark.life / spark.maxLife);
        context.fillRect(Math.round(spark.x), Math.round(spark.y), 2, 2);
      }
      context.restore();

      drawHud();
    }

    function update(timestamp) {
      const delta = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.034) : 0;
      lastTime = timestamp;
      gameTime += delta;
      distanceFlash = Math.max(0, distanceFlash - delta);
      signalFlash = Math.max(0, signalFlash - delta);

      // La carrera acelera despacio y con tope, como el runner original.
      const speed = Math.max(82, stageWidth * 0.33) * (1 + Math.min(0.52, gameTime / 145));
      const gravity = Math.max(980, Math.min(1180, stageHeight * 3.1));
      const dinoHeight = 47 * dinoScale;
      const dinoWidth = 44 * dinoScale;
      const bodyLeft = dinoX + dinoWidth * 0.22;
      const bodyRight = dinoX + dinoWidth * 0.74;

      const previousHundreds = Math.floor(distance / 100);
      distance += speed * delta * 0.09;
      if (Math.floor(distance / 100) > previousHundreds) distanceFlash = 0.75;

      groundOffset = (groundOffset + speed * delta) % 22;

      for (const star of stars) {
        star.x -= speed * 0.05 * delta;
        star.phase += delta * star.twinkle;
        if (star.x < -2) star.x += sceneSpan;
      }

      for (const cloud of clouds) {
        cloud.x -= speed * 0.11 * delta;
        if (cloud.x < -24) cloud.x += sceneSpan;
      }

      for (const item of skyline) {
        item.x -= speed * 0.34 * delta;
        item.blinkPhase += delta * 2.1;
        if (item.x + item.width < 0) item.x += sceneSpan;
      }

      for (const pebble of pebbles) {
        pebble.x -= speed * delta;
        if (pebble.x < -4) pebble.x += sceneSpan;
      }

      for (let index = obstacles.length - 1; index >= 0; index -= 1) {
        obstacles[index].x -= speed * delta;
        if (obstacles[index].x + obstacles[index].width < -10) obstacles.splice(index, 1);
      }

      // Carril unico: cada hueco lo ocupa un cactus o un dron bajo, nunca los
      // dos. El hueco se mide desde la aparicion anterior (no desde lo que hay
      // en pista), asi que dos amenazas nunca pueden quedar pegadas.
      spawnCooldown -= speed * delta;
      if (spawnCooldown <= 0) {
        laneSlots -= 1;

        if (laneSlots <= 0 && !drone) {
          spawnDrone(false);
          laneSlots = Math.round(randomBetween(3, 6));
        } else {
          spawnObstacle(stageWidth + 6);
        }

        spawnCooldown = speed * randomBetween(1.85, 3.6);
      }

      // Los drones altos pasan por encima del rastreador, asi que no consumen
      // hueco de carril: son solo trafico de fondo.
      skyDroneTimer -= delta;
      if (!drone && skyDroneTimer <= 0) {
        spawnDrone(true);
        skyDroneTimer = randomBetween(8, 16);
      }

      if (drone) {
        drone.x -= speed * delta;
        drone.phase += delta;
        drone.bob = Math.sin(drone.phase * 3.2) * (drone.blocking ? 1.5 : 4);
        drone.wing = Math.floor(drone.phase * 7) % 2 === 0;
        if (drone.x + drone.width < -24) drone = null;
      }

      let threat = null;
      for (const item of obstacles) {
        if (item.x + item.width <= bodyRight) continue;
        if (!threat || item.x < threat.x) threat = { clearance: item.height + 9, width: item.width, x: item.x };
      }
      if (drone?.blocking && drone.x + drone.width > bodyRight) {
        const clearance = drone.altitude + drone.height + 10;
        if (!threat || drone.x < threat.x) threat = { clearance, width: drone.width, x: drone.x };
      }

      if (isGrounded && threat) {
        // El impulso se dimensiona por obstaculo: el rastreador tiene que seguir
        // por encima mientras el cactus cruza todo el cuerpo, no solo cuando
        // llega al morro. Con impulso fijo el sprite se colaba por los altos.
        const traversal = (threat.width + bodyRight - bodyLeft) / speed;
        const needed = Math.sqrt(2 * gravity * threat.clearance + (gravity * traversal * 0.5) ** 2);
        // Techo duro: el salto nunca puede salirse por arriba del lienzo.
        const headroom = Math.max(40, groundY - dinoHeight - 6);
        const maxLaunch = Math.min(Math.max(430, stageHeight * 1.75), Math.sqrt(2 * gravity * headroom));
        const launchSpeed = Math.min(maxLaunch, needed * 1.05);
        const timeToThreat = (threat.x - bodyRight) / speed;
        const discriminant = Math.max(0, launchSpeed ** 2 - 2 * gravity * threat.clearance);
        const timeToClear = (launchSpeed - Math.sqrt(discriminant)) / gravity;

        if (timeToThreat > 0 && timeToThreat <= timeToClear + 0.02) {
          isGrounded = false;
          jumpVelocity = -launchSpeed;
        }
      }

      if (!isGrounded) {
        jumpOffset += jumpVelocity * delta;
        jumpVelocity += gravity * delta;

        if (jumpOffset >= 0) {
          jumpOffset = 0;
          jumpVelocity = 0;
          isGrounded = true;
        }
      }

      blipTimer -= delta;
      if (blipTimer <= 0) {
        blips.push({
          phase: randomBetween(0, Math.PI * 2),
          x: stageWidth + randomBetween(12, 70),
          y: randomBetween(24, 68)
        });
        blipTimer = randomBetween(2.6, 5.4);
      }

      const dinoTop = groundY - dinoHeight + jumpOffset;
      const boxTop = dinoTop + dinoHeight * 0.12;
      const boxBottom = dinoTop + dinoHeight * 0.94;

      for (let index = blips.length - 1; index >= 0; index -= 1) {
        const blip = blips[index];
        blip.x -= speed * delta;
        blip.phase += delta * 3.4;

        const blipY = groundY - blip.y - Math.sin(blip.phase) * 3;
        const caught = blip.x + 4 >= bodyLeft
          && blip.x - 4 <= bodyRight
          && blipY + 4 >= boxTop
          && blipY - 4 <= boxBottom;

        if (caught) {
          signals += 1;
          signalFlash = 0.6;
          for (let particle = 0; particle < 7; particle += 1) {
            sparks.push({
              life: randomBetween(0.26, 0.48),
              maxLife: 0.48,
              vx: randomBetween(-46, 40),
              vy: randomBetween(-70, 10),
              x: blip.x,
              y: blipY
            });
          }
          blips.splice(index, 1);
          continue;
        }

        if (blip.x < -14) blips.splice(index, 1);
      }

      for (let index = sparks.length - 1; index >= 0; index -= 1) {
        const spark = sparks[index];
        spark.life -= delta;

        if (spark.life <= 0) {
          sparks.splice(index, 1);
          continue;
        }

        spark.x += (spark.vx - speed) * delta;
        spark.y += spark.vy * delta;
        spark.vy += 150 * delta;
      }

      drawScene();
    }

    function loop(timestamp) {
      if (!isVisible) return;
      update(timestamp);
      animationFrame = window.requestAnimationFrame(loop);
    }

    function startAnimation() {
      if (animationFrame || !isVisible) return;
      lastTime = 0;
      animationFrame = window.requestAnimationFrame(loop);
    }

    function stopAnimation() {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    }

    const resizeObserver = new ResizeObserver(resizeCanvas);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible) startAnimation();
      else stopAnimation();
    }, { threshold: 0.05 });

    resizeCanvas();
    drawScene();
    resizeObserver.observe(canvas);
    intersectionObserver.observe(canvas);

    if (import.meta.env.DEV) {
      // Gancho de depuracion: avanza la escena sin rAF ni observers, igual que
      // los motores estacionales, para poder inspeccionarla sin repintado.
      window.__daivrPacketRex = {
        step(ms = 16) {
          stopAnimation();
          manualClock = (manualClock ?? (lastTime || performance.now())) + ms;
          update(manualClock);
          return this.summary();
        },
        resume() {
          manualClock = null;
          isVisible = true;
          lastTime = 0;
          startAnimation();
        },
        summary() {
          return {
            airborne: !isGrounded,
            blips: blips.length,
            clouds: clouds.length,
            distance: Math.floor(distance),
            lift: Math.round(-jumpOffset),
            drone: drone ? { altitude: Math.round(drone.altitude), blocking: drone.blocking, x: Math.round(drone.x) } : null,
            obstacles: obstacles.map((item) => ({
              height: Math.round(item.height),
              width: item.width,
              x: Math.round(item.x)
            })),
            pebbles: pebbles.length,
            signals,
            skyline: skyline.length,
            stars: stars.length,
            sparks: sparks.length,
            rig: {
              bottom: Math.round(groundY),
              height: Math.round(47 * dinoScale),
              left: Math.round(dinoX + 44 * dinoScale * 0.22),
              right: Math.round(dinoX + 44 * dinoScale * 0.74)
            },
            stage: { height: Math.round(stageHeight), width: Math.round(stageWidth) }
          };
        },
        sync() {
          resizeCanvas();
          drawScene();
          return this.summary();
        }
      };
    }

    return () => {
      stopAnimation();
      trexSprite.onload = null;
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      if (import.meta.env.DEV) delete window.__daivrPacketRex;
    };
  }, [prefersReducedMotion]);

  return (
    <div
      className={cn("discord-idle-game", prefersReducedMotion && "is-static")}
      role="img"
      aria-label="Pixel T-Rex running past a cabinet skyline, jumping obstacles and collecting signal markers"
    >
      {prefersReducedMotion ? (
        <svg className="discord-idle-runner" viewBox="0 0 44 47" aria-hidden="true" shapeRendering="crispEdges">
          <path fill="currentColor" d={IDLE_TREX_PATH} />
        </svg>
      ) : <canvas ref={canvasRef} aria-hidden="true" />}
    </div>
  );
}

function DiscordProfileFrame({ anchor, className, decorative = false, frame }) {
  // Las capas vienen del CDN de Discord y pesan lo suyo: hasta que cada una no
  // esta decodificada se deja transparente, para que aparezca entrando en vez
  // de aterrizar de golpe sobre el avatar.
  const [loaded, setLoaded] = useState(EMPTY_LAYERS);
  const markLoaded = useCallback((id) => {
    setLoaded((current) => (current.has(id) ? current : new Set(current).add(id)));
  }, []);

  if (!frame?.layers?.length || !frame.innerWidth) return null;

  const layers = anchor ? frame.layers.filter((layer) => layer.anchor === anchor) : frame.layers;
  const horizontalOverflow = (frame.overflowHorizontal / frame.innerWidth) * 100;
  const frameWidth = 100 + horizontalOverflow * 2;
  const style = {
    "--discord-frame-bottom-offset": `${(frame.overflowBottom / frame.innerWidth) * -100}cqi`,
    "--discord-frame-left-offset": `${-horizontalOverflow}%`,
    "--discord-frame-top-offset": `${(frame.overflowTop / frame.innerWidth) * -100}cqi`,
    "--discord-frame-width": `${frameWidth}%`
  };

  return (
    <div
      className={cn("discord-profile-frame", className)}
      style={style}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : `${frame.name}: ${frame.label}`}
    >
      {layers.map((layer) => {
        const layerImage = (
          <img
          className={cn(
            "discord-profile-frame-layer",
            `is-${layer.anchor}`,
            `is-${layer.order}`,
            `is-${layer.type}`,
            layer.responsive && "is-responsive",
            loaded.has(layer.id) && "is-ready"
          )}
          src={layer.src}
          alt=""
          aria-hidden="true"
          decoding="async"
          loading="eager"
          fetchPriority="low"
          ref={(node) => { if (node?.complete && node.naturalWidth > 0) markLoaded(layer.id); }}
          onLoad={() => markLoaded(layer.id)}
          />
        );

        return layer.type === "border" ? (
          <span className="discord-profile-frame-bottom-clip" key={layer.id}>
            {layerImage}
          </span>
        ) : (
          <span className="contents" key={layer.id}>{layerImage}</span>
        );
      })}
    </div>
  );
}

export function DiscordPresencePanel() {
  const { data: presence, error, loading, updatedAt } = useLanyardPresence(discord.userId);
  const isMobileLayout = useMobilePresenceLayout();
  const [openStatsKey, setOpenStatsKey] = useState(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [activityImages, setActivityImages] = useState({});
  const [badgeTooltip, setBadgeTooltip] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [profileFrame, setProfileFrame] = useState(null);
  const [profileNameplate, setProfileNameplate] = useState(null);
  const [profileFrameOverflow, setProfileFrameOverflow] = useState(true);
  const [profileFrameOverflowAdmin, setProfileFrameOverflowAdmin] = useState(false);
  const [profileFrameOverflowBusy, setProfileFrameOverflowBusy] = useState(false);
  const [streak, setStreak] = useState(null);
  const user = presence?.discord_user;
  const displayName = getDiscordDisplayName(user);
  const primaryGuild = user?.primary_guild;
  const primaryGuildBadgeUrl = primaryGuild?.identity_enabled && primaryGuild?.identity_guild_id && primaryGuild?.badge
    ? `https://cdn.discordapp.com/guild-tag-badges/${encodeURIComponent(primaryGuild.identity_guild_id)}/${encodeURIComponent(primaryGuild.badge)}.png?size=64`
    : null;
  const statusKey = loading && !presence ? "syncing" : presence?.discord_status || "offline";
  const status = discordStatusMeta[statusKey] || discordStatusMeta.offline;
  const avatarUrl = getDiscordAvatarUrl(user, 512) || discord.fallbackAvatar || profile.avatar;
  const decorationUrl = getAvatarDecorationUrl(user);
  const customStatus = getCustomStatus(presence?.activities);
  const customEmojiUrl = getEmojiUrl(customStatus?.emoji);
  const activities = useMemo(() => getVisibleActivities(presence), [presence]);
  const displayedActivities = useMemo(
    () => (isMobileLayout ? getMobileActivities(activities) : activities),
    [activities, isMobileLayout]
  );
  const animatedActivities = useAnimatedActivities(displayedActivities, prefersReducedMotion);
  const badges = getUserBadges(user);
  const statusText = error ? "Lanyard signal lost" : customStatus?.state || customStatus?.name || profile.location;
  const isLoadingStatus = /^loading\.{3}$/i.test(statusText.trim());
  const platforms = getActivePlatforms(presence);
  const activePlatforms = platforms.filter((platform) => platform.active);
  const mainGameName = activities.find((activity) => activity.type === 0)?.name || null;
  const hasTimedActivity = Boolean(
    presence?.listening_to_spotify ||
      activities.some(
        (activity) =>
          activity.type === 0 &&
          (activity.timestamps?.start || activity.createdAt || presence?.kv?.session_duration_ms)
      )
  );
  const steamGridLookupNames = activities
    .filter((activity) => !activity.isSpotify && !activity.image && activity.name)
    .map((activity) => activity.name)
    .join("|");

  useEffect(() => {
    // `now` solo lo consumen el progreso de Spotify y el cronometro de sesion.
    // El tic de reposo existia por el reloj local; sin el, sin actividad
    // cronometrada no hay nada que refrescar y el panel deja de repintarse solo.
    if (!hasTimedActivity) return undefined;

    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [hasTimedActivity]);

  useEffect(() => {
    let cancelled = false;

    async function loadProfileFrame() {
      try {
        const response = await fetch("/api/discord-profile-frame", { cache: "no-store" });
        if (!response.ok) throw new Error(`Discord profile frame returned ${response.status}`);

        const payload = await response.json();
        if (!cancelled) {
          setProfileFrame(payload.frame || null);
          setProfileNameplate(payload.nameplate || null);
        }
      } catch {
        if (!cancelled) {
          setProfileFrame(null);
          setProfileNameplate(null);
        }
      }
    }

    loadProfileFrame();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadProfileFramePreference() {
      try {
        const response = await fetch("/api/comments/preferences", {
          cache: "no-store",
          credentials: "include"
        });
        if (!response.ok) throw new Error(`Profile frame preference returned ${response.status}`);

        const payload = await response.json();
        if (!cancelled) {
          setProfileFrameOverflow(payload.profileFrameOverflow !== false);
          setProfileFrameOverflowAdmin(payload.canEditProfileFrameOverflow === true);
        }
      } catch {
        if (!cancelled) setProfileFrameOverflowAdmin(false);
      }
    }

    loadProfileFramePreference();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadStreak() {
      try {
        const response = await fetch("/api/discord-streak", { cache: "no-store" });
        if (!response.ok) throw new Error(`Discord streak returned ${response.status}`);
        const payload = await response.json();

        if (!cancelled) setStreak(payload || null);
      } catch {
        if (!cancelled) setStreak(null);
      }
    }

    loadStreak();
    const interval = window.setInterval(loadStreak, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!steamGridLookupNames) return undefined;

    const names = steamGridLookupNames.split("|").filter((name) => !(name in activityImages));
    if (!names.length) return undefined;

    let cancelled = false;

    async function loadImages() {
      const entries = await Promise.all(names.map(async (name) => {
        try {
          const response = await fetch(`/api/game-image?name=${encodeURIComponent(name)}`);
          if (!response.ok) return [name, null];

          const payload = await response.json();
          return [name, payload.url || null];
        } catch {
          return [name, null];
        }
      }));

      if (!cancelled) {
        setActivityImages((current) => ({
          ...current,
          ...Object.fromEntries(entries)
        }));
      }
    }

    loadImages();

    return () => {
      cancelled = true;
    };
  }, [activityImages, steamGridLookupNames]);

  function showBadgeTooltip(badge, element) {
    const rect = element.getBoundingClientRect();
    const tooltipWidth = badge.tooltipWidth || 190;
    const anchorX = rect.left + rect.width / 2;
    const viewportPadding = 12;
    const minLeft = viewportPadding + tooltipWidth / 2;
    const maxLeft = Math.max(minLeft, window.innerWidth - viewportPadding - tooltipWidth / 2);
    const left = Math.min(Math.max(anchorX, minLeft), maxLeft);

    setBadgeTooltip({
      arrowOffset: anchorX - left,
      icon: badge.tooltipIcon || badge.icon,
      iconType: badge.iconType,
      label: badge.label,
      left,
      sublabel: badge.sublabel,
      top: rect.top - 12,
      width: tooltipWidth
    });
  }

  function hideBadgeTooltip() {
    setBadgeTooltip(null);
  }

  async function toggleProfileFrameOverflow() {
    if (!profileFrameOverflowAdmin || profileFrameOverflowBusy) return;

    const nextValue = !profileFrameOverflow;
    setProfileFrameOverflow(nextValue);
    setProfileFrameOverflowBusy(true);

    try {
      const response = await fetch("/api/comments/preferences", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileFrameOverflow: nextValue })
      });
      if (!response.ok) throw new Error(`Profile frame preference returned ${response.status}`);

      const payload = await response.json();
      setProfileFrameOverflow(payload.profileFrameOverflow !== false);
      setProfileFrameOverflowAdmin(payload.canEditProfileFrameOverflow === true);
    } catch {
      setProfileFrameOverflow(!nextValue);
    } finally {
      setProfileFrameOverflowBusy(false);
    }
  }

  useEffect(() => {
    if (!badgeTooltip) return undefined;

    function dismissTooltip() {
      setBadgeTooltip(null);
    }

    window.addEventListener("scroll", dismissTooltip, true);
    window.addEventListener("resize", dismissTooltip);

    return () => {
      window.removeEventListener("scroll", dismissTooltip, true);
      window.removeEventListener("resize", dismissTooltip);
    };
  }, [badgeTooltip]);

  return (
    <section
      className={cn(
        "discord-presence-shell panel-strong",
        profileFrameOverflow ? "is-frame-overflowing" : "is-frame-contained"
      )}
      aria-label="Discord presence"
    >
      <div className="discord-presence-titlebar">
        <div className="discord-presence-titlebar-lights" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <code>~/daivr/discord.presence</code>
        {profileFrameOverflowAdmin ? (
          <button
            className={cn(
              "discord-frame-overflow-toggle arcade-focus has-tooltip",
              profileFrameOverflow && "is-active"
            )}
            type="button"
            role="switch"
            aria-label={profileFrameOverflow ? "Contain profile frame inside the presence card" : "Allow profile frame outside the presence card"}
            aria-checked={profileFrameOverflow}
            data-tooltip={profileFrameOverflow ? "Contain profile frame" : "Allow profile frame overflow"}
            disabled={profileFrameOverflowBusy}
            onClick={toggleProfileFrameOverflow}
          >
            <span className="discord-frame-toggle-label is-in" aria-hidden="true">IN</span>
            <span className="discord-frame-toggle-track" aria-hidden="true">
              <span className="discord-frame-toggle-thumb">
                {profileFrameOverflow ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
              </span>
            </span>
            <span className="discord-frame-toggle-label is-out" aria-hidden="true">OUT</span>
          </button>
        ) : null}
      </div>

      <div className="discord-presence-grid">
        <aside className="discord-presence-profile">
          <DiscordProfileFrame className="discord-profile-frame-profile" frame={profileFrame} />

          {/* En movil el adorno del marco cae justo sobre el centro de la barra
              de titulo y se come la ruta. Como esta fila dice lo mismo y queda
              por debajo del adorno, alli baja la ruta y el rotulo generico se
              retira: no se pierde el dato ni se gana altura. */}
          <div className="flex items-center justify-between gap-3">
            <p className="pixel-label discord-presence-eyebrow">DISCORD.PRESENCE</p>
            <code className="discord-presence-path">~/daivr/discord.presence</code>
            <span className={cn("discord-presence-led", status.colorClass)} aria-hidden="true" />
          </div>

          <a className={cn("discord-presence-avatar arcade-focus", statusKey === "offline" && "is-offline")} href={discord.profileUrl} rel="noreferrer" target="_blank">
            <img src={avatarUrl} alt={`${displayName} Discord avatar`} />
            {decorationUrl ? <img className="discord-presence-decoration" src={decorationUrl} alt="" aria-hidden="true" /> : null}
            <i className={statusKey === "offline" ? "discord-presence-offline-indicator" : status.colorClass} aria-hidden="true" />
          </a>

          <div className="discord-presence-identity text-center">
            <div className="discord-presence-name-row">
              <strong>{displayName}</strong>
              {primaryGuildBadgeUrl ? (
                <span
                  className="discord-primary-guild-badge"
                  aria-label={`${primaryGuild.tag || "Primary server"} server tag`}
                  data-tooltip={`PRIMARY SERVER // ${(primaryGuild.tag || "TAG").toUpperCase()}`}
                  tabIndex={0}
                >
                  <img src={primaryGuildBadgeUrl} alt="" aria-hidden="true" />
                  {primaryGuild.tag ? <span>{primaryGuild.tag}</span> : null}
                </span>
              ) : null}
            </div>
            <small>@{user?.username || "daivr"}</small>
          </div>

          <div className="discord-presence-status">
            <span className={status.textClass}>
              <i className={cn("discord-status-dot", status.colorClass)} aria-hidden="true" />
              {status.label}
            </span>
            <span>{error ? "fallback" : "lanyard.live"}</span>
          </div>

          <div className="discord-presence-custom">
            {customEmojiUrl ? <img src={customEmojiUrl} alt={customStatus?.emoji?.name || ""} /> : <Gamepad2 size={16} aria-hidden="true" />}
            {isLoadingStatus ? (
              <span className="discord-loading-label" aria-label="Loading...">
                Loading
                <span className="discord-loading-dots" aria-hidden="true">
                  <i>.</i><i>.</i><i>.</i>
                </span>
              </span>
            ) : <span>{statusText}</span>}
          </div>

          {/* La telemetria era el unico bloque de tres filas apiladas en una
              tarjeta donde todo lo demas es una fila por caja, y sus etiquetas
              de 0.34rem no se leian. Ahora los clientes son fichas con nombre
              propio y la hora local baja a su propia fila. */}
          <div className="discord-device-bay" aria-label="Clientes de Discord conectados">
            <div className="discord-device-bay-head">
              <code>devices</code>
              <span className={cn("discord-device-tally", activePlatforms.length && "is-live")}>
                <i aria-hidden="true" />
                {activePlatforms.length ? `${String(activePlatforms.length).padStart(2, "0")} online` : "sin cliente"}
              </span>
            </div>

            <div className="discord-device-grid">
              {platforms.map((platform) => (
                <span
                  className={cn("discord-device-tile", platform.active && "is-active")}
                  key={platform.id}
                  aria-label={`${platform.label}: ${platform.active ? "conectado" : "sin conexión"}`}
                  data-tooltip={`${platform.label}\n${platform.active ? "conectado" : "sin conexión"}`}
                  tabIndex={0}
                >
                  <PlatformIcon id={platform.id} />
                  <b>{platform.label}</b>
                </span>
              ))}
            </div>
          </div>


          {badges.length ? (
            <div
              className={cn("discord-presence-badges", profileNameplate && "has-nameplate")}
              data-nameplate-palette={profileNameplate?.palette || undefined}
              aria-label="Discord badges"
            >
              {profileNameplate ? (
                prefersReducedMotion ? (
                  <img
                    className="discord-nameplate-backdrop"
                    src={profileNameplate.fallbackSrc}
                    alt=""
                    aria-hidden="true"
                  />
                ) : (
                  <video
                    className="discord-nameplate-backdrop"
                    poster={profileNameplate.fallbackSrc}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    aria-hidden="true"
                    tabIndex={-1}
                  >
                    <source src={profileNameplate.animatedSrc} type="video/webm" />
                  </video>
                )
              ) : null}
              {badges.map((badge) => (
                <span
                  className="discord-presence-badge"
                  key={badge.label}
                  onBlur={hideBadgeTooltip}
                  onFocus={(event) => showBadgeTooltip(badge, event.currentTarget)}
                  onMouseEnter={(event) => showBadgeTooltip(badge, event.currentTarget)}
                  onMouseLeave={hideBadgeTooltip}
                  tabIndex={0}
                >
                  <img src={badge.icon} alt={badge.label} loading="lazy" />
                </span>
              ))}
            </div>
          ) : null}
        </aside>

        <div className="discord-presence-activity">
          <div className="discord-presence-activity-head">
            <div>
              <p className="pixel-label">ACTIVITY.STREAM</p>
              <h3>Actividad</h3>
            </div>
            <span className="discord-presence-live">
              {error ? <WifiOff size={14} aria-hidden="true" /> : <Radio size={14} aria-hidden="true" />}
              {displayedActivities.length} {displayedActivities.length === 1 ? "activa" : "activas"}
            </span>
          </div>

          <div className="discord-presence-feed">
            {animatedActivities.length ? (
              animatedActivities.map((activity, activityIndex) => {
                const sessionLabel = formatSessionDuration(getActivitySessionMs(activity, presence, now, mainGameName));
                const partySize = getActivityPartySize(activity);
                const hasGameStreak = Boolean(
                  streak?.alive && streak.streak > 1 && activity.type === 0 && streak.game === activity.name
                );
                const streakTooltip = hasGameStreak
                  ? {
                      iconType: "streak",
                      label: "Racha activa",
                      sublabel: `Dai ha jugado ${activity.name} ${streak.streak} días seguidos`,
                      tooltipWidth: 240
                    }
                  : null;
                const spotifyProgress = activity.isSpotify ? getSpotifyProgress(activity.timestamps, now) : null;
                const gameStats = activity.type === 0 ? getGameStats(streak, activity.name) : null;
                // El desplegable de estadisticas es cosa de escritorio: en movil
                // la tarjeta ya va apilada y no queda esquina donde ponerlo.
                const canShowStats = Boolean(gameStats && !isMobileLayout);
                const statsOpen = canShowStats && openStatsKey === activity.activityKey;
                const statsPanelId = `discord-activity-stats-${activity.activityKey.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
                // El reloj se saca al raíl derecho, que antes solo repetía la
                // etiqueta del tipo de actividad y dejaba media tarjeta vacía.
                const railClock = activity.isSpotify
                  ? (spotifyProgress ? { label: "left", value: `-${spotifyProgress.remainingLabel}` } : null)
                  : (sessionLabel ? { label: "session", value: sessionLabel } : null);
                const railMeta = activity.meta && activity.meta.toLowerCase() !== String(activity.typeLabel).toLowerCase()
                  ? activity.meta
                  : null;
                // En Spotify state es el album, que en los singles llega con el
                // mismo texto que la cancion: la tarjeta acababa imprimiendo el
                // titulo dos veces y ocupando el doble de alto.
                const stateText = activity.state
                  && activity.state.trim().toLowerCase() !== String(activity.name || "").trim().toLowerCase()
                  ? activity.state
                  : "";

                return (
                  <article
                    className={cn("discord-activity-card", `is-${activity.motionState}`)}
                    key={activity.activityKey}
                    style={{ "--discord-activity-delay": `${activityIndex * 45}ms` }}
                  >
                    <div className="discord-activity-art">
                      {activity.image || activityImages[activity.name] ? (
                        <img
                          className="discord-activity-main-art"
                          src={activity.image || activityImages[activity.name]}
                          alt=""
                          loading="lazy"
                        />
                      ) : (
                        <ActivityIcon icon={activity.icon} />
                      )}
                      {activity.appIcon ? (
                        <span className="discord-activity-app-icon">
                          <img src={activity.appIcon} alt={activity.appIconAlt} loading="lazy" />
                        </span>
                      ) : null}
                    </div>
                    <div className="discord-activity-main min-w-0">
                      <span>{activity.typeLabel}</span>
                      <strong>{activity.name}</strong>
                      {activity.detail ? <p>{activity.detail}</p> : null}
                      {stateText ? <small>{stateText}</small> : null}
                      {activity.isSpotify ? (
                        <SpotifyProgress now={now} timestamps={activity.timestamps} />
                      ) : null}
                      {partySize || hasGameStreak ? (
                        <div className="discord-activity-session" aria-label="Game session details">
                          {partySize ? (
                            <span
                              className="discord-party-chip"
                              aria-label={`${partySize.current} de ${partySize.maximum} jugadores`}
                              data-tooltip={`party\n${partySize.current} de ${partySize.maximum} jugadores`}
                              tabIndex={0}
                            >
                              <Users size={12} aria-hidden="true" />
                              {partySize.current} de {partySize.maximum}
                            </span>
                          ) : null}
                          {hasGameStreak ? (
                            <span className={cn("discord-streak-row", partySize && "is-stacked")}>
                              <span
                                className="discord-streak-chip"
                                aria-label={streakTooltip.sublabel}
                                onBlur={hideBadgeTooltip}
                                onFocus={(event) => showBadgeTooltip(streakTooltip, event.currentTarget)}
                                onMouseEnter={(event) => showBadgeTooltip(streakTooltip, event.currentTarget)}
                                onMouseLeave={hideBadgeTooltip}
                                tabIndex={0}
                              >
                                <Zap size={12} aria-hidden="true" />
                                {streak.streak}x Streak
                              </span>
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    <div className="discord-activity-rail">
                      {/* El raíl sirve para dos relojes distintos: el restante
                          de Spotify y el cronometro de sesion de un juego. El
                          modificador permite retirar solo el primero en movil,
                          donde la barra de progreso ya dice lo mismo. */}
                      {railClock ? (
                        <span className={`discord-activity-clock${activity.isSpotify ? " is-remaining" : ""}`}>
                          <b>{railClock.value}</b>
                          <i>{railClock.label}</i>
                        </span>
                      ) : null}
                      {railMeta ? <em>{railMeta}</em> : null}
                    </div>

                    {canShowStats ? (
                      <button
                        aria-controls={statsPanelId}
                        aria-expanded={statsOpen}
                        aria-label={statsOpen ? `Cerrar estadísticas de ${activity.name}` : `Ver estadísticas de ${activity.name}`}
                        className={cn("discord-activity-stats-toggle", statsOpen && "is-open")}
                        onClick={() => setOpenStatsKey(statsOpen ? null : activity.activityKey)}
                        type="button"
                      >
                        {statsOpen ? <X size={13} aria-hidden="true" /> : <BarChart3 size={13} aria-hidden="true" />}
                      </button>
                    ) : null}

                    {statsOpen ? (
                      <div className="discord-activity-stats" id={statsPanelId}>
                        <div className="discord-activity-stats-grid">
                          <span>
                            <i>horas jugadas</i>
                            <b>{formatPlaytime(gameStats.totalMs)}</b>
                          </span>
                          <span>
                            <i>racha actual</i>
                            <b>{gameStats.streak}d</b>
                          </span>
                          <span>
                            <i>mejor racha</i>
                            <b>{gameStats.bestStreak}d</b>
                          </span>
                          <span>
                            <i>días vistos</i>
                            <b>{gameStats.days}</b>
                          </span>
                        </div>
                        {streak?.library?.length > 1 ? (
                          <ol className="discord-activity-stats-library">
                            {streak.library.slice(0, 3).map((game) => (
                              <li className={cn(game.name === activity.name && "is-current")} key={game.name}>
                                <span>{game.name}</span>
                                <b>{formatPlaytime(game.totalMs)}</b>
                              </li>
                            ))}
                          </ol>
                        ) : null}
                        {gameStats.firstDay ? (
                          <p className="discord-activity-stats-since">seguimiento desde {gameStats.firstDay}</p>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                );
              })
            ) : (
              <div className="discord-presence-empty">
                <div className="discord-presence-empty-compact">
                  <span>NO ACTIVITY SIGNAL</span>
                  <p>Ahora mismo no hay actividades visibles. El radar sigue escuchando juego, Spotify y estados de Discord.</p>
                </div>

                <div className="discord-idle-desktop">
                  <div className="discord-idle-visual">
                    <DiscordIdleRunner prefersReducedMotion={prefersReducedMotion} />
                  </div>

                  <div className="discord-idle-copy">
                    <span className="discord-idle-kicker">PACKET_REX // SIGNAL HUNT</span>
                    <h4>No activity to chase.</h4>
                    <p>No hay juego ni música transmitiendo. El pequeño rastreador seguirá corriendo hasta encontrar una nueva señal.</p>
                    <div className="discord-idle-readout" aria-label="Activity scanners are listening">
                      <span><code>game.scan</code><b>listening</b></span>
                      <span><code>spotify.port</code><b>listening</b></span>
                      <span><code>discord.state</code><b>ready</b></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="discord-presence-footer">
            <span>{loading ? "syncing lanyard..." : `last sync // ${formatUpdatedAt(updatedAt)}`}</span>
            <span>{error ? "api fallback mode" : "presence online"}</span>
          </div>
        </div>

        <DiscordProfileFrame
          anchor="bottom"
          className="discord-profile-frame-mobile-bottom"
          decorative
          frame={profileFrame}
        />
      </div>
      {badgeTooltip ? (
        createPortal(
          <div
            className={cn("discord-floating-tooltip", badgeTooltip.iconType === "streak" && "is-streak")}
            role="tooltip"
            style={{
              "--tooltip-arrow-offset": `${badgeTooltip.arrowOffset || 0}px`,
              left: `${badgeTooltip.left}px`,
              top: `${badgeTooltip.top}px`,
              width: `${badgeTooltip.width}px`
            }}
          >
            {badgeTooltip.iconType === "streak" ? (
              <Zap className="discord-tooltip-icon" size={28} aria-hidden="true" />
            ) : (
              <img src={badgeTooltip.icon} alt="" aria-hidden="true" />
            )}
            <span className="discord-badge-tooltip-label">{badgeTooltip.label}</span>
            {badgeTooltip.sublabel ? (
              <span className="discord-badge-tooltip-sublabel">{badgeTooltip.sublabel}</span>
            ) : null}
          </div>,
          document.body
        )
      ) : null}
    </section>
  );
}

function SpotifyProgress({ now, timestamps }) {
  const progress = getSpotifyProgress(timestamps, now);
  if (!progress) return null;

  return (
    <div className="discord-spotify-progress">
      <div className="discord-spotify-progress-track">
        <i style={{ width: `${progress.percent}%` }} />
      </div>
      <div className="discord-spotify-progress-time">
        <span>{progress.currentLabel}</span>
        <span>{progress.totalLabel}</span>
      </div>
    </div>
  );
}
