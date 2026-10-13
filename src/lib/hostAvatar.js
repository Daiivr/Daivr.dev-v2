export const DEFAULT_HOST_AVATAR = "/models/dai-greeter-optimized.vrm";
export const MIKU_HOST_AVATAR = "/models/miku-rabbit-greeter.vrm";
export const KOMOE_HOST_AVATAR = "/models/komoe-greeter.vrm";

export const HOST_CHOICE_KEY = "daivr.host.v1";

// Anfitrionas de la puerta. `speaker` es como se presenta en el guion, `scale`
// iguala su altura a la de la original (mismo encuadre y misma altura de
// burbuja) y `portrait` es su retrato en el selector HOST de la barra superior
// (renders de su propio VRM con la luz de la puerta). `headroom` es lienzo extra
// por encima, en fraccion de su altura: las orejas de Komoe pasan del encuadre
// (medido: hasta 0.075 al saludar) y se cortaban con el borde del canvas.
// Miku sale con el traje Miku de Buddy; Komoe se compra en el Woodland Market
// (pedido especial host-komoe, shared/buddy-market.mjs).
export const HOSTS = [
  { id: "original", name: "Neko", speaker: "neko", url: DEFAULT_HOST_AVATAR, scale: 1, portrait: "/assets/hosts/original.webp" },
  { id: "miku", name: "Miku", speaker: "miku", url: MIKU_HOST_AVATAR, scale: 1.18, portrait: "/assets/hosts/miku.webp", unlockGear: "miku-costume" },
  { id: "komoe", name: "Komoe", speaker: "komoe", url: KOMOE_HOST_AVATAR, scale: 1.12, portrait: "/assets/hosts/komoe.webp", unlockItem: "host-komoe", headroom: 0.1 }
];

export function hostById(id) {
  return HOSTS.find((host) => host.id === id) || HOSTS[0];
}

export function unlockedHostIds({ unlockedGear = [], ownedItems = [], adminUnlock = false } = {}) {
  return HOSTS.filter((host) => adminUnlock
    || (!host.unlockGear && !host.unlockItem)
    || (host.unlockGear && unlockedGear.includes(host.unlockGear))
    || (host.unlockItem && ownedItems.includes(host.unlockItem))).map((host) => host.id);
}

// Solo el selector HOST elige anfitriona, y solo entre las desbloqueadas. Lo
// que lleve puesto Buddy no cuenta: el traje Miku la desbloquea, no la trae.
export function resolveHostId({ choice = "", unlockedGear = [], ownedItems = [], adminUnlock = false } = {}) {
  return choice && unlockedHostIds({ unlockedGear, ownedItems, adminUnlock }).includes(choice) ? choice : "original";
}

export function getHostAvatar(options = {}) {
  return hostById(resolveHostId(options)).url;
}

export function readHostChoice() {
  try {
    const value = window.localStorage.getItem(HOST_CHOICE_KEY) || "";
    return HOSTS.some((host) => host.id === value) ? value : "";
  } catch {
    return "";
  }
}

export function writeHostChoice(id) {
  try {
    window.localStorage.setItem(HOST_CHOICE_KEY, id);
  } catch {
    // Sin almacenamiento la eleccion dura lo que dure la pestana.
  }
}
