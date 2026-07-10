import { useEffect, useRef, useState } from "react";

const LOCAL_KEY = "daivr.buddyPets.v1";
const BUDDY_ENDPOINT = "/api/buddy";

// Debe coincidir con LEVEL_THRESHOLDS en server/buddy.mjs.
const LEVEL_THRESHOLDS = [0, 10, 25, 60, 120];

export function levelForPets(pets) {
  let level = 1;
  LEVEL_THRESHOLDS.forEach((threshold, index) => {
    if (pets >= threshold) level = index + 1;
  });
  return level;
}

function readLocalPets() {
  try {
    return Math.max(0, Math.floor(Number(window.localStorage.getItem(LOCAL_KEY)) || 0));
  } catch {
    return 0;
  }
}

// Nivel segun el espejo local (el hook lo mantiene al dia en cada caricia).
// Para visuales instantaneos fuera del footer (splash, caida de entrada).
export function getLocalBuddyLevel() {
  return levelForPets(readLocalPets());
}

function writeLocalPets(pets) {
  try {
    window.localStorage.setItem(LOCAL_KEY, String(pets));
  } catch {
    // localStorage puede fallar en modo privado; el contador sigue en memoria.
  }
}

/*
  Amistad del buddy: cuenta caricias y calcula nivel/cosmeticos. Con sesion
  Discord activa se sincroniza en /api/buddy (persistente por usuario); los
  invitados usan localStorage. Al iniciar sesion, el progreso local se fusiona
  via "merge" para no perder caricias previas.
*/
export function useBuddyFriendship({ onMilestone } = {}) {
  const [pets, setPets] = useState(0);
  const [isSynced, setIsSynced] = useState(false);

  const petsRef = useRef(0);
  const syncedRef = useRef(false);
  const lastMilestoneRef = useRef(1);
  const onMilestoneRef = useRef(onMilestone);

  useEffect(() => {
    onMilestoneRef.current = onMilestone;
  }, [onMilestone]);

  function applyPets(next) {
    petsRef.current = next;
    setPets(next);
    writeLocalPets(next);

    const level = levelForPets(next);
    if (level > lastMilestoneRef.current) {
      lastMilestoneRef.current = level;
      onMilestoneRef.current?.(level);
    }
  }

  useEffect(() => {
    let cancelled = false;

    const local = readLocalPets();
    petsRef.current = local;
    lastMilestoneRef.current = levelForPets(local);
    setPets(local);

    async function loadServerState() {
      try {
        const response = await fetch(BUDDY_ENDPOINT, { credentials: "include" });
        if (!response.ok || cancelled) return;
        const payload = await response.json();
        if (cancelled || !payload?.user) return;

        syncedRef.current = true;
        setIsSynced(true);
        // El servidor manda su total; si lo local va por delante (caricias de
        // invitado), se conserva y el proximo POST lo fusiona.
        applyPets(Math.max(petsRef.current, Number(payload.pets) || 0));
      } catch {
        // Sin API el buddy sigue funcionando en modo local.
      }
    }

    loadServerState();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function registerPet() {
    const merge = petsRef.current;
    applyPets(merge + 1);

    if (!syncedRef.current) return;

    fetch(BUDDY_ENDPOINT, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merge })
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (typeof payload?.pets === "number" && payload.pets > petsRef.current) {
          applyPets(payload.pets);
        }
      })
      .catch(() => {
        // La caricia ya cuenta en local; el proximo POST re-fusiona.
      });
  }

  return {
    pets,
    level: levelForPets(pets),
    isSynced,
    registerPet
  };
}
