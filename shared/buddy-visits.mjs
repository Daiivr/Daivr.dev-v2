// Visitas de buddies: el buddy de otro jugador conectado se pasa por el footer.
// Aqui vive todo lo que no depende del navegador ni del servidor (forma del
// "look" que se comparte, ritmo de las visitas y dialogo), para que las dos
// partes y los tests lean lo mismo.

// "off" en localStorage = ni visitar ni recibir visitas (comando `visits off`).
export const VISITS_STORAGE_KEY = "daivr.buddyVisits.v1";

// --- Look compartido ---------------------------------------------------------

// Solo lo que BuddySprite pinta. Nada de inventario, monedas ni progreso: el
// resto de visitantes ve el aspecto del buddy y nada mas.
export const VISIT_GEAR_IDS = [
  "party-hat", "sunglasses", "scarf", "gold-antenna",
  "green-visor", "star-cap", "pixel-crown", "rocket-boots",
  "market-beanie", "market-vest", "market-lantern",
  "miku-wig", "miku-costume",
  "headset", "coffee", "cartridge", "wrench"
];

// El sprite enseña estas piezas por nivel de amistad, no por desbloqueo.
export const FRIENDSHIP_GEAR_LEVELS = { "party-hat": 2, sunglasses: 3, scarf: 4, "gold-antenna": 5 };
const SPRITE_GEAR_IDS = ["green-visor", "star-cap", "pixel-crown", "rocket-boots", "market-beanie", "miku-wig", "miku-costume"];
const MAX_LEVEL = 99;

// Lo que el buddy local lleva puesto ahora mismo, con las mismas reglas que
// BuddySprite (hasItem / hasGear / showFriendshipGear).
export function buddyVisitLook({ friendshipLevel = 1, inventory = [], hiddenGear = [], unlockedGear = [] } = {}) {
  const level = Math.min(MAX_LEVEL, Math.max(1, Math.floor(Number(friendshipLevel) || 1)));
  const hidden = new Set(hiddenGear);
  const unlocked = new Set(unlockedGear);
  const owned = new Set([...inventory, ...unlockedGear]);
  const worn = VISIT_GEAR_IDS.filter((id) => {
    if (hidden.has(id)) return false;
    if (FRIENDSHIP_GEAR_LEVELS[id]) return level >= FRIENDSHIP_GEAR_LEVELS[id];
    if (SPRITE_GEAR_IDS.includes(id)) return unlocked.has(id);
    return owned.has(id);
  });
  return { level, worn };
}

// Lo que llega de otro navegador: nivel acotado y solo piezas conocidas.
export function sanitizeVisitLook(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const level = Math.floor(Number(value.level));
  if (!Number.isFinite(level) || level < 1) return null;
  const worn = Array.isArray(value.worn)
    ? VISIT_GEAR_IDS.filter((id) => value.worn.includes(id))
    : [];
  return { level: Math.min(MAX_LEVEL, level), worn };
}

// Props de BuddySprite para pintar un look ajeno tal cual llego.
export function visitSpriteProps(look) {
  const safe = sanitizeVisitLook(look) || { level: 1, worn: [] };
  return {
    friendshipLevel: safe.level,
    inventory: safe.worn,
    unlockedGear: safe.worn,
    hiddenGear: Object.keys(FRIENDSHIP_GEAR_LEVELS).filter((id) => !safe.worn.includes(id))
  };
}

// --- Ritmo de las visitas -----------------------------------------------------

export const VISIT_RULES = {
  maxVisitors: 2,
  compactMaxVisitors: 1,
  minStayMs: 60_000,
  maxStayMs: 150_000,
  // El primero no entra nada mas cargar: deja aterrizar al buddy de casa.
  firstArrivalMs: [12_000, 25_000],
  // Entre una llegada y la siguiente; con dos candidatos a veces coinciden.
  arrivalGapMs: [30_000, 75_000],
  // El mismo buddy no vuelve enseguida despues de irse.
  returnCooldownMs: 4 * 60_000
};

