import { LURES, MARKET_GEAR, MARKET_TACKLE } from "../../shared/buddy-market.mjs";
import { useEffect, useMemo, useRef, useState } from "react";
import { BUDDY_INVENTORY } from "./useBuddyAdventure";

const GEAR_STORAGE_KEY = "daivr.buddyGearHidden.v1";
const GUEST_GEAR_STORAGE_KEY = "daivr.buddyGearHidden.guest.v1";
const GEAR_OWNER_STORAGE_KEY = "daivr.buddyGearHidden.owner.v1";
// Interruptor de admin (comando de consola `unlockall`): abre todo el vestuario
// sin tocar el progreso real. Es deliberadamente efimero: cada sesion debe
// volver a pasar la comprobacion Discord del terminal.
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

// (los señuelos ya no se desbloquean para siempre: se gastan. Los que antes se
// ganaban pescando traen usos gratis al ganarlos: LURE_GRANTS del mercado.)

// Las recompensas Miku caen al llenar el diario. El peluco ocupa cabeza; el
// traje vive en su propio slot y sustituye el sprite completo cuando se usa.
export const JOURNAL_GEAR = [
  { id: "miku-wig", label: "miku wig" },
  { id: "miku-costume", label: "miku costume" }
];
// El diario del valle (los peces de Stardew) trae el traje de pescador:
// sombrero de pesca con señuelo, chaleco con bolsillos y botas de agua.
export const VALLEY_GEAR = [
  { id: "fisher-outfit", label: "fisherman outfit", perk: "valley journal complete" }
];

// Secretos: no se dice que existen hasta que caen (en el inventario son un
// hueco "???"). El pixel blaster, al borrar 100 bichos en las cacerias.
export const SECRET_GEAR = [
  { id: "pixel-blaster", label: "pixel blaster", unlockBugs: 100, secret: true, perk: "secret: 100 bugs deleted. pew pew." }
];
export const SECRET_UNLOCK_EVENT = "daivr-buddy-secret-unlock";

export const HEADWEAR_IDS = ["market-beanie", "market-straw-hat", "market-frog-hat", "market-bucket-hat", "party-hat", "star-cap", "pixel-crown", "miku-wig"];
export const FACE_GEAR_IDS = ["sunglasses", "green-visor", "market-specs"];
export const BODY_GEAR_IDS = ["scarf", "market-vest", "market-overalls", "market-hoodie", "market-raincoat"];
// La antena: la de chispas (amistad) o el brote del mercado, una u otra.
export const ANTENNA_IDS = ["gold-antenna", "market-sprout"];
// Para la lluvia: el paraguas de hoja sustituye al de rayas.
export const RAIN_GEAR_IDS = ["market-leaf-umbrella"];
export const MOBILITY_IDS = ["rocket-boots", "parachute-upgrade"];
export const COSTUME_IDS = ["miku-costume", "fisher-outfit"];

function isEditableWithMikuCostume(id) {
  return id === "miku-costume" || ROD_IDS.includes(id) || LURE_IDS.includes(id);
}
// (las del mercado, detras: las que se ganan pescando siguen primero)
export const ROD_IDS = [...ROD_GEAR.map((item) => item.id), ...MARKET_TACKLE.filter((item) => item.slot === "rod").map((item) => item.id)];
// El lucky lure (recompensa de quest) comparte slot con los señuelos pescados.
// (los señuelos se gastan: los que tienen usos estan en el inventario)
export const LURE_IDS = LURES.map((lure) => lure.id);
const CARRY_ITEM_IDS = ["cartridge", "wrench", "pixel-blaster"];

