// The signed-in Discord display name becomes FTE's `name` cvar via
// `+set name <name>`, which the engine applies after the saved config.cfg.
// FTE joins command-line arguments back into console text, so only plain
// characters pass: no quotes, `;`, `$`, `/`, `+`, `^` colour codes, or a
// leading `-` that would start a new command-line switch. Accents are folded
// to ASCII because the menu font has no other glyphs.
export const NZP_NAME_MAX = 32;

export function nzpPlayerName(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^A-Za-z0-9 _.-]/g, "")
    .replace(/\s+/g, " ")
    .replace(/^[ _.-]+/, "")
    .slice(0, NZP_NAME_MAX)
    .trim();
}
