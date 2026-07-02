const DEFAULT_AVATAR_URL = "https://cdn.discordapp.com/embed/avatars/0.png";
const CACHE_TTL_MS = 1000 * 60 * 60 * 6;
const profileCache = new Map();

function setCache(key, profile) {
  profileCache.set(key, { profile, expiresAt: Date.now() + CACHE_TTL_MS });
  return profile;
}

function fallbackProfile(fallback = {}) {
  return {
    displayName: fallback.displayName || null,
    avatarUrl: fallback.avatarUrl || DEFAULT_AVATAR_URL
  };
}

export async function getDiscordUserProfile(userId, size = 64, fallback = {}) {
  const id = String(userId || "").trim();
  if (!id) return fallbackProfile(fallback);

  const key = `${id}:${size}`;
  const cached = profileCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.profile;

  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return fallbackProfile(fallback);

  try {
    const response = await fetch(`https://discord.com/api/v10/users/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bot ${token}` },
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) throw new Error(`Discord user profile returned ${response.status}`);
    const data = await response.json();
    const avatarHash = String(data?.avatar || "");
    const extension = avatarHash.startsWith("a_") ? "gif" : "png";

    return setCache(key, {
      displayName: data?.global_name || data?.username || fallback.displayName || null,
      avatarUrl: avatarHash
        ? `https://cdn.discordapp.com/avatars/${data.id}/${avatarHash}.${extension}?size=${size}`
        : DEFAULT_AVATAR_URL
    });
  } catch (error) {
    console.warn(`[discord-avatar] Could not refresh avatar for ${id}: ${error.message || error}`);
    return fallbackProfile(fallback);
  }
}

export async function getDiscordAvatarUrl(userId, size = 64, fallbackUrl = DEFAULT_AVATAR_URL) {
  const profile = await getDiscordUserProfile(userId, size, { avatarUrl: fallbackUrl });
  return profile.avatarUrl;
}

export { DEFAULT_AVATAR_URL };
