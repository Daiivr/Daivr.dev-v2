import { useEffect, useRef, useState } from "react";
import { AMBIENT_CREATURES, ENEMY_BUGS, FIELD_FINDS, LEVIATHAN, fishById, weightedCatch } from "../data/buddyWorld";
import { LURE_IDS, ROD_IDS } from "../hooks/useBuddyLoadout";
import { BuddyChuteCanopy, BuddySprite } from "./BuddySprite";
import { BuddyBugWeapon } from "./BuddyBugWeapon";
import { BuddyEnemyBug } from "./BuddyEnemyBug";
import { PixelBird } from "./PixelBird";

const SLEEP_AFTER_MS = 5 * 60 * 1000;
const ATTRACT_WAKE_DELAY_MS = 1000;
const WALK_SPEED_PX_S = 44;
const SLEEPY_SPEED_PX_S = 30;
const FALL_SPEED_PX_S = 58;
const BRAIN_TICK_MS = 1100;
const SPRITE_WIDTH = 64;
const WALK_MARGIN = 72;
const CORNER_MARGIN = 12;
const FISHING_EDGE_MARGIN = 34;
const PET_SPAM_WINDOW_MS = 2600;
const EYE_TRACK_RADIUS = 340;
const DRAG_THRESHOLD_PX = 7;
const FISHING_COOLDOWN_MS = 100000;
const FISHING_SWIFT_COOLDOWN_MS = 55000;
const FISHING_CAST_MS = 560;
const RAIN_COOLDOWN_MS = 85000;
const RAIN_DURATION_MS = 7000;
const FIND_COOLDOWN_MS = 70000;
const ENEMY_COOLDOWN_MS = 95000;
const CREATURE_COOLDOWN_MS = 45000;
const OUTAGE_COOLDOWN_MS = 8 * 60 * 1000;
const DIALOGUE_GAP_MS = 420;
const MIN_DIALOGUE_MS = 1800;

const CONFETTI_COLORS = ["#3fff97", "#45d8ff", "#ff3d9d", "#ffd166", "#f4fff8"];
const SPLASH_COLORS = ["#45d8ff", "#b8f7ff", "#f4fff8"];

const LINES = {
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
  ]
};

