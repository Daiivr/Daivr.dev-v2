import { bonusCoins, normalizeMarket, mergeMarket, marketWallet, openMarketChest, purchaseLure, purchaseMarketItem, purchaseSeed, plantSeed, harvestCrop, sellCatch, sellCrops, spendLure, LURES, MARKET_GEAR } from "../../shared/buddy-market.mjs";
import { useEffect, useMemo, useRef, useState } from "react";
import { ALL_CATCHES, FIELD_FINDS, FISH_CATALOG, KRAKEN, LEVIATHAN, VALLEY_CATALOG } from "../data/buddyWorld";
import { isBuddyJournalComplete, isValleyJournalComplete } from "../../shared/buddy-journal.mjs";

const STORAGE_KEY = "daivr.buddyAdventure.v1";
const GUEST_STORAGE_KEY = "daivr.buddyAdventure.guest.v1";
const OWNER_STORAGE_KEY = "daivr.buddyAdventure.owner.v1";
const BUDDY_ENDPOINT = "/api/buddy";

export const BUDDY_INVENTORY = [
  { id: "cartridge", label: "cartridge", source: "quest reward" },
  { id: "wrench", label: "flashlight", source: "quest reward", perk: "lights the path ahead at night" },
  { id: "coffee", label: "coffee", source: "quest reward" },
  { id: "headset", label: "headset", source: "quest reward" },
  { id: "parachute-upgrade", label: "chute upgrade", source: "quest reward" },
  { id: "lure", label: "lucky lure", source: "quest reward", perk: "double rare bites + fewer escapes" }
];

const QUESTS = [
  {
    id: "cartridge-hunt",
    title: "Cartridge hunt",
    detail: "Find 3 unique project or game cartridges.",
    goal: 3,
    reward: "cartridge"
  },
  {
    id: "terminal-tapper",
    title: "Terminal tapper",
    detail: "Open the terminal 5 times.",
    goal: 5,
    reward: "wrench"
  },
  {
    id: "midnight-wakeup",
    title: "Midnight wake-up",
    detail: "Wake buddy during the late shift.",
    goal: 1,
    reward: "coffee"
  },
  {
    id: "room-signal",
    title: "Room signal",
    detail: "Catch Dai listening to Spotify live.",
    goal: 1,
    reward: "headset"
  },
  {
    id: "guestbook-ping",
    title: "Guestbook ping",
    detail: "Open the comments transmission stream.",
    goal: 1,
    reward: "parachute-upgrade"
  },
  {
    id: "void-angler",
    title: "Void angler",
    detail: "Watch buddy reel in 3 rare catches from the void.",
    goal: 3,
    reward: "lure"
  }
];

function createInitialState() {
  return {
    seenCartridges: [],
    terminalClicks: 0,
    midnightWakeups: 0,
    spotifySignals: 0,
    guestbookPings: 0,
    voidCatches: 0,
    totalCatches: 0,
    fishCollection: {},
    foundObjects: {},
    leviathanSightings: 0,
    krakenSightings: 0,
    daiBooted: false,
    bugsDefeated: 0,
    campfireMeals: 0,
    starWishes: 0,
    forageFound: 0,
    completed: [],
    market: { opened: 0, rewards: [], purchases: {}, seeds: [] },
    inventory: []
  };
}

function normalizeList(value) {
  return Array.isArray(value) ? [...new Set(value.map((item) => String(item || "").trim()).filter(Boolean))] : [];
}

function normalizeCounterMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.entries(value).reduce((result, [id, count]) => {
    const key = String(id || "").trim();
    const amount = Math.max(0, Math.floor(Number(count) || 0));
    if (key && amount) result[key] = amount;
    return result;
  }, {});
}

