import { useEffect, useState } from "react";
import { ArrowUpRight, CloudRain, Fish, Music2, Radar } from "lucide-react";
import { BUDDY_ACTIVITIES } from "../../shared/buddy-activities.mjs";
import { BuddySprite } from "./BuddySprite";

const ICONS = { fish: Fish, find: Radar, dance: Music2, rain: CloudRain };

export function BuddyActivities({ buddy, onClose }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(() => document.documentElement.dataset.buddyEvent || "");
  useEffect(() => {
    const update = (event) => setBusy(event.detail.active ? event.detail.name : "");
    window.addEventListener("daivr-buddy-event-state", update);
    return () => window.removeEventListener("daivr-buddy-event-state", update);
  }, []);

  function launch(id) {
    const request = { id, accepted: false, message: "Buddy is getting ready. Try again shortly." };
    // ScreenBuddy acknowledges synchronously; don't close the panel on refusal.
    window.dispatchEvent(new CustomEvent("daivr-buddy-activity-request", { detail: request }));
    if (!request.accepted) { setMessage(request.message); return; }
    onClose();
    requestAnimationFrame(() => document.querySelector(".app-footer-zone")?.scrollIntoView({ block: "end", behavior: "instant" }));
  }

  return <div className="buddy-activities">
    <section className="buddy-activity-intro"><div className="buddy-activity-companion"><BuddySprite expression="happy" friendshipLevel={buddy.friendship.level} inventory={buddy.adventure.inventoryIds} hiddenGear={buddy.effectiveHiddenGear} unlockedGear={buddy.unlockedGearIds} width={104} height={100} /></div><div><span className="buddy-modal-kicker">make a little time for buddy</span><h3>Where shall we go?</h3><p>Pick a moment to share. Buddy will meet you at the footer, wearing your current loadout.</p><span className="buddy-activity-readiness">{busy ? `In progress · ${busy.replaceAll("-", " ")}` : "Ready for an adventure"}</span></div></section>
    {message ? <p className="buddy-activity-feedback" role="status">{message}</p> : null}
    <div className="buddy-activity-grid">{BUDDY_ACTIVITIES.map((activity, index) => { const Icon = ICONS[activity.id]; return <article className={`buddy-activity-card is-${activity.id}`} key={activity.id}><header><span className="buddy-activity-symbol"><Icon size={25} aria-hidden="true" /></span><span>0{index + 1} / {activity.label}</span></header><h3>{activity.title}</h3><p>{activity.detail}</p><small>{activity.reward}</small><button type="button" disabled={!!busy} onClick={() => launch(activity.id)}>{busy ? "Buddy is busy" : `Start ${activity.label.toLowerCase()}`}<ArrowUpRight size={16} aria-hidden="true" /></button></article>; })}</div>
    <p className="buddy-activity-note">Activities have short cooldowns. Catches and finds use the usual reward rules. You can still let Buddy explore on their own.</p>
  </div>;
}
