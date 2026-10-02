import { useEffect, useMemo, useRef, useState } from "react";
import { Armchair, Check, Fish, Home, Moon, Palette, Save, Undo2 } from "lucide-react";
import { isRoomDisplayAllowed, ownedRoomDisplays, roomSeason } from "../../shared/buddy-room.mjs";
import { useBuddyRoom } from "../hooks/useBuddyRoom";
import { BuddySprite } from "./BuddySprite";
import { BuddyCollectibleIcon } from "./BuddyCollectibleIcon";
import { BuddyRoomScenery } from "./BuddyRoomScenery";
import { BuddyRoomAquarium } from "./BuddyRoomAquarium";
import { BuddyRoomOptionArt } from "./BuddyRoomOptionArt";
import "../styles/buddy-room.css";

const PALETTES = [["aurora", "Aurora"], ["plum", "Plum dusk"], ["amber", "Warm amber"]];
const SEASONS = { winter: "Snow over the pines", spring: "Spring in the clearing", summer: "An endless summer evening", autumn: "Autumn in the clearing", halloween: "A spooky little evening" };
const SLOTS = [["aquarium", "Aquarium"], ["shelfLeft", "Left shelf"], ["shelfRight", "Right shelf"]];
const FISH_SLOTS = [["aquarium", "Main fish", "Large · foreground"], ["aquariumBackLeft", "Back fish 1", "Small · background"], ["aquariumBackRight", "Back fish 2", "Small · background"]];

