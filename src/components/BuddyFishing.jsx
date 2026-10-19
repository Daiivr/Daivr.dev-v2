import { useEffect, useState } from "react";
import { LURES, LURE_GRANTS } from "../../shared/buddy-market.mjs";
import { ROD_IDS } from "../hooks/useBuddyLoadout";
import { BuddyGearIcon } from "./BuddyGearIcon";
import { BuddyJournal } from "./BuddyJournal";
import { BuddyRodIcon } from "./BuddySprite";
import { PixelIcon } from "./BuddyMenuDecor";

// El modal de pesca (lo abre el soporte de cañas del prado, o la pestaña
// "Fishing"): todo lo de pescar en un sitio. "Tackle": la caña y el señuelo
// que lleva Buddy, todas las cañas (equipar o como se consiguen) y todos los
// señuelos con los usos que le quedan. "Journal": el diario de capturas.
const TABS = [
  { id: "tackle", label: "Tackle" },
  { id: "journal", label: "Journal" }
];
const TIER_LABEL = { basic: "basic lure", good: "good lure", best: "best lure" };

function FishingTackle({ buddy }) {
  const [feedback, setFeedback] = useState("");
  const worn = (id) => buddy.unlockedGearIds.includes(id) && !buddy.effectiveHiddenGear.includes(id);
  const rod = ROD_IDS.find(worn) || "", lure = LURES.find((item) => worn(item.id))?.id || "";
  const catalog = buddy.catalogItems || [];
  const rods = catalog.filter((item) => item.slot === "rod");
  const lureLeft = buddy.adventure.market.lureLeft || {};
  const lureInfo = LURES.find((item) => item.id === lure);
  const rodInfo = rods.find((item) => item.id === rod);
  const grantFor = (id) => LURE_GRANTS.find((grant) => grant.id === id);

  return <div className="fishing-tackle">
    <section className="fishing-loadout" aria-label="Buddy's fishing loadout">
      <div className="buddy-section-heading"><span className="buddy-modal-kicker">on the line</span></div>
      <div className="buddy-preview-screen fishing-preview"><BuddyRodIcon className="fishing-preview-rod" rodId={rod} lureId={lure} /></div>
      <dl className="fishing-loadout-facts">
        <div><dt>Rod</dt><dd>{rodInfo?.label || "Plain rod"}<small>{rodInfo?.perk || "Looks only. Every rod catches the same, except the fisherman's."}</small></dd></div>
        <div><dt>Lure</dt><dd>{lureInfo ? `${lureInfo.label} · ${lureLeft[lure] || 0} left` : "No lure"}<small>{lureInfo ? lureInfo.perk : "Rare fish bite much less without a lure."}</small></dd></div>
      </dl>
      <div className="fishing-stats"><span>Catches<b>{buddy.adventure.totalCatches}</b></span><span>Rares<b>{buddy.adventure.rareCatches}</b></span><span>Journal<b>{buddy.adventure.discoveredFishCount}/{buddy.adventure.stationFishTotal}</b></span></div>
      <p className="fishing-note">A lure is used only when Buddy lands a catch. If the fish gets away, he keeps it.</p>
    </section>

    <div className="fishing-lists">
      <p className="buddy-locker-feedback" role="status">{feedback || "Pick a rod and a lure. Buddy uses them next time he fishes."}</p>
      <section aria-labelledby="fishing-rods-title">
        <div className="buddy-section-heading"><h3 id="fishing-rods-title">Rods <b>{rods.filter((item) => item.unlocked).length} / {rods.length}</b></h3></div>
        <ul className="fishing-grid">{rods.map((item) => {
          const on = item.id === rod;
          return <li key={item.id} className={`fishing-card ${on ? "is-on" : ""} ${item.unlocked ? "" : "is-locked"}`} data-item={item.id}>
            <BuddyGearIcon id={item.id} />
            <div><strong>{item.label}</strong><small>{item.unlocked ? item.perk || "Looks only" : item.requirement}</small>
              {!item.unlocked && item.goal > 1 ? <span className="fishing-progress"><progress value={item.progress} max={item.goal} aria-label={`${item.label} unlock progress`} /><i>{item.progress} / {item.goal}</i></span> : null}</div>
            {item.unlocked ? <button type="button" disabled={on} onClick={() => { buddy.equipGear(item.id); setFeedback(`${item.label} equipped.`); }}>{on ? "Equipped" : "Equip"}</button> : <PixelIcon name="lock" />}
          </li>;
        })}</ul>
      </section>
      <section aria-labelledby="fishing-lures-title">
        <div className="buddy-section-heading"><h3 id="fishing-lures-title">Lures</h3>{lure ? <button type="button" className="fishing-no-lure" onClick={() => { buddy.stashGear(lure); setFeedback("No lure: Buddy will fish without one."); }}>Fish without a lure</button> : <span>No lure on</span>}</div>
        <ul className="fishing-grid">{LURES.map((item) => {
          const left = lureLeft[item.id] || 0, on = item.id === lure, grant = grantFor(item.id);
          return <li key={item.id} className={`fishing-card is-lure tier-${item.tier} ${on ? "is-on" : ""} ${left ? "" : "is-empty"}`} data-item={item.id}>
            <BuddyGearIcon id={item.id} />
            <div><strong>{item.label}<em>{TIER_LABEL[item.tier]}</em></strong><small>{item.perk}</small>
              <span className="fishing-lure-meta"><b>{left} {left === 1 ? "use" : "uses"}</b><i>{item.seller === "market" ? "Woodland market bait shelf" : "Traveling fisherman"}{grant ? ` · ${grant.uses} free at ${grant.label}` : ""}</i></span></div>
            {left ? <button type="button" disabled={on} onClick={() => { buddy.equipGear(item.id); setFeedback(`${item.label} on the line: ${left} ${left === 1 ? "use" : "uses"} left.`); }}>{on ? "On the line" : "Equip"}</button> : <span className="fishing-empty-tag">none</span>}
          </li>;
        })}</ul>
      </section>
    </div>
  </div>;
}

export function BuddyFishing({ buddy, initialTab = "tackle" }) {
  const [tab, setTab] = useState(initialTab);
  useEffect(() => { setTab(initialTab); }, [initialTab]);
  return <div className={`buddy-fishing is-${tab}`}>
    <div className="buddy-loot-filters fishing-tabs" role="tablist" aria-label="Fishing">
      {TABS.map((item) => <button key={item.id} type="button" role="tab" className={`buddy-loot-filter ${tab === item.id ? "is-active" : ""}`} aria-selected={tab === item.id} onClick={() => setTab(item.id)}>{item.label}</button>)}
    </div>
    {tab === "journal" ? <BuddyJournal buddy={buddy} /> : <FishingTackle buddy={buddy} />}
  </div>;
}
