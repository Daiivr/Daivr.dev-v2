// Que lleva puesto Pip: las mismas reglas que tenia BuddySprite (equipo del
// inventario, equipo desbloqueado y premios de amistad, menos lo que el
// jugador ha ocultado), repartidas en huecos del rig. Sin DOM.

// Premios de amistad: el nivel desde el que se ven.
export const FRIENDSHIP_GEAR = { "party-hat": 2, sunglasses: 3, scarf: 4, "gold-antenna": 5 };
// Con varias cosas para el mismo hueco gana la primera.
const HEAD_ORDER = ["pixel-crown", "star-cap", "market-straw-hat", "market-frog-hat", "market-bucket-hat", "market-beanie", "party-hat"];
const FRONT_HAND_ORDER = ["pixel-blaster", "wrench", "cartridge", "coffee", "market-lantern"];
const BACK_HAND_ORDER = ["market-lantern", "coffee"];

// El evento de temporada viste los huecos que el jugador deja libres.
export const SEASON_FITS = {
  winter: { head: "market-beanie", neck: "scarf" },
  halloween: { head: "witch-hat", hand: "pumpkin-pail" },
  birthday: { head: "party-hat" },
  anniversary: { hand: "sparkler" },
  "april-fools": { face: "sunglasses" }
};

export function outfitFor({ friendshipLevel = 1, inventory = [], hiddenGear = [], unlockedGear = [], season = "" } = {}) {
  const hidden = (id) => hiddenGear.includes(id);
  const hasItem = (id) => (inventory.includes(id) || unlockedGear.includes(id)) && !hidden(id);
  const hasGear = (id) => unlockedGear.includes(id) && !hidden(id);
  const earned = (id) => friendshipLevel >= FRIENDSHIP_GEAR[id] && !hidden(id);
  const owns = (id) => (id in FRIENDSHIP_GEAR ? earned(id) : ["market-lantern", "coffee", "wrench", "cartridge", "headset", "market-vest"].includes(id) ? hasItem(id) : hasGear(id));
  const fit = {};
  const head = HEAD_ORDER.find(owns);
  if (head) fit.head = head;
  if (hasGear("miku-wig")) fit.hair = "miku-wig";
  if (hasGear("market-specs")) fit.face = "market-specs";
  else if (hasGear("green-visor")) fit.face = "green-visor";
  else if (earned("sunglasses")) fit.face = "sunglasses";
  if (hasItem("headset")) fit.ears = "headset";
  if (hasGear("market-sprout")) fit.antenna = "market-sprout";
  else if (earned("gold-antenna")) fit.antenna = "gold-antenna";
  if (earned("scarf")) fit.neck = "scarf";
  if (hasGear("miku-costume")) fit.body = "miku-costume";
  else if (hasItem("market-vest")) fit.body = "market-vest";
  else if (hasGear("market-overalls")) fit.body = "market-overalls";
  else if (hasGear("market-hoodie")) fit.body = "market-hoodie";
  else if (hasGear("market-raincoat")) fit.body = "market-raincoat";
  // (el paraguas de hoja solo sale cuando llueve: lo pinta events/rain.js)
  if (hasGear("market-leaf-umbrella")) fit.umbrella = "leaf";
  const hand = FRONT_HAND_ORDER.find(owns);
  if (hand) fit.hand = hand;
  const handB = BACK_HAND_ORDER.find((id) => id !== hand && owns(id));
  if (handB) fit.handB = handB;
  if (hasGear("rocket-boots")) fit.feet = "rocket-boots";
  if (hasItem("parachute-upgrade")) fit.chute = "parachute-upgrade";
  // El traje de pescador (diario del valle): sombrero, chaleco y botas de agua
  // (las botas cohete, si las lleva, se quedan: con ellas vuela).
  if (hasGear("fisher-outfit") && fit.body !== "miku-costume") {
    fit.head = "fisher-hat"; fit.body = "fisher-vest";
    if (fit.feet !== "rocket-boots") fit.feet = "fisher-boots";
    delete fit.hair;
  }
  const seasonal = SEASON_FITS[season] || {};
  for (const [slot, id] of Object.entries(seasonal)) if (!fit[slot]) fit[slot] = id;
  return fit;
}

// Huecos que dibuja el rig (sin caña, señuelo ni paracaidas).
export function wornSlots(fit, { handsBusy = false } = {}) {
  const out = { ...fit };
  delete out.chute; delete out.rod; delete out.lure;
  if (handsBusy) { delete out.hand; delete out.handB; }
  return out;
}
