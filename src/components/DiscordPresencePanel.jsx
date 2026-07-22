import { Activity, Gamepad2, Headphones, Radio, Users, WifiOff, Zap } from "lucide-react";
import { useEffect, useState } from "react";
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

function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return "0:00";

  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
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

export function DiscordPresencePanel() {
  const { data: presence, error, loading, updatedAt } = useLanyardPresence(discord.userId);
  const [activityImages, setActivityImages] = useState({});
  const [badgeTooltip, setBadgeTooltip] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [streak, setStreak] = useState(null);
  const user = presence?.discord_user;
  const displayName = getDiscordDisplayName(user);
  const statusKey = loading && !presence ? "syncing" : presence?.discord_status || "offline";
  const status = discordStatusMeta[statusKey] || discordStatusMeta.offline;
  const avatarUrl = getDiscordAvatarUrl(user, 512) || discord.fallbackAvatar || profile.avatar;
  const decorationUrl = getAvatarDecorationUrl(user);
  const customStatus = getCustomStatus(presence?.activities);
  const customEmojiUrl = getEmojiUrl(customStatus?.emoji);
  const activities = getVisibleActivities(presence);
  const badges = getUserBadges(user);
  const statusText = error ? "Lanyard signal lost" : customStatus?.state || customStatus?.name || profile.location;
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
    if (!hasTimedActivity) return undefined;

    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [hasTimedActivity]);

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
    <section className="discord-presence-shell panel-strong overflow-hidden" aria-label="Discord presence">
      <div className="discord-presence-titlebar">
        <span />
        <span />
        <span />
        <code>~/daivr/discord.presence</code>
      </div>

      <div className="discord-presence-grid">
        <aside className="discord-presence-profile">
          <div className="flex items-center justify-between gap-3">
            <p className="pixel-label">DISCORD.PRESENCE</p>
            <span className={cn("discord-presence-led", status.colorClass)} aria-hidden="true" />
          </div>

          <a className={cn("discord-presence-avatar arcade-focus", statusKey === "offline" && "is-offline")} href={discord.profileUrl} rel="noreferrer" target="_blank">
            <img src={avatarUrl} alt={`${displayName} Discord avatar`} />
            {decorationUrl ? <img className="discord-presence-decoration" src={decorationUrl} alt="" aria-hidden="true" /> : null}
            <i className={statusKey === "offline" ? "discord-presence-offline-indicator" : status.colorClass} aria-hidden="true" />
          </a>

          <div className="text-center">
            <strong>{displayName}</strong>
            <small>@{user?.username || "daivr"}</small>
          </div>

          <div className="discord-presence-status">
            <span className={status.textClass}>{status.label}</span>
            <span>{error ? "fallback" : "lanyard.live"}</span>
          </div>

          <div className="discord-presence-custom">
            {customEmojiUrl ? <img src={customEmojiUrl} alt={customStatus?.emoji?.name || ""} /> : <Gamepad2 size={16} aria-hidden="true" />}
            <span>{statusText}</span>
          </div>

          {badges.length ? (
            <div className="discord-presence-badges" aria-label="Discord badges">
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
              {activities.length} activas
            </span>
          </div>

          <div className="discord-presence-feed">
            {activities.length ? (
              activities.map((activity) => {
                const sessionLabel = formatSessionDuration(getActivitySessionMs(activity, presence, now, mainGameName));
                const partySize = getActivityPartySize(activity);
                const hasGameStreak = Boolean(
                  streak?.alive && streak.streak > 0 && activity.type === 0 && streak.game === activity.name
                );
                const streakTooltip = hasGameStreak
                  ? {
                      iconType: "streak",
                      label: "Racha activa",
                      sublabel: `Has jugado ${activity.name} ${streak.streak} días seguidos`,
                      tooltipWidth: 240
                    }
                  : null;

                return (
                  <article className="discord-activity-card" key={`${activity.name}-${activity.detail}`}>
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
                    <div className="min-w-0">
                      <span>{activity.typeLabel}</span>
                      <strong>{activity.name}</strong>
                      {activity.detail ? <p>{activity.detail}</p> : null}
                      {activity.state ? <small>{activity.state}</small> : null}
                      {activity.isSpotify ? (
                        <SpotifyProgress now={now} timestamps={activity.timestamps} />
                      ) : null}
                      {sessionLabel || partySize || hasGameStreak ? (
                        <div className="discord-activity-session" aria-label="Game session details">
                          {partySize ? (
                            <span
                              className="discord-party-chip"
                              title={`${partySize.current} de ${partySize.maximum} jugadores`}
                            >
                              <Users size={12} aria-hidden="true" />
                              {partySize.current} de {partySize.maximum}
                            </span>
                          ) : null}
                          {sessionLabel ? (
                            <span className="discord-session-chip">
                              <Gamepad2 size={12} aria-hidden="true" />
                              {sessionLabel}
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
                    <em>{activity.meta}</em>
                  </article>
                );
              })
            ) : (
              <div className="discord-presence-empty">
                <span>NO ACTIVITY SIGNAL</span>
                <p>Ahora mismo no hay actividades visibles. El radar sigue escuchando juego, Spotify y estados de Discord.</p>
              </div>
            )}
          </div>

          <div className="discord-presence-footer">
            <span>{loading ? "syncing lanyard..." : `last sync // ${formatUpdatedAt(updatedAt)}`}</span>
            <span>{error ? "api fallback mode" : "presence online"}</span>
          </div>
        </div>
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