const between = ([min, max], rng) => min + rng() * (max - min);

export function createVisitSchedule(now, rng = Math.random) {
  return { nextArrivalAt: now + between(VISIT_RULES.firstArrivalMs, rng), leftAt: {} };
}

// Decide quien entra y quien se va. `present` son los que estan en el footer
// ({ id, stayUntil }), `roster` los buddies conectados ({ id, ... }).
export function planVisits(schedule, { present, roster, now, canArrive = true, maxVisitors = VISIT_RULES.maxVisitors }, rng = Math.random) {
  const leaving = present.filter((visitor) => visitor.stayUntil != null && visitor.stayUntil <= now).map((visitor) => visitor.id);
  let arrival = null;
  const staying = present.length - leaving.length;
  if (canArrive && staying < maxVisitors && now >= schedule.nextArrivalAt) {
    const here = new Set(present.map((visitor) => visitor.id));
    const candidates = roster.filter((entry) => !here.has(entry.id) && now - (schedule.leftAt[entry.id] ?? -Infinity) >= VISIT_RULES.returnCooldownMs);
    if (candidates.length) {
      arrival = candidates[Math.floor(rng() * candidates.length)];
      schedule.nextArrivalAt = now + between(VISIT_RULES.arrivalGapMs, rng);
    }
  }
  return { leaving, arrival };
}

export function visitStayMs(rng = Math.random) {
  return between([VISIT_RULES.minStayMs, VISIT_RULES.maxStayMs], rng);
}

// --- Dialogo --------------------------------------------------------------------

