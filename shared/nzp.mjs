export const NZP_GAME_URL = "/nzp/index.html";
export const NZP_MAX_PLAYERS = 4;
export const NZP_SESSION_NAME_MAX = 32;
export const NZP_PASSWORD_MAX = 24;

// NZ:P's stock maps, in the game's own menu order and with its own names.
export const NZP_MAPS = [
  { id: "ndu", name: "Nacht der Untoten" },
  { id: "nzp_warehouse2", name: "Warehouse" },
  { id: "nzp_xmas2", name: "Tikhaya Noch" },
  { id: "nzp_warehouse", name: "Warehouse (Classic)" },
  { id: "christmas_special", name: "Christmas Special" },
  { id: "lexi_house", name: "House" },
  { id: "lexi_temple", name: "Temple" },
  { id: "lexi_overlook", name: "Overlook" }
];

export const nzpMapName = (id) => NZP_MAPS.find((map) => map.id === id)?.name || "NZ:P";

export function normalizeNzpAddress(value) {
  const code = String(value || "").trim();
  return /^\/?[0-9]{1,12}$/.test(code) ? `/${code.replace(/^\//, "")}` : "";
}

// Session names become the game's `hostname` and passwords its `password`
// cvar on the engine command line. FTE joins those arguments back into console
// text, so both keep to plain characters (public/nzp/shell.js re-checks them):
// no quotes, `;`, `$`, `/`, `+`, `^` colour codes or a leading `-`.
export function normalizeNzpSessionName(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^A-Za-z0-9 _.-]/g, "")
    .replace(/\s+/g, " ")
    .replace(/^[ _.-]+/, "")
    .slice(0, NZP_SESSION_NAME_MAX)
    .trim();
}

export const isNzpPassword = (value) => typeof value === "string" && /^[A-Za-z0-9_.-]{1,24}$/.test(value);

// Launch requests the website hands to the game wrapper (postMessage, never the
// URL, so passwords stay out of history and logs).
export function nzpHostLaunch({ name, map, password = "" }) {
  const hostname = normalizeNzpSessionName(name);
  if (!hostname || !NZP_MAPS.some(({ id }) => id === map) || (password && !isNzpPassword(password))) return null;
  return { mode: "host", name: hostname, map, password };
}

export function nzpJoinLaunch({ address, password = "" }) {
  const room = normalizeNzpAddress(address);
  if (!room || (password && !isNzpPassword(password))) return null;
  return { mode: "join", address: room, password };
}
