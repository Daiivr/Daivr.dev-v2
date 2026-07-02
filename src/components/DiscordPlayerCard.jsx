import { Gamepad2, Radio, WifiOff } from "lucide-react";
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

function getCustomStatus(activities = []) {
  const activity = activities.find((item) => item.type === 4);
  if (!activity) return null;

  return {
    emoji: activity.emoji,
    text: activity.state || activity.name
  };
}

function getActivityLine(presence) {
  if (presence?.listening_to_spotify && presence.spotify) {
    return {
      icon: "spotify",
      label: "listening",
      text: `${presence.spotify.song} // ${presence.spotify.artist}`
    };
  }

  const activity = presence?.activities?.find((item) => item.type !== 4 && item.name !== "Spotify");
  if (!activity) return null;

  return {
    icon: "activity",
    label: activity.name,
    text: [activity.details, activity.state].filter(Boolean).join(" // ") || "active now"
  };
}

function getPlatformTags(presence) {
  return [
    presence?.active_on_discord_desktop && "desktop",
    presence?.active_on_discord_web && "web",
    presence?.active_on_discord_mobile && "mobile",
    presence?.active_on_discord_embedded && "embedded"
  ].filter(Boolean);
}

export function DiscordPlayerCard() {
  const { data: presence, error, loading } = useLanyardPresence(discord.userId);
  const user = presence?.discord_user;
  const displayName = getDiscordDisplayName(user);
  const statusKey = loading && !presence ? "syncing" : presence?.discord_status || "offline";
  const status = discordStatusMeta[statusKey] || discordStatusMeta.offline;
  const avatarUrl = getDiscordAvatarUrl(user) || discord.fallbackAvatar || profile.avatar;
  const decorationUrl = getAvatarDecorationUrl(user);
  const customStatus = getCustomStatus(presence?.activities);
  const customEmojiUrl = getEmojiUrl(customStatus?.emoji);
  const activity = getActivityLine(presence);
  const platformTags = getPlatformTags(presence);
  const statusText = error ? "lanyard signal lost" : customStatus?.text || profile.location;
  const activityText = error ? "using local fallback avatar" : activity?.text || "night-shift build mode";

  return (
    <section
      className="discord-player-card panel mb-4 overflow-hidden p-3"
      data-discord-status={statusKey}
      aria-label="Discord player status"
    >
      <div className="relative grid grid-cols-[76px_minmax(0,1fr)] items-center gap-3">
        <a
          className="arcade-focus group relative block h-[76px] w-[76px]"
          href={discord.profileUrl}
          rel="noreferrer"
          target="_blank"
          aria-label={`Open ${displayName} on Discord`}
        >
          <span className="absolute inset-0 border border-cyan-arcade/45 bg-cyan-arcade/8 shadow-[0_0_22px_rgba(69,216,255,.16)]" />
          <img
            className="relative z-10 h-full w-full border border-phosphor/45 object-cover transition duration-200 group-hover:scale-[1.035]"
            src={avatarUrl}
            alt={`${displayName} Discord avatar`}
          />
          {decorationUrl ? (
            <img
              className="discord-avatar-decoration"
              src={decorationUrl}
              alt=""
              aria-hidden="true"
            />
          ) : null}
          <span
            className={cn(
              "absolute -bottom-1 -right-1 z-30 h-4 w-4 border-2 border-ink-950 shadow-[0_0_18px_currentColor]",
              status.colorClass
            )}
            aria-hidden="true"
          />
        </a>

        <div className="min-w-0">
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="pixel-label">PLAYER 01</p>
            <span className="inline-flex items-center gap-1 text-[0.62rem] font-black uppercase text-cyan-arcade">
              {error ? <WifiOff size={12} aria-hidden="true" /> : <Radio size={12} aria-hidden="true" />}
              {error ? "fallback" : "live"}
            </span>
          </div>
          <strong className="block truncate font-display text-xl leading-none text-white">{displayName}</strong>
          <small className={cn("mt-1 block truncate text-[0.68rem] font-black uppercase", status.textClass)}>
            {status.label}
          </small>
        </div>
      </div>

      <div className="relative z-10 mt-3 border-t border-phosphor/15 pt-3">
        <div className="flex min-w-0 items-center gap-2 text-xs font-black text-phosphor-soft/75">
          {customEmojiUrl ? (
            <img className="h-4 w-4 shrink-0" src={customEmojiUrl} alt={customStatus?.emoji?.name || ""} />
          ) : customStatus?.emoji?.name ? (
            <span className="shrink-0">{customStatus.emoji.name}</span>
          ) : (
            <Gamepad2 className="shrink-0 text-cabinet" size={15} aria-hidden="true" />
          )}
          <span className="truncate">{statusText}</span>
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="min-w-0 truncate text-[0.68rem] font-black uppercase text-phosphor-soft/45">
            {activity?.label || "lanyard sync"}
          </span>
          {platformTags.length ? (
            <span className="shrink-0 text-[0.62rem] font-black uppercase text-cyan-arcade/80">
              {platformTags[0]}
            </span>
          ) : null}
        </div>
        <p className="mt-1 truncate text-xs text-phosphor-soft/70">{activityText}</p>
      </div>
    </section>
  );
}