// {from}: el jugador del visitante ("a guest" si no tiene sesion).
// {host}: el jugador de esta pestaña, solo en lineas que lo necesitan.
// {other}: el otro visitante, si hay dos.
export const VISITOR_LINES = {
  greet: [
    "knock knock! visiting from {from}'s tab.",
    "hi! {from}'s buddy, reporting in.",
    "beep beep! mind if i hang out?",
    "hello, neighbor!",
    "nice footer. can i stay a bit?",
    "hi hi! just passing through the arcade."
  ],
  greetHost: ["hi {host}! hi buddy!", "hey {host}! your buddy invited me."],
  greetOther: ["oh, {other}'s buddy is here too!", "fancy meeting you here, {other}'s buddy.", "a party! hi, {other}'s buddy."],
  greetOtherGuest: ["oh, another visitor!", "the more the merrier!", "a party! hi, new buddy."],
  bye: [
    "gotta go. {from} needs me.",
    "bye! see you around the arcade.",
    "heading home. thanks for having me!",
    "my tab is calling. bye!",
    "logging off this footer. bye bye!"
  ],
  idle: [
    "nice footer you've got.",
    "{from} says hi!",
    "my footer has way more dust.",
    "is that a market stand? fancy.",
    "beep boop. just visiting.",
    "the arcade is busy today.",
    "i like it here. good lighting.",
    "weather report from my tab: sunny, mostly pixels.",
    "it's cozier down here than in my footer.",
    "does your footer get fish too?"
  ],
  poke: ["hey! that tickles.", "boop received.", "i'm just visiting!", "hi there!", "careful, i'm a guest."],
  // Respuestas a lo que dice el buddy de casa, por tema.
  chat: ["same.", "true.", "hehe.", "beep. agreed.", "real.", "you talk a lot. i like it."],
  night: ["late shift here too.", "{from} is up late as well."],
  morning: ["morning! just booted too.", "fresh pixels over here too."],
  pet: ["lucky! nobody pets me like that.", "aww.", "can i get one too?"],
  petSpam: ["they REALLY like you.", "easy, easy!"],
  wake: ["morning, sleepyhead.", "you were snoring in binary."],
  sleepy: ["shh. i'll keep watch.", "night night."],
  party: ["gg!!", "confetti! for me?", "woo!"],
  dance: ["dance battle?", "ooh, i know this one!"],
  flip: ["show-off.", "10/10. i give it a 10."],
  held: ["whoa, free ride!", "they picked you up!"],
  chute: ["wheee!", "nice chute!"],
  landed: ["stuck the landing!", "smooth."],
  glitchTheme: ["pink! fancy.", "glitchy looks good on you."],
  crtTheme: ["green again. classic.", "the colors are back."],
  music: ["this one's good.", "{from} listens to this too.", "turn it up!"],
  fishCast: ["ooh, fishing! can i watch?", "cast it far!", "i'll be quiet. promise."],
  fishWait: ["any bites?", "patience...", "shhh."],
  fishFight: ["reel! REEL!", "don't let go!", "it's a big one!"],
  fishRare: ["WHOA. rare one!", "no way!!", "frame that one."],
  fishCatch: ["nice catch!", "into the bucket.", "hey, it counts."],
  fishEscape: ["it'll be back.", "noooo...", "next cast, for sure."],
  fishSight: ["i saw it too!", "jumpy fish today."],
  fishBump: ["ouch! you okay?", "flying fish strike again."],
  leviathan: ["WHAT IS THAT", "i'm hiding behind you.", "nope. nope. nope."],
  find: ["ooh, shiny!", "finders keepers."],
  bugHunt: ["get it! get it!", "i'll hold the flashlight."],
  bugWin: ["nice shot!", "squashed."],
  bird: ["a bird! hi bird!", "tiny passenger!"],
  outage: ["who turned off the lights?!", "i can't see a thing!"],
  outageFix: ["power's back!", "nice fix."],
  rain: ["rain! i forgot my umbrella...", "can i share that umbrella?"],
  rainEnd: ["dry again. nice.", "sun's out! well, the pixels are.", "that was a short one."],
  findMiss: ["aw, it got away.", "next time!"],
  cartSwap: ["new cartridge? which one?", "ooh, fresh level."],
  commentTyping: ["someone's writing in the guestbook!", "ooh, news incoming."],
  // Charla de contexto del buddy de casa (src/lib/buddyContext.js).
  weather: ["can't see outside from my tab.", "i'll take your word for it.", "my tab has better weather. kidding.", "weather in here: perfect, as always."],
  time: ["time flies in here.", "{from} keeps the same hours.", "same here.", "already? wow."],
  session: ["they're a regular now.", "i've been here a while too.", "time flies in the arcade."],
  returning: ["welcome back!", "oh, a regular!", "they missed you, i can tell."],
  arcade: ["it IS busy. that's why i came.", "full house today.", "the more the merrier!"],
  daily: ["good luck on the daily!", "i heard the daily is tough today.", "{from} already tried it. no comment."],
  level: ["a high-level player! fancy.", "level up!"],
  tabReturn: ["they're back!", "welcome back!", "we were just talking about you."],
  offline: ["uh oh. is my tab still there?", "static...", "hold on, i'm flickering."],
  online: ["phew.", "we're back!", "still here!"],
  footer: ["they found us!", "hi from down here!"],
  tips: ["good tip.", "wait, really?!", "noted."],
  lore: ["same, actually.", "tell me more.", "that explains a lot."]
};

// Cumplidos para el buddy de casa segun lo que lleve puesto.
export const GEAR_COMPLIMENTS = {
  "miku-costume": "that costume is amazing.",
  "pixel-crown": "is that a pixel crown?!",
  "rocket-boots": "rocket boots? so jealous.",
  "gold-antenna": "ooh, a golden antenna.",
  "star-cap": "nice cap. very starry.",
  "miku-wig": "love the twin-tails.",
  "market-beanie": "cozy beanie!"
};

// Lo que un visitante dice por su cuenta: relleno general mas cumplidos por
// el aspecto del buddy de casa.
export function visitorIdlePool(hostLook) {
  const worn = sanitizeVisitLook(hostLook)?.worn || [];
  return [...VISITOR_LINES.idle, ...worn.map((id) => GEAR_COMPLIMENTS[id]).filter(Boolean)];
}

