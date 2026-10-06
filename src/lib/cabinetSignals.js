import { useSyncExternalStore } from "react";

// Ultimo valor de las senales globales que varias piezas leen a la vez: la
// barra superior, el modo attract y la consola. Llegan por los CustomEvent de
// siempre (`daivr-player-card` desde PlayerHub, `daivr-presence` desde el
// stream del libro de visitas); aqui solo se guarda el ultimo para que quien
// monte tarde no se quede sin dato y para no re-renderizar App entero.
const values = { player: null, online: null, visitHello: null, visitRoster: [], weather: null, nzpUnlocked: false };
const listeners = new Set();

function update(key, value) {
  if (values[key] === value) return;
  values[key] = value;
  listeners.forEach((listener) => listener());
}

if (typeof window !== "undefined") {
  window.addEventListener("daivr-player-card", (event) => update("player", event.detail || null));
  window.addEventListener("daivr-presence", (event) => {
    const count = event.detail?.count;
    update("online", Number.isFinite(count) && count > 0 ? count : null);
  });
  // Visitas de buddies: token de esta pestaña y buddies conectados.
  window.addEventListener("daivr-visits-hello", (event) => update("visitHello", event.detail || null));
  window.addEventListener("daivr-visits-roster", (event) => update("visitRoster", Array.isArray(event.detail) ? event.detail : []));
  // El tiempo de fuera (/api/weather), que carga ScreenBuddy: lo usa el cielo del footer.
  window.addEventListener("daivr-outside-weather", (event) => update("weather", event.detail?.available ? event.detail : null));
  // NZ:P desbloqueado (diario de Buddy completo), que anuncia App: decide si el
  // reto diario del dia de NZ:P es el de NZ:P o el de repuesto.
  window.addEventListener("daivr-nzp-unlocked", (event) => update("nzpUnlocked", Boolean(event.detail)));
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCabinetSignal(key) {
  return values[key];
}

export function useCabinetSignal(key) {
  return useSyncExternalStore(subscribe, () => values[key], () => values[key]);
}
