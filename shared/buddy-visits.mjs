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
  poke: ["hey! that tickles.", "boop received.", "i'm just visiting!", "hi there!", "careful, i'm a guest."],
  // Al despertar de una siesta (se echa una si el de casa se duerme).
  napWake: ["huh? i wasn't sleeping.", "five more minutes...", "what did i miss?"],
  // Remate cuando el de casa le contesta.
  rejoin: ["hehe.", "right?", "true!", "ha!", "fair.", "beep. agreed."],
  // Cuando le alaban un baile, un salto...
  praised: ["hehe. thanks!", "i've been practising.", "thank you, thank you.", "{from} taught me that."],
  thanks: ["thanks! {from} picked it.", "aw, thank you!", "it's new!", "you noticed!"],
  // Preguntas del buddy de casa (HOST_ASKS), una respuesta por pregunta.
  askFooter: ["dustier than this one.", "cozy, but no fish.", "{from} keeps it tidy. mostly."],
  askTab: ["far away. three tabs over.", "just down the tab bar.", "a tab with way too many cookies."],
  askStay: ["a little while, if that's ok!", "until {from} calls me back.", "can't leave yet. too comfy."],
  askGame: ["don't ask. it was rough.", "{from} is on a streak!", "they're practising. a lot."],
  askFish: ["YES. please.", "i'll bring a bucket.", "only if i can hold the rod."],
  askMonster: ["a what now?", "is it safe?", "nope. and i'd like to keep it that way."],
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
  update: ["ooh, patch day!", "{from} should reload too.", "new build? fancy.", "i'll tell my tab."],
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
  tips: ["tips", 0.3], lore: ["lore", 0.5], update: ["update", 0.6],
  // Lo que el de casa le dice a un visitante en concreto (ver "Charla entre todos").
  askFooter: ["askFooter", 0.95], askTab: ["askTab", 0.95], askStay: ["askStay", 0.95], askGame: ["askGame", 0.95],
  askFish: ["askFish", 0.95], askMonster: ["askMonster", 0.95],
  compliment: ["thanks", 0.9], praise: ["praised", 0.45], answer: ["rejoin", 0.3]
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

// --- Charla entre todos ---------------------------------------------------------
//
// Todos hablan con todos: el de casa con sus visitas, las visitas entre ellas,
// y cada uno comenta lo que hacen los demas. Cada frase lleva un tema y a quien
// va (`to`: "host", el id de un visitante, o nadie). Tres temas cierran la
// conversacion para que no haya bucles: una respuesta ("answer") a veces se
// remata, un elogio ("praise") o un cumplido ("compliment") se agradece, y el
// remate o el agradecimiento ("end") ya no los contesta nadie.

// Lo que un visitante le cuenta al buddy de casa. Un tema = una idea, para
// que cualquier respuesta del tema pegue con cualquier frase del tema.
export const VISITOR_TALK = {
  footer: ["nice footer you've got.", "it's cozier down here than in my footer.", "i like it here. good lighting."],
  dust: ["my footer has way more dust.", "do you dust down here? it's spotless."],
  hello: ["{from} says hi!", "{from} sends their regards."],
  market: ["is that a market stand? fancy.", "what's good at the market stand?"],
  arcade: ["the arcade is busy today."],
  weather: ["weather report from my tab: sunny, mostly pixels."],
  fish: ["does your footer get fish too?", "is it true you fish in the floor?"],
  favorite: ["what's your favourite cartridge?", "best game in the cabinet? go."],
  bored: ["do you ever get bored down here?"],
  player: ["how's {host} treating you?", "is your player nice to you?"],
  snack: ["anyone got a spare byte? i'm starving."],
  cat: ["my tab has a cat gif. you'd love it."],
  tabs: ["{from} has like forty tabs open. it's crowded in there."]
};

// Lo que dice al llegar a un sitio nuevo del footer.
export const EXPLORE_LINES = ["ooh, nice view from over here.", "what's over here?", "hello? echo!", "this spot's comfy.", "found a dust bunny.", "the rainbow line is warm here too."];

// Lo que un visitante le dice al otro ({other} = el jugador del otro).
export const GUEST_TALK = {
  firstTime: ["first time in this footer?"],
  known: ["{other}'s buddy, right? i've seen you around."],
  secret: ["this footer's nicer than mine. don't tell {from}."],
  leak: ["how's your footer? mine has a leaky pixel."],
  race: ["race you to the other side?"],
  danceLater: ["wanna dance later?"],
  fishing: ["psst. this buddy fishes in the floor."],
  leviathan: ["i heard there's a leviathan down there."]
};

