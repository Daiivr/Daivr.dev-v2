import { FISH_CATALOG } from "./buddy-catches.mjs";

export const ROOM_PALETTES = ["aurora", "plum", "amber"];
export const ROOM_BEDS = ["cot", "cushion", "bunk"];
export const ROOM_RUGS = ["checker", "moon", "none"];
export const ROOM_PROPS = ["plant", "lamp", "books"];
export const AQUARIUM_SLOTS = ["aquarium", "aquariumBackLeft", "aquariumBackRight"];
export const DEFAULT_ROOM = Object.freeze({ palette: "aurora", bed: "cot", rug: "checker", prop: "plant", aquarium: "", aquariumBackLeft: "", aquariumBackRight: "", shelfLeft: "", shelfRight: "" });

const choice = (value, choices, fallback) => choices.includes(value) ? value : fallback;
const catchKinds = new Map(FISH_CATALOG.map((item) => [item.id, item.kind]));

// The fish: prefix means fishing-journal origin, not necessarily a living fish.
export function isRoomDisplayAllowed(slot, key) {
  if (typeof key !== "string" || !/^(fish|find):[a-z0-9-]{1,60}$/.test(key)) return false;
  const shelf = slot === "shelfLeft" || slot === "shelfRight";
  const [origin, id] = key.split(":");
  if (origin === "find") return shelf;
  const kind = catchKinds.get(id);
  return AQUARIUM_SLOTS.includes(slot) ? kind === "fish" : shelf && (kind === "junk" || kind === "treasure");
}

const displayId = (value, slot) => isRoomDisplayAllowed(slot, value) ? value : "";

// Both browser storage and account saves use a bounded, version-independent shape.
export function normalizeRoom(value) {
  const source = value && typeof value === "object" ? value : {};
  const residents = new Set();
  const aquarium = Object.fromEntries(AQUARIUM_SLOTS.map((slot) => {
    const fish = displayId(source[slot], slot);
    if (!fish || residents.has(fish)) return [slot, ""];
    residents.add(fish);
    return [slot, fish];
  }));
  return {
    palette: choice(source.palette, ROOM_PALETTES, DEFAULT_ROOM.palette),
    bed: choice(source.bed, ROOM_BEDS, DEFAULT_ROOM.bed),
    rug: choice(source.rug, ROOM_RUGS, DEFAULT_ROOM.rug),
    prop: choice(source.prop, ROOM_PROPS, DEFAULT_ROOM.prop),
    ...aquarium,
    shelfLeft: displayId(source.shelfLeft, "shelfLeft"),
    shelfRight: displayId(source.shelfRight, "shelfRight")
  };
}

export function ownedRoomDisplays(adventure) {
  return [
    ...(adventure.fishJournal || []).filter((item) => item.discovered).map((item) => ({ ...item, key: `fish:${item.id}` })),
    ...(adventure.finds || []).filter((item) => item.discovered).map((item) => ({ ...item, key: `find:${item.id}` }))
  ];
}

export function roomSeason(event, date = new Date()) {
  if (event === "winter" || event === "halloween") return event;
  const month = date.getMonth();
  return month < 2 || month === 11 ? "winter" : month < 5 ? "spring" : month < 8 ? "summer" : "autumn";
}

