const DEFAULT_DISCORD_USER_ID = "271701484922601472";
const DEFAULT_PROFILE_FRAME_SKU = "1491908830844424302";
const FRAME_CACHE_MS = 5 * 60 * 1000;
const DISCORD_API_BASE = "https://discord.com/api/v10";
const DISCORD_CDN_BASE = "https://cdn.discordapp.com/media/v1/collectibles-shop";

let cachedFrame = null;
let cachedAt = 0;

function isSnowflake(value) {
  return typeof value === "string" && /^\d{16,22}$/.test(value);
}

async function getEquippedFrameSku() {
  const discordId = process.env.DISCORD_USER_ID || DEFAULT_DISCORD_USER_ID;
  const fallbackSku = process.env.DISCORD_PROFILE_FRAME_SKU || DEFAULT_PROFILE_FRAME_SKU;

  try {
    const response = await fetch(`https://dcdn.dstn.to/profile/${discordId}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(4_000)
    });

    if (!response.ok) throw new Error(`profile lookup returned ${response.status}`);

    const payload = await response.json();
    const collectibles = Array.isArray(payload?.user_profile?.collectibles)
      ? payload.user_profile.collectibles
      : [];
    const profileFrame = collectibles.find((item) => item?.type === 3 && isSnowflake(String(item.sku_id || "")));

    return profileFrame ? String(profileFrame.sku_id) : fallbackSku;
  } catch (error) {
    console.error("Discord profile frame lookup error:", error.message || error);
    return fallbackSku;
  }
}

function normalizeFrameProduct(product, skuId) {
  const frame = Array.isArray(product?.items)
    ? product.items.find((item) => item?.type === 3)
    : null;

  if (!frame || !isSnowflake(skuId) || !Array.isArray(frame.layers)) return null;

  const layers = frame.layers
    .filter((layer) => isSnowflake(String(layer?.id || "")))
    .map((layer) => ({
      anchor: ["top", "bottom", "center"].includes(layer.anchor) ? layer.anchor : "top",
      id: String(layer.id),
      order: layer.order === "back" ? "back" : "front",
      responsive: Boolean(layer.responsive),
      src: `${DISCORD_CDN_BASE}/${skuId}/${layer.id}/static`,
      type: ["staple", "rail", "border"].includes(layer.type) ? layer.type : "staple"
    }));

  if (!layers.length) return null;

  return {
    innerWidth: Number(frame.inner_width) || 1200,
    label: frame.label || product.name || "Discord profile frame",
    layers,
    name: product.name || "Discord profile frame",
    overflowBottom: Number(frame.overflow_bottom) || 0,
    overflowHorizontal: Number(frame.overflow_horizontal) || 0,
    overflowTop: Number(frame.overflow_top) || 0,
    skuId
  };
}

export async function getDiscordProfileFrame() {
  if (cachedFrame && Date.now() - cachedAt < FRAME_CACHE_MS) return cachedFrame;

  const skuId = await getEquippedFrameSku();
  if (!isSnowflake(skuId)) return null;

  const response = await fetch(`${DISCORD_API_BASE}/collectibles-products/${skuId}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(5_000)
  });

  if (!response.ok) throw new Error(`Discord collectible returned ${response.status}`);

  const frame = normalizeFrameProduct(await response.json(), skuId);
  if (frame) {
    cachedFrame = frame;
    cachedAt = Date.now();
  }

  return frame;
}

export async function handleDiscordProfileFrameRequest(_request, response) {
  try {
    const frame = await getDiscordProfileFrame();
    response.writeHead(200, {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
      "Content-Type": "application/json; charset=utf-8"
    });
    response.end(JSON.stringify({ frame }));
  } catch (error) {
    console.error("Discord profile frame error:", error.message || error);
    response.writeHead(502, {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8"
    });
    response.end(JSON.stringify({ error: "Profile frame unavailable", frame: null }));
  }
}