// El buddy de casa contesta a sus visitas ({name} = el jugador del visitante).
export const HOST_ANSWERS = {
  footer: ["thanks! it's home.", "make yourself comfy.", "the rainbow line keeps it warm."],
  dust: ["i sweep it every night.", "dust doesn't stand a chance down here."],
  hello: ["tell {name} i said hi back!", "hi back!", "say hi to your player for me."],
  market: ["it trades gear for coins.", "the beanie is cozy. trust me."],
  arcade: ["busiest arcade on the web.", "everyone wants a turn today."],
  weather: ["pixels with a chance of confetti down here.", "same forecast here."],
  fish: ["there's a whole sea under this floor.", "fish? oh, you have no idea.", "stick around. i might cast a line."],
  favorite: ["the secret ones. konami knows.", "whichever one my player picks.", "the one with my high score on it."],
  bored: ["never. there's fish under the floor.", "bored? there's always a bug to squash.", "i count pixels. it's relaxing."],
  player: ["the best. i get pets.", "they keep me company.", "they let me nap. ten out of ten."],
  snack: ["i have half a coffee byte.", "try the market stand.", "you can have a crumb of my cache."],
  cat: ["a cat gif? jealous.", "does it do the loaf thing?"],
  tabs: ["forty tabs?! how do you find your way home?", "and i thought this footer was busy."],
  explore: ["that's my favourite spot!", "careful, the floor cracks sometimes.", "find anything good?", "the view's better from the middle."],
  napWake: ["you were snoring in hologram.", "nothing much. welcome back."],
  compliment: ["thank you! it's new.", "aw, thanks!", "you have good taste.", "my player picked it."],
  praise: ["hehe. thanks!", "years of practice.", "i've been working on it."],
  answer: ["hehe.", "right?", "exactly.", "ha!", "beep. agreed."]
};
// Las preguntas casi siempre tienen respuesta; el comentario suelto, a veces.
export const HOST_ANSWER_CHANCE = {
  favorite: 0.95, bored: 0.95, player: 0.95, snack: 0.85, fish: 0.85, compliment: 0.9,
  hello: 0.7, market: 0.7, cat: 0.7, tabs: 0.7, dust: 0.6, napWake: 0.6, footer: 0.5, arcade: 0.5, weather: 0.5,
  explore: 0.45, praise: 0.45, answer: 0.3
};

// Un visitante contesta al otro ({from} = el que contesta).
export const GUEST_ANSWERS = {
  firstTime: ["nope, regular here.", "first time! it's nice."],
  known: ["guilty. that's me.", "the one and only."],
  secret: ["my lips are sealed.", "mine's dustier, trust me."],
  leak: ["a leaky pixel? yikes.", "mine's fine. dusty, but fine."],
  race: ["you're on!", "later. i'm comfy."],
  danceLater: ["only if there's music.", "you're on!"],
  fishing: ["in the floor?!", "no way."],
  leviathan: ["a WHAT down there?", "i'm staying up here, then."],
  compliment: VISITOR_LINES.thanks,
  praise: VISITOR_LINES.praised,
  answer: VISITOR_LINES.rejoin
};
export const GUEST_ANSWER_CHANCE = {
  firstTime: 0.9, known: 0.9, secret: 0.85, leak: 0.85, race: 0.9, danceLater: 0.9, fishing: 0.9, leviathan: 0.9,
  compliment: 0.9, praise: 0.45, answer: 0.3
};

// El buddy de casa tambien saca tema a sus visitas.
export const HOST_ASKS = {
  askFooter: ["how's your footer, {name}'s buddy?", "is your footer as cozy as mine?"],
  askTab: ["where's your tab at?", "where did you walk in from?"],
  askStay: ["you staying for a while?", "comfy? stay as long as you like."],
  askGame: ["has {name} played the daily yet?", "how's your player doing on the leaderboard?"],
  askFish: ["want to see me fish later?"],
  askMonster: ["ever seen a leviathan?"]
};

