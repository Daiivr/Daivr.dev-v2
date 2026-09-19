export const GUIDES_PATH = "/fallout/guides";
export const SLASHER_PATH = `${GUIDES_PATH}/pint-sized-slasher-masks`;

// Shared by the browser, HTML generator and Node server.
export const FALLOUT_PAGES = {
  "/fallout": {
    title: "Fallout Terminal | daivr.dev",
    description: "Dai's Fallout 76 intelligence terminal: nuclear launch codes, Minerva's schedule and inventory, monthly axolotls, wasteland events, and collectable guides.",
  },
  [GUIDES_PATH]: {
    title: "Fallout 76 Guides | daivr.dev",
    description: "Fallout 76 field guides, collectable locations, and wasteland reference files from Dai's field station.",
  },
  [SLASHER_PATH]: {
    title: "Pint-Sized Slasher Masks Guide | daivr.dev",
    description: "An original Fallout 76 mask-hunting guide with a searchable spawn directory, interactive survey map, and challenge rewards.",
  },
};

export function normalizeFalloutPath(pathname) {
  return pathname.toLowerCase().replace(/\/+$/, "");
}

export function isGuidePath(pathname) {
  const path = normalizeFalloutPath(pathname);
  return path !== "/fallout" && Object.hasOwn(FALLOUT_PAGES, path);
}