// Extra dialogue enters the pools only while the full costume is equipped.
// These are original nods to Miku's virtual-singer identity, teal palette,
// "39" wordplay and famous leek motif rather than quoted song lyrics.
const MIKU_LINES = {
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

const reduceMotionQuery =
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;

const desktopQuery =
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(min-width: 760px)")
    : null;

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/*
  buddy.exe v3 — mascota del cabinet anclada al footer:
  - patrulla la barra, se detiene a comentar, baila, mira al cursor;
  - en desktop camina hasta una esquina libre del footer para dormir;
  - se puede agarrar y soltar: baja en paracaidas hasta el riel;
  - niveles de amistad (props) desbloquean cosmeticos: gorro, lentes, bufanda,
    LED dorado;
  - comenta la cancion de Spotify si hay una sonando.
  Cada humor lleva un contador de generacion para que timers viejos no pisen
  estados nuevos.
*/
export function ScreenBuddy({ onPet, onPowerOutage, user = null, visitCount, friendshipLevel = 1, inventory = [], hiddenGear = [], unlockedGear = [], nowPlaying = null }) {
  const [mood, setMood] = useState("off");
  const [fx, setFx] = useState("");
  const [bubble, setBubble] = useState("");
  const [x, setX] = useState(WALK_MARGIN);
  const [y, setY] = useState(0);
  const [facing, setFacing] = useState(1);
  const [travelDirection, setTravelDirection] = useState(1);
  const [walkMs, setWalkMs] = useState(0);
  const [particles, setParticles] = useState([]);
  const [fishingPhase, setFishingPhase] = useState("");
  const [fishingCatch, setFishingCatch] = useState("");
  const [fishingCatchId, setFishingCatchId] = useState("");
  const [weather, setWeather] = useState("");
  const [fieldFind, setFieldFind] = useState(null);
  const [creature, setCreature] = useState(null);
  const [enemy, setEnemy] = useState(null);
  const [outagePhase, setOutagePhase] = useState("");

  const moodRef = useRef("off");
  const moodGenRef = useRef(0);
  const xRef = useRef(WALK_MARGIN);
  const yRef = useRef(0);
  const facingRef = useRef(1);
  const travelDirectionRef = useRef(1);
  const rootRef = useRef(null);
  const visibleRef = useRef(false);
  const bootedRef = useRef(false);
  const dropInFlightRef = useRef(false);
  const lastActivityRef = useRef(Date.now());
  const lastLineRef = useRef("");
  const timersRef = useRef(new Set());
  const bubbleTimerRef = useRef(0);
  const bubbleGapTimerRef = useRef(0);
  const bubbleQueueRef = useRef([]);
  const activeBubbleRef = useRef(null);
  const activeEventRef = useRef("");
  const fxTimerRef = useRef(0);
  const petTimesRef = useRef([]);
  const particleIdRef = useRef(0);
  const visitCountRef = useRef(null);
  const nowPlayingRef = useRef(null);
  const lastSongRef = useRef("");
  const equippedGearRef = useRef({ lure: "", rod: "" });
  const mikuCostumeRef = useRef(false);
  const inventoryRef = useRef(inventory);
  const fishingCooldownRef = useRef(0);
  const fishSightCommentRef = useRef(0);
  const rainCooldownRef = useRef(0);
  const findCooldownRef = useRef(0);
  const enemyCooldownRef = useRef(0);
  const enemyEncounterRef = useRef(0);
  const creatureCooldownRef = useRef(0);
  const outageCooldownRef = useRef(0);
  const attractModeRef = useRef(false);
  const dragRef = useRef(null);
  const draggedRef = useRef(false);
  const dragFrameRef = useRef(0);
  const pendingDragRef = useRef(null);
  const onPowerOutageRef = useRef(onPowerOutage);
  const userRef = useRef({ name: "guest", discord: false });

  useEffect(() => {
    onPowerOutageRef.current = onPowerOutage;
  }, [onPowerOutage]);

  useEffect(() => {
    const name = String(user?.username || "guest").trim().slice(0, 24) || "guest";
    userRef.current = { name, discord: Boolean(user?.username) };
  }, [user]);

  useEffect(() => {
    visitCountRef.current = typeof visitCount === "number" ? visitCount : null;
  }, [visitCount]);

  useEffect(() => {
    nowPlayingRef.current = nowPlaying?.song ? nowPlaying : null;
  }, [nowPlaying]);

  // Aparejo puesto (hiddenGear ya trae la exclusividad de slot resuelta):
  // el señuelo define las reglas de pesca, la caña solo el color.
  const equippedLure = LURE_IDS.find((id) => unlockedGear.includes(id) && !hiddenGear.includes(id)) || "";
  const equippedRod = ROD_IDS.find((id) => unlockedGear.includes(id) && !hiddenGear.includes(id)) || "";
  const hasMikuCostume = unlockedGear.includes("miku-costume") && !hiddenGear.includes("miku-costume");

  useEffect(() => {
    equippedGearRef.current = { lure: equippedLure, rod: equippedRod };
  }, [equippedLure, equippedRod]);

  useEffect(() => {
    mikuCostumeRef.current = hasMikuCostume;
  }, [hasMikuCostume]);

  useEffect(() => {
    inventoryRef.current = inventory;
  }, [inventory]);

  function updateMood(next) {
    moodGenRef.current += 1;
    moodRef.current = next;
    setMood(next);
  }

  function beginBuddyEvent(name) {
    if (activeEventRef.current) return false;
    activeEventRef.current = name;
    document.documentElement.dataset.buddyEvent = name;
    window.dispatchEvent(new CustomEvent("daivr-buddy-event-state", {
      detail: { active: true, name }
    }));
    return true;
  }

  function endBuddyEvent(name) {
    if (activeEventRef.current !== name) return;
    activeEventRef.current = "";
    delete document.documentElement.dataset.buddyEvent;
    window.dispatchEvent(new CustomEvent("daivr-buddy-event-state", {
      detail: { active: false, name }
    }));
  }

  function updateFacing(next) {
    if (facingRef.current === next) return;
    facingRef.current = next;
    setFacing(next);
  }

  function facingForDirection(direction) {
    return direction >= 0 ? -1 : 1;
  }

  function updateTravelDirection(next) {
    if (travelDirectionRef.current === next) return;
    travelDirectionRef.current = next;
    setTravelDirection(next);
  }

  function faceTravelDirection(direction) {
    updateTravelDirection(direction);
    updateFacing(facingForDirection(direction));
  }

  function moveTo(target) {
    xRef.current = target;
    setX(target);
  }

  function liftTo(target) {
    yRef.current = target;
    setY(target);
  }

  function schedule(fn, ms) {
    const timer = window.setTimeout(() => {
      timersRef.current.delete(timer);
      fn();
    }, ms);
    timersRef.current.add(timer);
    return timer;
  }

  function stageWidth() {
    return rootRef.current?.parentElement?.clientWidth || 640;
  }

  function inwardEventDirection(preferredDirection = 1, position = xRef.current, clearance = 132) {
    const width = stageWidth();
    const preferred = preferredDirection < 0 ? -1 : 1;
    if (position < clearance) return 1;
    if (position + SPRITE_WIDTH > width - clearance) return -1;
    return preferred;
  }

  function pickLine(pool) {
    const options = pool.filter((line) => line !== lastLineRef.current);
    const line = options[Math.floor(Math.random() * options.length)] || pool[0];
    lastLineRef.current = line;
    return line;
  }

  function showNextBubble() {
    const next = bubbleQueueRef.current.shift();
    if (!next) return;

    activeBubbleRef.current = next;
    setBubble(next.line);
    bubbleTimerRef.current = window.setTimeout(() => {
      bubbleTimerRef.current = 0;
      activeBubbleRef.current = null;
      setBubble("");
      bubbleGapTimerRef.current = window.setTimeout(() => {
        bubbleGapTimerRef.current = 0;
        showNextBubble();
      }, DIALOGUE_GAP_MS);
    }, next.ms);
  }

  function say(line, ms = 2400, options = {}) {
    if (!line) return;
    const priority = options.priority === "ambient" ? "ambient" : "event";
    const item = { line, ms: Math.max(MIN_DIALOGUE_MS, ms), priority, key: options.key || "" };
    const active = activeBubbleRef.current;

    if (active?.line === line || bubbleQueueRef.current.some((entry) => entry.line === line)) return;
    if (item.key) bubbleQueueRef.current = bubbleQueueRef.current.filter((entry) => entry.key !== item.key);

    if (priority === "ambient") {
      if (activeEventRef.current) return;
      if (active || bubbleGapTimerRef.current || bubbleQueueRef.current.length) return;
    } else {
      // Events are never discarded, but stale ambient chatter should not make
      // a catch, collision, weather change, or user interaction wait in line.
      bubbleQueueRef.current = bubbleQueueRef.current.filter((entry) => entry.priority !== "ambient");
      if (active?.priority === "ambient") {
        window.clearTimeout(bubbleTimerRef.current);
        window.clearTimeout(bubbleGapTimerRef.current);
        bubbleTimerRef.current = 0;
        bubbleGapTimerRef.current = 0;
        activeBubbleRef.current = null;
        setBubble("");
      }
    }

    bubbleQueueRef.current.push(item);
    if (!active && !bubbleGapTimerRef.current && !bubbleTimerRef.current) showNextBubble();
  }

  function clearDialogue(render = true) {
    window.clearTimeout(bubbleTimerRef.current);
    window.clearTimeout(bubbleGapTimerRef.current);
    bubbleTimerRef.current = 0;
    bubbleGapTimerRef.current = 0;
    activeBubbleRef.current = null;
    bubbleQueueRef.current = [];
    if (render) setBubble("");
  }

  function playFx(name, ms) {
    window.clearTimeout(fxTimerRef.current);
    setFx(name);
    fxTimerRef.current = window.setTimeout(() => setFx(""), ms);
  }

  function spawnParticles(kind, count) {
    // El splash brota en la punta de la linea (afuera, a la altura del riel),
    // no sobre la cabeza del buddy como corazones y confeti.
    const splash = kind === "splash";
    const palette = splash ? SPLASH_COLORS : CONFETTI_COLORS;
    const items = Array.from({ length: count }, () => ({
      id: (particleIdRef.current += 1),
      kind,
      dx: kind === "heart" ? randomBetween(-18, 18) : splash ? randomBetween(-13, 13) : randomBetween(-46, 46),
      dy: kind === "heart" ? randomBetween(-46, -30) : splash ? randomBetween(-32, -14) : randomBetween(-78, -34),
      ox: splash ? facingRef.current * -30 : 0,
      oy: splash ? -30 : 0,
      rot: randomBetween(-280, 280),
      delay: randomBetween(0, splash ? 140 : 240),
      color: palette[Math.floor(Math.random() * palette.length)]
    }));
    const ids = new Set(items.map((item) => item.id));
    setParticles((current) => [...current, ...items]);
    schedule(() => setParticles((current) => current.filter((item) => !ids.has(item.id))), 1500);
  }

  // Posicion actual real (puede estar a mitad de un paseo o caida).
  function currentDomPosition() {
    const node = rootRef.current;
    const parent = node?.parentElement;
    if (!node || !parent) return { x: xRef.current, y: yRef.current };
    const nodeRect = node.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();
    return {
      x: nodeRect.left - parentRect.left,
      y: nodeRect.bottom - (parentRect.top + 2)
    };
  }

  function freezeAtCurrentPosition() {
    const position = currentDomPosition();
    setWalkMs(0);
    moveTo(position.x);
    liftTo(Math.min(0, position.y));
  }

  function settleDown(delayMs) {
    // Solo el humor que programo este timer puede cerrarse a si mismo: si un
    // humor mas nuevo tomo el control, el timer viejo no debe pisarlo.
    const generation = moodGenRef.current;
    schedule(() => {
      if (moodGenRef.current !== generation) return;
      if (["pet", "party", "dance", "talk"].includes(moodRef.current)) {
        updateMood("idle");
      }
    }, delayMs);
  }

  function buddyLine(key) {
    const regular = LINES[key] || [];
    const miku = mikuCostumeRef.current ? MIKU_LINES[key] || [] : [];
    return pickLine(miku.length ? [...miku, ...miku, ...regular] : regular);
  }

  function contextIdlePool() {
    const hour = new Date().getHours();
    const pool = [...LINES.idle, ...LINES.walkStop];
    if (mikuCostumeRef.current) pool.push(...MIKU_LINES.idle, ...MIKU_LINES.idle, ...MIKU_LINES.walkStop);
    if (hour >= 22 || hour < 5) pool.push(...LINES.night, ...LINES.night);
    else if (hour < 11) pool.push(...LINES.morning);
    if (visitCountRef.current) pool.push(`visitor #${visitCountRef.current.toLocaleString("en-US")} logged.`);

    const playing = nowPlayingRef.current;
    if (playing?.song) {
      const song = playing.song.length > 26 ? `${playing.song.slice(0, 24)}...` : playing.song;
      pool.push(`♪ ${song}? good taste.`, ...LINES.music);
    }

    const identity = userRef.current;
    if (identity.discord) {
      pool.push(
        `hey ${identity.name}. footer patrol is online.`,
        `${identity.name}, your Discord signal is crystal clear.`,
        `still exploring, ${identity.name}?`,
        `${identity.name}! i kept the footer warm.`,
        `status report for ${identity.name}: all cozy.`,
        `i recognize that signal, ${identity.name}.`
      );
    } else {
      pool.push(
        "hey guest. enjoying the cabinet?",
        "guest signal detected. welcome in.",
        "you can call me Buddy, guest.",
        "still there, guest? beep twice for yes.",
        "guest patrol companion reporting in.",
        "pick a cartridge, guest. i will guard the footer."
      );
    }

    return pool;
  }

  function greetingPool() {
    const identity = userRef.current;
    const pool = identity.discord
      ? [...LINES.boot, `hello, ${identity.name}!`, `${identity.name} signal linked.`, `welcome back, ${identity.name}.`]
      : [...LINES.boot, "hello, guest!", "guest session linked. stay awhile."];
    if (mikuCostumeRef.current) pool.push(...MIKU_LINES.boot, ...MIKU_LINES.boot);
    return pool;
  }

  function handlePet() {
    if (draggedRef.current) return;
    if (activeEventRef.current) return;
    if (["held", "chute", "outage", "hunt"].includes(moodRef.current)) return;

    const wasAsleep = moodRef.current === "sleep" || moodRef.current === "sleepy";
    const wasFishing = moodRef.current === "fishing";
    lastActivityRef.current = Date.now();

    if (wasFishing) {
      setFishingPhase("");
      setFishingCatch("");
      setFishingCatchId("");
    }

    if (wasAsleep) {
      const hour = new Date().getHours();
      if (hour >= 0 && hour < 6) {
        window.dispatchEvent(new CustomEvent("daivr-buddy-quest-progress", {
          detail: { type: "midnight-wakeup" }
        }));
      }
    }

    const now = Date.now();
    petTimesRef.current = [...petTimesRef.current.filter((t) => now - t < PET_SPAM_WINDOW_MS), now];

    freezeAtCurrentPosition();

    if (petTimesRef.current.length >= 4) {
      petTimesRef.current = [];
      updateMood("pet");
      playFx("dizzy", 1500);
      say(pickLine(LINES.petSpam), 2000, { key: "pet" });
      settleDown(1700);
      onPet?.();
      return;
    }

    updateMood("pet");
    spawnParticles("heart", 3);
    const identity = userRef.current;
    const petLine = !wasAsleep && !wasFishing && identity.discord && Math.random() < 0.35
      ? `${identity.name}! ${buddyLine("pet")}`
      : wasAsleep ? pickLine(LINES.wake) : wasFishing ? buddyLine("fishInterrupt") : buddyLine("pet");
    say(petLine, 1900, { key: "pet" });
    onPet?.();
    settleDown(1700);
  }

  function collectFieldFind() {
    if (moodRef.current === "hunt") return;
    if (!fieldFind) return;
    window.dispatchEvent(new CustomEvent("daivr-buddy-quest-progress", {
      detail: { type: "field-find", id: fieldFind.id }
    }));
    setFieldFind(null);
    updateMood("party");
    spawnParticles("confetti", 10);
    say(`${fieldFind.name} added to collection!`, 2600);
    settleDown(2800);
    schedule(() => endBuddyEvent("find"), 2900);
  }

  function handleFlip() {
    if (reduceMotionQuery?.matches) return;
    if (activeEventRef.current) return;
    if (["held", "chute", "hunt"].includes(moodRef.current)) return;
    playFx("flip", 800);
    say(pickLine(LINES.flip), 1800);
  }

  // --- Agarrar y soltar -----------------------------------------------------

  function applyDragFrame() {
    dragFrameRef.current = 0;
    const drag = dragRef.current;
    const point = pendingDragRef.current;
    if (!drag?.dragging || !point) return;
    moveTo(clamp(drag.originX + (point.clientX - drag.startClientX), 4, drag.maxX));
    liftTo(clamp(drag.originY + (point.clientY - drag.startClientY), drag.minY, 0));
  }

  function handlePointerDown(event) {
    if (reduceMotionQuery?.matches) return;
    if (activeEventRef.current) return;
    if (["outage", "hunt"].includes(moodRef.current)) return;
    if (event.button != null && event.button !== 0) return;
    const node = rootRef.current;
    const parent = node?.parentElement;
    if (!node || !parent) return;

    const parentRect = parent.getBoundingClientRect();
    const position = currentDomPosition();

    dragRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originX: position.x,
      originY: Math.min(0, position.y),
      // Altura maxima: que el sprite no salga del viewport por arriba.
      minY: Math.min(-40, -(parentRect.top - 26)),
      maxX: Math.max(4, parent.clientWidth - SPRITE_WIDTH - 4),
      dragging: false
    };
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      // Punteros sinteticos o ya liberados: el arrastre funciona igual.
    }
  }

  function handlePointerMove(event) {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;

    pendingDragRef.current = { clientX: event.clientX, clientY: event.clientY };

    if (!drag.dragging) {
      const moved = Math.hypot(event.clientX - drag.startClientX, event.clientY - drag.startClientY);
      if (moved < DRAG_THRESHOLD_PX) return;
      drag.dragging = true;
      draggedRef.current = true;
      // Congela la posicion real antes de matar la transicion para no saltar.
      moveTo(drag.originX);
      liftTo(drag.originY);
      setWalkMs(0);
      updateMood("held");
      say(pickLine(LINES.held), 1800);
    }

    if (!dragFrameRef.current) {
      dragFrameRef.current = window.requestAnimationFrame(applyDragFrame);
    }
  }

  function handlePointerRelease(event) {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    dragRef.current = null;
    pendingDragRef.current = null;
    window.cancelAnimationFrame(dragFrameRef.current);
    dragFrameRef.current = 0;
    try {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    } catch {
      // Sin captura activa no hay nada que liberar.
    }

    if (!drag.dragging) return;
    schedule(() => {
      draggedRef.current = false;
    }, 220);

    if (yRef.current < -30) {
      updateMood("chute");
      say(pickLine(hasRocketBoots ? LINES.rocketFall : LINES.chute), 2200);
      const fallMs = clamp((Math.abs(yRef.current) / FALL_SPEED_PX_S) * 1000, 650, 6500);
      const generation = moodGenRef.current;
      setWalkMs(fallMs);
      liftTo(0);
      schedule(() => {
        if (moodGenRef.current !== generation || moodRef.current !== "chute") return;
        setWalkMs(0);
        updateMood("idle");
        say(pickLine(hasRocketBoots ? LINES.rocketLanded : LINES.landed), 2200);
      }, fallMs + 60);
    } else {
      setWalkMs(0);
      liftTo(0);
      updateMood("idle");
    }
  }

  // --- Cerebro ---------------------------------------------------------------

  useEffect(() => {
    const timers = timersRef.current;
    const reduceMotion = Boolean(reduceMotionQuery?.matches);
    const stage = rootRef.current?.parentElement;

    function bootUp() {
      bootedRef.current = true;
      moveTo(Math.min(Math.max(WALK_MARGIN, stageWidth() * 0.14), stageWidth() - WALK_MARGIN - SPRITE_WIDTH));

      if (reduceMotion) {
        updateMood("idle");
        say(pickLine(greetingPool()), 2600);
        return;
      }

      // Aterrizaje inaugural: continua el salto desde la puerta de bienvenida,
      // entrando en paracaidas desde arriba hasta tocar el riel.
      const parentTop = rootRef.current?.parentElement?.getBoundingClientRect().top ?? 300;
      const dropFrom = Math.round(Math.max(200, Math.min(320, parentTop - 30)));
      liftTo(-dropFrom);
      updateMood("chute");
      const generation = moodGenRef.current;
      const fallMs = clamp((dropFrom / FALL_SPEED_PX_S) * 1000, 900, 6500);

      // Un tick para que la posicion elevada pinte antes de iniciar la caida.
      schedule(() => {
        if (moodGenRef.current !== generation) return;
        setWalkMs(fallMs);
        liftTo(0);
      }, 60);

      schedule(() => {
        if (moodGenRef.current !== generation || moodRef.current !== "chute") return;
        setWalkMs(0);
        updateMood("idle");
        say(pickLine(greetingPool()), 2600);
      }, fallMs + 200);
    }

    function startWalk() {
      const maxX = Math.max(WALK_MARGIN, stageWidth() - SPRITE_WIDTH - WALK_MARGIN);
      const target = WALK_MARGIN + Math.random() * (maxX - WALK_MARGIN);
      const distance = Math.abs(target - xRef.current);
      if (distance < 56) return;

      const ms = Math.min(8000, (distance / WALK_SPEED_PX_S) * 1000);
      faceTravelDirection(target > xRef.current ? 1 : -1);
      updateMood("walk");
      const generation = moodGenRef.current;
      setWalkMs(ms);
      moveTo(target);

      schedule(() => {
        if (moodGenRef.current !== generation || moodRef.current !== "walk") return;
        if (Math.random() < 0.4) {
          updateMood("talk");
          say(pickLine([...LINES.walkStop, ...contextIdlePool()]), 2600, { priority: "ambient", key: "ambient" });
          settleDown(2700);
        } else {
          updateMood("idle");
        }
      }, ms + 80);
    }

    // En desktop camina hasta la esquina mas cercana del footer y duerme ahi;
    // en mobile (o con motion reducido) se duerme donde este.
    function goToSleep() {
      function enterSleep() {
        updateMood("sleep");
        window.dispatchEvent(new CustomEvent("daivr-buddy-sleep"));
      }

      if (!desktopQuery?.matches || reduceMotion) {
        enterSleep();
        clearDialogue();
        return;
      }

      const width = stageWidth();
      const leftCorner = CORNER_MARGIN;
      const rightCorner = Math.max(leftCorner, width - SPRITE_WIDTH - CORNER_MARGIN);
      const target = xRef.current < width / 2 ? leftCorner : rightCorner;
      const distance = Math.abs(target - xRef.current);

      if (distance < 24) {
        enterSleep();
        clearDialogue();
        return;
      }

      faceTravelDirection(target > xRef.current ? 1 : -1);
      updateMood("sleepy");
      say(pickLine(LINES.sleepy), 2000);
      const generation = moodGenRef.current;
      const ms = Math.min(11000, (distance / SLEEPY_SPEED_PX_S) * 1000);
      setWalkMs(ms);
      moveTo(target);

      schedule(() => {
        if (moodGenRef.current !== generation || moodRef.current !== "sleepy") return;
        enterSleep();
        clearDialogue();
      }, ms + 80);
    }

    // Sesion de pesca: elige un punto seguro por todo el ancho del footer,
    // camina hasta alli y lanza hacia el lado con espacio. Las capturas raras
    // alimentan la quest "Void angler"; el lucky lure mejora las probabilidades.
    function startFishing() {
      if (!beginBuddyEvent("fishing")) return;
      fishingCooldownRef.current = Date.now();

      const width = stageWidth();
      const minSpot = Math.min(FISHING_EDGE_MARGIN, Math.max(0, width - SPRITE_WIDTH));
      const maxSpot = Math.max(minSpot, width - SPRITE_WIDTH - FISHING_EDGE_MARGIN);
      const target = randomBetween(minSpot, maxSpot);
      const roomOnLeft = target;
      const roomOnRight = width - (target + SPRITE_WIDTH);
      const castLeft = roomOnLeft < 78
        ? false
        : roomOnRight < 78
          ? true
          : Math.random() < 0.5;
      const distance = Math.abs(target - xRef.current);

      function beginSession() {
        // En el sprite base facing 1 apunta a la izquierda. Cerca de un borde
        // lanza hacia dentro; en el centro puede elegir cualquiera de los lados.
        updateTravelDirection(castLeft ? -1 : 1);
        updateFacing(castLeft ? 1 : -1);
        updateMood("fishing");
        const generation = moodGenRef.current;
        const stillFishing = () => moodGenRef.current === generation && moodRef.current === "fishing";

        setFishingPhase("cast");
        setFishingCatch("");
        setFishingCatchId("");
        setWeather("");
        say(buddyLine("fishCast"), 2000);

        schedule(() => {
          if (stillFishing()) setFishingPhase("wait");
        }, FISHING_CAST_MS);

        // El señuelo puesto define las reglas de la sesion.
        const lure = equippedGearRef.current.lure;
        const waitMs = lure === "lure-swift" ? 3200 + Math.random() * 2800 : 7000 + Math.random() * 6000;

        schedule(() => {
          if (stillFishing()) say(buddyLine("fishWait"), 2200);
        }, 2600 + Math.random() * 2400);

        if (waitMs > 9500) {
          schedule(() => {
            if (stillFishing()) say(buddyLine("fishWait"), 2200);
          }, 7800);
        }

        schedule(() => {
          if (!stillFishing()) return;
          setFishingPhase("bite");
          say("!", 900);
        }, FISHING_CAST_MS + waitMs);

        function landCatch(catchItem) {
          const tier = catchItem.rarity;
          setFishingPhase("catch");
          setFishingCatch(tier);
          setFishingCatchId(catchItem.id);
          spawnParticles("splash", 7);
          const prefix = catchItem.kind === "treasure" ? "TREASURE" : tier === "mythic" ? "MYTHIC" : tier === "legendary" ? "LEGENDARY" : tier === "rare" ? "RARE" : "caught";
          const rareEncore = mikuCostumeRef.current && ["rare", "legendary", "mythic"].includes(tier)
            ? ` ${buddyLine("fishRare")}`
            : "";
          say(`${prefix}: ${catchItem.name}!${rareEncore}`, 3300);

          // Toda captura suma al total (desbloquea aparejos); las raras
          // ademas avanzan la quest Void angler.
          window.dispatchEvent(new CustomEvent("daivr-buddy-quest-progress", {
            detail: { type: "fishing-haul", tier, catchId: catchItem.id }
          }));
        }

        function endSessionAfter(ms) {
          schedule(() => {
            if (!stillFishing()) return;
            setFishingPhase("");
            setFishingCatch("");
            setFishingCatchId("");
            setWeather("");
            updateMood("idle");
            endBuddyEvent("fishing");
          }, ms);
        }

        schedule(() => {
          if (!stillFishing()) return;

          // Muy rara vez la sombra no es una captura: es algo que puede tirar
          // del propio Buddy al agua antes de soltar la linea.
          if (Math.random() < 0.025) {
            setFishingPhase("monster");
            setFishingCatch("mythic");
            setFishingCatchId(LEVIATHAN.id);
            say(buddyLine("leviathan"), 3000);
            spawnParticles("splash", 14);
            liftTo(22);
            window.dispatchEvent(new CustomEvent("daivr-buddy-quest-progress", {
              detail: { type: "fishing-sighting", id: LEVIATHAN.id }
            }));

            schedule(() => {
              if (!stillFishing()) return;
              liftTo(0);
              setFishingPhase("escape");
              say("it let go. i am counting that.", 2600);
              endSessionAfter(2300);
            }, 3600);
            return;
          }

          const catchItem = weightedCatch(lure);
          const fightsBack = ["rare", "legendary", "mythic"].includes(catchItem.rarity);

          if (!fightsBack) {
            landCatch(catchItem);
            endSessionAfter(2400);
            return;
          }

          // Los raros pelean: tira de la linea un rato y puede escaparse
          // (el lucky lure tambien ayuda a no perderlos).
          setFishingPhase("fight");
          say(buddyLine("fishFight"), 2000);
          const fightMs = 2600 + Math.random() * 1400;

          schedule(() => {
            if (stillFishing()) say(buddyLine("fishFight"), 1700);
          }, fightMs * 0.55);

          schedule(() => {
            if (!stillFishing()) return;
            const escaped = Math.random() < (lure === "lure" ? 0.15 : lure === "lure-anchor" ? 0.05 : 0.35);

            if (escaped) {
              setFishingPhase("escape");
              spawnParticles("splash", 9);
              playFx("dizzy", 900);
              say(buddyLine("fishEscape"), 2400);
              endSessionAfter(2000);
              return;
            }

            landCatch(catchItem);
            endSessionAfter(2400);
          }, fightMs);
        }, FISHING_CAST_MS + waitMs + 880);
      }

      if (distance < 24) {
        beginSession();
        return;
      }

      faceTravelDirection(target > xRef.current ? 1 : -1);
      updateMood("walk");
      const generation = moodGenRef.current;
      const ms = Math.min(9000, (distance / WALK_SPEED_PX_S) * 1000);
      setWalkMs(ms);
      moveTo(target);

      schedule(() => {
        if (moodGenRef.current !== generation || moodRef.current !== "walk") return;
        setWalkMs(0);
        beginSession();
      }, ms + 80);
    }

    function startRain() {
      if (!beginBuddyEvent("rain")) return;
      rainCooldownRef.current = Date.now();
      freezeAtCurrentPosition();
      setWeather("rain");
      updateMood("rain");
      const generation = moodGenRef.current;
      say(pickLine(LINES.rain), 2600);
      window.dispatchEvent(new CustomEvent("daivr-footer-rain", { detail: { active: true } }));

      schedule(() => {
        setWeather("");
        window.dispatchEvent(new CustomEvent("daivr-footer-rain", { detail: { active: false } }));
        if (moodGenRef.current === generation && moodRef.current === "rain") {
          updateMood("idle");
          say("rain stopped. patrol resumed.", 2000);
        }
        endBuddyEvent("rain");
      }, RAIN_DURATION_MS);
    }

    function startFind() {
      if (!beginBuddyEvent("find")) return;
      findCooldownRef.current = Date.now();
      const item = FIELD_FINDS[Math.floor(Math.random() * FIELD_FINDS.length)];
      const direction = inwardEventDirection(Math.random() < 0.5 ? -1 : 1);
      const maxX = Math.max(WALK_MARGIN, stageWidth() - SPRITE_WIDTH - WALK_MARGIN);
      const target = clamp(xRef.current + direction * randomBetween(70, 140), WALK_MARGIN, maxX);
      const distance = Math.abs(target - xRef.current);
      const ms = Math.min(3600, (distance / WALK_SPEED_PX_S) * 1000);
      faceTravelDirection(target > xRef.current ? 1 : -1);
      updateMood("walk");
      const generation = moodGenRef.current;
      setWalkMs(ms);
      moveTo(target);

      schedule(() => {
        if (moodGenRef.current !== generation || moodRef.current !== "walk") return;
        setWalkMs(0);
        updateMood("find");
        const findSide = inwardEventDirection(direction, target, 104);
        updateTravelDirection(findSide);
        updateFacing(facingForDirection(findSide));
        setFieldFind({ ...item, side: findSide });
        say(pickLine(LINES.find), 2400);
        const findGeneration = moodGenRef.current;
        schedule(() => {
          setFieldFind(null);
          if (moodGenRef.current === findGeneration && moodRef.current === "find") {
            updateMood("idle");
            say("loot signal expired...", 1600);
          }
          endBuddyEvent("find");
        }, 11000);
      }, ms + 80);
    }

    function showCreature(forcedId = "", options = {}) {
      creatureCooldownRef.current = Date.now();
      const pool = AMBIENT_CREATURES.filter((item) => item.id !== "frog");
      const item = forcedId
        ? AMBIENT_CREATURES.find((entry) => entry.id === forcedId)
        : pool[Math.floor(Math.random() * pool.length)];
      if (!item) return;
      if (item.id === "frog") {
        startRain();
        return;
      }
      if (item.id === "leap-fish") {
        window.dispatchEvent(new CustomEvent("daivr-footer-fish", {
          detail: { forceCollision: Boolean(options.forceCollision) }
        }));
        return;
      }
      if (!beginBuddyEvent(`creature:${item.id}`)) return;
      if (item.id !== "bird") {
        setCreature({ ...item, side: inwardEventDirection(Math.random() < 0.5 ? -1 : 1), phase: "active" });
        schedule(() => {
          setCreature((current) => current?.id === item.id ? null : current);
          endBuddyEvent(`creature:${item.id}`);
        }, 6200);
        return;
      }

      setCreature({ ...item, side: inwardEventDirection(Math.random() < 0.5 ? -1 : 1), phase: "fly-in" });
      schedule(() => {
        setCreature((current) => current?.id === "bird" ? { ...current, phase: "perched" } : current);
        if (["idle", "talk"].includes(moodRef.current)) say(pickLine(LINES.birdHello), 2400);
      }, 1450);

      schedule(() => {
        setCreature((current) => current?.id === "bird" ? { ...current, phase: "fly-out" } : current);
        if (["idle", "talk"].includes(moodRef.current)) {
          updateMood("shoo");
          say(pickLine(LINES.birdShoo), 2400);
        }
      }, 6100);

      schedule(() => {
        setCreature((current) => current?.id === "bird" ? null : current);
        if (moodRef.current === "shoo") updateMood("idle");
        endBuddyEvent("creature:bird");
      }, 7500);
    }

    function startBugHunt(forcedWeapon = "") {
      if (!beginBuddyEvent("hunt")) return;
      enemyCooldownRef.current = Date.now();
      const encounterId = enemyEncounterRef.current + 1;
      enemyEncounterRef.current = encounterId;
      const bug = ENEMY_BUGS[Math.floor(Math.random() * ENEMY_BUGS.length)];
      const tools = inventoryRef.current.includes("wrench") ? ["wrench"] : ["net", "laser", "flyswatter"];
      const weapon = ["wrench", "net", "laser", "flyswatter"].includes(forcedWeapon)
        ? forcedWeapon
        : tools[Math.floor(Math.random() * tools.length)];
      const side = inwardEventDirection(Math.random() < 0.5 ? -1 : 1);
      setEnemy({ ...bug, weapon, side, phase: "stalk" });
      updateFacing(side > 0 ? -1 : 1);
      updateMood("hunt");
      say(pickLine(LINES.bugHunt), 2200);

      const encounterIsActive = () => enemyEncounterRef.current === encounterId;

      schedule(() => {
        if (!encounterIsActive()) return;
        setEnemy((current) => current ? { ...current, phase: "ready" } : current);
      }, 900);

      schedule(() => {
        if (!encounterIsActive()) return;
        setEnemy((current) => current ? { ...current, phase: "attack" } : current);
      }, 1800);

      schedule(() => {
        if (!encounterIsActive()) return;
        setEnemy((current) => current ? { ...current, phase: "hit" } : current);
      }, 3300);

      schedule(() => {
        if (!encounterIsActive()) return;
        enemyEncounterRef.current = encounterId + 1;
        setEnemy(null);
        spawnParticles("confetti", 8);
        window.dispatchEvent(new CustomEvent("daivr-buddy-quest-progress", { detail: { type: "bug-defeated" } }));
        updateMood("party");
        say(`${bug.name}: ${pickLine(LINES.bugWin)}`, 2400);
        settleDown(2600);
        schedule(() => endBuddyEvent("hunt"), 2700);
      }, 4700);

      // Last-resort cleanup: even an exceptional interruption can never leave
      // a live bug parked beside Buddy after the encounter window has ended.
      schedule(() => {
        if (!encounterIsActive()) return;
        enemyEncounterRef.current = encounterId + 1;
        setEnemy(null);
        if (moodRef.current === "hunt") updateMood("idle");
        endBuddyEvent("hunt");
      }, 6500);
    }

    function startPowerOutage() {
      if (!beginBuddyEvent("outage")) return;
      outageCooldownRef.current = Date.now();
      freezeAtCurrentPosition();
      updateFacing(facingForDirection(inwardEventDirection(facingRef.current > 0 ? -1 : 1)));
      updateMood("outage");
      const generation = moodGenRef.current;
      setOutagePhase("flicker");
      onPowerOutageRef.current?.("flicker");
      say("power fluctuation detected...", 1500);

      schedule(() => {
        if (moodGenRef.current !== generation || moodRef.current !== "outage") return;
        setOutagePhase("search");
        onPowerOutageRef.current?.("blackout");
        say(pickLine(LINES.outage), 2600);
      }, 1200);

      schedule(() => {
        if (moodGenRef.current !== generation || moodRef.current !== "outage") return;
        setOutagePhase("fix");
        say(pickLine(LINES.outageFix), 2300);
      }, 5100);

      schedule(() => {
        if (moodGenRef.current !== generation || moodRef.current !== "outage") return;
        setOutagePhase("restore");
        onPowerOutageRef.current?.("restore");
        playFx("static", 900);
        say("POWER RESTORED. totally intentional.", 2800);
      }, 7600);

      // La pagina vuelve a la normalidad y la caja se despide con un
      // apagado CRT (colapsa a linea y a punto) antes de desmontarse.
      schedule(() => {
        if (moodGenRef.current !== generation || moodRef.current !== "outage") return;
        setOutagePhase("stow");
        onPowerOutageRef.current?.("");
      }, 10400);

      schedule(() => {
        if (moodGenRef.current !== generation || moodRef.current !== "outage") return;
        setOutagePhase("");
        updateMood("idle");
        endBuddyEvent("outage");
      }, 11200);
    }

    function brainTick() {
      if (!visibleRef.current) return;
      if (attractModeRef.current) return;
      if (activeEventRef.current) return;

      const currentMood = moodRef.current;
      if (["off", "walk", "pet", "party", "dance", "held", "chute", "fishing", "rain", "find", "hunt", "outage", "shoo"].includes(currentMood)) return;

      const idleFor = Date.now() - lastActivityRef.current;

      if (currentMood === "sleepy") {
        // El usuario volvio antes de llegar a la cama: cancela la caminata.
        if (idleFor < SLEEP_AFTER_MS) {
          freezeAtCurrentPosition();
          updateMood("idle");
          say(pickLine(LINES.wake), 1700);
        }
        return;
      }

      if (idleFor > SLEEP_AFTER_MS) {
        if (currentMood !== "sleep") goToSleep();
        return;
      }

      if (currentMood === "sleep") {
        updateMood("idle");
        say(pickLine(LINES.wake), 1700);
        return;
      }

      if (currentMood === "talk") return;

      const roll = Math.random();
      // El swift lure acorta tambien la espera entre sesiones.
      const cooldownMs = equippedGearRef.current.lure === "lure-swift" ? FISHING_SWIFT_COOLDOWN_MS : FISHING_COOLDOWN_MS;
      const canFish = !reduceMotion && Date.now() - fishingCooldownRef.current > cooldownMs;
      // Sin motion la lluvia quedaria congelada en el aire: mejor ni llueve.
      const canRain = !reduceMotion && Date.now() - rainCooldownRef.current > RAIN_COOLDOWN_MS;
      const canFind = Date.now() - findCooldownRef.current > FIND_COOLDOWN_MS;
      const canHunt = !reduceMotion && Date.now() - enemyCooldownRef.current > ENEMY_COOLDOWN_MS;
      const canCreature = !reduceMotion && !creature && Date.now() - creatureCooldownRef.current > CREATURE_COOLDOWN_MS;
      const canOutage = !reduceMotion && Date.now() - outageCooldownRef.current > OUTAGE_COOLDOWN_MS;

      if (canOutage && roll < 0.0007) {
        startPowerOutage();
      } else if (canHunt && roll < 0.025) {
        startBugHunt();
      } else if (canFind && roll < 0.06) {
        startFind();
      } else if (canRain && roll < 0.09) {
        startRain();
      } else if (canFish && roll < 0.14) {
        startFishing();
      } else if (canCreature && roll < 0.2) {
        showCreature();
      } else if (roll < 0.3 && !reduceMotion) {
        startWalk();
      } else if (roll < 0.46) {
        updateMood("talk");
        say(pickLine(contextIdlePool()), 2600, { priority: "ambient", key: "ambient" });
        settleDown(2700);
      } else if (roll < 0.51 && !reduceMotion) {
        updateMood("dance");
        if (Math.random() < 0.5) say(buddyLine("dance"), 2200, { priority: "ambient", key: "ambient" });
        settleDown(2600);
      } else if (roll < 0.58 && !reduceMotion) {
        playFx("static", 700);
      } else if (roll < 0.66 && !reduceMotion) {
        playFx("scan", 1600);
      }
    }

    function markActivity() {
      // Coin interaction belongs to attract mode; Buddy wakes only after its
      // closing transition reports that the cabinet is visible again.
      if (attractModeRef.current) return;
      lastActivityRef.current = Date.now();
    }

    function reactToAttractMode(event) {
      const active = Boolean(event.detail?.active);
      attractModeRef.current = active;

      if (active) {
        if (activeEventRef.current) endBuddyEvent(activeEventRef.current);
        if (moodRef.current === "outage") {
          setOutagePhase("");
          onPowerOutageRef.current?.("");
        }
        freezeAtCurrentPosition();
        clearDialogue();
        enemyEncounterRef.current += 1;
        setEnemy(null);
        if (moodRef.current !== "sleep") updateMood("sleep");
        return;
      }

      lastActivityRef.current = Date.now();
      schedule(() => {
        if (attractModeRef.current || moodRef.current !== "sleep") return;
        updateMood("idle");
        say(pickLine(LINES.wake), 1800);
      }, ATTRACT_WAKE_DELAY_MS);
    }

    function celebrate() {
      if (!visibleRef.current) return;
      if (activeEventRef.current) return;
      if (["pet", "off", "held", "chute", "outage", "hunt"].includes(moodRef.current)) return;
      freezeAtCurrentPosition();
      updateMood("party");
      spawnParticles("confetti", 16);
      say(buddyLine("party"), 2600);
      settleDown(3000);
    }

    function reactToTheme(event) {
      if (!visibleRef.current) return;
      if (activeEventRef.current) return;
      if (["off", "sleep", "sleepy", "held", "chute", "hunt"].includes(moodRef.current)) return;
      playFx("glitchy", 900);
      say(pickLine(event.detail?.theme === "glitch" ? LINES.glitchTheme : LINES.crtTheme), 2400);
    }

    // Cambio de cartucho (navegacion entre secciones): comentario ocasional.
    function reactToCartSwap() {
      if (!visibleRef.current) return;
      if (!["idle", "talk", "walk"].includes(moodRef.current)) return;
      if (Math.random() > 0.35) return;
      say(pickLine(LINES.cartSwap), 2200, { priority: "ambient", key: "navigation" });
    }

    // Gatillo manual de pesca (consola/tests): respeta humor y motion.
    function onFishSignal() {
      if (!visibleRef.current || reduceMotion) return;
      if (!["idle", "talk"].includes(moodRef.current)) return;
      startFishing();
    }

    function reactToFishJump(event) {
      if (!visibleRef.current) return;
      if (activeEventRef.current !== "flying-fish") return;
      if (!["idle", "talk", "walk", "rain"].includes(moodRef.current)) return;
      if (Date.now() - fishSightCommentRef.current < 38000 || Math.random() > 0.34) return;
      const fishX = clamp(Number(event.detail?.x || 50), 0, 100) / 100 * stageWidth();
      fishSightCommentRef.current = Date.now();
      updateFacing(facingForDirection(fishX >= xRef.current ? 1 : -1));
      say(buddyLine("fishSight"), 2300);
    }

    function reactToFishBump(event) {
      if (!visibleRef.current) return;
      if (activeEventRef.current !== "flying-fish") return;
      if (["off", "sleep", "sleepy", "held", "chute", "outage", "hunt"].includes(moodRef.current)) return;
      const direction = Number(event.detail?.direction) < 0 ? -1 : 1;
      freezeAtCurrentPosition();
      const maxX = Math.max(4, stageWidth() - SPRITE_WIDTH - 4);
      setWalkMs(180);
      moveTo(clamp(xRef.current + direction * 12, 4, maxX));
      updateFacing(facingForDirection(-direction));
      playFx("bump", 620);
      spawnParticles("splash", 5);
      say(buddyLine("fishBump"), 2200);
      schedule(() => setWalkMs(0), 200);
    }

    function onWildlifeEvent(event) {
      const detail = event.detail || {};
      if (detail.active) beginBuddyEvent("flying-fish");
      else endBuddyEvent("flying-fish");
    }

    // Gatillo manual de lluvia (consola/tests), mismas reglas.
    function onRainSignal() {
      if (activeEventRef.current) return;
      if (reduceMotion || moodRef.current === "outage") return;
      if (moodRef.current === "hunt") return;
      if (!["idle", "talk"].includes(moodRef.current)) {
        freezeAtCurrentPosition();
        updateMood("idle");
      }
      startRain();
    }

    function onFindSignal() {
      if (activeEventRef.current) return;
      if (moodRef.current === "outage") return;
      if (moodRef.current === "hunt") return;
      if (!["idle", "talk"].includes(moodRef.current)) {
        freezeAtCurrentPosition();
        updateMood("idle");
      }
      startFind();
    }

    function onCreatureSignal(event) {
      if (activeEventRef.current) return;
      if (reduceMotion || moodRef.current === "outage") return;
      if (moodRef.current === "hunt") return;
      if (["off", "chute", "held", "sleep", "sleepy"].includes(moodRef.current)) {
        freezeAtCurrentPosition();
        updateMood("idle");
      }
      showCreature(event.detail?.id || "", event.detail || {});
    }

    function onEnemySignal(event) {
      if (activeEventRef.current) return;
      if (reduceMotion) return;
      if (moodRef.current === "outage") return;
      if (moodRef.current === "hunt") return;
      if (!["idle", "talk"].includes(moodRef.current)) {
        freezeAtCurrentPosition();
        updateMood("idle");
      }
      startBugHunt(event.detail?.weapon || "");
    }

    function onOutageSignal() {
      if (activeEventRef.current) return;
      if (reduceMotion) return;
      if (moodRef.current === "hunt") return;
      if (!["idle", "talk"].includes(moodRef.current)) {
        freezeAtCurrentPosition();
        updateMood("idle");
      }
      startPowerOutage();
    }

    function reactToNowPlaying(event) {
      if (!visibleRef.current) return;
      if (activeEventRef.current) return;
      // La pesca no se interrumpe por musica: puede vibrar sentado.
      if (["off", "held", "chute", "sleepy", "fishing", "outage", "hunt"].includes(moodRef.current)) return;
      const detail = event.detail || {};
      if (!detail.active || !detail.song || detail.song === lastSongRef.current) return;
      lastSongRef.current = detail.song;
      freezeAtCurrentPosition();
      updateMood("dance");
      say(buddyLine("music"), 2600);
      settleDown(3200);
    }

    function reactToCommentTyping(event) {
      const buddyRect = rootRef.current?.getBoundingClientRect();
      const buddyIsVisible = buddyRect && buddyRect.bottom > 0 && buddyRect.top < window.innerHeight && buddyRect.right > 0 && buddyRect.left < window.innerWidth;
      if (!buddyIsVisible || moodRef.current === "off") return;

      const canPause = !activeEventRef.current && !["held", "chute", "fishing", "outage", "hunt"].includes(moodRef.current);
      if (canPause) {
        freezeAtCurrentPosition();
        updateMood("talk");
      }
      const username = String(event.detail?.username || "").trim();
      const line = username && username.toLowerCase() !== "someone" && Math.random() < 0.45
        ? `${username} is composing a transmission... stand by.`
        : pickLine(LINES.commentTyping);
      say(line, 3600, { key: "comment-typing" });
      if (canPause) settleDown(3700);
    }

    // Relevo con la caida de bienvenida (BuddyDrop): mientras el clon del
    // splash sigue en el aire, este buddy NO aparece (evita duplicados); al
    // tocar el riel, toma el control exactamente donde aterrizo.
    function onDropSignal(event) {
      const detail = event.detail || {};

      if (detail.phase === "start") {
        dropInFlightRef.current = true;
        return;
      }

      if (detail.phase === "land") {
        dropInFlightRef.current = false;
        if (bootedRef.current) return;
        bootedRef.current = true;

        const maxX = Math.max(4, stageWidth() - SPRITE_WIDTH - 4);
        setWalkMs(0);
        moveTo(clamp(Number(detail.x) || stageWidth() * 0.14, 4, maxX));
        liftTo(0);
        updateMood("idle");
        say(pickLine(greetingPool()), 2600);
      }
    }

    function clampToStage() {
      const maxX = Math.max(WALK_MARGIN, stageWidth() - SPRITE_WIDTH - WALK_MARGIN);
      if (xRef.current > maxX) {
        setWalkMs(0);
        moveTo(maxX);
      }
    }

    // Ojos que siguen el cursor (via CSS vars, sin re-render). El giro del
    // cuerpo solo ocurre parado, para no torcerlo a mitad de un paseo.
    let eyeRaf = 0;
    function trackPointer(event) {
      if (!visibleRef.current || reduceMotion || eyeRaf) return;
      eyeRaf = window.requestAnimationFrame(() => {
        eyeRaf = 0;
        const node = rootRef.current;
        if (!node) return;
        const rect = node.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);

        if (Math.hypot(dx, dy) < EYE_TRACK_RADIUS) {
          node.style.setProperty("--buddy-eye-x", `${Math.max(-1.7, Math.min(1.7, dx / 70)).toFixed(2)}px`);
          node.style.setProperty("--buddy-eye-y", `${Math.max(-1.2, Math.min(1.2, dy / 90)).toFixed(2)}px`);
          if (["idle", "talk"].includes(moodRef.current)) updateFacing(facingForDirection(dx >= 0 ? 1 : -1));
        } else {
          node.style.setProperty("--buddy-eye-x", "0px");
          node.style.setProperty("--buddy-eye-y", "0px");
        }
      });
    }

    // Primera pesca posible ~45s despues de montar; luego manda el cooldown.
    fishingCooldownRef.current = Date.now() - FISHING_COOLDOWN_MS + 45000;
    rainCooldownRef.current = Date.now() - RAIN_COOLDOWN_MS + 20000;
    findCooldownRef.current = Date.now() - FIND_COOLDOWN_MS + 35000;
    enemyCooldownRef.current = Date.now() - ENEMY_COOLDOWN_MS + 50000;
    creatureCooldownRef.current = Date.now() - CREATURE_COOLDOWN_MS + 18000;
    outageCooldownRef.current = Date.now();

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);
        visibleRef.current = visible;
        if (visible && !bootedRef.current && !dropInFlightRef.current) bootUp();
      },
      { threshold: 0.15 }
    );
    if (stage) observer.observe(stage);

    const brainTimer = window.setInterval(brainTick, BRAIN_TICK_MS);
    const activityEvents = ["pointerdown", "keydown", "wheel", "touchstart"];
    activityEvents.forEach((name) => window.addEventListener(name, markActivity, { passive: true }));
    window.addEventListener("pointermove", markActivity, { passive: true });
    window.addEventListener("pointermove", trackPointer, { passive: true });
    window.addEventListener("daivr-achievement", celebrate);
    window.addEventListener("daivr-theme", reactToTheme);
    window.addEventListener("daivr-now-playing", reactToNowPlaying);
    window.addEventListener("daivr-comment-typing", reactToCommentTyping);
    window.addEventListener("daivr-buddy-drop", onDropSignal);
    window.addEventListener("daivr-cart-swap", reactToCartSwap);
    window.addEventListener("daivr-buddy-fish", onFishSignal);
    window.addEventListener("daivr-footer-fish-seen", reactToFishJump);
    window.addEventListener("daivr-footer-fish-bump", reactToFishBump);
    window.addEventListener("daivr-footer-wildlife-event", onWildlifeEvent);
    window.addEventListener("daivr-buddy-rain", onRainSignal);
    window.addEventListener("daivr-buddy-find", onFindSignal);
    window.addEventListener("daivr-buddy-creature", onCreatureSignal);
    window.addEventListener("daivr-buddy-enemy", onEnemySignal);
    window.addEventListener("daivr-buddy-outage", onOutageSignal);
    window.addEventListener("daivr-attract-mode", reactToAttractMode);
    window.addEventListener("resize", clampToStage);

    return () => {
      observer.disconnect();
      window.clearInterval(brainTimer);
      window.cancelAnimationFrame(eyeRaf);
      window.cancelAnimationFrame(dragFrameRef.current);
      activityEvents.forEach((name) => window.removeEventListener(name, markActivity));
      window.removeEventListener("pointermove", markActivity);
      window.removeEventListener("pointermove", trackPointer);
      window.removeEventListener("daivr-achievement", celebrate);
      window.removeEventListener("daivr-theme", reactToTheme);
      window.removeEventListener("daivr-now-playing", reactToNowPlaying);
      window.removeEventListener("daivr-comment-typing", reactToCommentTyping);
      window.removeEventListener("daivr-buddy-drop", onDropSignal);
      window.removeEventListener("daivr-cart-swap", reactToCartSwap);
      window.removeEventListener("daivr-buddy-fish", onFishSignal);
      window.removeEventListener("daivr-footer-fish-seen", reactToFishJump);
      window.removeEventListener("daivr-footer-fish-bump", reactToFishBump);
      window.removeEventListener("daivr-footer-wildlife-event", onWildlifeEvent);
      window.removeEventListener("daivr-buddy-rain", onRainSignal);
      window.removeEventListener("daivr-buddy-find", onFindSignal);
      window.removeEventListener("daivr-buddy-creature", onCreatureSignal);
      window.removeEventListener("daivr-buddy-enemy", onEnemySignal);
      window.removeEventListener("daivr-buddy-outage", onOutageSignal);
      window.removeEventListener("daivr-attract-mode", reactToAttractMode);
      window.removeEventListener("resize", clampToStage);
      clearDialogue(false);
      window.clearTimeout(fxTimerRef.current);
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
      if (activeEventRef.current) endBuddyEvent(activeEventRef.current);
      onPowerOutageRef.current?.("");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isHappy = ["pet", "party", "dance"].includes(mood)
    || (mood === "fishing" && fishingPhase === "catch")
    || (mood === "hunt" && enemy?.phase === "hit");
  const isAsleep = mood === "sleep";
  const isAirborne = y < -4;
  const hasRocketBoots = unlockedGear.includes("rocket-boots") && !hiddenGear.includes("rocket-boots");
  const currentStageWidth = stageWidth();
  const bubbleAnchor = x > currentStageWidth - 180 ? "anchor-right" : x < 116 ? "anchor-left" : "anchor-center";
  const eventSide = x < 132 ? 1 : x + SPRITE_WIDTH > currentStageWidth - 132 ? -1 : (facing > 0 ? -1 : 1);
  const creatureSide = creature?.side || eventSide;
  const fishingCatchItem = fishById(fishingCatchId);

  return (
    <div
      className={`screen-buddy-root is-${mood} ${fx ? `fx-${fx}` : ""} ${mood === "fishing" && fishingPhase === "fight" ? "is-fish-fight" : ""} ${weather ? `weather-${weather}` : ""} ${outagePhase ? `outage-${outagePhase}` : ""} ${isAirborne ? "is-airborne" : ""} ${hasRocketBoots ? "has-rocket-boots" : ""} ${hasMikuCostume ? "has-miku-costume" : ""}`}
      ref={rootRef}
      style={{
        "--buddy-x": `${x}px`,
        "--buddy-y": `${y}px`,
        "--buddy-walk-ms": `${walkMs}ms`,
        "--buddy-facing": facing,
        "--buddy-travel-direction": travelDirection,
        "--buddy-event-side": eventSide
      }}
    >
      <div className={`screen-buddy-bubble ${bubbleAnchor} ${bubble ? "is-visible" : ""}`} aria-hidden="true">
        {bubble}
      </div>

      {isAsleep ? (
        <span className="screen-buddy-zzz" aria-hidden="true">
          <i>z</i>
          <i>z</i>
          <i>z</i>
        </span>
      ) : null}

      <span className="screen-buddy-particles" aria-hidden="true">
        {particles.map((particle) =>
          particle.kind === "heart" ? (
            <i
              className="buddy-particle buddy-particle-heart"
              key={particle.id}
              style={{ "--px": `${particle.dx}px`, "--py": `${particle.dy}px`, "--pd": `${particle.delay}ms` }}
            >
              ♥
            </i>
          ) : particle.kind === "splash" ? (
            <i
              className="buddy-particle buddy-particle-splash"
              key={particle.id}
              style={{
                left: `${particle.ox}px`,
                bottom: `${particle.oy}px`,
                "--px": `${particle.dx}px`,
                "--py": `${particle.dy}px`,
                "--pd": `${particle.delay}ms`,
                background: particle.color
              }}
            />
          ) : (
            <i
              className="buddy-particle buddy-particle-confetti"
              key={particle.id}
              style={{
                "--px": `${particle.dx}px`,
                "--py": `${particle.dy}px`,
                "--rot": `${particle.rot}deg`,
                "--pd": `${particle.delay}ms`,
                background: particle.color
              }}
            />
          )
        )}
      </span>

      {fieldFind ? (
        <button
          className={`buddy-field-find is-${fieldFind.id}`}
          type="button"
          style={{ "--find-x": `${fieldFind.side * 76}px` }}
          onClick={collectFieldFind}
          aria-label={`Collect ${fieldFind.name}`}
        >
          <i aria-hidden="true" />
          <span>{fieldFind.name}</span>
        </button>
      ) : null}

      {creature && creature.id !== "bird" ? (
        <span
          className={`buddy-ambient-creature is-${creature.id} phase-${creature.phase || "active"}`}
          style={{
            "--creature-moth-start-x": `${creatureSide * 8}px`,
            "--creature-moth-mid-x": `${creatureSide * 36}px`,
            "--creature-moth-end-x": `${creatureSide * 58}px`
          }}
          aria-label={creature.name}
          role="img"
        >
          <><i /><i /><i /></>
        </span>
      ) : null}

      {enemy ? (
        <span className={`buddy-enemy-encounter is-${enemy.id} weapon-${enemy.weapon} phase-${enemy.phase}`} style={{ "--enemy-side": enemy.side }} aria-hidden="true">
          <BuddyEnemyBug bugId={enemy.id} />
          <BuddyBugWeapon weapon={enemy.weapon} />
          <i className="buddy-laser-beam" />
          <i className="buddy-hit-burst"><b /><b /><b /><b /></i>
        </span>
      ) : null}

      <button
        className="screen-buddy arcade-focus"
        type="button"
        aria-label="Pet Dai's screen buddy (drag to carry it)"
        onClick={handlePet}
        onDoubleClick={handleFlip}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerRelease}
        onPointerCancel={handlePointerRelease}
      >
        {creature?.id === "bird" ? (
          <span
            className={`buddy-ambient-creature is-bird phase-${creature.phase || "active"}`}
            style={{
              "--creature-bird-in-start-x": `${creatureSide * 145}px`,
              "--creature-bird-in-mid-x": `${creatureSide * 65}px`,
              "--creature-bird-in-near-x": `${creatureSide * 12}px`,
              "--creature-bird-out-mid-x": `${creatureSide * 28}px`,
              "--creature-bird-out-end-x": `${creatureSide * 140}px`,
              "--creature-bird-in-facing": creatureSide > 0 ? -1 : 1,
              "--creature-bird-out-facing": creatureSide
            }}
            aria-label={creature.name}
            role="img"
          >
            <PixelBird />
          </span>
        ) : null}
        <span className="screen-buddy-body">
          {hasRocketBoots ? null : (
            <BuddyChuteCanopy className="screen-buddy-chute-canopy" upgraded={inventory.includes("parachute-upgrade") && !hiddenGear.includes("parachute-upgrade")} />
          )}

          {mood === "fishing" ? (
            <span
              className={`buddy-fishing-rig is-${fishingPhase || "cast"} ${fishingCatch ? `tier-${fishingCatch}` : ""} ${fishingCatchId ? `catch-${fishingCatchId}` : ""} ${equippedRod} ${equippedLure}`}
              aria-hidden="true"
            >
              {/* Caña + linea dibujadas mirando a la izquierda (facing 1);
                  el contenedor se espeja con --buddy-facing igual que el sprite.
                  Los colores de caña/boya los pisa el aparejo puesto via CSS. */}
              <svg className="buddy-fishing-svg" viewBox="0 0 44 78" width="44" height="78">
                <g className="buddy-fishing-rod-art" shapeRendering="crispEdges">
                  <rect className="buddy-rod-seg" x="30" y="40" width="4" height="3" fill="#b8f7ff" />
                  <rect className="buddy-rod-seg" x="24" y="34" width="8" height="3" fill="#b8f7ff" />
                  <rect className="buddy-rod-seg" x="17" y="27" width="9" height="3" fill="#b8f7ff" />
                  <rect className="buddy-rod-seg" x="10" y="20" width="9" height="3" fill="#b8f7ff" />
                  <rect className="buddy-rod-tip" x="5" y="13" width="7" height="3" fill="#45d8ff" />
                  <rect className="buddy-rod-tip" x="4" y="10" width="4" height="4" fill="#45d8ff" />
                  {/* carrete */}
                  <rect x="26" y="43" width="5" height="5" fill="#ffd166" />
                  <rect x="27" y="44" width="2" height="2" fill="#020604" />
                </g>

                <g className="buddy-fishing-line-group">
                  <g shapeRendering="crispEdges">
                    <rect x="5" y="14" width="1" height="52" fill="rgba(180, 255, 207, 0.75)" />
                    <g className="buddy-fishing-bobber">
                      <rect className="buddy-lure-top" x="3" y="64" width="5" height="3" fill="#ff3d9d" />
                      <rect className="buddy-lure-bottom" x="3" y="67" width="5" height="3" fill="#ffd166" />
                      <rect x="4" y="65" width="2" height="1" fill="#f4fff8" opacity="0.8" />
                    </g>
                  </g>
                </g>

                {/* Superficie del vacio: ondas concentricas alrededor del anzuelo */}
                <g className="buddy-fishing-ripples" shapeRendering="crispEdges">
                  <path className="buddy-water-surface" d="M-13 70h13v-1h11v1h17v2H12v1H-2v-1h-11z" fill="#164d68" />
                  <path className="buddy-ripple buddy-ripple-a" d="M1 70h3v-1h4v1h3v1H8v1H4v-1H1z" fill="#b8f7ff" />
                  <path className="buddy-ripple buddy-ripple-b" d="M-4 71h5v-1h11v1h5v1h-5v1H1v-1h-5z" fill="#45d8ff" />
                  <path className="buddy-ripple buddy-ripple-c" d="M-10 72h7v-1h19v1h8v1h-8v1H-3v-1h-7z" fill="#b8f7ff" />
                </g>

                {/* Pececitos visibles bajo la superficie; el grande se acerca y muerde. */}
                <g className="buddy-fish-school" shapeRendering="crispEdges">
                  <g className="buddy-fish buddy-fish-small">
                    <path d="M22 79h3v-2h5v1h2v3h-2v1h-5v-2h-3l-2 2v-5z" fill="#45d8ff" />
                    <rect x="29" y="78" width="1" height="1" fill="#020604" />
                  </g>
                  <g className="buddy-fish buddy-fish-biter">
                    <path d="M-10 78h4v-3H1v1h3v4H1v2h-7v-2h-4l-3 3v-8z" fill="#ffd166" />
                    <rect x="0" y="76" width="1" height="1" fill="#020604" />
                    <rect className="buddy-fish-mouth" x="3" y="78" width="2" height="1" fill="#f4fff8" />
                  </g>
                  <path className="buddy-hook-line" d="M5 70v8h2v3H4" fill="none" stroke="#b8f7ff" strokeWidth="1" />
                </g>

                <g className="buddy-leviathan" shapeRendering="crispEdges">
                  <path d="M-42 82h9v-6h13v-5H2v4h8v10H2v4h-22v-4h-13v-5h-9l-10 8V72z" fill="#081c24" />
                  <rect x="0" y="77" width="3" height="3" fill="#ff3d9d" />
                  <path d="M-33 72l5-8 5 8m8-2 5-9 5 10" fill="none" stroke="#164d68" strokeWidth="3" />
                </g>

                <g className="buddy-fishing-loot" shapeRendering="crispEdges">
                  {fishingCatchItem?.kind === "treasure" ? (
                    <g className="buddy-catch-chest">
                      <rect x="0" y="25" width="11" height="8" fill="#8a5428" />
                      <rect x="1" y="23" width="9" height="4" fill="#ffd166" />
                      <rect x="4" y="27" width="3" height="4" fill="#f4fff8" />
                    </g>
                  ) : fishingCatchItem?.id === "old-boot" ? (
                    <path className="buddy-catch-boot" d="M1 23h6v7h6v5H1z" fill="#7b8f82" />
                  ) : fishingCatchItem?.id === "soggy-disk" ? (
                    <g><rect x="0" y="24" width="11" height="11" fill="#6da58a" /><rect x="2" y="26" width="7" height="3" fill="#020604" /><rect x="3" y="31" width="5" height="4" fill="#b8f7ff" /></g>
                  ) : (
                    <g className="buddy-catch-fish" style={{ "--catch-color": fishingCatchItem?.color || "#45d8ff" }}>
                      <path d="M-2 27h4v-3h8v2h3v6h-3v2H2v-3h-4l-4 4V23z" fill="var(--catch-color)" />
                      <rect x="9" y="26" width="1" height="1" fill="#020604" />
                    </g>
                  )}
                </g>
              </svg>
            </span>
          ) : null}

          {weather === "rain" ? (
            <span className="buddy-weather" aria-hidden="true">
              <span className="buddy-rain-field">
                {Array.from({ length: 18 }, (_, index) => <i key={index} style={{ "--rain-i": index }} />)}
                {Array.from({ length: 2 }, (_, index) => (
                  <b className="buddy-rain-plink" key={index} style={{ "--plink-i": index }} />
                ))}
              </span>

              {/* Paraguas pixel: primo directo de la cupula del paracaidas
                  (misma escalera rosa, paneles dorado/cian y festones),
                  con punta dorada, mastil y mango en J detras del cuerpo. */}
              <svg className="buddy-umbrella" viewBox="0 0 48 54" width="64" height="72">
                <g shapeRendering="crispEdges">
                  {/* punta */}
                  <rect x="22" y="0" width="4" height="3" fill="#ffd166" />
                  <rect x="23" y="0" width="2" height="1" fill="#f4fff8" opacity="0.7" />

                  {/* cupula en escalera */}
                  <rect x="12" y="3" width="24" height="4" fill="#ff3d9d" />
                  <rect x="8" y="7" width="32" height="4" fill="#ff3d9d" />
                  <rect x="5" y="11" width="38" height="4" fill="#ff3d9d" />
                  <rect x="4" y="15" width="40" height="3" fill="#e02f86" />

                  {/* paneles de color */}
                  <rect x="13" y="3" width="5" height="15" fill="#ffd166" />
                  <rect x="30" y="3" width="5" height="15" fill="#45d8ff" />

                  {/* respiradero + brillo */}
                  <rect x="22" y="3" width="4" height="2" fill="#b3216b" />
                  <rect x="14" y="4" width="7" height="1" fill="rgba(255, 255, 255, 0.35)" />
                  <rect x="26" y="4" width="8" height="1" fill="rgba(255, 255, 255, 0.35)" />

                  {/* festones del borde */}
                  <rect x="4" y="18" width="6" height="2" fill="#e02f86" />
                  <rect x="14" y="18" width="6" height="2" fill="#ffd166" />
                  <rect x="24" y="18" width="6" height="2" fill="#e02f86" />
                  <rect x="34" y="18" width="6" height="2" fill="#45d8ff" />

                  {/* mastil + mango en J */}
                  <rect x="23" y="18" width="2" height="32" fill="#b8f7ff" />
                  <rect x="23" y="50" width="5" height="2" fill="#45d8ff" />
                  <rect x="26" y="47" width="2" height="3" fill="#45d8ff" />
                </g>

                {/* gotas reventando sobre la cupula, una por escalon */}
                <g className="buddy-umbrella-splashes">
                  {[[9, 11], [16, 7], [24, 2], [33, 7], [40, 11]].map(([sx, sy], index) => (
                    <g key={index} transform={`translate(${sx} ${sy})`}>
                      <g className="buddy-umbrella-splash" style={{ "--splash-i": index }}>
                        <rect x="-2" y="-2.5" width="1.5" height="1.5" fill="#b8f7ff" />
                        <rect x="1" y="-3" width="1.5" height="1.5" fill="#f4fff8" />
                        <rect x="-0.5" y="-1" width="1" height="1" fill="#b8f7ff" />
                      </g>
                    </g>
                  ))}
                </g>
              </svg>
            </span>
          ) : null}

          {mood === "outage" ? (
            <span className={`buddy-outage-kit is-${outagePhase}`} aria-hidden="true">
              <svg className="buddy-flashlight-beam" viewBox="0 0 168 112" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="buddy-beam-outer" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#fff5bf" stopOpacity=".72" />
                    <stop offset=".42" stopColor="#ffd166" stopOpacity=".28" />
                    <stop offset="1" stopColor="#ffd166" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="buddy-beam-core" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#fffbe0" stopOpacity=".92" />
                    <stop offset=".52" stopColor="#ffe69a" stopOpacity=".22" />
                    <stop offset="1" stopColor="#ffe69a" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path className="buddy-beam-outer" d="M0 49 168 2v108L0 61z" fill="url(#buddy-beam-outer)" />
                <path className="buddy-beam-core" d="M0 52 154 24v66L0 58z" fill="url(#buddy-beam-core)" />
              </svg>

              <svg className="buddy-flashlight" viewBox="0 0 30 16">
                <g shapeRendering="crispEdges">
                  <path d="M1 5h17V2h8v3h3v7h-3v3h-8v-3H1z" fill="#071b1c" />
                  <rect x="3" y="7" width="17" height="4" fill="#ffd166" />
                  <rect x="5" y="7" width="5" height="4" fill="#45d8ff" />
                  <rect x="20" y="4" width="6" height="9" fill="#f4fff8" />
                  <rect x="22" y="6" width="4" height="5" fill="#ffd166" />
                  <rect x="1" y="6" width="4" height="6" fill="#174b57" />
                </g>
              </svg>

              {/* Gabinete de breakers estilo cabinet: placa con rayo, medidor
                  con aguja muerta, LEDs de falla, fila de breakers chicos,
                  palanca principal caida, franjas de peligro y conductos que
                  bajan al riel. La aguja/palanca/LEDs se animan por fase. */}
              <svg className="buddy-breaker-box" viewBox="0 0 48 64">
                <g shapeRendering="crispEdges">
                  {/* carcasa con biseles */}
                  <path d="M4 0h40v4h4v52h-4v4H4v-4H0V4h4z" fill="#06100b" />
                  <rect x="3" y="3" width="42" height="54" fill="#0d2a22" />
                  <rect x="6" y="6" width="36" height="48" fill="#153b31" />
                  <rect x="4" y="4" width="2" height="2" fill="#b8f7ff" />
                  <rect x="42" y="4" width="2" height="2" fill="#b8f7ff" />
                  <rect x="4" y="54" width="2" height="2" fill="#b8f7ff" />
                  <rect x="42" y="54" width="2" height="2" fill="#b8f7ff" />

                  {/* placa de identificacion: rayo + lineas de etiqueta */}
                  <rect x="9" y="9" width="30" height="9" fill="#071b1c" />
                  <rect x="14" y="10" width="4" height="2.5" fill="#ffd166" />
                  <rect x="12.5" y="12.5" width="4" height="2.5" fill="#ffd166" />
                  <rect x="15" y="15" width="4" height="2.5" fill="#ffd166" />
                  <rect x="23" y="11" width="13" height="2" fill="#2a725a" />
                  <rect x="23" y="14.5" width="9" height="1.5" fill="#1d5344" />

                  {/* medidor analogico: la aguja revive al restaurar */}
                  <rect x="9" y="21" width="16" height="13" fill="#071b1c" />
                  <rect x="10" y="22" width="14" height="1" fill="rgba(69, 216, 255, 0.22)" />
                  <rect x="11" y="24" width="1" height="2" fill="#2a725a" />
                  <rect x="16.5" y="23.5" width="1" height="2.5" fill="#2a725a" />
                  <rect x="22" y="24" width="1" height="2" fill="#2a725a" />
                  <rect className="buddy-breaker-needle" x="16.5" y="24.5" width="1.5" height="7.5" fill="#45d8ff" />
                  <rect x="16" y="31" width="3" height="2" fill="#2a725a" />

                  {/* LEDs de estado: parpadean en falla, verdes al volver */}
                  <rect className="buddy-breaker-led buddy-breaker-led-a" x="28" y="21" width="5" height="4" fill="#ff5f68" />
                  <rect className="buddy-breaker-led buddy-breaker-led-b" x="35" y="21" width="5" height="4" fill="#ff5f68" />
                  <rect x="28" y="27" width="12" height="2" fill="#0d1f15" />

                  {/* fila de breakers chicos (decorativos) */}
                  <rect x="9" y="37" width="16" height="9" fill="#071b1c" />
                  <rect x="10.5" y="38" width="4" height="7" fill="#0d1f15" />
                  <rect x="10.5" y="38" width="4" height="3" fill="#174b57" />
                  <rect x="15.5" y="38" width="4" height="7" fill="#0d1f15" />
                  <rect x="15.5" y="42" width="4" height="3" fill="#174b57" />
                  <rect x="20.5" y="38" width="4" height="7" fill="#0d1f15" />
                  <rect x="20.5" y="38" width="4" height="3" fill="#174b57" />

                  {/* palanca principal: caida durante el apagon */}
                  <rect x="30" y="31" width="8" height="17" fill="#071b1c" />
                  <rect x="31" y="32" width="1" height="15" fill="rgba(184, 247, 255, 0.14)" />
                  <g className="buddy-breaker-lever">
                    <rect x="32.5" y="35" width="3" height="10" fill="#ffd166" />
                    <rect x="34.5" y="35" width="1" height="10" fill="rgba(2, 6, 4, 0.35)" />
                    <rect x="30.5" y="32" width="7" height="4" fill="#ff5f68" />
                    <rect x="31.5" y="33" width="2" height="1" fill="#f4fff8" opacity="0.8" />
                  </g>
                  <rect x="31" y="45" width="6" height="3" fill="#2a725a" />

                  {/* franjas de peligro en diagonal pixel */}
                  <rect x="6" y="48.5" width="36" height="4" fill="#071b1c" />
                  <rect x="7" y="48.5" width="4" height="2" fill="#ffd166" />
                  <rect x="15" y="48.5" width="4" height="2" fill="#ffd166" />
                  <rect x="23" y="48.5" width="4" height="2" fill="#ffd166" />
                  <rect x="31" y="48.5" width="4" height="2" fill="#ffd166" />
                  <rect x="39" y="48.5" width="3" height="2" fill="#ffd166" />
                  <rect x="9" y="50.5" width="4" height="2" fill="#ffd166" />
                  <rect x="17" y="50.5" width="4" height="2" fill="#ffd166" />
                  <rect x="25" y="50.5" width="4" height="2" fill="#ffd166" />
                  <rect x="33" y="50.5" width="4" height="2" fill="#ffd166" />

                  {/* conductos hacia el riel */}
                  <rect x="11" y="58" width="4" height="2" fill="#0d1f15" />
                  <rect x="21" y="58" width="4" height="2" fill="#0d1f15" />
                  <rect x="31" y="58" width="4" height="2" fill="#0d1f15" />
                  <rect x="12" y="60" width="2" height="4" fill="#45d8ff" />
                  <rect x="22" y="60" width="2" height="4" fill="#ffd166" />
                  <rect x="32" y="60" width="2" height="4" fill="#ff3d9d" />
                </g>
              </svg>

              <span className="buddy-breaker-sparks"><i /><i /><i /><i /></span>
            </span>
          ) : null}

          <BuddySprite
            className="screen-buddy-sprite"
            expression={isHappy ? "happy" : isAsleep ? "sleep" : "idle"}
            facing={facing}
            friendshipLevel={friendshipLevel}
            inventory={inventory}
            hiddenGear={hiddenGear}
            unlockedGear={unlockedGear}
          />

          {mood === "fishing" && hasMikuCostume ? (
            <span
              className={`buddy-fishing-rod-overlay is-${fishingPhase || "cast"} ${equippedRod}`}
              aria-hidden="true"
            >
              <svg className="buddy-fishing-rod-overlay-svg" viewBox="0 0 44 78" width="44" height="78">
                <g shapeRendering="crispEdges">
                  <rect className="buddy-rod-seg" x="30" y="40" width="4" height="3" fill="#b8f7ff" />
                  <rect className="buddy-rod-seg" x="24" y="34" width="8" height="3" fill="#b8f7ff" />
                  <rect className="buddy-rod-seg" x="17" y="27" width="9" height="3" fill="#b8f7ff" />
                  <rect className="buddy-rod-seg" x="10" y="20" width="9" height="3" fill="#b8f7ff" />
                  <rect className="buddy-rod-tip" x="5" y="13" width="7" height="3" fill="#45d8ff" />
                  <rect className="buddy-rod-tip" x="4" y="10" width="4" height="4" fill="#45d8ff" />
                  <rect x="26" y="43" width="5" height="5" fill="#ffd166" />
                  <rect x="27" y="44" width="2" height="2" fill="#020604" />

                  {/* Two small foreground grips visually lock her posed hands
                      around the handle instead of letting it cross her body. */}
                  <g className="buddy-miku-rod-grip">
                    <rect x="28" y="38" width="5" height="4" fill="#202633" />
                    <rect x="29" y="39" width="3" height="2" fill="#ffd8c8" />
                    <rect x="31" y="42" width="5" height="4" fill="#202633" />
                    <rect x="32" y="43" width="3" height="2" fill="#ffd8c8" />
                  </g>
                </g>
              </svg>
            </span>
          ) : null}
        </span>
        <span className="screen-buddy-shadow" aria-hidden="true" />
      </button>
    </div>
  );
}
