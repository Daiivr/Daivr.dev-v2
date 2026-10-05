import { ControllerSticker } from "./ControllerSticker";
import { Activity, BarChart3, ExternalLink, Gamepad2, Globe, Headphones, Maximize2, Minimize2, Monitor, Radio, Smartphone, Users, X, Zap } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
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
import { DiscordDeskControls } from "./DiscordDeskControls";
import { DiscordTabletop } from "./DiscordTabletop";
import { DiscordPresenceMobile } from "./DiscordPresenceMobile";
import { NotebookFacts, NotebookLocalTime, NotebookSocialsTab } from "./NotebookDesk";

// Un Set vacio y estable: sirve de estado inicial a los dos marcos que se
// pintan, sin crear uno nuevo en cada render.
const EMPTY_LAYERS = new Set();

const BADGE_BASE = "https://raw.githubusercontent.com/merlinfuchs/discord-badges/main/SVG";

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
    icon: "/discord-badges/discord-badge-nitro-opal.png",
    tooltipIcon: "/discord-badges/discord-badge-nitro-opal-card.png",
    iconType: "nitro",
    tooltipWidth: 229,
    label: "Nitro Opal",
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
      trackId: presence.spotify.track_id,
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

  return activities;
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

const desktopMediaQuery = "(min-width: 761px)";
function subscribeDesktopViewport(callback) {
  const query = window.matchMedia(desktopMediaQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
const getDesktopViewport = () => window.matchMedia(desktopMediaQuery).matches;
const getServerDesktopViewport = () => false;

export function DiscordPresencePanel() {
  const isDesktop = useSyncExternalStore(subscribeDesktopViewport, getDesktopViewport, getServerDesktopViewport);
  const { data: presence, error, loading, updatedAt } = useLanyardPresence(discord.userId);
  const [openStatsKey, setOpenStatsKey] = useState(null);
  const [activityImages, setActivityImages] = useState({});
  const [badgeTooltip, setBadgeTooltip] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [profileFrame, setProfileFrame] = useState(null);
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
  const displayedActivities = activities;
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
  // Tambien la portada de los tres juegos con mas horas que aun no tengan la
  // caratula de Discord guardada: son los cartuchos del escritorio
  // (DeskCartridges).
  const steamGridLookupNames = [...new Set([
    ...activities
      .filter((activity) => !activity.isSpotify && !activity.image && activity.name)
      .map((activity) => activity.name),
    ...(streak?.library || []).slice(0, 3).filter((game) => game?.name && !game.image).map((game) => game.name)
  ])].join("|");

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
        }
      } catch {
        if (!cancelled) {
          setProfileFrame(null);
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

  const notebook = (
        <aside className="discord-presence-profile">
          <span className="discord-notebook-binding" aria-hidden="true" />
          <div className="discord-notebook-page is-portrait">
          <div className="flex items-center justify-between gap-3">
            <p className="pixel-label discord-presence-eyebrow">THE PERSON / 01</p>
            <code className="discord-presence-path">~/daivr/discord.presence</code>
            <span className={cn("discord-presence-led", status.colorClass)} aria-hidden="true" />
          </div>

          <div className="discord-notebook-photo">
          <DiscordProfileFrame className="discord-profile-frame-profile" frame={profileFrame} />
          <a className={cn("discord-presence-avatar arcade-focus", statusKey === "offline" && "is-offline")} href={discord.profileUrl} rel="noreferrer" target="_blank">
            <img src={avatarUrl} alt={`${displayName} Discord avatar`} />
            {decorationUrl ? <img className="discord-presence-decoration" src={decorationUrl} alt="" aria-hidden="true" /> : null}
            <i className={statusKey === "offline" ? "discord-presence-offline-indicator" : status.colorClass} aria-hidden="true" />
          </a>
          </div>

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
          <NotebookFacts />

          <div className="discord-notebook-scribble">
            <span>my little corner<br />of the internet.</span>
            <ControllerSticker />
            <small>PROFILE NOTES · VOL. 01</small>
          </div>
          </div>
          <div className="discord-notebook-page is-notes">
          <p className="discord-notebook-heading">CURRENTLY / 02</p>

          <div className="discord-presence-status">
            <span className={status.textClass}>
              <i className={cn("discord-status-dot", status.colorClass)} aria-hidden="true" />
              {status.label}
            </span>
            <span>{error ? "fallback" : "lanyard.live"}</span>
          </div>
          <NotebookLocalTime />

          <div className="discord-presence-custom-block">
            <span className="discord-presence-custom-label">{error ? "connection status" : customStatus ? "custom status" : "room status"}</span>
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
              className="discord-presence-badges"
              aria-label="Discord badges"
            >
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
          <NotebookSocialsTab />
          <a className="discord-profile-link arcade-focus" href={discord.profileUrl} target="_blank" rel="noreferrer">
            <Radio size={14} aria-hidden="true" />
            Open Discord profile
            <ExternalLink size={14} aria-hidden="true" />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          </div>
        </aside>
  );

  const renderActivities = (selectedActivities) => selectedActivities.map((activity, activityIndex) => {
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
                const canShowStats = Boolean(gameStats);
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
                    className={cn("discord-activity-card discord-desk-device", activity.type === 2 ? "is-music-player" : activity.type === 0 ? "is-handheld" : "is-activity-terminal", `is-${activity.motionState || "visible"}`)}
                    key={activity.activityKey}
                    style={{ "--discord-activity-delay": `${activityIndex * 45}ms` }}
                  >
                    <div className="discord-device-brand" aria-hidden="true"><span>{activity.type === 2 ? "daiPod" : activity.type === 0 ? "DAI BOY" : "SIGNAL"}</span><i /> <small>{activity.type === 2 ? "music lives here" : "COLOR"}</small></div>
                    <div className={cn("discord-device-screen", statsOpen && "is-showing-stats")} onKeyDown={(event) => { if (event.key === "Escape" && statsOpen) { event.stopPropagation(); setOpenStatsKey(null); } }}>
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
                    <div className="discord-activity-main min-w-0" inert={statsOpen || undefined}>
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
                      {railMeta && !canShowStats ? <em>{railMeta}</em> : null}

                    {canShowStats ? (
                      <button
                        aria-controls={statsPanelId}
                        aria-expanded={statsOpen}
                        aria-label={statsOpen ? `Close ${activity.name} stats` : `View ${activity.name} stats`}
                        className={cn("discord-activity-stats-toggle", statsOpen && "is-open")}
                        onClick={() => setOpenStatsKey(statsOpen ? null : activity.activityKey)}
                        type="button"
                      >
                        {statsOpen ? <X size={13} aria-hidden="true" /> : <BarChart3 size={13} aria-hidden="true" />}
                      </button>
                    ) : null}
                    </div>

                    {statsOpen ? (
                      <div className="discord-activity-stats" id={statsPanelId} role="region" aria-label={`${activity.name} stats`} tabIndex={0}>
                        <h4 className="discord-stats-heading">Player record <span>{activity.name}</span></h4>
                        <div className="discord-activity-stats-grid">
                          <span>
                            <i>play time</i>
                            <b>{formatPlaytime(gameStats.totalMs)}</b>
                          </span>
                          <span>
                            <i>current streak</i>
                            <b>{gameStats.streak}d</b>
                          </span>
                          <span>
                            <i>best streak</i>
                            <b>{gameStats.bestStreak}d</b>
                          </span>
                          <span>
                            <i>days played</i>
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
                          <p className="discord-activity-stats-since">Tracking since {gameStats.firstDay}</p>
                        ) : null}
                      </div>
                    ) : null}
                    </div>
                    <DiscordDeskControls music={activity.type === 2} handheld={activity.type === 0} />
                    {activity.isSpotify && activity.trackId ? <a className="discord-device-open-link" href={`https://open.spotify.com/track/${encodeURIComponent(activity.trackId)}`} target="_blank" rel="noreferrer">Open in Spotify <ExternalLink size={11} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a> : null}
                  </article>
                );
              });

  return (
    <section
      className={cn(
        "discord-presence-shell discord-desk panel-strong",
        isDesktop && "discord-tabletop-shell",
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
        <code>DAI’S DESK <span aria-hidden="true"> / </span> LIVE FROM DISCORD</code>
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

      {isDesktop ? <DiscordTabletop
        notebook={notebook}
        activities={displayedActivities}
        renderActivities={renderActivities}
        status={status.label}
        statusKey={statusKey}
        error={error}
        loading={loading && !presence}
        updatedAt={formatUpdatedAt(updatedAt)}
        activityImages={activityImages}
        library={streak?.library}
        onInspect={() => { setOpenStatsKey(null); setBadgeTooltip(null); }}
      /> : <DiscordPresenceMobile
        notebook={notebook}
        activities={displayedActivities}
        renderActivities={renderActivities}
        error={error}
        loading={loading}
        presence={presence}
        updatedAt={formatUpdatedAt(updatedAt)}
      />}
      {badgeTooltip ? (
        createPortal(
          <div
            className={cn(
              "discord-floating-tooltip",
              badgeTooltip.iconType === "streak" && "is-streak",
              badgeTooltip.iconType === "nitro" && "is-nitro"
            )}
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
