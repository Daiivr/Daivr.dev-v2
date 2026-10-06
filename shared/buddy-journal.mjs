import { FISH_CATALOG } from "./buddy-catches.mjs";

export const FIELD_FINDS = [
  { id: "arcade-coin", name: "Arcade Coin", color: "#ffd166", line: "a credit! shiny." },
  { id: "floppy-disk", name: "Floppy Disk", color: "#45d8ff", line: "ancient save technology." },
  { id: "battery", name: "Tiny Battery", color: "#3fff97", line: "portable zap acquired." },
  { id: "lost-bug", name: "Friendly Bug", color: "#ff3d9d", line: "this bug has a permit." },
  { id: "mini-cartridge", name: "Mini Cartridge", color: "#a78bfa", line: "bonus level located!" }
];

// Check actual catalogue IDs, never collection length or client-supplied totals.
export function isBuddyJournalComplete(adventure) {
  const found = (collection, id) => Object.hasOwn(collection || {}, id)
    && Number.isFinite(Number(collection[id])) && Number(collection[id]) >= 1;
  return FISH_CATALOG.every(({ id }) => found(adventure?.fishCollection, id))
    && FIELD_FINDS.every(({ id }) => found(adventure?.foundObjects, id));
}
