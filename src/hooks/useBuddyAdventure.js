import { useEffect, useMemo, useRef, useState } from "react";
import { FIELD_FINDS, FISH_CATALOG, LEVIATHAN } from "../data/buddyWorld";

const STORAGE_KEY = "daivr.buddyAdventure.v1";
const GUEST_STORAGE_KEY = "daivr.buddyAdventure.guest.v1";
const OWNER_STORAGE_KEY = "daivr.buddyAdventure.owner.v1";
const BUDDY_ENDPOINT = "/api/buddy";

export const BUDDY_INVENTORY = [
  { id: "cartridge", label: "cartridge", source: "quest reward" },
  { id: "wrench", label: "pixel blaster", source: "quest reward" },
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
    bugsDefeated: 0,
    completed: [],
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
    bugsDefeated: Math.max(0, Math.floor(Number(source.bugsDefeated) || 0)),
    completed: normalizeList(source.completed),
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
    foundObjects: mergeCounterMaps(left.foundObjects, right.foundObjects),
    leviathanSightings: Math.max(left.leviathanSightings, right.leviathanSightings),
    bugsDefeated: Math.max(left.bugsDefeated, right.bugsDefeated),
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
  const [state, setState] = useState(createInitialState);
  const stateRef = useRef(createInitialState());
  const onQuestCompleteRef = useRef(onQuestComplete);
  const storageKeyRef = useRef(STORAGE_KEY);
  const syncedRef = useRef(false);

  useEffect(() => {
    onQuestCompleteRef.current = onQuestComplete;
  }, [onQuestComplete]);

  useEffect(() => {
    const saved = readState();
    stateRef.current = saved;
    setState(saved);

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
        const confirmed = resolveQuestRewards(mergeStates(stateRef.current, synced.adventure));
        stateRef.current = confirmed;
        setState(confirmed);
        writeState(confirmed, STORAGE_KEY);
      } catch {
        // Offline and guest sessions keep using their isolated local save.
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

  const quests = useMemo(() => QUESTS.map((quest) => ({
    ...quest,
    progress: Math.min(quest.goal, progressForQuest(state, quest)),
    complete: state.completed.includes(quest.id)
  })), [state]);

  const inventory = useMemo(
    () => BUDDY_INVENTORY.filter((item) => state.inventory.includes(item.id)),
    [state.inventory]
  );

  const fishJournal = useMemo(() => FISH_CATALOG.map((item) => ({
    ...item,
    count: state.fishCollection[item.id] || 0,
    discovered: Boolean(state.fishCollection[item.id])
  })), [state.fishCollection]);

  const finds = useMemo(() => FIELD_FINDS.map((item) => ({
    ...item,
    count: state.foundObjects[item.id] || 0,
    discovered: Boolean(state.foundObjects[item.id])
  })), [state.foundObjects]);

  return {
    quests,
    inventory,
    inventoryIds: state.inventory,
    completedCount: state.completed.length,
    totalCatches: state.totalCatches,
    rareCatches: state.voidCatches,
    fishJournal,
    discoveredFishCount: fishJournal.filter((item) => item.discovered).length,
    finds,
    discoveredFindCount: finds.filter((item) => item.discovered).length,
    leviathanSightings: state.leviathanSightings,
    bugsDefeated: state.bugsDefeated
  };
}