function normalizeState(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const normalized = {
    ...createInitialState(),
    seenCartridges: normalizeList(source.seenCartridges),
    terminalClicks: Math.max(0, Math.floor(Number(source.terminalClicks) || 0)),
    midnightWakeups: Math.max(0, Math.floor(Number(source.midnightWakeups) || 0)),
    spotifySignals: Math.max(0, Math.floor(Number(source.spotifySignals) || 0)),
    guestbookPings: Math.max(0, Math.floor(Number(source.guestbookPings) || 0)),
    voidCatches: Math.max(0, Math.floor(Number(source.voidCatches) || 0)),
    totalCatches: Math.max(0, Math.floor(Number(source.totalCatches) || 0)),
    fishCollection: normalizeCounterMap(source.fishCollection),
    foundObjects: normalizeCounterMap(source.foundObjects),
    leviathanSightings: Math.max(0, Math.floor(Number(source.leviathanSightings) || 0)),
    krakenSightings: Math.max(0, Math.floor(Number(source.krakenSightings) || 0)),
    daiBooted: source.daiBooted === true,
    bugsDefeated: Math.max(0, Math.floor(Number(source.bugsDefeated) || 0)),
    campfireMeals: Math.max(0, Math.floor(Number(source.campfireMeals) || 0)),
    starWishes: Math.max(0, Math.floor(Number(source.starWishes) || 0)),
    forageFound: Math.max(0, Math.floor(Number(source.forageFound) || 0)),
    completed: normalizeList(source.completed),
    market: normalizeMarket(source.market, source.fishCollection, bonusCoins({
      campfireMeals: source.campfireMeals,
      starWishes: source.starWishes,
      forageFound: source.forageFound,
      totalCatches: Math.max(Number(source.totalCatches) || 0, Number(source.voidCatches) || 0)
    })),
    inventory: normalizeList(source.inventory)
  };
  normalized.totalCatches = Math.max(normalized.totalCatches, normalized.voidCatches);
  return normalized;
}

function mergeCounterMaps(left, right) {
  const merged = { ...left };
  Object.entries(right).forEach(([id, count]) => {
    merged[id] = Math.max(merged[id] || 0, count);
  });
  return merged;
}

function mergeStates(leftValue, rightValue) {
  const left = normalizeState(leftValue);
  const right = normalizeState(rightValue);
  return {
    seenCartridges: normalizeList([...left.seenCartridges, ...right.seenCartridges]),
    terminalClicks: Math.max(left.terminalClicks, right.terminalClicks),
    midnightWakeups: Math.max(left.midnightWakeups, right.midnightWakeups),
    spotifySignals: Math.max(left.spotifySignals, right.spotifySignals),
    guestbookPings: Math.max(left.guestbookPings, right.guestbookPings),
    voidCatches: Math.max(left.voidCatches, right.voidCatches),
    totalCatches: Math.max(left.totalCatches, right.totalCatches),
    fishCollection: mergeCounterMaps(left.fishCollection, right.fishCollection),
    market: mergeMarket(left.market, right.market, mergeCounterMaps(left.fishCollection, right.fishCollection), bonusCoins({
      campfireMeals: Math.max(left.campfireMeals, right.campfireMeals),
      starWishes: Math.max(left.starWishes, right.starWishes),
      forageFound: Math.max(left.forageFound, right.forageFound),
      totalCatches: Math.max(left.totalCatches, right.totalCatches)
    })),
    foundObjects: mergeCounterMaps(left.foundObjects, right.foundObjects),
    leviathanSightings: Math.max(left.leviathanSightings, right.leviathanSightings),
    krakenSightings: Math.max(left.krakenSightings, right.krakenSightings),
    daiBooted: left.daiBooted || right.daiBooted,
    bugsDefeated: Math.max(left.bugsDefeated, right.bugsDefeated),
    campfireMeals: Math.max(left.campfireMeals, right.campfireMeals),
    starWishes: Math.max(left.starWishes, right.starWishes),
    forageFound: Math.max(left.forageFound, right.forageFound),
    completed: normalizeList([...left.completed, ...right.completed]),
    inventory: normalizeList([...left.inventory, ...right.inventory])
  };
}

function readState(key = STORAGE_KEY) {
  try {
    return normalizeState(JSON.parse(window.localStorage.getItem(key) || "null"));
  } catch {
    return createInitialState();
  }
}

function writeState(state, key = STORAGE_KEY) {
  try {
    window.localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // Local progress is a bonus layer; if storage is blocked, keep it in memory.
  }
}

function readOwner() {
  try {
    return String(window.localStorage.getItem(OWNER_STORAGE_KEY) || "");
  } catch {
    return "";
  }
}