// Lo que hace cada buddy y lo que comentan los demas. El de casa anuncia
// walk/dance/scan/glitch/sleep/wake; las visitas roam/back/follow/dance/flip/
// hop/look/nap/wake.
export const ACTION_LINES = {
  // Un visitante, sobre lo que hace el de casa (`follow`: el que se va detras).
  onHost: {
    walk: ["where are you off to?", "patrol time?", "going somewhere?"],
    follow: ["wait up!", "lead the way!", "right behind you!", "tour time?"],
    dance: ["dance battle?", "ooh, i know this one!", "teach me that one!"],
    scan: ["what are you looking for?", "did you hear something too?"],
    glitch: ["you glitched a little there.", "bless you?", "static! you ok?"],
    sleep: ["shh. i'll keep watch.", "night night."]
  },
  // Un visitante, sobre lo que hace el otro.
  onGuest: {
    roam: ["don't get lost over there!", "find anything good?"],
    back: ["oh, you're back.", "welcome back."],
    dance: ["go, {other}'s buddy, go!", "nice moves!", "ok, i'm joining."],
    flip: ["show-off.", "ooh, a flip!"],
    hop: ["boing.", "someone's excited."],
    look: ["what are you looking at?", "see something?"],
    nap: ["they fell asleep. guests these days.", "shh."],
    wake: ["good nap?", "morning!"]
  },
  // El de casa, sobre lo que hace un visitante.
  byHost: {
    roam: ["exploring, {name}'s buddy?", "make yourself at home!", "careful, the floor cracks sometimes.", "the market stand is over there."],
    back: ["welcome back over here!", "missed me?"],
    follow: ["ha, you're following me?", "tour mode: on.", "this way, this way!"],
    dance: ["nice moves, {name}'s buddy!", "ooh, show me that one!", "dance party!"],
    flip: ["whoa, a flip!", "show-off!", "10/10 landing."],
    hop: ["bouncy guest!", "someone's excited."],
    look: ["looking for something?", "the fish live under the floor, if you're wondering."],
    nap: ["did my guest just fall asleep?", "shh. guest napping."],
    wake: ["morning, sleepy guest!", "good nap?"],
    // Cuando se va detras del visitante a enseñarle el sitio.
    tagAlong: ["wait, i'll show you around!", "ooh, let me come too.", "tour guide coming through!"]
  }
};
// Lo raro llama mas la atencion que pasear.
export const ACTION_CHANCE = {
  walk: 0.3, roam: 0.3, back: 0.3, look: 0.3, scan: 0.3, hop: 0.35,
  glitch: 0.45, sleep: 0.5, follow: 0.55, dance: 0.55, wake: 0.55, nap: 0.6, flip: 0.65, tagAlong: 1
};
const PRAISED_ACTIONS = new Set(["dance", "flip", "hop"]);

const CLOSING_TOPICS = new Set(["answer", "praise", "compliment"]);

// Tema de una respuesta: contestar a algo abre "answer"; contestar a una
// respuesta, un elogio o un cumplido cierra ("end").
export function replyTopic(topic) {
  return CLOSING_TOPICS.has(topic) ? "end" : "answer";
}

// Comentar un baile o un salto es un elogio (se agradece); lo demas, no.
export function actionTopic(action) {
  return PRAISED_ACTIONS.has(action) ? "praise" : "end";
}

function chanceReply(pools, chances, topic, values, rng, avoid) {
  const pool = pools[topic];
  if (!pool || rng() >= (chances[topic] ?? 0)) return "";
  return pickVisitLine(pool, values, rng, avoid);
}

// Lo que contesta el buddy de casa a una visita, o "" si calla.
export function hostAnswerTo(topic, values = {}, rng = Math.random, avoid = "") {
  return chanceReply(HOST_ANSWERS, HOST_ANSWER_CHANCE, topic, values, rng, avoid);
}

// Lo que contesta un visitante a otro, o "" si calla.
export function guestAnswerTo(topic, values = {}, rng = Math.random, avoid = "") {
  return chanceReply(GUEST_ANSWERS, GUEST_ANSWER_CHANCE, topic, values, rng, avoid);
}

// Comentario de `group` (onHost, onGuest, byHost) sobre una accion, o "".
export function actionComment(group, action, values = {}, rng = Math.random, avoid = "") {
  return chanceReply(ACTION_LINES[group] || {}, ACTION_CHANCE, action, values, rng, avoid);
}

const complimentsFor = (look) => (sanitizeVisitLook(look)?.worn || [])
  .map((id) => GEAR_COMPLIMENTS[id])
  .filter(Boolean)
  .map((line) => ({ line, topic: "compliment" }));
const talkEntries = (talk) => Object.entries(talk).flatMap(([topic, lines]) => lines.map((line) => ({ line, topic })));

// Lo que un visitante le puede contar al de casa: charla general y cumplidos
// por lo que lleva puesto. `online` = buddies conectados contando este.
export function visitorTalkPool(hostLook, online = 0) {
  return [
    ...talkEntries(VISITOR_TALK),
    ...complimentsFor(hostLook),
    ...(online > 2 ? [{ line: `${online} buddies online right now.`, topic: "arcade" }] : [])
  ];
}

// Lo que un visitante le puede decir al otro.
export function guestTalkPool(otherLook) {
  return [...talkEntries(GUEST_TALK), ...complimentsFor(otherLook)];
}

// Elige una entrada {line, topic} con la frase ya rellenada, o null.
export function pickTalk(entries, values = {}, rng = Math.random, avoid = "") {
  const usable = entries
    .map((entry) => ({ ...entry, line: fillLine(entry.line, values) }))
    .filter((entry) => !/\{\w+\}/.test(entry.line));
  const options = usable.filter((entry) => entry.line !== avoid);
  const list = options.length ? options : usable;
  return list.length ? list[Math.floor(rng() * list.length)] : null;
}

// Pregunta (o cumplido) del de casa a una de sus visitas ({id, name, look}).
export function hostQuestion(visitors, rng = Math.random, avoid = "") {
  if (!visitors.length) return null;
  const visitor = visitors[Math.floor(rng() * visitors.length)];
  const entry = pickTalk([...talkEntries(HOST_ASKS), ...complimentsFor(visitor.look)], { name: visitor.name }, rng, avoid);
  return entry ? { ...entry, to: visitor.id } : null;
}