function Choices({ number, label, value, options, onChange }) {
  return <fieldset className="room-choices">
    <legend><span className="room-control-index" aria-hidden="true">{number}</span>{label}</legend>
    <div>{options.map(([id, name]) => <button className="room-option" type="button" key={id} aria-label={name} aria-pressed={value === id} onClick={() => onChange(id)}>
      <BuddyRoomOptionArt id={id} />
      <span className="room-option-name">{name}</span>
      <span className="room-option-check" aria-hidden="true">{value === id ? <Check size={10} /> : null}</span>
    </button>)}</div>
  </fieldset>;
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

  return <div className="buddy-room">
    <div className="room-main">
      <div className="room-scene-heading"><span><Home size={14} aria-hidden="true" /> A place of your own</span><span>ROOM / 01</span></div>
      <div className={`room-scene palette-${room.palette} season-${season}`}>
        <BuddyRoomScenery room={room} season={season} />
        <div className="room-window-hotspot" tabIndex={0} role="img" aria-label={`${SEASONS[season]}. Trees sway beneath a starry mountain sky.`} onPointerDown={(event) => event.currentTarget.focus()}>
          <span className="room-window-caption" aria-hidden="true">{SEASONS[season]}</span>
        </div>
        {SLOTS.map(([id, label]) => {
          const item = displayFor(id);
          return <button type="button" key={id} className={`room-display room-display-${id} ${slot === id && tab === "collection" ? "is-selected" : ""}`} disabled={state.loading || state.saving} aria-label={`Choose ${label.toLowerCase()} display${item ? `: ${item.name}` : ": empty"}`} onClick={() => { setSlot(id); setTab("collection"); }}>
            {id === "aquarium" ? <BuddyRoomAquarium featured={item} companions={[displayFor("aquariumBackLeft"), displayFor("aquariumBackRight")]} /> : item ? <BuddyCollectibleIcon id={item.id} color={item.color} /> : <span className="room-display-empty" aria-hidden="true">+</span>}
            <span className="room-display-label">{item?.name || label}</span>
          </button>;
        })}
        <button type="button" className={`room-resident ${napping ? "is-napping" : ""}`} onClick={greetBuddy} aria-pressed={napping} aria-label={napping ? "Wake Buddy" : "Let Buddy nap"}>
          <BuddySprite expression={napping ? "sleep" : "happy"} facing={-1} friendshipLevel={buddy.friendship.level} inventory={buddy.adventure.inventoryIds} hiddenGear={buddy.effectiveHiddenGear} unlockedGear={buddy.unlockedGearIds} width={100} height={100} />
          {speech ? <span key={speech} className="room-buddy-speech" aria-hidden="true">{speech}</span> : null}
        </button>
        <span className="sr-only" role="status">{speech}</span>
      </div>
      <div className="room-caption"><span><Moon size={14} aria-hidden="true" />{napping ? "Recharging for the next adventure." : "Tap Buddy for a well-earned nap."}</span><span>LV {String(buddy.friendship.level).padStart(2, "0")}</span></div>
      <p className="room-note">Your catches, finds, and market decorations have a home here. Tap a display to choose what goes in it. Displaying an item keeps it in your collection.</p>
    </div>
    <section className="room-editor" aria-label="Room customization">
      <div className="room-editor-heading"><span><i aria-hidden="true" />ROOM STUDIO</span><span>MAKE IT YOURS</span></div>
      <div className="room-editor-tabs" role="group" aria-label="Room controls"><button type="button" aria-pressed={tab === "decorate"} onClick={() => setTab("decorate")}><Palette size={15} aria-hidden="true" />Decorate</button><button type="button" aria-pressed={tab === "collection"} onClick={() => setTab("collection")}><Fish size={15} aria-hidden="true" />Collection <span>{displays.length}</span></button></div>
      <fieldset className="room-editor-fields" disabled={state.loading || state.saving}>
        <legend className="sr-only">Customize your room</legend>
        {tab === "decorate" ? <>
          <div className="room-editor-intro"><Armchair size={22} aria-hidden="true" /><div><h3>A little more you.</h3><p>Pick a piece. Watch your room change.</p></div></div>
          <Choices number="01" label="Atmosphere" value={room.palette} options={PALETTES} onChange={(value) => state.update("palette", value)} />
          <Choices number="02" label="A place to rest" value={room.bed} options={[["cot", "Cozy cot"], ["cushion", "Floor cushion"], ["bunk", "Loft bed"]]} onChange={(value) => state.update("bed", value)} />
          <Choices number="03" label="Underfoot" value={room.rug} options={[["checker", "Checker rug"], ["moon", "Moon rug"], ["none", "Bare floor"]]} onChange={(value) => state.update("rug", value)} />
          <Choices number="04" label="Little comforts" value={room.prop} options={[["plant", "Houseplant"], ["lamp", "Reading lamp"], ["books", "Book stack"]]} onChange={(value) => state.update("prop", value)} />
        </> : <>
          <fieldset className="room-slot-picker"><legend>Choose a display</legend><div>{SLOTS.map(([id, name]) => <button type="button" key={id} aria-pressed={slot === id} onClick={() => setSlot(id)}>{name}</button>)}</div></fieldset>
          {slot === "aquarium" ? <div className="room-fish-slots" role="group" aria-label="Aquarium residents">{FISH_SLOTS.map(([id, name, size]) => <button type="button" key={id} aria-pressed={fishSlot === id} onClick={() => setFishSlot(id)}><span>{name}</span><small>{size}</small><strong>{displayFor(id)?.name || "Empty"}</strong></button>)}</div> : null}
          <p className="room-collection-hint">{slot === "aquarium" ? "Choose a resident above, then a caught fish below. Selecting a fish already in the tank moves it to this slot." : "Display market decorations, patrol finds, fishing junk, or treasure. Your fish live in the aquarium."}</p>
          <div className="room-collection"><button type="button" className="room-item" aria-pressed={!displayFor(selectedSlot)} onClick={() => state.update(selectedSlot, "")}><span aria-hidden="true">—</span><strong>Leave empty</strong></button>{candidates.map((item) => <button type="button" className="room-item" key={item.key} aria-pressed={room[selectedSlot] === item.key} onClick={() => state.update(selectedSlot, item.key)}><BuddyCollectibleIcon id={item.id} color={item.color} /><strong>{item.name}</strong><small>{slot === "aquarium" ? FISH_SLOTS.find(([id]) => room[id] === item.key)?.[1] || item.rarity : item.rarity || "patrol find"}</small></button>)}</div>
          {!candidates.length ? <div className="room-empty-note"><Fish size={24} aria-hidden="true" /><strong>{slot === "aquarium" ? "A little life, coming soon." : "A shelf for your stories."}</strong><p>{slot === "aquarium" ? "Let Buddy fish at the footer, then come back to choose your first resident." : "Explore with Buddy to collect your first display."}</p></div> : null}
        </>}
      </fieldset>
      <footer className={`room-save ${state.dirty || state.retry ? "has-changes" : ""}`}><div className="room-save-state"><span><i aria-hidden="true" />{state.loading ? "OPENING ROOM" : state.saving ? "SAVING ROOM" : state.retry ? "SYNC PENDING" : state.dirty ? "UNSAVED CHANGES" : "ROOM READY"}</span><span>YOUR SAVE SLOT</span></div><p role="status">{state.status}</p><div className="room-save-actions"><button type="button" className="room-save-button" disabled={state.loading || state.saving || (!state.dirty && !state.retry)} onClick={state.save}><Save size={15} aria-hidden="true" />{state.saving ? "Saving…" : "Save room"}<span aria-hidden="true">↗</span></button><button type="button" disabled={!state.dirty || state.saving} onClick={state.undo}><Undo2 size={14} aria-hidden="true" />Undo</button></div></footer>
    </section>
  </div>;
}
