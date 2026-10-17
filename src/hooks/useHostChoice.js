import { useCallback, useEffect, useMemo, useState } from "react";
import { HOST_CHOICE_KEY, readHostChoice, resolveHostId, unlockedHostIds, writeHostChoice } from "../lib/hostAvatar";

// Anfitriona de la puerta: la elegida en el selector HOST (localStorage), si
// sigue desbloqueada. Miku sale del traje Miku de Buddy y Komoe de su compra
// en el Woodland Market, asi que hace falta el equipo y la cartera de Buddy.
export function useHostChoice({ loadout, adventure }) {
  const [visitChoice] = useState(readHostChoice);
  const [choice, setChoice] = useState(visitChoice);
  const [greetingHostId, setGreetingHostId] = useState(null);

  // Otra pestana cambio de anfitriona.
  useEffect(() => {
    const sync = (event) => { if (event.key === HOST_CHOICE_KEY) setChoice(readHostChoice()); };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const ownedItems = adventure.market.owned;
  const unlockedIds = useMemo(
    () => unlockedHostIds({ unlockedGear: loadout.unlockedGearIds, ownedItems, adminUnlock: loadout.adminUnlock }),
    [loadout.adminUnlock, loadout.unlockedGearIds, ownedItems]
  );
  const hostId = resolveHostId({ choice, unlockedGear: loadout.unlockedGearIds, ownedItems, adminUnlock: loadout.adminUnlock });
  // Wait for ownership to hydrate, then freeze this visit's model. Selector
  // changes (including other tabs) only affect the next full page load.
  if (greetingHostId === null && loadout.ready) {
    setGreetingHostId(resolveHostId({ choice: visitChoice, unlockedGear: loadout.unlockedGearIds, ownedItems, adminUnlock: loadout.adminUnlock }));
  }

  const chooseHost = useCallback((id) => {
    if (!unlockedIds.includes(id)) return false;
    writeHostChoice(id);
    setChoice(id);
    return true;
  }, [unlockedIds]);

  return { hostId, greetingHostId, unlockedIds, chooseHost };
}
