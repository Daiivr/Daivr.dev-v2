import { ArrowUpRight, Gamepad2, Globe, Headphones, MessageSquare, Monitor, Radio, Smartphone, WifiOff } from "lucide-react";
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
      label: "Listening to Spotify",
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
  const isSyncing = loading && !presence;
  const statusText = customStatus?.text || (isSyncing ? "Connecting to Discord…" : error ? "Presence is temporarily unavailable." : "No status message set.");
  const activityLabel = activity?.label || (isSyncing ? "Checking activity" : error ? "Signal interrupted" : "Between sessions");
  const activityText = activity?.text || (isSyncing ? "Waiting for the first update." : error ? (presence ? "Showing the last known presence." : "Check back in a little while.") : "No game or music playing right now.");
  const ActivityIcon = activity?.icon === "spotify" ? Headphones : Gamepad2;
  const signalLabel = isSyncing ? "Syncing" : error ? "Reconnecting" : "Live";
  const platforms = { desktop: Monitor, mobile: Smartphone, web: Globe, embedded: Gamepad2 };

  return (
    <section
      className="discord-player-card"
      data-discord-status={statusKey}
      aria-label="Discord player status"
    >
      <div className="discord-player-topline"><span>01 <i aria-hidden="true">/</i> PLAYER PROFILE</span><span className="discord-player-signal" data-state={error ? "error" : isSyncing ? "syncing" : "live"}>{error ? <WifiOff size={11} aria-hidden="true" /> : <Radio size={11} aria-hidden="true" />}{signalLabel}</span></div>
      <div className="discord-player-identity">
        <a
          className="discord-player-avatar arcade-focus"
          href={discord.profileUrl}
          rel="noreferrer"
          target="_blank"
          aria-label={`Open ${displayName} on Discord`}
        >
          <span className="discord-player-avatar-viewport">
            <img
              className="discord-player-avatar-image"
              src={avatarUrl}
              alt={`${displayName} Discord avatar`}
              onError={(event) => { const fallback = new URL(discord.fallbackAvatar || profile.avatar, window.location.href).href; if (event.currentTarget.src !== fallback) event.currentTarget.src = fallback; }}
            />
          </span>
          {decorationUrl ? (
            <img
              className="discord-avatar-decoration"
              src={decorationUrl}
              alt=""
              aria-hidden="true"
            />
          ) : null}
        </a>

        <div className="discord-player-nameplate">
          <strong>{displayName}</strong>
          <span className={cn("discord-player-status", status.textClass)}><i className={status.colorClass} aria-hidden="true" />{status.label}</span>
          <a className="discord-player-profile-link arcade-focus" href={discord.profileUrl} target="_blank" rel="noreferrer" aria-label={`View ${displayName}'s Discord profile (opens in a new tab)`}>Discord profile<ArrowUpRight size={11} aria-hidden="true" /></a>
        </div>
      </div>

      <div className="discord-player-message">
        <span className="discord-player-caption">STATUS MESSAGE</span>
        <div>
          {customEmojiUrl ? (
            <img src={customEmojiUrl} alt={customStatus?.emoji?.name || ""} />
          ) : customStatus?.emoji?.name ? (
            <span aria-hidden="true">{customStatus.emoji.name}</span>
          ) : (
            <MessageSquare size={13} aria-hidden="true" />
          )}
          <p title={statusText}>{statusText}</p>
        </div>
      </div>
      <div className="discord-player-activity"><span className="discord-player-activity-icon"><ActivityIcon size={17} aria-hidden="true" /></span><div><strong>{activityLabel}</strong><p title={activityText}>{activityText}</p></div></div>
      <footer className="discord-player-footer"><span>{error ? "SIGNAL LOST" : isSyncing ? "CONNECTING" : "DISCORD PRESENCE"}</span><span className="discord-player-platforms">{platformTags.map((platform) => { const Icon = platforms[platform]; return <span key={platform}><Icon size={11} aria-hidden="true" />{platform}</span>; })}</span></footer>
    </section>
  );
}
