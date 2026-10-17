import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Save, Undo2 } from "lucide-react";
import { isRoomDisplayAllowed, ownedRoomDisplays, roomSeason } from "../../shared/buddy-room.mjs";
import { useBuddyRoom } from "../hooks/useBuddyRoom";
import { getSeasonalEvent } from "../lib/seasons";
import { outfitFor, wornSlots } from "../lib/pixelWorld/pip/outfit";
import { ROOM_H, ROOM_SPOTS, ROOM_W, createRoomPainter, roomOptionIcon } from "../lib/pixelWorld/room";
import { BuddyCollectibleIcon } from "./BuddyCollectibleIcon";
import { PixelIcon } from "./BuddyMenuDecor";
import "../styles/buddy-room.css";

const PALETTES = [["aurora", "Aurora"], ["plum", "Plum dusk"], ["amber", "Warm amber"]];
const SEASONS = { winter: "Snow over the pines", spring: "Spring in the clearing", summer: "An endless summer evening", autumn: "Autumn in the clearing", halloween: "A spooky little evening" };
const SLOTS = [["aquarium", "Aquarium"], ["shelfLeft", "Left shelf"], ["shelfRight", "Right shelf"]];
const FISH_SLOTS = [["aquarium", "Main fish", "Large · foreground"], ["aquariumBackLeft", "Back fish 1", "Small · background"], ["aquariumBackRight", "Back fish 2", "Small · background"]];
// Donde cae cada boton sobre el lienzo, en % (las zonas vienen de room.js).
const spotStyle = ({ x, y, w, h }) => ({ left: `${x / ROOM_W * 100}%`, top: `${y / ROOM_H * 100}%`, width: `${w / ROOM_W * 100}%`, height: `${h / ROOM_H * 100}%` });

// Icono de pixel de una opcion del estudio (mismo dibujo que el cuarto).
function RoomOptionIcon({ group, id }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current, g = canvas?.getContext("2d");
    if (!g) return;
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, 24, 12);
    g.drawImage(roomOptionIcon(group, id), 0, 0);
  }, [group, id]);
  return <canvas ref={ref} className="room-option-art" width={24} height={12} aria-hidden="true" />;
}

function Choices({ number, label, group, value, options, onChange }) {
  return <fieldset className="room-choices">
    <legend><span className="room-control-index" aria-hidden="true">{number}</span>{label}</legend>
    <div>{options.map(([id, name]) => <button className="room-option" type="button" key={id} aria-label={name} aria-pressed={value === id} onClick={() => onChange(id)}>
      <RoomOptionIcon group={group} id={id} />
      <span className="room-option-name">{name}</span>
      {value === id ? <span className="room-option-check" aria-hidden="true"><Check size={10} /></span> : null}
    </button>)}</div>
  </fieldset>;
}

// El cuarto en pixel art (room.js): se anima solo mientras se ve; con
// movimiento reducido queda un fotograma quieto.
function RoomCanvas({ view }) {
  const ref = useRef(null);
  const viewRef = useRef(view);
  viewRef.current = view;
  const painter = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    painter.current = createRoomPainter(canvas);
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const t0 = performance.now();
    let frame = 0, last = -Infinity, visible = false;
    const tick = (now) => {
      frame = requestAnimationFrame(tick);
      if (now - last < 33) return;
      last = now;
      painter.current.draw(Math.max(0, (now - t0) / 1000), viewRef.current);
    };
    painter.current.draw(reduce ? 4 : 0, viewRef.current);
    if (reduce) return undefined;
    const seen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      cancelAnimationFrame(frame);
      if (visible) frame = requestAnimationFrame(tick);
    });
    seen.observe(canvas);
    return () => { cancelAnimationFrame(frame); seen.disconnect(); };
  }, []);
  // Un cambio de decoracion se ve al momento, aunque no haya animacion.
  useEffect(() => { painter.current?.draw(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? 4 : performance.now() / 1000, view); }, [view]);
  return <canvas ref={ref} className="room-canvas" width={ROOM_W} height={ROOM_H} aria-hidden="true" />;
}

