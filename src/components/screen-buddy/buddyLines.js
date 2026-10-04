import { returnLines } from "../../lib/buddyContext";

// Lo que dice Buddy: frases por tema, las del disfraz de Miku, y el tema de
// cada frase (los buddies de visita lo leen en `daivr-buddy-said` para
// contestar a juego). Solo datos y funciones puras, salvo el saludo segun la
// ultima visita, que lee y apunta localStorage una vez por carga.

export const LINES = {
  boot: ["hello, player.", "buddy.exe delivered.", "touchdown. footer secured.", "special delivery."],
  idle: [
    "beep.",
    "...",
    "coffee?",
    "insert coin.",
    "nice cabinet, right?",
    "01101000 01101001",
    "the rainbow line is warm.",
    "i live here now.",
    "guarding the footer.",
    "step count: many.",
    "no bugs down here. checked.",
    "dai said i could stay."
  ],
  walkStop: [
    "wait. i heard something.",
    "this spot is nice.",
    "checking the pixels... clean.",
    "all systems green.",
    "patrol complete-ish.",
    "hm. footer secure."
  ],
  night: ["late shift again?", "the glow hits different at night.", "hydrate, player.", "night mode: cozy."],
  morning: ["good morning, player.", "fresh phosphor smell.", "early. impressive."],
  pet: ["beep!", "+1 friendship", "hehe.", "again!", "purr.exe", "<3", "acceptable."],
  petSpam: ["ok ok!", "dizzy...", "affection overload!", "cooldown needed."],
  wake: ["!?", "i'm up. i'm up.", "rebooting...", "was not sleeping."],
  sleepy: ["low battery...", "bedtime protocol.", "corner. now."],
  party: ["gg!", "achievement get!", "new record?", "confetti protocol!"],
  dance: ["dance protocol engaged.", "do not perceive me.", "grooving."],
  flip: ["wheee!", "gymnastics.exe", "10/10 landing."],
  held: ["hey!", "unauthorized lift!", "flying???", "put me down?", "no seatbelt!"],
  chute: ["deploying chute.", "wheee.", "this is fine.", "mayday? no. style points."],
  landed: ["soft landing.", "10/10 landing.", "again.", "chute packed. ready."],
  rocketFall: ["rocket boots online.", "boosters firing.", "thrusters engaged.", "no chute. just vibes."],
  rocketLanded: ["boosters cooled.", "rocket landing logged.", "soft-ish landing.", "boots survived. probably."],
  glitchTheme: ["reality.exe corrupted?", "pink? bold choice.", "i feel... glitchy.", "who turned the colors?"],
  crtTheme: ["ah. classic green.", "home sweet green.", "calibration restored."],
  music: ["this track slaps.", "vibing in binary.", "volume up. trust me."],
  fishCast: ["casting into the void.", "fishing protocol engaged.", "the void is stocked. trust me.", "line out. patience on."],
  fishWait: ["...", "any second now.", "shhh. fish are compiling.", "the void nibbles.", "patience level: max."],
  fishJunk: ["caught: old pixel. releasing.", "caught: kelp.txt", "caught: soggy cable.", "the void sent null."],
  fishCommon: ["caught: bottle cap!", "caught: arcade token!", "caught: tiny star!", "caught: spare semicolon!"],
  fishRare: ["RARE CATCH: void pearl!", "RARE CATCH: golden chip!", "RARE CATCH: ancient pixel!"],
  fishFight: ["it's fighting!", "big one. HUGE.", "reeling! REELING!", "the void pulls back!", "hold. HOLD."],
  fishEscape: ["it got away...", "line snapped. the void wins.", "so close. SO close.", "next time, fish."],
  fishInterrupt: ["hey! you scared the fish.", "line lost. rude.", "the big one got away..."],
  fishSight: ["did you see that fish?", "okay. i need my fishing rod.", "that one looked catchable.", "fish jump detected!", "the void is showing off.", "note to self: cast over there."],
  fishBump: ["OW! flying fish!", "ouch. fish collision.", "hey! watch the fins!", "bonked by a bytefish...", "fish: 1. buddy: 0."],
  leviathan: ["TOO BIG. TOO BIG!", "the footer has a boss fight?!", "I NEED A BIGGER ROD."],
  find: ["wait... loot detected.", "something shiny!", "patrol discovery!"],
  bugHunt: ["unauthorized bug!", "debugging. literally.", "hold still, tiny error."],
  bugWin: ["bug deleted.", "footer secure again.", "zero bugs remaining. probably."],
  birdHello: ["oh. hello, tiny bird.", "a passenger? on my antenna?", "bird.exe has landed."],
  birdShoo: ["shoo! feathers in my vents!", "okay, flight time. shoo!", "no nesting on the hardware!"],
  outage: ["uh... who turned off the pixels?", "flashlight protocol.", "checking the cabinet breaker..."],
  outageFix: ["technical tap incoming.", "stand back. certified repair.", "have you tried hitting it?"],
  rain: ["rain? umbrella protocol!", "nice try, weather.exe.", "dry buddy. wet world.", "cozy weather.", "plink plink plink."],
  cartSwap: ["fresh cartridge loaded.", "blew on it for you.", "cart seated. no dust.", "new level, same footer."],
  commentTyping: [
    "psst... someone is composing a transmission. any minute now.",
    "typing detected... incoming comment ETA: when it is perfect.",
    "comment buffer filling up. i will pretend not to peek.",
    "new signal being written... stand by for transmission."
  ],
  // Noches de hoguera (useBuddyCampfire).
  campfire: ["campfire time.", "a little fire, a little rest.", "night shift by the fire.", "cozy protocol engaged."],
  campfireWait: ["smells good already.", "slow and steady.", "almost...", "patience. it's an art."],
  marshmallow: ["toasting a marshmallow...", "marshmallow.exe: warming up.", "golden is the goal."],
  marshmallowGood: ["perfectly golden.", "10/10 toast.", "crispy outside, gooey inside."],
  marshmallowBurnt: ["it's on fire. it's ON FIRE.", "charcoal edition. still eating it.", "oops. extra crispy."],
  campfireLeave: ["that hit the spot.", "fire's still going. back to patrol.", "warm pixels. good night."],
  // Pistas de verdad sobre el armario: ayudan a descubrir cosas.
  tips: [
    "tip: press / to open the terminal.",
    "tip: double-click me for a flip.",
    "tip: you can drag me around. gently.",
    "psst... ever tried the konami code?",
    "the market stand trades gear for coins.",
    "pet me a lot. good things happen.",
    "the guestbook up there is live. say hi!",
    "type weather in the terminal. i'll check outside.",
    "type visits in the terminal to see who's around.",
    "patch.log has the whole history of this place."
  ],
  // Un poco de historia de Buddy, para que se note que vive aqui.
  lore: [
    "i was compiled on a tuesday. it was raining.",
    "my first word was 'beep'. my second was also 'beep'.",
    "i used to live on a floppy disk. tight fit.",
    "dai built me out of leftover pixels.",
    "i've counted every pixel down here. twice.",
    "one day i'll visit the header. one day.",
    "the rainbow line hums at night. i checked."
  ]
};

