import { useEffect, useMemo, useRef, useState } from "react";
import { BUDDY_INVENTORY } from "./useBuddyAdventure";

const GEAR_STORAGE_KEY = "daivr.buddyGearHidden.v1";
const GUEST_GEAR_STORAGE_KEY = "daivr.buddyGearHidden.guest.v1";
const GEAR_OWNER_STORAGE_KEY = "daivr.buddyGearHidden.owner.v1";
// Interruptor de admin (comando de consola `unlockall`): abre todo el vestuario
// sin tocar el progreso real — es un override local, no se sincroniza al server.
const ADMIN_UNLOCK_STORAGE_KEY = "daivr.buddyAdminUnlock.v1";
const ADMIN_UNLOCK_EVENT = "daivr-buddy-admin-unlock";
const BUDDY_ENDPOINT = "/api/buddy";

export const FRIENDSHIP_GEAR = [
  { id: "party-hat", label: "party hat", unlockLevel: 2 },
  { id: "sunglasses", label: "sunglasses", unlockLevel: 3 },
  { id: "scarf", label: "scarf", unlockLevel: 4 },
  { id: "gold-antenna", label: "spark antenna", unlockLevel: 5 }
];

export const PET_GEAR = [
  { id: "green-visor", label: "green visor", unlockPets: 3 },
  { id: "star-cap", label: "star cap", unlockPets: 8 },
  { id: "pixel-crown", label: "pixel crown", unlockPets: 18 },
  { id: "rocket-boots", label: "rocket boots", unlockPets: 35 }
];

// Aparejos de pesca: se desbloquean pescando. Las cañas son puro cosmetico
// (recolorean la caña de la sesion); los señuelos cambian las reglas de pesca
// y solo puede haber uno puesto — elegir es la gracia.
export const ROD_GEAR = [
  { id: "rod-driftwood", label: "driftwood rod", unlockCatches: 1 },
  { id: "rod-bamboo", label: "bamboo rod", unlockCatches: 6 },
  { id: "rod-neon", label: "neon rod", unlockCatches: 14 },
  { id: "rod-golden", label: "golden rod", unlockRares: 4 }
];

export const LURE_GEAR = [
  { id: "lure-swift", label: "swift lure", unlockCatches: 10, perk: "bites come way faster" },
  { id: "lure-anchor", label: "anchor lure", unlockCatches: 20, perk: "rares almost never escape" },
  { id: "lure-magnet", label: "magnet lure", unlockRares: 6, perk: "junk upgrades to common" }
];

// Las recompensas Miku caen al llenar el diario. El peluco ocupa cabeza; el
// traje vive en su propio slot y sustituye el sprite completo cuando se usa.
export const JOURNAL_GEAR = [
  { id: "miku-wig", label: "miku wig" },
  { id: "miku-costume", label: "miku costume" }
];

export const HEADWEAR_IDS = ["party-hat", "star-cap", "pixel-crown", "miku-wig"];
export const FACE_GEAR_IDS = ["sunglasses", "green-visor"];
export const MOBILITY_IDS = ["rocket-boots", "parachute-upgrade"];
export const COSTUME_IDS = ["miku-costume"];

function isEditableWithMikuCostume(id) {
  return id === "miku-costume" || ROD_IDS.includes(id) || LURE_IDS.includes(id);
}
export const ROD_IDS = ROD_GEAR.map((item) => item.id);
// El lucky lure (recompensa de quest) comparte slot con los señuelos pescados.
export const LURE_IDS = ["lure", ...LURE_GEAR.map((item) => item.id)];
const CARRY_ITEM_IDS = ["cartridge", "wrench"];

// Vestuario completo: todo lo equipable, sin importar como se gana. Lo usa el
// override de admin para mostrarlo todo de golpe.
const ALL_COSMETICS = [
  ...FRIENDSHIP_GEAR,
  ...PET_GEAR,
  ...JOURNAL_GEAR,
  ...ROD_GEAR,
  ...LURE_GEAR,
  ...BUDDY_INVENTORY
];