// Vestuario completo: todo lo equipable, sin importar como se gana. Lo usa el
// override de admin para mostrarlo todo de golpe.
const ALL_COSMETICS = [
  ...FRIENDSHIP_GEAR,
  ...PET_GEAR,
  ...JOURNAL_GEAR,
  ...VALLEY_GEAR,
  ...SECRET_GEAR,
  ...ROD_GEAR,
  ...BUDDY_INVENTORY,
  ...MARKET_GEAR,
  ...LURES.map((lure) => ({ ...lure, source: lure.seller === "market" ? "Woodland market bait shelf" : "Sold by the traveling fisherman" }))
];

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
  if (ANTENNA_IDS.includes(id)) return "antenna";
  if (BODY_GEAR_IDS.includes(id)) return "body";
  if (ROD_IDS.includes(id)) return "rod";
  if (LURE_IDS.includes(id)) return "lure";
  if (["wrench", "pixel-blaster", "cartridge", "coffee", "headset"].includes(id)) return "utility";
  if (MOBILITY_IDS.includes(id)) return "mobility";
  if (RAIN_GEAR_IDS.includes(id)) return "rain";
  return "utility";
}

export function useBuddyLoadout({ friendship, adventure }) {
  const [hiddenGear, setHiddenGear] = useState(() => readHiddenGear());
  const [ready, setReady] = useState(false);
  const [adminUnlock, setAdminUnlock] = useState(false);
  const hiddenGearRef = useRef(hiddenGear);
  const storageKeyRef = useRef(GEAR_STORAGE_KEY);
  const syncedRef = useRef(false);

  // Comando de consola `unlockall`: alterna el override de vestuario en vivo.
  useEffect(() => {
    function handleAdminUnlock(event) {
      const value = event.detail?.value !== false;
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
      } finally {
        if (!cancelled) setReady(true);
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
    const unlockedTackle = ROD_GEAR.filter((item) =>
      item.unlockRares ? rareCatches >= item.unlockRares : totalCatches >= item.unlockCatches
    );
    // El peluco cae al completar el diario: todas las especies escaneadas.
    // (solo el diario original: el del valle trae su propio traje)
    const totalSpecies = adventure.stationFishTotal || 0;
    const journalComplete = totalSpecies > 0 && (adventure.discoveredFishCount || 0) >= totalSpecies;
    const unlockedJournalGear = journalComplete ? JOURNAL_GEAR : [];
    const unlockedSecretGear = SECRET_GEAR.filter((item) => (adventure.bugsDefeated || 0) >= item.unlockBugs);
    const unlockedValleyGear = adventure.valleyComplete ? VALLEY_GEAR : [];

    return [
      ...unlockedFriendshipGear.map((item) => ({ ...item, source: `friendship lv ${item.unlockLevel}` })),
      ...unlockedPetGear.map((item) => ({ ...item, source: `${item.unlockPets} pets` })),
      ...unlockedJournalGear.map((item) => ({ ...item, source: "journal 100%" })),
      ...unlockedValleyGear.map((item) => ({ ...item, source: "valley journal 100%" })),
      ...unlockedSecretGear.map((item) => ({ ...item, source: `${item.unlockBugs} bugs deleted` })),
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
  }, [adminUnlock, adventure.bugsDefeated, adventure.valleyComplete, adventure.discoveredFishCount, adventure.fishJournal, adventure.inventory, adventure.rareCatches, adventure.totalCatches, friendship.level, friendship.pets]);

  const unlockedGearIds = useMemo(() => gearItems.map((item) => item.id), [gearItems]);
  const availableHeadwearIds = unlockedGearIds.filter((id) => HEADWEAR_IDS.includes(id));
  const equippedHeadwear = [...availableHeadwearIds].reverse().find((id) => !hiddenGear.includes(id)) || "";
  const availableFaceGearIds = unlockedGearIds.filter((id) => FACE_GEAR_IDS.includes(id));
  const equippedFaceGear = availableFaceGearIds.find((id) => !hiddenGear.includes(id)) || "";
  // (el brote va primero: si se compra, se lo pone en vez de la de chispas)
  const availableAntennaIds = unlockedGearIds.filter((id) => ANTENNA_IDS.includes(id)).sort((a, b) => ANTENNA_IDS.indexOf(b) - ANTENNA_IDS.indexOf(a));
  const equippedAntenna = availableAntennaIds.find((id) => !hiddenGear.includes(id)) || "";
  const availableBodyGearIds = unlockedGearIds.filter((id) => BODY_GEAR_IDS.includes(id));
  const equippedBodyGear = [...availableBodyGearIds].reverse().find((id) => !hiddenGear.includes(id)) || "";
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
    ...availableAntennaIds.filter((id) => id !== equippedAntenna),
    ...availableBodyGearIds.filter((id) => id !== equippedBodyGear),
    ...availableMobilityIds.filter((id) => id !== equippedMobility),
    ...availableCostumeIds.filter((id) => id !== equippedCostume),
    ...availableRodIds.filter((id) => id !== equippedRod),
    ...availableLureIds.filter((id) => id !== equippedLure),
    ...availableCarryItemIds.filter((id) => id !== equippedCarryItem)
  ]), [availableAntennaIds, availableBodyGearIds, availableCarryItemIds, availableCostumeIds, availableFaceGearIds, availableHeadwearIds, availableLureIds, availableMobilityIds, availableRodIds, equippedAntenna, equippedBodyGear, equippedCarryItem, equippedCostume, equippedFaceGear, equippedHeadwear, equippedLure, equippedMobility, equippedRod, hiddenGear]);

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

      if (ANTENNA_IDS.includes(id)) {
        const nonAntennaHidden = current.filter((itemId) => !availableAntennaIds.includes(itemId));
        return [...nonAntennaHidden, ...availableAntennaIds.filter((itemId) => itemId !== id)];
      }

      if (FACE_GEAR_IDS.includes(id)) {
        const nonFaceGearHidden = current.filter((itemId) => !availableFaceGearIds.includes(itemId));
        return [...nonFaceGearHidden, ...availableFaceGearIds.filter((itemId) => itemId !== id)];
      }

      if (BODY_GEAR_IDS.includes(id)) {
        const nonBodyGearHidden = current.filter((itemId) => !BODY_GEAR_IDS.includes(itemId));
        return [...nonBodyGearHidden, ...BODY_GEAR_IDS.filter((itemId) => itemId !== id)];
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
    adminUnlock,
    ready: ready && adventure.ready,
    effectiveHiddenGear,
    equipGear,
    gearItems,
    catalogItems: ALL_COSMETICS.map((item) => {
      const owned = gearItems.find((gear) => gear.id === item.id);
      // (un secreto sin ganar: ni nombre, ni pista, ni barra de progreso)
      if (item.secret && !owned) return { id: item.id, label: "???", slot: slotForGear(item.id), unlocked: false, secretLocked: true, requirement: "A secret. Keep exploring.", progress: 0, goal: 1 };
      const quest = adventure.quests.find((entry) => entry.reward === item.id);
      const valley = VALLEY_GEAR.some((gear) => gear.id === item.id);
      const goal = item.unlockLevel || item.unlockPets || item.unlockRares || item.unlockCatches || (JOURNAL_GEAR.some((gear) => gear.id === item.id) ? adventure.stationFishTotal : valley ? adventure.valleyFishTotal : quest?.goal) || 1;
      const progress = item.unlockLevel ? friendship.level : item.unlockPets ? friendship.pets : item.unlockRares ? adventure.rareCatches : item.unlockCatches ? adventure.totalCatches : JOURNAL_GEAR.some((gear) => gear.id === item.id) ? adventure.discoveredFishCount : valley ? adventure.discoveredValleyCount : quest?.progress || 0;
      const requirement = item.unlockLevel ? `Reach friendship level ${goal}` : item.unlockPets ? `Pet Buddy ${goal} times` : item.unlockRares ? `Land ${goal} rare catches` : item.unlockCatches ? `Land ${goal} catches` : JOURNAL_GEAR.some((gear) => gear.id === item.id) ? "Complete the catch journal" : valley ? "Complete the valley journal" : quest ? `Quest: ${quest.title}` : item.source;
      return { ...item, ...owned, slot: slotForGear(item.id), unlocked: !!owned, requirement, progress: Math.min(goal, progress || 0), goal };
    }),
    hiddenGear,
    stashGear,
    toggleGear,
    unlockedGearIds
  };
}