export default function BuddyRoom({ buddy, seasonalEvent }) {
  const state = useBuddyRoom();
  const [slot, setSlot] = useState("aquarium");
  const [fishSlot, setFishSlot] = useState("aquarium");
  const [napping, setNapping] = useState(false);
  const [speech, setSpeech] = useState("");
  const speechTimer = useRef(null);
  useEffect(() => () => clearTimeout(speechTimer.current), []);
  const greetBuddy = () => {
    setNapping(!napping);
    setSpeech(napping ? "home, sweet home." : "just five more minutes…");
    clearTimeout(speechTimer.current);
    speechTimer.current = setTimeout(() => setSpeech(""), 4000);
  };
  const [tab, setTab] = useState("decorate");
  const displays = useMemo(() => ownedRoomDisplays(buddy.adventure), [buddy.adventure]);
  const season = roomSeason(seasonalEvent);
  const selectedSlot = slot === "aquarium" ? fishSlot : slot;
  const candidates = displays.filter((item) => isRoomDisplayAllowed(selectedSlot, item.key));
  const { room } = state;
  const displayFor = (id) => displays.find((item) => item.key === room[id] && isRoomDisplayAllowed(id, item.key));
  const outfitKey = JSON.stringify([buddy.friendship.level, buddy.adventure.inventoryIds, buddy.effectiveHiddenGear, buddy.unlockedGearIds]);
  const outfit = useMemo(
    () => wornSlots(outfitFor({ friendshipLevel: buddy.friendship.level, inventory: buddy.adventure.inventoryIds, hiddenGear: buddy.effectiveHiddenGear, unlockedGear: buddy.unlockedGearIds, season: getSeasonalEvent() || "" })),
    [outfitKey] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const fishKeys = FISH_SLOTS.map(([id]) => displayFor(id)?.key || "").join("|");
  const shelfLeft = displayFor("shelfLeft")?.key || "", shelfRight = displayFor("shelfRight")?.key || "";
  const view = useMemo(() => ({
    palette: room.palette, bed: room.bed, rug: room.rug, prop: room.prop, season,
    fish: fishKeys.split("|").map((key) => key.split(":")[1] || ""),
    shelves: { shelfLeft, shelfRight }, napping, outfit, expression: speech && !napping ? "happy" : "idle"
  }), [room.palette, room.bed, room.rug, room.prop, season, fishKeys, shelfLeft, shelfRight, napping, outfit, speech]);
  const school = FISH_SLOTS.map(([id]) => displayFor(id)).filter(Boolean);
  const pick = (id) => { setSlot(id); setTab("collection"); };

  return <div className="buddy-room">
    <div className="room-main">
      <div className="room-scene-heading"><span className="buddy-sign">A place of your own</span><span>ROOM / 01</span></div>
      {/* Nothing known about this visitor's room yet: an opening state, never
          the default room that would then swap for theirs. */}
      {!state.ready ? <div className="room-scene room-scene-opening" role="status"><span><i aria-hidden="true" />Opening your room…</span></div> : <div className="room-scene">
        <RoomCanvas view={view} />
        <div className="room-window-hotspot" style={spotStyle(ROOM_SPOTS.window)} tabIndex={0} role="img" aria-label={`${SEASONS[season]}. Pines under a starry night sky.`} onPointerDown={(event) => event.currentTarget.focus()}>
          <span className="room-window-caption" aria-hidden="true">{SEASONS[season]}</span>
        </div>
        {SLOTS.map(([id, label]) => {
          const item = displayFor(id);
          const names = id === "aquarium" ? school.map((fish) => fish.name).join(", ") : item?.name;
          return <button type="button" key={id} style={spotStyle(ROOM_SPOTS[id])} className={`room-display room-display-${id} ${slot === id && tab === "collection" ? "is-selected" : ""}`} disabled={state.loading || state.saving} aria-label={`Choose ${label.toLowerCase()} display${names ? `: ${names}` : ": empty"}`} onClick={() => pick(id)}>
            {id === "aquarium" && !school.length ? <span className="room-aquarium-invite">+ add fish</span> : null}
            <span className="room-display-label">{names || label}</span>
          </button>;
        })}
        <button type="button" style={spotStyle(ROOM_SPOTS.resident)} className={`room-resident ${napping ? "is-napping" : ""}`} onClick={greetBuddy} aria-pressed={napping} aria-label={napping ? "Wake Buddy" : "Let Buddy nap"}>
          {speech ? <span key={speech} className="room-buddy-speech" aria-hidden="true">{speech}</span> : null}
        </button>
        <span className="sr-only" role="status">{speech}</span>
      </div>}
      <div className="room-caption"><span>{napping ? "Recharging for the next adventure." : "Tap Buddy for a well-earned nap."}</span><span className="buddy-chip">LV {String(buddy.friendship.level).padStart(2, "0")}</span></div>
      {/* What is on show, one tap from changing it. Displaying keeps the item in your collection. */}
      <div className="room-displays" role="group" aria-label="On display">
        <div className="room-displays-head"><span className="buddy-sign">On display</span><small>Tap one to change it · items stay in your collection</small></div>
        <div className="room-displays-list">{[["aquarium", "Aquarium", school], ["shelfLeft", "Left shelf", [displayFor("shelfLeft")].filter(Boolean)], ["shelfRight", "Right shelf", [displayFor("shelfRight")].filter(Boolean)]].map(([id, label, items]) => <button type="button" key={id} className={`room-display-card ${items.length ? "" : "is-empty"} ${slot === id && tab === "collection" ? "is-selected" : ""}`} disabled={!state.ready || state.saving} onClick={() => pick(id)}>
          <span className="room-display-card-art" aria-hidden="true">{items.length ? <BuddyCollectibleIcon id={items[0].id} color={items[0].color} /> : <PixelIcon name="plus" />}</span>
          <span className="room-display-card-copy"><strong>{label}</strong><small>{items.length ? items.map((item) => item.name).join(", ") : "Empty"}</small></span>
        </button>)}</div>
      </div>
    </div>
    <section className="room-editor" aria-label="Room customization">
      <div className="room-editor-heading"><span className="buddy-sign">Room studio</span><span>MAKE IT YOURS</span></div>
      <div className="room-editor-tabs" role="group" aria-label="Room controls"><button type="button" aria-pressed={tab === "decorate"} onClick={() => setTab("decorate")}>Decorate</button><button type="button" aria-pressed={tab === "collection"} onClick={() => setTab("collection")}>Collection <span>{displays.length}</span></button></div>
      <fieldset className="room-editor-fields" disabled={state.loading || state.saving}>
        <legend className="sr-only">Customize your room</legend>
        {tab === "decorate" ? <>
          <Choices number="01" label="Atmosphere" group="palette" value={room.palette} options={PALETTES} onChange={(value) => state.update("palette", value)} />
          <Choices number="02" label="A place to rest" group="bed" value={room.bed} options={[["cot", "Cozy cot"], ["cushion", "Floor cushion"], ["bunk", "Loft bed"]]} onChange={(value) => state.update("bed", value)} />
          <Choices number="03" label="Underfoot" group="rug" value={room.rug} options={[["checker", "Checker rug"], ["moon", "Moon rug"], ["none", "Bare floor"]]} onChange={(value) => state.update("rug", value)} />
          <Choices number="04" label="Little comforts" group="prop" value={room.prop} options={[["plant", "Houseplant"], ["lamp", "Reading lamp"], ["books", "Book stack"]]} onChange={(value) => state.update("prop", value)} />
        </> : <>
          <fieldset className="room-slot-picker"><legend>Choose a display</legend><div>{SLOTS.map(([id, name]) => <button type="button" key={id} aria-pressed={slot === id} onClick={() => setSlot(id)}>{name}</button>)}</div></fieldset>
          {slot === "aquarium" ? <div className="room-fish-slots" role="group" aria-label="Aquarium residents">{FISH_SLOTS.map(([id, name, size]) => <button type="button" key={id} aria-pressed={fishSlot === id} onClick={() => setFishSlot(id)}><span>{name}</span><small>{size}</small><strong>{displayFor(id)?.name || "Empty"}</strong></button>)}</div> : null}
          <p className="room-collection-hint">{slot === "aquarium" ? "Choose a resident above, then a caught fish below. Selecting a fish already in the tank moves it to this slot." : "Display market decorations, patrol finds, fishing junk, or treasure. Your fish live in the aquarium."}</p>
          <div className="room-collection"><button type="button" className="room-item" aria-pressed={!displayFor(selectedSlot)} onClick={() => state.update(selectedSlot, "")}><span aria-hidden="true">—</span><strong>Leave empty</strong></button>{candidates.map((item) => <button type="button" className="room-item" key={item.key} aria-pressed={room[selectedSlot] === item.key} onClick={() => state.update(selectedSlot, item.key)}><BuddyCollectibleIcon id={item.id} color={item.color} /><strong>{item.name}</strong><small>{slot === "aquarium" ? FISH_SLOTS.find(([id]) => room[id] === item.key)?.[1] || item.rarity : item.rarity || "patrol find"}</small></button>)}</div>
          {!candidates.length ? <div className="room-empty-note"><PixelIcon name={slot === "aquarium" ? "fish" : "scroll"} /><strong>{slot === "aquarium" ? "A little life, coming soon." : "A shelf for your stories."}</strong><p>{slot === "aquarium" ? "Let Buddy fish at the footer, then come back to choose your first resident." : "Explore with Buddy to collect your first display."}</p></div> : null}
        </>}
      </fieldset>
      <footer className={`room-save ${state.dirty || state.retry ? "has-changes" : ""}`}><div className="room-save-state"><span><i aria-hidden="true" />{state.loading ? "OPENING ROOM" : state.saving ? "SAVING ROOM" : state.retry ? "SYNC PENDING" : state.dirty ? "UNSAVED CHANGES" : "ROOM READY"}</span><span>YOUR SAVE SLOT</span></div><p role="status">{state.status}</p><div className="room-save-actions"><button type="button" className="room-save-button" disabled={state.loading || state.saving || (!state.dirty && !state.retry)} onClick={state.save}><Save size={15} aria-hidden="true" />{state.saving ? "Saving…" : "Save room"}</button><button type="button" disabled={!state.dirty || state.saving} onClick={state.undo}><Undo2 size={14} aria-hidden="true" />Undo</button></div></footer>
    </section>
  </div>;
}
