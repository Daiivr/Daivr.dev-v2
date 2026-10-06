export const NZP_GAME_URL = "/nzp/index.html";
export const NZP_MAX_PLAYERS = 4;

export function normalizeNzpAddress(value) {
  const code = String(value || "").trim();
  return /^\/?[0-9]{1,12}$/.test(code) ? `/${code.replace(/^\//, "")}` : "";
}

// Our canvas shell passes validated room numbers to FTE's +connect argument.
// Only relay room numbers are accepted; never arbitrary engine commands/URLs.
export function nzpJoinUrl(value) {
  const address = normalizeNzpAddress(value);
  return address ? `${NZP_GAME_URL}?room=${encodeURIComponent(address)}` : null;
}