function readAdminUnlock() {
  try {
    return window.localStorage.getItem(ADMIN_UNLOCK_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeAdminUnlock(value) {
  try {
    if (value) window.localStorage.setItem(ADMIN_UNLOCK_STORAGE_KEY, "1");
    else window.localStorage.removeItem(ADMIN_UNLOCK_STORAGE_KEY);
  } catch {
    // Admin override is a local-only dev toggle; ignore storage failures.
  }
}

function readHiddenGear(key = GEAR_STORAGE_KEY) {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeHiddenGear(items, key = GEAR_STORAGE_KEY) {
  try {
    window.localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // Cosmetic loadout is local-only; ignore storage failures.
  }
}

function readGearOwner() {
  try {
    return String(window.localStorage.getItem(GEAR_OWNER_STORAGE_KEY) || "");
  } catch {
    return "";
  }
}

function writeGearOwner(userId) {
  try {
    window.localStorage.setItem(GEAR_OWNER_STORAGE_KEY, String(userId || ""));
  } catch {
    // Server state remains available when local storage is blocked.
  }
}

function unique(items) {
  return [...new Set(items)];
}

export function slotForGear(id) {
  if (COSTUME_IDS.includes(id)) return "costume";
  if (HEADWEAR_IDS.includes(id)) return "head";
  if (FACE_GEAR_IDS.includes(id)) return "face";
  if (id === "gold-antenna") return "antenna";
  if (id === "scarf") return "neck";
  if (ROD_IDS.includes(id)) return "rod";
  if (LURE_IDS.includes(id)) return "lure";
  if (["wrench", "cartridge", "coffee", "headset"].includes(id)) return "utility";
  if (MOBILITY_IDS.includes(id)) return "mobility";
  return "utility";
}

export function useBuddyLoadout({ friendship, adventure }) {
  const [hiddenGear, setHiddenGear] = useState(() => readHiddenGear());
  const [adminUnlock, setAdminUnlock] = useState(() => readAdminUnlock());
  const hiddenGearRef = useRef(hiddenGear);
  const storageKeyRef = useRef(GEAR_STORAGE_KEY);
  const syncedRef = useRef(false);

  // Comando de consola `unlockall`: alterna el override de vestuario en vivo.
  useEffect(() => {
    function handleAdminUnlock(event) {
      const value = event.detail?.value !== false;
      writeAdminUnlock(value);
      setAdminUnlock(value);
    }
    window.addEventListener(ADMIN_UNLOCK_EVENT, handleAdminUnlock);
    return () => window.removeEventListener(ADMIN_UNLOCK_EVENT, handleAdminUnlock);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadServerLoadout() {
      try {
        const response = await fetch(BUDDY_ENDPOINT, { credentials: "include" });
        if (!response.ok || cancelled) return;
        const payload = await response.json();
        if (cancelled) return;

        if (!payload?.user) {
          if (readGearOwner()) {
            const guest = unique(readHiddenGear(GUEST_GEAR_STORAGE_KEY));
            storageKeyRef.current = GUEST_GEAR_STORAGE_KEY;
            hiddenGearRef.current = guest;
            setHiddenGear(guest);
          }
          return;
        }

        const userId = String(payload.user);
        const owner = readGearOwner();
        const canClaimLocal = !owner || owner === userId;
        const next = unique(payload.hasLoadout ? payload.hiddenGear : canClaimLocal ? hiddenGearRef.current : []);
        storageKeyRef.current = GEAR_STORAGE_KEY;
        hiddenGearRef.current = next;
        setHiddenGear(next);
        writeGearOwner(userId);
        writeHiddenGear(next, GEAR_STORAGE_KEY);
        syncedRef.current = true;

        await fetch(BUDDY_ENDPOINT, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "save-loadout", hiddenGear: next })
        });
      } catch {
        // The local loadout remains usable while offline.
      }
    }

    loadServerLoadout();
    return () => {
      cancelled = true;
    };
  }, []);

  const gearItems = useMemo(() => {
    // Override de admin: todo el vestuario disponible, ignorando el progreso.
    if (adminUnlock) {
      return ALL_COSMETICS.map((item) => ({ ...item, source: "admin unlock", slot: slotForGear(item.id) }));
    }

    const unlockedFriendshipGear = FRIENDSHIP_GEAR.filter((item) => friendship.level >= item.unlockLevel);
    const unlockedPetGear = PET_GEAR.filter((item) => friendship.pets >= item.unlockPets);
    const totalCatches = adventure.totalCatches || 0;
    const rareCatches = adventure.rareCatches || 0;
    const unlockedTackle = [...ROD_GEAR, ...LURE_GEAR].filter((item) =>
      item.unlockRares ? rareCatches >= item.unlockRares : totalCatches >= item.unlockCatches
    );
    // El peluco cae al completar el diario: todas las especies escaneadas.
    const totalSpecies = adventure.fishJournal?.length || 0;
    const journalComplete = totalSpecies > 0 && (adventure.discoveredFishCount || 0) >= totalSpecies;
    const unlockedJournalGear = journalComplete ? JOURNAL_GEAR : [];

    return [
      ...unlockedFriendshipGear.map((item) => ({ ...item, source: `friendship lv ${item.unlockLevel}` })),
      ...unlockedPetGear.map((item) => ({ ...item, source: `${item.unlockPets} pets` })),
      ...unlockedJournalGear.map((item) => ({ ...item, source: "journal 100%" })),
      ...unlockedTackle.map((item) => ({
        ...item,
        source: item.unlockRares
          ? `${item.unlockRares} rare ${item.unlockRares === 1 ? "catch" : "catches"}`
          : item.unlockCatches === 1
            ? "first catch"
            : `${item.unlockCatches} catches`
      })),
      ...adventure.inventory
    ].map((item) => ({ ...item, slot: slotForGear(item.id) }));
  }, [adminUnlock, adventure.discoveredFishCount, adventure.fishJournal, adventure.inventory, adventure.rareCatches, adventure.totalCatches, friendship.level, friendship.pets]);

  const unlockedGearIds = useMemo(() => gearItems.map((item) => item.id), [gearItems]);
  const availableHeadwearIds = unlockedGearIds.filter((id) => HEADWEAR_IDS.includes(id));
  const equippedHeadwear = [...availableHeadwearIds].reverse().find((id) => !hiddenGear.includes(id)) || "";
  const availableFaceGearIds = unlockedGearIds.filter((id) => FACE_GEAR_IDS.includes(id));
  const equippedFaceGear = availableFaceGearIds.find((id) => !hiddenGear.includes(id)) || "";
  const availableMobilityIds = unlockedGearIds.filter((id) => MOBILITY_IDS.includes(id));
  const equippedMobility = availableMobilityIds.find((id) => !hiddenGear.includes(id)) || "";
  const availableCostumeIds = unlockedGearIds.filter((id) => COSTUME_IDS.includes(id));
  const equippedCostume = availableCostumeIds.find((id) => !hiddenGear.includes(id)) || "";
  // Cañas: la mas nueva se equipa sola (como el headwear); señuelos: estable,
  // el puesto no cambia solo porque un perk nuevo aparezca.
  const availableRodIds = unlockedGearIds.filter((id) => ROD_IDS.includes(id));
  const equippedRod = [...availableRodIds].reverse().find((id) => !hiddenGear.includes(id)) || "";
  const availableLureIds = unlockedGearIds.filter((id) => LURE_IDS.includes(id));
  const equippedLure = availableLureIds.find((id) => !hiddenGear.includes(id)) || "";
  const availableCarryItemIds = unlockedGearIds.filter((id) => CARRY_ITEM_IDS.includes(id));
  const equippedCarryItem = availableCarryItemIds.find((id) => !hiddenGear.includes(id)) || "";

  const effectiveHiddenGear = useMemo(() => unique([
    ...hiddenGear,
    ...availableHeadwearIds.filter((id) => id !== equippedHeadwear),
    ...availableFaceGearIds.filter((id) => id !== equippedFaceGear),
    ...availableMobilityIds.filter((id) => id !== equippedMobility),
    ...availableCostumeIds.filter((id) => id !== equippedCostume),
    ...availableRodIds.filter((id) => id !== equippedRod),
    ...availableLureIds.filter((id) => id !== equippedLure),
    ...availableCarryItemIds.filter((id) => id !== equippedCarryItem)
  ]), [availableCarryItemIds, availableCostumeIds, availableFaceGearIds, availableHeadwearIds, availableLureIds, availableMobilityIds, availableRodIds, equippedCarryItem, equippedCostume, equippedFaceGear, equippedHeadwear, equippedLure, equippedMobility, equippedRod, hiddenGear]);

  const activeGearCount = gearItems.filter((item) => !effectiveHiddenGear.includes(item.id)).length;

  function updateHiddenGear(updater) {
    setHiddenGear((current) => {
      const next = unique(typeof updater === "function" ? updater(current) : updater);
      hiddenGearRef.current = next;
      writeHiddenGear(next, storageKeyRef.current);
      if (syncedRef.current) {
        fetch(BUDDY_ENDPOINT, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "save-loadout", hiddenGear: next })
        }).catch(() => {
          // The latest local choice is retried by the next session bootstrap.
        });
      }
      return next;
    });
  }

  function equipGear(id) {
    if (equippedCostume === "miku-costume" && !isEditableWithMikuCostume(id)) return;

    updateHiddenGear((current) => {
      if (HEADWEAR_IDS.includes(id)) {
        const nonHeadwearHidden = current.filter((itemId) => !availableHeadwearIds.includes(itemId));
        return [...nonHeadwearHidden, ...availableHeadwearIds.filter((itemId) => itemId !== id)];
      }

      if (FACE_GEAR_IDS.includes(id)) {
        const nonFaceGearHidden = current.filter((itemId) => !availableFaceGearIds.includes(itemId));
        return [...nonFaceGearHidden, ...availableFaceGearIds.filter((itemId) => itemId !== id)];
      }

      if (MOBILITY_IDS.includes(id)) {
        const nonMobilityHidden = current.filter((itemId) => !availableMobilityIds.includes(itemId));
        return [...nonMobilityHidden, ...availableMobilityIds.filter((itemId) => itemId !== id)];
      }

      if (COSTUME_IDS.includes(id)) {
        const nonCostumeHidden = current.filter((itemId) => !availableCostumeIds.includes(itemId));
        return [...nonCostumeHidden, ...availableCostumeIds.filter((itemId) => itemId !== id)];
      }

      if (ROD_IDS.includes(id)) {
        const nonRodHidden = current.filter((itemId) => !availableRodIds.includes(itemId));
        return [...nonRodHidden, ...availableRodIds.filter((itemId) => itemId !== id)];
      }

      if (LURE_IDS.includes(id)) {
        const nonLureHidden = current.filter((itemId) => !availableLureIds.includes(itemId));
        return [...nonLureHidden, ...availableLureIds.filter((itemId) => itemId !== id)];
      }

      if (CARRY_ITEM_IDS.includes(id)) {
        const nonCarryItemHidden = current.filter((itemId) => !availableCarryItemIds.includes(itemId));
        return [...nonCarryItemHidden, ...availableCarryItemIds.filter((itemId) => itemId !== id)];
      }

      return current.filter((itemId) => itemId !== id);
    });
  }

  function stashGear(id) {
    if (equippedCostume === "miku-costume" && !isEditableWithMikuCostume(id)) return;
    updateHiddenGear((current) => current.includes(id) ? current : [...current, id]);
  }

  function toggleGear(id) {
    if (equippedCostume === "miku-costume" && !isEditableWithMikuCostume(id)) return;
    if (effectiveHiddenGear.includes(id)) equipGear(id);
    else stashGear(id);
  }

  return {
    activeGearCount,
    effectiveHiddenGear,
    equipGear,
    gearItems,
    hiddenGear,
    stashGear,
    toggleGear,
    unlockedGearIds
  };
}