// Tema del buddy de casa -> grupo de respuestas del visitante y probabilidad
// de que conteste (los sucesos llaman mas la atencion que la charla).
export const HOST_TOPIC_REPLIES = {
  boot: ["chat", 0.35], idle: ["chat", 0.22], walkStop: ["chat", 0.22],
  night: ["night", 0.5], morning: ["morning", 0.5],
  pet: ["pet", 0.55], petSpam: ["petSpam", 0.6], wake: ["wake", 0.6], sleepy: ["sleepy", 0.6],
  party: ["party", 0.8], dance: ["dance", 0.6], flip: ["flip", 0.6], held: ["held", 0.6],
  chute: ["chute", 0.5], rocketFall: ["chute", 0.5], landed: ["landed", 0.45], rocketLanded: ["landed", 0.45],
  glitchTheme: ["glitchTheme", 0.7], crtTheme: ["crtTheme", 0.5], music: ["music", 0.55],
  fishCast: ["fishCast", 0.75], fishWait: ["fishWait", 0.35], fishFight: ["fishFight", 0.8],
  fishRare: ["fishRare", 0.95], fishCommon: ["fishCatch", 0.7], fishJunk: ["fishCatch", 0.5],
  fishEscape: ["fishEscape", 0.75], fishInterrupt: ["fishEscape", 0.5], fishSight: ["fishSight", 0.5],
  fishBump: ["fishBump", 0.8], leviathan: ["leviathan", 0.95], find: ["find", 0.7],
  bugHunt: ["bugHunt", 0.75], bugWin: ["bugWin", 0.8], birdHello: ["bird", 0.6], birdShoo: ["bird", 0.4],
  outage: ["outage", 0.9], outageFix: ["outageFix", 0.8], rain: ["rain", 0.75], rainEnd: ["rainEnd", 0.5], findMiss: ["findMiss", 0.5],
  cartSwap: ["cartSwap", 0.5], commentTyping: ["commentTyping", 0.6],
  weather: ["weather", 0.45], time: ["time", 0.35], session: ["session", 0.5], returning: ["returning", 0.6],
  arcade: ["arcade", 0.5], daily: ["daily", 0.45], level: ["level", 0.6], tabReturn: ["tabReturn", 0.7],
  offline: ["offline", 0.8], online: ["online", 0.6], footer: ["footer", 0.6],
  tips: ["tips", 0.3], lore: ["lore", 0.5]
};

export const HOST_REPLY_LINES = {
  arrive: ["oh, hi {name}'s buddy!", "a visitor! come in, come in.", "welcome! make yourself at home.", "hey! the footer's all yours."],
  arriveGuest: ["oh, a guest buddy! hi!", "a visitor! come in, come in.", "welcome! make yourself at home."],
  leave: ["bye, {name}'s buddy!", "come back soon!", "see ya around!", "safe travels!"],
  leaveGuest: ["bye, guest buddy!", "come back soon!", "see ya around!"],
  poke: ["be nice to my guest.", "that's my visitor!", "hehe. they're friendly."]
};

export function fillLine(line, values = {}) {
  return line.replace(/\{(\w+)\}/g, (match, key) => (values[key] ? String(values[key]) : match));
}

export function pickVisitLine(pool, values = {}, rng = Math.random, avoid = "") {
  // Una linea con un hueco sin rellenar ({host} sin sesion) no se dice.
  const usable = pool.map((line) => fillLine(line, values)).filter((line) => !/\{\w+\}/.test(line));
  const options = usable.filter((line) => line !== avoid);
  const list = options.length ? options : usable;
  return list.length ? list[Math.floor(rng() * list.length)] : "";
}

// Lo que contesta un visitante a una frase del buddy de casa, o "" si calla.
export function visitorReplyTo(topic, values = {}, rng = Math.random, avoid = "") {
  const entry = HOST_TOPIC_REPLIES[topic];
  if (!entry) return "";
  const [pool, chance] = entry;
  if (rng() >= chance) return "";
  return pickVisitLine(VISITOR_LINES[pool], values, rng, avoid);
}
