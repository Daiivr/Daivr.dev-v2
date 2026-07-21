import { useEffect, useState } from "react";
import { Backpack, BookOpen, Check, ScrollText, X } from "lucide-react";
import { COSTUME_IDS, FACE_GEAR_IDS, HEADWEAR_IDS, LURE_IDS, MOBILITY_IDS, ROD_IDS } from "../hooks/useBuddyLoadout";
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

function InventorySlot({ buddy, slot }) {
  const equipped = slotItems(slot, buddy);

  function handleDrop(event) {
    event.preventDefault();
    const itemId = droppedItemId(event);
    if (!slot.accepts.includes(itemId)) return;
    buddy.equipGear(itemId);
  }

  function allowDrop(event) {
    event.preventDefault();
  }

  return (
    <div
      className={`buddy-equip-slot is-${slot.id} ${equipped.length ? "is-filled" : ""}`}
      onDragOver={allowDrop}
      onDrop={handleDrop}
    >
      <span>{slot.label}</span>
      <div>
        {equipped.length ? equipped.map((item) => (
          <button
            className={`buddy-equipped-chip is-${item.id}`}
            type="button"
            key={item.id}
            onClick={() => buddy.stashGear(item.id)}
            aria-label={`Unequip ${item.label}`}
            title={item.perk || undefined}
          >
            <BuddyGearIcon id={item.id} />
            <b>{item.label}</b>
            <X size={12} aria-hidden="true" />
          </button>
        )) : <small>empty</small>}
      </div>
    </div>
  );
}

function BuddyInventoryView({ buddy }) {
  const [filter, setFilter] = useState("all");

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

  // El preview muestra el loadout completo: el equipo que no vive "sobre" el
  // sprite (chute de mobility, caña y señuelo de pesca) se compone alrededor.
  const wearsItem = (id) => buddy.unlockedGearIds.includes(id) && !buddy.effectiveHiddenGear.includes(id);
  const previewChute = wearsItem("parachute-upgrade");
  const previewRod = ROD_IDS.find(wearsItem) || "";
  const previewLure = LURE_IDS.find(wearsItem) || "";

  return (
    <div className="buddy-modal-inventory">
      <div className="buddy-inventory-stage" aria-label="Buddy equipment slots">
        <div className="buddy-preview-card">
          <span className="buddy-modal-kicker">buddy.exe</span>
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
            <span>LV {String(buddy.friendship.level).padStart(2, "0")}</span>
            <span>{buddy.activeGearCount}/{buddy.gearItems.length || 0}</span>
          </div>
        </div>

        <div className="buddy-slot-grid">
          {BUDDY_SLOTS.map((slot) => <InventorySlot buddy={buddy} key={slot.id} slot={slot} />)}
        </div>
      </div>

      <div className="buddy-loot-panel" aria-label="Buddy inventory items">
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

        <div className="buddy-loot-scroll">
          <div className="buddy-loot-grid">
            {visibleItems.length ? visibleItems.map((item) => {
              const equipped = isEquipped(item, buddy);
              return (
                <button
                  className={`buddy-loot-cell is-${item.id} ${equipped ? "is-equipped" : "is-stashed"}`}
                  type="button"
                  draggable
                  key={item.id}
                  onClick={() => buddy.toggleGear(item.id)}
                  onDragStart={(event) => dragItem(event, item)}
                  aria-pressed={equipped}
                  title={item.perk || undefined}
                >
                  <BuddyGearIcon id={item.id} />
                  <span>{item.label}</span>
                  <small>{item.perk || item.source}</small>
                </button>
              );
            }) : (
              <div className="buddy-loot-empty">
                {activeFilter === "all" ? "no loot yet" : "nothing for this slot yet"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BuddyQuestView({ buddy }) {
  return (
    <div className="buddy-modal-quests">
      {buddy.adventure.quests.map((quest) => (
        <article className={`buddy-modal-quest ${quest.complete ? "is-complete" : ""}`} key={quest.id}>
          <div>
            <span>{quest.complete ? <Check size={15} aria-hidden="true" /> : <ScrollText size={15} aria-hidden="true" />}</span>
            <div>
              <strong>{quest.title}</strong>
              <p>{quest.detail}</p>
            </div>
          </div>
          <b>{quest.progress}/{quest.goal}</b>
        </article>
      ))}
    </div>
  );
}

export function BuddyModal({ buddy, mode, onClose, onModeChange }) {
  useEffect(() => {
    if (!mode) return undefined;

    function closeOnEscape(event) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mode, onClose]);

  if (!mode) return null;

  const title = mode === "inventory" ? "Buddy Inventory" : mode === "journal" ? "Catch Journal" : "Buddy Quests";

  return (
    <div className="buddy-modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className={`buddy-modal is-${mode}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="buddy-modal-header">
          <div>
            <span className="buddy-modal-kicker">buddy card</span>
            <h2>{title}</h2>
          </div>
          <div className="buddy-modal-actions">
            <button
              className={mode === "inventory" ? "is-active" : ""}
              type="button"
              onClick={() => onModeChange("inventory")}
            >
              <Backpack size={15} aria-hidden="true" />
              inventory
            </button>
            <button
              className={mode === "quests" ? "is-active" : ""}
              type="button"
              onClick={() => onModeChange("quests")}
            >
              <ScrollText size={15} aria-hidden="true" />
              quests
            </button>
            <button
              className={mode === "journal" ? "is-active" : ""}
              type="button"
              onClick={() => onModeChange("journal")}
            >
              <BookOpen size={15} aria-hidden="true" />
              journal
            </button>
            <button className="buddy-modal-close" type="button" onClick={onClose} aria-label="Close buddy modal">
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </header>

        {mode === "inventory" ? <BuddyInventoryView buddy={buddy} /> : mode === "journal" ? <BuddyJournal buddy={buddy} /> : <BuddyQuestView buddy={buddy} />}
      </section>
    </div>
  );
}
