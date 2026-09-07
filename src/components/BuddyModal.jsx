import { memo, useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Backpack, BookOpen, Check, Lock, ScrollText, Trophy, X } from "lucide-react";
import { COSTUME_IDS, FACE_GEAR_IDS, HEADWEAR_IDS, LURE_IDS, MOBILITY_IDS, ROD_IDS } from "../hooks/useBuddyLoadout";
import { useScrollEdges } from "../hooks/useScrollEdges";
import { BuddyChuteCanopy, BuddyRodIcon, BuddySprite } from "./BuddySprite";
import { BuddyGearIcon } from "./BuddyGearIcon";
import { BuddyJournal } from "./BuddyJournal";

const BUDDY_SLOTS = [
  { id: "costume", label: "costume", accepts: COSTUME_IDS },
  { id: "head", label: "head", accepts: HEADWEAR_IDS },
  { id: "face", label: "face", accepts: FACE_GEAR_IDS },
  { id: "antenna", label: "antenna", accepts: ["gold-antenna"] },
  { id: "neck", label: "neck", accepts: ["scarf"] },
  { id: "utility", label: "utility", accepts: ["wrench", "cartridge", "coffee", "headset"] },
  { id: "mobility", label: "mobility", accepts: MOBILITY_IDS },
  { id: "rod", label: "rod", accepts: ROD_IDS },
  { id: "lure", label: "lure", accepts: LURE_IDS }
];

// Orden estable del botin: agrupado por slot, en el orden de los slots.
const SLOT_ORDER = Object.fromEntries(BUDDY_SLOTS.map((slot, index) => [slot.id, index]));
const MIKU_EDITABLE_SLOTS = new Set(["costume", "rod", "lure"]);

function isMikuEditableItem(id) {
  return id === "miku-costume" || ROD_IDS.includes(id) || LURE_IDS.includes(id);
}

function isEquipped(item, buddy) {
  return !buddy.effectiveHiddenGear.includes(item.id);
}

function dragItem(event, item) {
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("application/x-buddy-item", item.id);
  event.dataTransfer.setData("text/plain", item.id);
}

function droppedItemId(event) {
  return event.dataTransfer.getData("application/x-buddy-item") || event.dataTransfer.getData("text/plain");
}

function slotItems(slot, buddy) {
  return buddy.gearItems.filter((item) => slot.accepts.includes(item.id) && isEquipped(item, buddy));
}

function InventorySlot({ buddy, slot, mikuCostumeActive, activeSlot, dragging }) {
  const [over, setOver] = useState(false);
  const equipped = slotItems(slot, buddy);
  const slotLocked = mikuCostumeActive && !MIKU_EDITABLE_SLOTS.has(slot.id);
  const matched = activeSlot === slot.id && !slotLocked;

  function handleDrop(event) {
    event.preventDefault();
    setOver(false);
    if (slotLocked) return;
    const itemId = droppedItemId(event);
    if (!slot.accepts.includes(itemId)) return;
    buddy.equipGear(itemId);
  }

  function allowDrop(event) {
    if (slotLocked) return;
    event.preventDefault();
    setOver(true);
  }

  const className = [
    "buddy-equip-slot",
    `is-${slot.id}`,
    equipped.length ? "is-filled" : "",
    slotLocked ? "is-miku-locked" : "",
    matched ? (dragging ? "is-droppable" : "is-hinted") : "",
    over && matched ? "is-drop-over" : ""
  ].filter(Boolean).join(" ");

  return (
    <div
      className={className}
      onDragOver={allowDrop}
      onDragLeave={() => setOver(false)}
      onDrop={handleDrop}
      aria-disabled={slotLocked || undefined}
    >
      <span>{slot.label}</span>
      <div>
        {equipped.length ? equipped.map((item) => (
          <button
            className={`buddy-equipped-chip is-${item.id} ${mikuCostumeActive && !isMikuEditableItem(item.id) ? "is-miku-locked" : ""}`}
            type="button"
            key={item.id}
            onClick={() => buddy.stashGear(item.id)}
            disabled={mikuCostumeActive && !isMikuEditableItem(item.id)}
            aria-label={`Unequip ${item.label}`}
            title={mikuCostumeActive && !isMikuEditableItem(item.id)
              ? "Unequip Miku Costume to edit other gear."
              : item.perk || undefined}
          >
            <BuddyGearIcon id={item.id} />
            <b>{item.label}</b>
            <X size={12} aria-hidden="true" />
          </button>
        )) : <small>{slotLocked ? "costume locked" : dragging && matched ? "drop to equip" : "empty slot"}</small>}
      </div>
    </div>
  );
}

