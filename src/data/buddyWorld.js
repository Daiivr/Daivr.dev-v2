export const FISH_CATALOG = [
  { id: "byte-minnow", name: "Byte Minnow", rarity: "common", kind: "fish", color: "#45d8ff", lore: "Travels in neat little packets." },
  { id: "cache-carp", name: "Cache Carp", rarity: "common", kind: "fish", color: "#3fff97", lore: "Always returns faster the second time." },
  { id: "pixel-perch", name: "Pixel Perch", rarity: "common", kind: "fish", color: "#ffd166", lore: "Exactly sixteen pixels when nobody is looking." },
  { id: "buffer-bass", name: "Buffer Bass", rarity: "common", kind: "fish", color: "#67e8f9", lore: "Pauses briefly before every turn." },
  { id: "cursor-guppy", name: "Cursor Guppy", rarity: "common", kind: "fish", color: "#f4fff8", lore: "Blinks whenever it thinks nobody is watching." },
  { id: "ping-sardine", name: "Ping Sardine", rarity: "common", kind: "fish", color: "#73ffad", lore: "Replies from the deep in under twelve milliseconds." },
  { id: "syntax-salmon", name: "Syntax Salmon", rarity: "uncommon", kind: "fish", color: "#ff8c69", lore: "Swims upstream through malformed code." },
  { id: "neon-tetra", name: "Neon Tetra", rarity: "uncommon", kind: "fish", color: "#ff3d9d", lore: "A tiny living cabinet light." },
  { id: "circuit-catfish", name: "Circuit Catfish", rarity: "uncommon", kind: "fish", color: "#3fff97", lore: "Its whiskers complete any circuit they touch." },
  { id: "cobalt-cod", name: "Cobalt Cod", rarity: "uncommon", kind: "fish", color: "#4f8cff", lore: "Leaves a blue diagnostic trail through dark water." },
  { id: "packet-puffer", name: "Packet Puffer", rarity: "uncommon", kind: "fish", color: "#ffd166", lore: "Inflates when the network gets congested." },
  { id: "void-eel", name: "Void Eel", rarity: "rare", kind: "fish", color: "#a78bfa", lore: "Long enough to wrap around an unused variable." },
  { id: "glitch-koi", name: "Glitch Koi", rarity: "rare", kind: "fish", color: "#ff3d9d", lore: "Exists in two frames at once." },
  { id: "recursion-ray", name: "Recursion Ray", rarity: "rare", kind: "fish", color: "#45d8ff", lore: "A ray inside a ray inside a ray." },
  { id: "firewall-fangfish", name: "Firewall Fangfish", rarity: "rare", kind: "fish", color: "#ff5f68", lore: "Blocks every hook except the one it bites." },
  { id: "prism-piranha", name: "Prism Piranha", rarity: "rare", kind: "fish", color: "#f472d0", lore: "Splits cabinet light into dangerous little rainbows." },
  { id: "starfin", name: "Starfin", rarity: "legendary", kind: "fish", color: "#ffd166", lore: "Its scales remember old high scores." },
  { id: "crown-coelacanth", name: "Crown Coelacanth", rarity: "legendary", kind: "fish", color: "#f6c453", lore: "An ancient champion from before the first cabinet." },
  { id: "aurora-arowana", name: "Aurora Arowana", rarity: "legendary", kind: "fish", color: "#67e8f9", lore: "Paints the water green, blue, and violet as it turns." },
  { id: "chrono-manta", name: "Chrono Manta", rarity: "mythic", kind: "fish", color: "#c084fc", lore: "Its shadow arrives three seconds before it does." },
  { id: "moonkernel-sturgeon", name: "Moonkernel Sturgeon", rarity: "mythic", kind: "fish", color: "#f4fff8", lore: "Carries a tiny moon in its armored memory core." },
  { id: "old-boot", name: "Old Boot", rarity: "junk", kind: "junk", color: "#7b8f82", lore: "Left foot. Suspiciously warm." },
  { id: "soggy-disk", name: "Soggy Floppy", rarity: "junk", kind: "junk", color: "#6da58a", lore: "The save file is mostly water." },
  { id: "cracked-controller", name: "Cracked Controller", rarity: "junk", kind: "junk", color: "#8b9a91", lore: "Player two was not gentle with it." },
  { id: "rusty-can", name: "Rusty Energy Can", rarity: "junk", kind: "junk", color: "#9b7556", lore: "Expired sometime before the footer was compiled." },
  { id: "tangled-cable", name: "Tangled Cable", rarity: "junk", kind: "junk", color: "#58756a", lore: "Tied itself into a knot while nobody was looking." },
  { id: "wet-keyboard", name: "Wet Keyboard", rarity: "junk", kind: "junk", color: "#70877b", lore: "Only the F and the 7 still work." },
  { id: "token-chest", name: "Token Chest", rarity: "treasure", kind: "treasure", color: "#ffd166", lore: "Still jingling with arcade credits." }
];

export const FIELD_FINDS = [
  { id: "arcade-coin", name: "Arcade Coin", color: "#ffd166", line: "a credit! shiny." },
  { id: "floppy-disk", name: "Floppy Disk", color: "#45d8ff", line: "ancient save technology." },
  { id: "battery", name: "Tiny Battery", color: "#3fff97", line: "portable zap acquired." },
  { id: "lost-bug", name: "Friendly Bug", color: "#ff3d9d", line: "this bug has a permit." },
  { id: "mini-cartridge", name: "Mini Cartridge", color: "#a78bfa", line: "bonus level located!" }
];

export const AMBIENT_CREATURES = [
  { id: "moth", name: "Phosphor Moth" },
  { id: "bird", name: "Signal Bird" },
  { id: "frog", name: "Rain Frog" },
  { id: "leap-fish", name: "Jumping Bytefish" }
];

export const ENEMY_BUGS = [
  { id: "null-beetle", name: "Null Beetle" },
  { id: "stack-roach", name: "Stack Roach" },
  { id: "memory-mite", name: "Memory Mite" }
];

export const LEVIATHAN = {
  id: "void-leviathan",
  name: "Void Leviathan",
  rarity: "mythic",
  kind: "sighting",
  color: "#ff3d9d",
  lore: "Too large for the journal scanner. Too large for the footer."
};

export function fishById(id) {
  return FISH_CATALOG.find((item) => item.id === id);
}

export function weightedCatch(lure = "") {
  const roll = Math.random();
  let rarity;

  if (roll < 0.3) rarity = "common";
  else if (roll < 0.52) rarity = "uncommon";
  else if (roll < 0.68) rarity = "junk";
  else if (roll < (lure === "lure" ? 0.9 : 0.87)) rarity = "rare";
  else if (roll < 0.95) rarity = "treasure";
  else if (roll < 0.992) rarity = "legendary";
  else rarity = "mythic";

  if (rarity === "junk" && lure === "lure-magnet") rarity = "uncommon";
  const pool = FISH_CATALOG.filter((item) => item.rarity === rarity);
  return pool[Math.floor(Math.random() * pool.length)] || FISH_CATALOG[0];
}