// Extra dialogue enters the pools only while the full costume is equipped.
// These are original nods to Miku's virtual-singer identity, teal palette,
// "39" wordplay and famous leek motif rather than quoted song lyrics.
export const MIKU_LINES = {
  boot: ["Miku signal online!", "virtual singer reporting in!", "39! stage link ready."],
  idle: [
    "39 signal: crystal clear!",
    "teal twin-tails at full power.",
    "virtual singer, real footer.",
    "leek supply: secured.",
    "ready for the next song, producer!"
  ],
  walkStop: ["stage mark reached!", "twin-tails calibrated.", "tour stop: footer rail."],
  pet: ["miku miku!", "thank you, producer!", "39!", "encore pets?"],
  party: ["stage lights—on!", "encore mode!", "39 celebration!"],
  dance: ["one, two—spotlight!", "digital diva dance break!", "follow my rhythm!"],
  music: ["shall we sing together?", "this beat needs a teal harmony.", "adding one virtual vocal!"],
  fishCast: ["leek bait deployed!", "digital diva fishing arc!", "casting on beat—one, two!"],
  fishWait: ["shh... the fish is listening.", "holding this note... and the line.", "39 seconds. probably."],
  fishFight: ["high note, high tension!", "producer, this fish has rhythm!", "reel on the beat!"],
  fishEscape: ["the fish skipped the encore...", "next verse, next catch!"],
  fishSight: ["a backup dancer with fins?", "teal fish duet detected!"],
  fishBump: ["fish choreography failed!", "that was not in rehearsal!"],
  fishRare: ["rare catch—spotlight!", "a legendary duet partner!"],
  leviathan: ["that is NOT a stage prop!", "producer, the audience is enormous!"]
};

// Tema de cada frase, para que los buddies de visita sepan de que se esta
// hablando y contesten a juego (BuddyVisitors escucha `daivr-buddy-said`).
const LINE_TOPICS = new Map(
  [...Object.entries(LINES), ...Object.entries(MIKU_LINES)].flatMap(([topic, lines]) => lines.map((line) => [line, topic]))
);
export const EVENT_TOPICS = { fishing: "fishWait", rain: "rain", find: "find", hunt: "bugHunt", outage: "outage", "flying-fish": "fishSight", campfire: "campfire" };
// Frases generadas (tiempo, hora, arcade...) con el tema que traian.
const DYNAMIC_TOPICS = new Map();
const LAST_SEEN_KEY = "daivr.buddyLastSeen.v1";

// Saludo segun la visita anterior. Se calcula una vez por carga de pagina (y
// deja apuntada esta): el doble render de StrictMode no debe pisarlo.
let pageReturnLines = null;
export function visitReturnLines() {
  if (pageReturnLines) return pageReturnLines;
  try {
    const lastSeen = Number(window.localStorage.getItem(LAST_SEEN_KEY)) || 0;
    window.localStorage.setItem(LAST_SEEN_KEY, String(Date.now()));
    pageReturnLines = returnLines(lastSeen || null);
  } catch {
    // Sin almacenamiento no se sabe si es la primera vez: mejor no decir nada.
    pageReturnLines = [];
  }
  return pageReturnLines;
}

export function rememberTopic(line, topic) {
  if (DYNAMIC_TOPICS.size > 400) DYNAMIC_TOPICS.clear();
  DYNAMIC_TOPICS.set(line, topic);
  return line;
}

export function lineTopic(line, eventName = "") {
  if (DYNAMIC_TOPICS.has(line)) return DYNAMIC_TOPICS.get(line);
  if (LINE_TOPICS.has(line)) return LINE_TOPICS.get(line);
  if (/^(RARE|LEGENDARY|MYTHIC|TREASURE):/.test(line)) return "fishRare";
  if (/^caught:/.test(line)) return "fishCommon";
  if (line.startsWith("♪")) return "music";
  if (eventName.startsWith("creature:")) return "birdHello";
  return EVENT_TOPICS[eventName] || "idle";
}
