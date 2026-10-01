import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Award, ChevronLeft, ChevronRight, Flame, Inbox, LockKeyhole, SlidersHorizontal, Trophy, X } from "lucide-react";
import { PLAYER_GAMES } from "../../shared/player-catalog.mjs";
import { CommunityInbox } from "./CommunityInbox";
import { PlayerBadge } from "./PlayerBadge";
import { PlayerRankings } from "./PlayerRankings";

export function PlayerHub({ onPlay, theme = "crt" }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("passport");
  const [badgePage, setBadgePage] = useState(0);
  const [data, setData] = useState(null);
  const [edit, setEdit] = useState(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const previousCard = useRef(null);
  const requestId = useRef(0);
  async function load(signal, preserveEdit = false) {
    const id = ++requestId.current;
    try {
      const response = await fetch("/api/player", { credentials: "include", signal });
      const value = await response.json();
      if (!response.ok) throw new Error(value.error || "Player panel unavailable.");
      if (signal?.aborted || id !== requestId.current) return;
      const before = previousCard.current;
      const after = value.passport;
      if (before && after && before.user.id === after.user.id) {
        const fresh = after.badges.filter((badge) => !before.badges.some((old) => old.id === badge.id));
        const gain = after.progression.totalXp - before.progression.totalXp;
        const levelUp = after.progression.level > before.progression.level ? `Level ${after.progression.level}! ` : "";
        if (fresh.length || gain > 0) setNotice(`${levelUp}${fresh.map((badge) => `${badge.secret ? "Secret discovered" : "Badge unlocked"}: ${badge.label}`).join(" · ")}${gain > 0 ? ` · +${gain.toLocaleString()} XP` : ""}`);
      }
      previousCard.current = after;
      setData(value);
      setEdit((current) => preserveEdit && current?.user.id === after?.user.id ? current : after || null);
      if (!preserveEdit) setMessage("");
    } catch (error) { if (error.name !== "AbortError" && id === requestId.current) setMessage("Player panel is unavailable. Try again shortly."); }
  }
  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    const inbox = (event) => setData((current) => current ? { ...current, inbox: event.detail } : current);
    const refresh = () => load(controller.signal, true);
    window.addEventListener("daivr-inbox", inbox);
    window.addEventListener("daivr-player-progress", refresh);
    return () => { controller.abort(); window.removeEventListener("daivr-inbox", inbox); window.removeEventListener("daivr-player-progress", refresh); };
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 8000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    load(controller.signal, true);
    // Refresh the UTC challenge at rollover without discarding unsaved edits.
    const timer = window.setTimeout(() => load(controller.signal, true), Math.max(1000, Date.parse(data?.challenge?.resetsAt || new Date(Date.now() + 86_400_000).toISOString()) - Date.now() + 100));
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [open, data?.challenge?.date]);
  async function save(event) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/player", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: edit.title, favoriteGame: edit.favoriteGame, featuredBadges: edit.featuredBadges, accent: edit.accent }) });
      const value = await response.json();
      if (!response.ok) throw new Error(value.error || "Save failed.");
      ++requestId.current;
      previousCard.current = value.passport;
      setData(value); setEdit(value.passport); setMessage("Passport saved.");
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }
  const card = data?.passport;
  const challenge = data?.challenge;
  const collection = card ? [...card.badges, ...(card.milestones || []).filter((badge) => !badge.earned && !card.badges.some((earned) => earned.id === badge.id) && !badge.secret)] : [];
  const pageCount = Math.max(1, Math.ceil(collection.length / 4));
  const page = Math.min(badgePage, pageCount - 1);
  const titles = { passport: "Player passport", challenge: "Daily challenge", records: "Personal bests", customize: "Customize passport", inbox: "Conversations", rankings: "Player rankings" };
  return <Dialog.Root open={open} onOpenChange={(next) => { setOpen(next); if (next) setView("passport"); }}>
    {notice ? <div className="player-xp-toast" role="status"><Award size={20} aria-hidden="true" /><span>{notice}</span><button type="button" aria-label="Dismiss player reward" onClick={() => setNotice("")}><X size={16} /></button></div> : null}
    <Dialog.Trigger asChild><button className="player-hub-trigger arcade-focus" type="button"><Award size={16} aria-hidden="true" /><span>Player</span>{data?.inbox?.unread ? <b aria-label={`${data.inbox.unread} unread notifications`}>{data.inbox.unread}</b> : null}</button></Dialog.Trigger>
    <Dialog.Portal><Dialog.Overlay className={`player-hub-overlay ${theme === "glitch" ? "theme-glitch" : ""}`} /><Dialog.Content className={`player-hub-dialog ${theme === "glitch" ? "theme-glitch" : ""}`}>
      <header className="player-hub-heading"><div><div className="player-hub-kicker"><span className="player-hub-window-dots" aria-hidden="true"><i /><i /><i /></span><span>~/cabinet/player.save</span></div><Dialog.Title>{titles[view]}<span aria-hidden="true">_</span></Dialog.Title><Dialog.Description>{view === "rankings" ? "Three leaderboards. Five spots. Make your mark." : "Your identity, records, and next challenge."}</Dialog.Description></div><div className="player-hub-heading-actions">
        {view !== "passport" ? <button type="button" aria-label="Back to passport" onClick={() => setView("passport")}><ArrowLeft size={18} /><span>Back</span></button> : null}
        {view !== "rankings" ? <button type="button" aria-label="Open player rankings" onClick={() => setView("rankings")}><Trophy size={18} /></button> : null}
        <Dialog.Close asChild><button type="button" aria-label="Close player panel"><X size={20} /></button></Dialog.Close>
      </div></header>
      <div className={`player-hub-body view-${view}`}>
      {message ? <p className="player-hub-status" role="status">{message}</p> : null}
      {!data ? <button type="button" onClick={() => load()}>Retry loading player panel</button> : null}
      {data && !data.user ? <p className="player-signin"><a href="/api/comments/auth/discord">Connect Discord</a> to save a passport, earn challenge rewards, and see your inbox.</p> : null}
      {view === "rankings" ? <PlayerRankings userId={data?.user?.id} /> : null}
      {view === "passport" || view === "challenge" ? <div className="player-hub-overview">
      {view === "passport" && card && edit ? <div className="player-hub-identity">
        <section className={`player-passport accent-${edit.accent.toLowerCase()}`} aria-label="Your passport preview">
          <div className="passport-card-label"><span>01 / PLAYER ID</span><span className="passport-collection-count"><Award size={14} aria-hidden="true" />{card.badges.length} badges earned</span></div>
          <img src={card.user.avatarUrl} alt="" /><div><small>{edit.title}</small><h3>{card.user.username}</h3><p>Favorite: {PLAYER_GAMES.find((game) => game.id === edit.favoriteGame)?.name || "Not chosen yet"}</p></div>
          {card.progression ? <section className="passport-level" aria-label="Player level and experience">
            <div className="passport-level-heading"><strong><span>LVL</span> {card.progression.level}</strong><span>{card.progression.totalXp.toLocaleString()} lifetime XP</span></div>
            <progress value={card.progression.levelXp} max={card.progression.levelGoal} aria-label={`Player level ${card.progression.level} progress`} />
            <div className="passport-level-meta"><span>{card.progression.levelXp.toLocaleString()} / {card.progression.levelGoal.toLocaleString()} XP</span><span>{card.progression.remainingXp.toLocaleString()} to level {card.progression.level + 1}</span></div>
          </section> : null}
          <dl className="passport-stats"><div><dt>Buddy level</dt><dd>{card.level}</dd></div><div><dt>Quests</dt><dd>{card.quests}</dd></div><div><dt>Daily wins</dt><dd>{card.challengeCount}</dd></div></dl>
          {edit.featuredBadges.length ? <div className="passport-badges" aria-label="Featured badges">{card.badges.filter((badge) => edit.featuredBadges.includes(badge.id)).map((badge) => <PlayerBadge key={badge.id} badge={badge} tooltip />)}</div> : null}
        </section>
      </div> : null}
      {challenge ? <section className="daily-challenge" aria-label="Daily challenge">
        <div className="daily-challenge-heading"><span className="pixel-label">DAILY CHALLENGE</span><span>{challenge.complete ? "Completed" : "One run"}</span></div>
        <h3>{challenge.name}</h3><p>Score <strong>{challenge.goal.toLocaleString()} {challenge.unit}</strong> in {PLAYER_GAMES.find((game) => game.id === challenge.game)?.name} in one run.</p>
        <div className="daily-challenge-progress"><progress max={challenge.goal} value={challenge.complete ? challenge.goal : Math.min(challenge.goal, challenge.best || 0)} aria-label="Daily challenge progress" /><p>{challenge.complete ? "Complete — reward unlocked!" : `${(challenge.best || 0).toLocaleString()} / ${challenge.goal.toLocaleString()} ${challenge.unit}`}</p></div>
        <div className="daily-challenge-reward"><Award size={18} aria-hidden="true" /><div><strong>{challenge.reward}</strong><span>Passport title + card accent</span></div></div>
        {challenge.xp ? <div className="daily-xp-reward"><strong>+{challenge.xp.total.toLocaleString()} XP <small>{challenge.complete ? "earned" : "on completion"}</small></strong><span>{challenge.xp.base} base + {challenge.xp.bonus.toLocaleString()} streak bonus</span><small>Each consecutive day adds 10 bonus XP. A missed day resets the bonus.</small></div> : null}
        {card ? <div className="daily-streak-panel"><Flame size={22} aria-hidden="true" /><div><strong>{card.currentStreak || 0}<span> day streak</span></strong><small>Personal best: {card.bestStreak || 0} days</small></div><span className="daily-streak-status">{challenge.complete ? "Today secured" : card.currentStreak ? "Keep it going" : "Start your streak"}</span></div> : null}
        <button type="button" onClick={() => { setOpen(false); onPlay(challenge.game); }}>Play challenge <span aria-hidden="true">↗</span></button>
        <small>{challenge.date} · Resets at 00:00 UTC.<br />{data?.user ? "Progress saves after an accepted run." : "Sign in before playing to save progress."}</small>
      </section> : null}
      </div> : null}
      {view === "records" && card ? <section className="passport-records-panel" aria-label="Personal bests"><h3><Trophy size={14} aria-hidden="true" />Your high scores</h3><div className="passport-records">{card.records.map((record) => <div key={record.game}><span>{PLAYER_GAMES.find((game) => game.id === record.game)?.name}</span><strong>{record.best === null ? "No run yet" : record.best.toLocaleString()}</strong></div>)}</div></section> : null}
      {view === "customize" && card && edit ? <section className="passport-customize">
        <form className="passport-form" onSubmit={save}>
          <div className="passport-fields">
            <label>Title<select value={edit.title} disabled={busy} onChange={(event) => setEdit({ ...edit, title: event.target.value })}>{card.titles.map((title) => <option key={title}>{title}</option>)}</select></label>
            <label>Favorite game<select value={edit.favoriteGame} disabled={busy} onChange={(event) => setEdit({ ...edit, favoriteGame: event.target.value })}><option value="">Choose a game</option>{PLAYER_GAMES.map((game) => <option key={game.id} value={game.id}>{game.name}</option>)}</select></label>
            <label>Card accent<select value={edit.accent} disabled={busy} onChange={(event) => setEdit({ ...edit, accent: event.target.value })}>{["default", ...card.cosmetics].map((accent) => <option key={accent} value={accent}>{accent === "default" ? "Classic green" : accent}</option>)}</select></label>
          </div>
          <fieldset disabled={busy}><legend>Badge collection · {edit.featuredBadges.length}/3 featured</legend><p className="passport-collection-hint">Choose up to three earned badges. Earned streak badges stay yours.</p><div className="passport-badge-options">{collection.slice(page * 4, page * 4 + 4).map((badge) => {
            const earned = badge.earned !== false;
            return <label key={badge.id} className={earned ? "is-earned" : "is-locked"}>
              <input type="checkbox" aria-label={`Feature ${badge.label}`} checked={edit.featuredBadges.includes(badge.id)} disabled={!earned || (!edit.featuredBadges.includes(badge.id) && edit.featuredBadges.length >= 3)} onChange={(event) => setEdit({ ...edit, featuredBadges: event.target.checked ? [...edit.featuredBadges, badge.id] : edit.featuredBadges.filter((id) => id !== badge.id) })} />
              <PlayerBadge badge={badge} /><span className="badge-requirement">{badge.description}</span>
              <span className="badge-xp">+{badge.xp?.toLocaleString()} XP {earned ? "earned" : "on unlock"}</span>
              <span className="badge-unlock-status">{earned ? "Unlocked" : <><LockKeyhole size={11} aria-hidden="true" />{badge.progress} / {badge.target} {badge.metric === "streak" ? "best streak" : "daily wins"}</>}</span>
              {!earned ? <progress value={badge.progress} max={badge.target} aria-label={`${badge.label} progress`} /> : null}
            </label>;
          })}</div><div className="passport-badge-pagination"><button type="button" aria-label="Previous badges" disabled={page === 0} onClick={() => setBadgePage(page - 1)}><ChevronLeft size={16} /></button><span aria-live="polite">Page {page + 1} / {pageCount}</span><button type="button" aria-label="Next badges" disabled={page + 1 === pageCount} onClick={() => setBadgePage(page + 1)}><ChevronRight size={16} /></button></div></fieldset>
          <button type="submit" disabled={busy}>{busy ? "Saving…" : "Save passport"}</button>
        </form>
      </section> : null}
      {view === "inbox" && data?.user ? <CommunityInbox inbox={data.inbox} onNavigate={() => setOpen(false)} /> : null}
      </div>
      <nav className="player-hub-nav" aria-label="Passport sections">{[
        ["passport", "Passport", Award], ["challenge", "Daily", Flame], ["records", "Records", Trophy], ["customize", "Customize", SlidersHorizontal], ["inbox", "Inbox", Inbox]
      ].filter(([id]) => data?.user || ["passport", "challenge"].includes(id)).map(([id, label, Icon]) => <button key={id} type="button" aria-current={view === id ? "page" : undefined} onClick={() => setView(id)}><Icon size={15} aria-hidden="true" /><span>{label}</span>{id === "inbox" && data?.inbox?.unread ? <b>{data.inbox.unread}</b> : null}</button>)}</nav>
    </Dialog.Content></Dialog.Portal>
  </Dialog.Root>;
}