// El sprite es lo mas caro que pinta el modal y no depende de la pieza que el
// puntero este rozando: se aisla para que el resaltado de slots no lo repinte.
const BuddyPreviewCard = memo(function BuddyPreviewCard({ buddy }) {
  // El preview muestra el loadout completo: el equipo que no vive "sobre" el
  // sprite (chute de mobility, caña y señuelo de pesca) se compone alrededor.
  const wearsItem = (id) => buddy.unlockedGearIds.includes(id) && !buddy.effectiveHiddenGear.includes(id);
  const previewChute = wearsItem("parachute-upgrade");
  const previewRod = ROD_IDS.find(wearsItem) || "";
  const previewLure = LURE_IDS.find(wearsItem) || "";

  return (
    <div className="buddy-preview-card">
      <div className="buddy-section-heading"><span className="buddy-modal-kicker">your companion</span><span className="buddy-status-dot">online</span></div>
      <div className="buddy-preview-screen">
        <div className="buddy-preview-pose">
          {previewChute ? <BuddyChuteCanopy className="buddy-preview-chute" upgraded /> : null}
          <BuddySprite
            className="buddy-preview-sprite"
            expression="idle"
            facing={-1}
            friendshipLevel={buddy.friendship.level}
            inventory={buddy.adventure.inventoryIds}
            hiddenGear={buddy.effectiveHiddenGear}
            unlockedGear={buddy.unlockedGearIds}
            width={112}
            height={108}
          />
          {previewRod ? <BuddyRodIcon className="buddy-preview-rod" rodId={previewRod} lureId={previewLure} /> : null}
        </div>
      </div>
      <div className="buddy-preview-stats">
        <span>Level <b>{String(buddy.friendship.level).padStart(2, "0")}</b></span>
        <span><b>{buddy.activeGearCount}</b> equipped</span>
      </div>
    </div>
  );
});