function writeOwner(userId) {
  try {
    window.localStorage.setItem(OWNER_STORAGE_KEY, String(userId || ""));
  } catch {
    // The server remains authoritative when local storage is unavailable.
  }
}

function uniquePush(list, value) {
  return list.includes(value) ? list : [...list, value];
}

function progressForQuest(state, quest) {
  if (quest.id === "cartridge-hunt") return state.seenCartridges.length;
  if (quest.id === "terminal-tapper") return state.terminalClicks;
  if (quest.id === "midnight-wakeup") return state.midnightWakeups;
  if (quest.id === "room-signal") return state.spotifySignals;
  if (quest.id === "guestbook-ping") return state.guestbookPings;
  if (quest.id === "void-angler") return state.voidCatches;
  return 0;
}

function resolveQuestRewards(state) {
  let next = state;

  for (const quest of QUESTS) {
    if (next.completed.includes(quest.id)) continue;
    if (progressForQuest(next, quest) < quest.goal) continue;

    next = {
      ...next,
      completed: uniquePush(next.completed, quest.id),
      inventory: uniquePush(next.inventory, quest.reward)
    };
  }

  return next;
}

export function useBuddyAdventure({ onQuestComplete } = {}) {
  // Igual que en useBuddyFriendship: el progreso guardado se lee en el
  // inicializador, no en un efecto, para no re-renderizar el arbol entero
  // nada mas montar. readState ya cae a createInitialState si no hay nada.
  const [state, setState] = useState(readState);
  const [ready, setReady] = useState(false);
  const stateRef = useRef(state);
  const onQuestCompleteRef = useRef(onQuestComplete);
  const storageKeyRef = useRef(STORAGE_KEY);
  const syncedRef = useRef(false);

  useEffect(() => {
    onQuestCompleteRef.current = onQuestComplete;
  }, [onQuestComplete]);

  useEffect(() => {
    let cancelled = false;

    async function loadServerState() {
      try {
        const response = await fetch(BUDDY_ENDPOINT, { credentials: "include" });
        if (!response.ok || cancelled) return;
        const payload = await response.json();
        if (cancelled) return;

        if (!payload?.user) {
          if (readOwner()) {
            const guest = readState(GUEST_STORAGE_KEY);
            storageKeyRef.current = GUEST_STORAGE_KEY;
            stateRef.current = guest;
            setState(guest);
          }
          return;
        }

        const userId = String(payload.user);
        const owner = readOwner();
        const local = !owner || owner === userId ? stateRef.current : createInitialState();
        const merged = resolveQuestRewards(mergeStates(payload.adventure, local));
        storageKeyRef.current = STORAGE_KEY;
        writeOwner(userId);
        writeState(merged, STORAGE_KEY);
        stateRef.current = merged;
        setState(merged);
        syncedRef.current = true;

        const syncResponse = await fetch(BUDDY_ENDPOINT, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "sync-adventure", adventure: merged })
        });
        if (!syncResponse.ok || cancelled) return;
        const synced = await syncResponse.json();
        const confirmed = resolveQuestRewards(mergeStates(synced.adventure, stateRef.current));
        stateRef.current = confirmed;
        setState(confirmed);
        writeState(confirmed, STORAGE_KEY);
        window.dispatchEvent(new Event("daivr-player-progress"));
      } catch {
        // Offline and guest sessions keep using their isolated local save.
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    loadServerState();
    return () => {
      cancelled = true;
    };
  }, []);

  function syncAdventure(next) {
    if (!syncedRef.current) return;
    fetch(BUDDY_ENDPOINT, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sync-adventure", adventure: next })
    }).then(async (response) => {
      if (!response.ok) return;
      const payload = await response.json();
      const confirmed = resolveQuestRewards(mergeStates(payload.adventure, stateRef.current));
      stateRef.current = confirmed;
      setState(confirmed);
      writeState(confirmed, storageKeyRef.current);
      window.dispatchEvent(new Event("daivr-player-progress"));
    }).catch(() => {
      // Local progress remains queued implicitly and merges on the next load.
    });
  }

  function apply(update) {
    const before = stateRef.current;
    const updated = typeof update === "function" ? update(before) : update;
    const after = resolveQuestRewards(updated);
    stateRef.current = after;
    setState(after);
    writeState(after, storageKeyRef.current);
    syncAdventure(after);

    const freshCompletions = after.completed.filter((id) => !before.completed.includes(id));
    freshCompletions.forEach((id) => {
      const quest = QUESTS.find((item) => item.id === id);
      if (quest) onQuestCompleteRef.current?.(quest);
    });
  }

  useEffect(() => {
    function handleProgress(event) {
      const detail = event.detail || {};

      apply((current) => {
        if (detail.type === "dai-boot") return { ...current, daiBooted: true };
        if (detail.type === "cartridge") {
          const id = String(detail.id || "").trim();
          if (!id) return current;
          return { ...current, seenCartridges: uniquePush(current.seenCartridges, id) };
        }

        if (detail.type === "terminal") {
          return { ...current, terminalClicks: Math.min(999, current.terminalClicks + 1) };
        }

        if (detail.type === "midnight-wakeup") {
          return { ...current, midnightWakeups: Math.max(1, current.midnightWakeups) };
        }

        if (detail.type === "spotify") {
          return { ...current, spotifySignals: Math.max(1, current.spotifySignals) };
        }

        if (detail.type === "guestbook") {
          return { ...current, guestbookPings: Math.max(1, current.guestbookPings) };
        }

        // Toda captura aterrizada suma al total; las raras ademas a la quest.
        if (detail.type === "fishing-haul") {
          const catchId = String(detail.catchId || "").trim();
          return {
            ...current,
            totalCatches: Math.min(9999, current.totalCatches + 1),
            voidCatches: ["rare", "legendary", "mythic", "treasure"].includes(detail.tier) ? Math.min(999, current.voidCatches + 1) : current.voidCatches,
            fishCollection: catchId
              ? { ...current.fishCollection, [catchId]: Math.min(999, (current.fishCollection[catchId] || 0) + 1) }
              : current.fishCollection
          };
        }

        if (detail.type === "fishing-sighting" && detail.id === KRAKEN.id) {
          return { ...current, krakenSightings: Math.min(99, current.krakenSightings + 1) };
        }
        if (detail.type === "fishing-sighting" && detail.id === LEVIATHAN.id) {
          return { ...current, leviathanSightings: Math.min(99, current.leviathanSightings + 1) };
        }

        if (detail.type === "field-find") {
          const findId = String(detail.id || "").trim();
          if (!FIELD_FINDS.some((item) => item.id === findId)) return current;
          return {
            ...current,
            foundObjects: { ...current.foundObjects, [findId]: Math.min(999, (current.foundObjects[findId] || 0) + 1) }
          };
        }

        // Un pez asado en la hoguera y un deseo a una estrella fugaz: monedas.
        if (detail.type === "campfire-meal") {
          return { ...current, campfireMeals: Math.min(9999, current.campfireMeals + 1) };
        }
        if (detail.type === "star-wish") {
          return { ...current, starWishes: Math.min(9999, current.starWishes + 1) };
        }
        // Forraje del borde del prado (FooterWorld): una moneda cada una.
        if (detail.type === "forage") {
          return { ...current, forageFound: Math.min(9999, current.forageFound + 1) };
        }
        // Pip cosecha una planta madura del huerto: sus monedas a la cartera.
        if (detail.type === "harvest") {
          const result = harvestCrop(current, String(detail.seedId || ""));
          if (result.adventure !== current) window.dispatchEvent(new CustomEvent("daivr-garden-harvested", { detail: { seedId: detail.seedId, crop: result.crop?.id, value: result.value } }));
          return result.adventure;
        }

        if (detail.type === "bug-defeated") {
          return { ...current, bugsDefeated: Math.min(9999, current.bugsDefeated + 1) };
        }

        // Alias directo a rara (consola/tests viejos): equivale a un haul raro.
        if (detail.type === "fishing-catch") {
          return {
            ...current,
            totalCatches: Math.min(9999, current.totalCatches + 1),
            voidCatches: Math.min(999, current.voidCatches + 1)
          };
        }

        return current;
      });
    }

    window.addEventListener("daivr-buddy-quest-progress", handleProgress);
    return () => window.removeEventListener("daivr-buddy-quest-progress", handleProgress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Secreto: el bicho numero 100 desbloquea el pixel blaster. Solo se anuncia
  // si cae aqui y ahora (de uno en uno), no al sincronizar desde otro equipo.
  const bugsSeenRef = useRef(state.bugsDefeated);
  useEffect(() => {
    const before = bugsSeenRef.current;
    bugsSeenRef.current = state.bugsDefeated;
    if (before < 100 && state.bugsDefeated >= 100 && state.bugsDefeated - before === 1) {
      window.dispatchEvent(new CustomEvent("daivr-buddy-secret-unlock", { detail: { id: "pixel-blaster" } }));
    }
  }, [state.bugsDefeated]);

  const quests = useMemo(() => QUESTS.map((quest) => ({
    ...quest,
    progress: Math.min(quest.goal, progressForQuest(state, quest)),
    complete: state.completed.includes(quest.id)
  })), [state]);

  const wallet = useMemo(() => marketWallet(state), [state]);
  // (los señuelos del pescador estan mientras les queden usos)
  const inventory = useMemo(
    () => [
      // (el lucky lure ya no es para siempre: va con los demas señuelos)
      ...BUDDY_INVENTORY.filter((item) => state.inventory.includes(item.id) && !LURES.some((lure) => lure.id === item.id)),
      ...MARKET_GEAR.filter((item) => Object.hasOwn(wallet.purchases, item.id)),
      ...LURES.filter((lure) => wallet.lureLeft[lure.id] > 0).map((lure) => ({ ...lure, uses: wallet.lureLeft[lure.id], perk: `${wallet.lureLeft[lure.id]} ${wallet.lureLeft[lure.id] === 1 ? "use" : "uses"} left · ${lure.perk}` }))
    ],
    [state.inventory, wallet]
  );
  // Cada pesca con un señuelo del pescador puesto gasta un uso (la pesca avisa
  // con `daivr-lure-used`); al acabarse, Buddy lo dice.
  useEffect(() => {
    function onLureUsed(event) {
      const id = event.detail?.id;
      const result = spendLure(stateRef.current, id);
      if (result.adventure === stateRef.current) return;
      apply(result.adventure);
      if (result.left === 0) window.dispatchEvent(new CustomEvent("daivr-buddy-lure-empty", { detail: { id, label: LURES.find((lure) => lure.id === id)?.label || "lure" } }));
    }
    window.addEventListener("daivr-lure-used", onLureUsed);
    return () => window.removeEventListener("daivr-lure-used", onLureUsed);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Las dos colecciones juntas (cada entrada dice su juego: "station" o
  // "valley"); los contadores de siempre son solo del diario original.
  const fishJournal = useMemo(() => ALL_CATCHES.map((item) => ({
    ...item,
    count: state.fishCollection[item.id] || 0,
    discovered: Boolean(state.fishCollection[item.id])
  })), [state.fishCollection]);
  const valleyFound = fishJournal.filter((item) => item.set === "valley" && item.discovered).length;

  // Completar el diario del valle (al pescar el ultimo, aqui y ahora) se anuncia:
  // trae el traje de pescador.
  const valleySeenRef = useRef(valleyFound);
  useEffect(() => {
    const before = valleySeenRef.current;
    valleySeenRef.current = valleyFound;
    if (before === VALLEY_CATALOG.length - 1 && valleyFound === VALLEY_CATALOG.length) {
      window.dispatchEvent(new CustomEvent("daivr-buddy-secret-unlock", { detail: { id: "fisher-outfit" } }));
    }
  }, [valleyFound]);

  const finds = useMemo(() => FIELD_FINDS.map((item) => ({
    ...item,
    count: state.foundObjects[item.id] || 0,
    discovered: Boolean(state.foundObjects[item.id])
  })), [state.foundObjects]);

  return {
    quests,
    ready,
    journalComplete: isBuddyJournalComplete(state),
    completeJournalForTesting: import.meta.env.DEV && ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname) ? () => {
      apply((current) => {
        const fishCollection = { ...current.fishCollection };
        const foundObjects = { ...current.foundObjects };
        let added = 0;
        let rareAdded = 0;
        for (const item of FISH_CATALOG) {
          if (fishCollection[item.id] > 0) continue;
          fishCollection[item.id] = 1;
          added += 1;
          if (["rare", "legendary", "mythic", "treasure"].includes(item.rarity)) rareAdded += 1;
        }
        for (const item of FIELD_FINDS) foundObjects[item.id] = Math.max(1, foundObjects[item.id] || 0);
        return { ...current, fishCollection, foundObjects, totalCatches: current.totalCatches + added, voidCatches: current.voidCatches + rareAdded };
      });
    } : undefined,
    // (pruebas, en local) el diario del valle completo de golpe
    completeValleyForTesting: import.meta.env.DEV && ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname) ? () => {
      apply((current) => {
        const fishCollection = { ...current.fishCollection };
        let added = 0;
        for (const item of VALLEY_CATALOG) if (!(fishCollection[item.id] > 0)) { fishCollection[item.id] = 1; added += 1; }
        return { ...current, fishCollection, totalCatches: current.totalCatches + added };
      });
    } : undefined,
    valleyComplete: isValleyJournalComplete(state),
    inventory,
    inventoryIds: inventory.map((item) => item.id),
    market: wallet,
    openChest() { const result = openMarketChest(stateRef.current); if (result.adventure !== stateRef.current) apply(result.adventure); return { reward: result.reward || 0, message: result.message }; },
    buyItem(id) { const result = purchaseMarketItem(stateRef.current, id); if (result.adventure !== stateRef.current) apply(result.adventure); return result.message; },
    // Un paquete de señuelos del pescador (se gastan).
    buyLure(id, qty = 1) { const result = purchaseLure(stateRef.current, id, new Date(), qty); if (result.adventure !== stateRef.current) apply(result.adventure); return result.message; },
    // El huerto (cobertizo de semillas): comprar a la bolsa, plantar en una
    // parcela libre y vender la cesta los viernes. Pip cosecha con el
    // quest-progress "harvest".
    buySeed(cropId) {
      const result = purchaseSeed(stateRef.current, cropId);
      if (result.adventure !== stateRef.current) apply(result.adventure);
      return result.message;
    },
    plantSeed(cropId, plot = null) {
      const result = plantSeed(stateRef.current, cropId, new Date(), plot);
      if (result.adventure !== stateRef.current) { apply(result.adventure); window.dispatchEvent(new CustomEvent("daivr-garden-planted", { detail: { seed: result.seed } })); }
      return result.message;
    },
    // Al pescador ambulante: vender capturas (una o "all") por monedas.
    sellCatch(id, amount = 1) {
      const result = sellCatch(stateRef.current, id, amount);
      if (result.adventure !== stateRef.current) apply(result.adventure);
      return result.message;
    },
    sellCrops(cropId = null) {
      const result = sellCrops(stateRef.current, cropId);
      if (result.adventure !== stateRef.current) { apply(result.adventure); window.dispatchEvent(new CustomEvent("daivr-garden-sold", { detail: { value: result.value } })); }
      return result.message;
    },
    // (desde el cobertizo, si Buddy no esta para cosecharlo)
    harvest(seedId) {
      const result = harvestCrop(stateRef.current, seedId);
      if (result.adventure !== stateRef.current) { apply(result.adventure); window.dispatchEvent(new CustomEvent("daivr-garden-harvested", { detail: { seedId, crop: result.crop?.id, value: result.value } })); }
      return result.message;
    },
    completedCount: state.completed.length,
    totalCatches: state.totalCatches,
    rareCatches: state.voidCatches,
    fishJournal,
    discoveredFishCount: fishJournal.filter((item) => item.set === "station" && item.discovered).length,
    stationFishTotal: FISH_CATALOG.length,
    discoveredValleyCount: valleyFound,
    valleyFishTotal: VALLEY_CATALOG.length,
    finds,
    discoveredFindCount: finds.filter((item) => item.discovered).length,
    leviathanSightings: state.leviathanSightings,
    krakenSightings: state.krakenSightings,
    bugsDefeated: state.bugsDefeated,
    campfireMeals: state.campfireMeals,
    starWishes: state.starWishes,
    forageFound: state.forageFound
  };
}