function BuddyInventoryView({ buddy }) {
  const [filter, setFilter] = useState("all");
  // Un solo "slot en foco" alimenta dos pistas: el resaltado al pasar por
  // encima de una pieza y el destino valido mientras se arrastra.
  const [activeSlot, setActiveSlot] = useState(null);
  const [dragging, setDragging] = useState(false);
  const lootScrollRef = useScrollEdges();
  const slotScrollRef = useScrollEdges();
  const mikuCostumeActive = buddy.unlockedGearIds.includes("miku-costume")
    && !buddy.effectiveHiddenGear.includes("miku-costume");

  const slotCounts = buddy.gearItems.reduce((counts, item) => {
    counts[item.slot] = (counts[item.slot] || 0) + 1;
    return counts;
  }, {});

  // Chips solo para slots con botin: el filtro crece junto al inventario.
  const filterChips = [
    { id: "all", label: "all", count: buddy.gearItems.length },
    ...BUDDY_SLOTS.filter((slot) => slotCounts[slot.id]).map((slot) => ({
      id: slot.id,
      label: slot.label,
      count: slotCounts[slot.id]
    }))
  ];
  const activeFilter = filter === "all" || slotCounts[filter] ? filter : "all";

  const sortedItems = [...buddy.gearItems].sort(
    (a, b) => (SLOT_ORDER[a.slot] ?? 99) - (SLOT_ORDER[b.slot] ?? 99)
  );
  const visibleItems = activeFilter === "all"
    ? sortedItems
    : sortedItems.filter((item) => item.slot === activeFilter);

  // Filtrar con la reja a media altura dejaba al usuario mirando un hueco.
  useEffect(() => {
    lootScrollRef.current?.scrollTo({ top: 0 });
  }, [activeFilter, lootScrollRef]);

  // Equipar algo cuya ranura quedaba fuera de la lista no daba ninguna señal.
  // Se acerca la fila justa (nunca el modal entero) para que el cambio se vea.
  function revealSlot(slotId) {
    const box = slotScrollRef.current;
    if (!box || box.scrollHeight <= box.clientHeight) return;
    requestAnimationFrame(() => {
      const row = box.querySelector(`.buddy-equip-slot.is-${slotId}`);
      if (!row) return;
      const rowRect = row.getBoundingClientRect();
      const boxRect = box.getBoundingClientRect();
      const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
      // El margen de 30px deja la fila fuera del degradado de borde.
      if (rowRect.top < boxRect.top + 30) box.scrollBy({ top: rowRect.top - boxRect.top - 30, behavior });
      else if (rowRect.bottom > boxRect.bottom - 30) box.scrollBy({ top: rowRect.bottom - boxRect.bottom + 30, behavior });
    });
  }

  return (
    <div className="buddy-modal-inventory">
      <div className="buddy-inventory-stage" aria-label="Buddy equipment slots">
        <BuddyPreviewCard buddy={buddy} />

        <div className="buddy-loadout">
          <div className="buddy-section-heading"><h3>Current loadout</h3><span>click to remove</span></div>
          <div className="buddy-slot-scroll" ref={slotScrollRef}>
            <div className="buddy-slot-grid" data-dragging={dragging ? "on" : undefined}>
              {BUDDY_SLOTS.map((slot) => (
                <InventorySlot
                  buddy={buddy}
                  key={slot.id}
                  slot={slot}
                  mikuCostumeActive={mikuCostumeActive}
                  activeSlot={activeSlot}
                  dragging={dragging}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="buddy-loot-panel" aria-label="Buddy inventory items">
        <div className="buddy-section-heading"><div><span className="buddy-modal-kicker">equipment locker</span><h3>Your collection <b>{buddy.gearItems.length}</b></h3></div><span>Click to equip or stash · drag onto a slot</span></div>
        {mikuCostumeActive ? (
          <div className="buddy-miku-lock-notice" role="status">
            <Lock size={13} aria-hidden="true" />
            <span>costume lock</span>
            Clothing and accessories stay locked while the Miku Costume is on. Rods and lures are still editable.
          </div>
        ) : null}

        <div className="buddy-loot-filters" aria-label="Filter loot by slot">
          {filterChips.map((chip) => (
            <button
              className={`buddy-loot-filter ${activeFilter === chip.id ? "is-active" : ""}`}
              type="button"
              key={chip.id}
              onClick={() => setFilter(chip.id)}
              aria-pressed={activeFilter === chip.id}
            >
              {chip.label}
              <b>{chip.count}</b>
            </button>
          ))}
        </div>

        <div className="buddy-loot-scroll" ref={lootScrollRef} onPointerLeave={() => setActiveSlot(null)}>
          <div className="buddy-loot-grid">
            {visibleItems.length ? visibleItems.map((item) => {
              const equipped = isEquipped(item, buddy);
              const itemLocked = mikuCostumeActive && !isMikuEditableItem(item.id);
              return (
                <button
                  className={`buddy-loot-cell is-${item.id} ${equipped ? "is-equipped" : "is-stashed"} ${itemLocked ? "is-miku-locked" : ""}`}
                  type="button"
                  draggable={!itemLocked}
                  key={item.id}
                  onClick={() => { buddy.toggleGear(item.id); revealSlot(item.slot); }}
                  onPointerEnter={() => { if (!dragging) setActiveSlot(item.slot); }}
                  onFocus={() => setActiveSlot(item.slot)}
                  onDragStart={(event) => { dragItem(event, item); setActiveSlot(item.slot); setDragging(true); }}
                  onDragEnd={() => { setDragging(false); setActiveSlot(null); }}
                  disabled={itemLocked}
                  aria-pressed={equipped}
                  title={itemLocked ? "Unequip Miku Costume to edit other gear." : item.perk || undefined}
                >
                  <BuddyGearIcon id={item.id} />
                  <span>{item.label}</span>
                  <small>{item.perk || item.source}</small>
                  <b className={`buddy-loot-state ${equipped ? "is-on" : ""}`} aria-hidden="true">
                    {itemLocked ? <Lock size={11} /> : equipped ? <Check size={13} /> : null}
                  </b>
                </button>
              );
            }) : (
              <div className="buddy-loot-empty">
                <Backpack size={28} aria-hidden="true" />
                <strong>{activeFilter === "all" ? "Your adventure starts here" : "Nothing for this slot yet"}</strong>
                <p>Pet Buddy, complete quests, and fish in the footer to unlock new gear.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BuddyQuestView({ buddy }) {
  const scrollRef = useScrollEdges();
  const quests = buddy.adventure.quests;
  const complete = quests.filter((quest) => quest.complete);
  const active = quests.filter((quest) => !quest.complete);
  const overall = quests.length ? Math.round((complete.length / quests.length) * 100) : 0;

  return (
    <div className="buddy-modal-quests" ref={scrollRef}>
      <div className="buddy-quest-summary">
        <Trophy size={32} aria-hidden="true" />
        <div className="buddy-quest-summary-copy">
          <span className="buddy-modal-kicker">adventure progress</span>
          <h3>{active.length ? "A little curiosity goes a long way." : "Every quest, conquered."}</h3>
          <p>{active.length ? `${active.length} ${active.length === 1 ? "quest" : "quests"} left. Explore the station with Buddy to complete your log.` : "You've completed the quest log. There's still more to discover in the void."}</p>
        </div>
        <div className="buddy-quest-total"><strong>{String(complete.length).padStart(2, "0")}<small> / {String(quests.length).padStart(2, "0")}</small></strong><span>quests complete</span></div>
        <div className="buddy-quest-summary-meter" role="progressbar" aria-label="Quests complete" aria-valuenow={complete.length} aria-valuemin={0} aria-valuemax={quests.length || 1}>
          <i style={{ width: `${overall}%` }} />
        </div>
      </div>
      {[{ label: "In progress", items: active }, { label: "Completed", items: complete }].map((group) => group.items.length > 0 && (
        <section className={`buddy-quest-group ${group.label === "Completed" ? "is-completed" : ""}`} key={group.label} aria-label={group.label}>
          <div className="buddy-section-heading"><h3>{group.label} <b>{group.items.length}</b></h3><span>{group.label === "In progress" ? "your next discoveries" : "mission accomplished"}</span></div>
          <div className="buddy-quest-list">
            {group.items.map((quest) => {
              const ratio = quest.goal ? Math.min(1, quest.progress / quest.goal) : 0;
              return (
                <article className={`buddy-modal-quest ${quest.complete ? "is-complete" : ""}`} key={quest.id}>
                  <div className="buddy-quest-info">
                    <span className="buddy-quest-icon">{quest.complete ? <Check size={18} aria-hidden="true" /> : <ScrollText size={18} aria-hidden="true" />}</span>
                    <div><strong>{quest.title}</strong><p>{quest.detail}</p></div>
                  </div>
                  <div className="buddy-quest-track">
                    <div><span>{quest.complete ? "Complete" : "In progress"}</span><b>{quest.progress} / {quest.goal}</b></div>
                    <i className="buddy-quest-bar" role="progressbar" aria-label={quest.title} aria-valuenow={Math.min(quest.progress, quest.goal)} aria-valuemin={0} aria-valuemax={quest.goal || 1}><b style={{ width: `${Math.round(ratio * 100)}%` }} /></i>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

const BUDDY_VIEWS = [
  { id: "inventory", label: "Inventory", icon: Backpack, title: "Buddy Inventory", description: "A little gear. A lot of personality. Make Buddy your own." },
  { id: "quests", label: "Quests", icon: ScrollText, title: "Buddy Quests", description: "Follow your curiosity. Explore the station. Find something new." },
  { id: "journal", label: "Journal", icon: BookOpen, title: "Catch Journal", description: "Every catch has a story. Keep a record of the things you find." }
];

export function BuddyModal({ buddy, mode, onClose, onModeChange, theme }) {
  const opener = useRef(null);
  const view = BUDDY_VIEWS.find((item) => item.id === mode) || BUDDY_VIEWS[0];

  // El portal cuelga del body, fuera de `.app-shell`, que es donde vive la
  // clase del tema: sin repetirla aqui el modal se queda verde mientras el
  // resto del sitio se vuelve rosa.
  return (
    <Dialog.Root open={Boolean(mode)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className={`buddy-modal-backdrop ${theme === "glitch" ? "theme-glitch" : ""}`}>
          <Dialog.Content className={`buddy-modal is-${mode}`}
            onOpenAutoFocus={() => { opener.current = document.activeElement; }}
            onCloseAutoFocus={(event) => { event.preventDefault(); opener.current?.focus(); }}>
            <header className="buddy-modal-header">
              <div className="buddy-modal-title-row">
                <div>
                  <span className="buddy-modal-kicker">
                    <span className="buddy-window-dots" aria-hidden="true"><i /><i /><i /></span>
                    buddy companion / {view.label}
                  </span>
                  <Dialog.Title asChild><h2>{view.title}</h2></Dialog.Title>
                  <Dialog.Description className="buddy-modal-description">{view.description}</Dialog.Description>
                </div>
                <Dialog.Close className="buddy-modal-close" aria-label="Close buddy modal"><X size={20} aria-hidden="true" /></Dialog.Close>
              </div>
              <nav className="buddy-modal-actions" aria-label="Buddy views">
                {BUDDY_VIEWS.map(({ id, label, icon: Icon }) => (
                  <button className={mode === id ? "is-active" : ""} type="button" key={id} onClick={() => onModeChange(id)} aria-current={mode === id ? "page" : undefined}>
                    <Icon size={16} aria-hidden="true" />{label}
                    <span>{id === "inventory" ? buddy.gearItems.length : id === "quests" ? buddy.adventure.quests.filter((quest) => !quest.complete).length : buddy.adventure.discoveredFishCount}</span>
                  </button>
                ))}
              </nav>
            </header>
            {mode === "inventory" ? <BuddyInventoryView buddy={buddy} /> : mode === "journal" ? <BuddyJournal buddy={buddy} /> : <BuddyQuestView buddy={buddy} />}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
