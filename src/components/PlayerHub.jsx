import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight, Award, Clock3, Flame, Gamepad2, HeartHandshake, Inbox, LockKeyhole, Pencil, ScrollText, SlidersHorizontal, Trophy, X, Zap } from "lucide-react";
import { PLAYER_GAMES, gameTitle } from "../../shared/player-catalog.mjs";
import { CommunityInbox } from "./CommunityInbox";
import { PlayerBadge } from "./PlayerBadge";
import { PlayerRankings } from "./PlayerRankings";

// La barra superior, el modo attract y la consola leen el nivel real desde aqui
// (src/lib/cabinetSignals.js) en vez de pedir /api/player otra vez.
// Cartridge art from the game library, shared by the challenge and the records.
const coverFor = (game) => `/arcade-library/${game}-cover.webp`;
const gameName = gameTitle;
const SUBTITLES = {
  passport: "Your player ID and today's challenge.",
  records: "Your best run in every cabinet game.",
  customize: "Pick a title, a favorite game, an accent and three badges to show off.",
  inbox: "Replies and mentions from the message board.",
  rankings: "Three leaderboards. Five spots. Make your mark."
};

// "13h 08m" until the challenge rolls over.
function timeLeft(until, now) {
  const minutes = Math.max(0, Math.ceil((Date.parse(until) - now) / 60000));
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours}h ${String(minutes % 60).padStart(2, "0")}m` : `${minutes}m`;
}

function announcePlayer(value) {
  const detail = value?.user ? { user: value.user, progression: value.passport?.progression || null } : null;
  window.dispatchEvent(new CustomEvent("daivr-player-card", { detail }));
}

export function PlayerHub({ onPlay, theme = "crt" }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("passport");
  const [data, setData] = useState(null);
  const [edit, setEdit] = useState(null);
  const [message, setMessage] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [now, setNow] = useState(() => Date.now());
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
      announcePlayer(value);
      setEdit((current) => preserveEdit && current?.user.id === after?.user.id ? current : after || null);
      if (!preserveEdit) setMessage("");
    } catch (error) { if (error.name !== "AbortError" && id === requestId.current) setMessage("Player panel is unavailable. Try again shortly."); }
  }
  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    const inbox = (event) => setData((current) => current ? { ...current, inbox: event.detail } : current);
    const refresh = () => load(controller.signal, true);
    // La consola abre el pasaporte (o una vista concreta) con este evento.
    const openPassport = (event) => { setView(event.detail?.view || "passport"); setOpen(true); };
    window.addEventListener("daivr-inbox", inbox);
    window.addEventListener("daivr-player-progress", refresh);
    window.addEventListener("daivr-open-passport", openPassport);
    return () => { controller.abort(); window.removeEventListener("daivr-inbox", inbox); window.removeEventListener("daivr-player-progress", refresh); window.removeEventListener("daivr-open-passport", openPassport); };
  }, []);
  // The challenge countdown only needs to move while the panel is open.
  useEffect(() => {
    if (!open) return undefined;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, [open]);
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
    event.preventDefault(); setBusy(true); setSaveMessage("");
    try {
      const response = await fetch("/api/player", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: edit.title, favoriteGame: edit.favoriteGame, featuredBadges: edit.featuredBadges, accent: edit.accent }) });
      const value = await response.json();
      if (!response.ok) throw new Error(value.error || "Save failed.");
      ++requestId.current;
      previousCard.current = value.passport;
      setData(value); setEdit(value.passport); setSaveMessage("Passport saved.");
      announcePlayer(value);
    } catch (error) { setSaveMessage(error.message); }
    finally { setBusy(false); }
  }
  const card = data?.passport;
  const challenge = data?.challenge;
  const collection = card ? [...card.badges, ...(card.milestones || []).filter((badge) => !badge.earned && !card.badges.some((earned) => earned.id === badge.id) && !badge.secret)] : [];
  const titles = { passport: "Player passport", records: "Personal bests", customize: "Customize passport", inbox: "Conversations", rankings: "Player rankings" };
  return <Dialog.Root open={open} onOpenChange={(next) => { setOpen(next); if (next) setView("passport"); }}>
    {notice ? <div className="player-xp-toast" role="status"><Award size={20} aria-hidden="true" /><span>{notice}</span><button type="button" aria-label="Dismiss player reward" onClick={() => setNotice("")}><X size={16} /></button></div> : null}
    <Dialog.Trigger asChild><button className="player-hub-trigger arcade-focus" type="button"><Award size={16} aria-hidden="true" /><span>Player</span>{data?.inbox?.unread ? <b aria-label={`${data.inbox.unread} unread notifications`}>{data.inbox.unread}</b> : null}</button></Dialog.Trigger>
    <Dialog.Portal><Dialog.Overlay className={`player-hub-overlay motion-backdrop ${theme === "glitch" ? "theme-glitch" : ""}`} /><Dialog.Content className={`player-hub-dialog motion-panel motion-from-center ${theme === "glitch" ? "theme-glitch" : ""}`}>
      <header className="player-hub-heading"><div><div className="player-hub-kicker"><span className="player-hub-window-dots" aria-hidden="true"><i /><i /><i /></span><span>~/cabinet/player.save</span></div><Dialog.Title>{titles[view]}<span aria-hidden="true">_</span></Dialog.Title><Dialog.Description>{SUBTITLES[view]}</Dialog.Description></div><div className="player-hub-heading-actions">
        {view !== "passport" ? <button type="button" aria-label="Back to passport" onClick={() => setView("passport")}><ArrowLeft size={18} /><span>Back</span></button> : null}
        {view !== "rankings" ? <button type="button" aria-label="Open player rankings" onClick={() => setView("rankings")}><Trophy size={18} /><span>Rankings</span></button> : null}
        <Dialog.Close asChild><button type="button" aria-label="Close player panel"><X size={20} /></button></Dialog.Close>
      </div></header>
      <div className={`player-hub-body view-${view}`}>
      {message ? <p className="player-hub-status" role="status">{message}</p> : null}
      {!data ? <button type="button" onClick={() => load()}>Retry loading player panel</button> : null}
      {data && !data.user ? <p className="player-signin"><a href="/api/comments/auth/discord">Connect Discord</a> to save a passport, earn challenge rewards, and see your inbox.</p> : null}
      {view === "rankings" ? <PlayerRankings userId={data?.user?.id} /> : null}
      {view === "passport" ? <div className="player-hub-overview">
      {view === "passport" && card && edit ? <div className="player-hub-identity">
        <section className={`player-passport accent-${edit.accent.toLowerCase()}`} aria-label="Your passport preview">
          <div className="passport-card-label"><span>01 / PLAYER ID</span><span className="passport-collection-count"><Award size={14} aria-hidden="true" />{card.badges.length} badges earned</span></div>
          <div className="passport-identity">
            <span className="passport-avatar"><img src={card.user.avatarUrl} alt="" /></span>
            <div className="passport-name">
              <span className="passport-title">{edit.title}</span>
              <h3>{card.user.username}</h3>
              <p><Gamepad2 size={13} aria-hidden="true" />{edit.favoriteGame ? <>Favorite <b>{gameName(edit.favoriteGame)}</b></> : "No favorite game yet"}</p>
            </div>
          </div>
          {card.progression ? <section className="passport-level" aria-label="Player level and experience">
            <div className="passport-level-heading"><strong><span>LVL</span> {card.progression.level}</strong><span>{card.progression.totalXp.toLocaleString()} lifetime XP</span></div>
            <progress value={card.progression.levelXp} max={card.progression.levelGoal} aria-label={`Player level ${card.progression.level} progress`} />
            <div className="passport-level-meta"><span><b>{card.progression.levelXp.toLocaleString()}</b> / {card.progression.levelGoal.toLocaleString()} XP</span><span>{card.progression.remainingXp.toLocaleString()} XP to level {card.progression.level + 1}</span></div>
          </section> : null}
          <dl className="passport-stats"><div><dt><HeartHandshake size={13} aria-hidden="true" />Buddy level</dt><dd>{card.level}</dd></div><div><dt><ScrollText size={13} aria-hidden="true" />Quests</dt><dd>{card.quests}</dd></div><div><dt><Trophy size={13} aria-hidden="true" />Daily wins</dt><dd>{card.challengeCount}</dd></div></dl>
          {edit.featuredBadges.length ? <div className="passport-featured">
            <div className="passport-featured-head"><span>Featured badges</span><button type="button" onClick={() => setView("customize")}><Pencil size={12} aria-hidden="true" />Edit</button></div>
            <div className="passport-badges" aria-label="Featured badges">{card.badges.filter((badge) => edit.featuredBadges.includes(badge.id)).map((badge) => <PlayerBadge key={badge.id} badge={badge} tooltip />)}</div>
          </div> : null}
        </section>
      </div> : null}
      {challenge ? <section className={`daily-challenge${challenge.complete ? " is-complete" : ""}`} aria-label="Daily challenge">
        <div className="daily-challenge-heading"><span className="pixel-label">DAILY CHALLENGE</span><span className="daily-challenge-reset" title="A new challenge every day at 00:00 UTC"><Clock3 size={12} aria-hidden="true" />{challenge.complete ? "Done for today" : `New in ${timeLeft(challenge.resetsAt, now)}`}</span></div>
        <div className="daily-challenge-main">
          <img className="daily-challenge-cover" src={coverFor(challenge.game)} alt="" />
          <div>
            <h3>{challenge.name}</h3>
            <p>{challenge.task ? <><strong>{challenge.task}</strong> in {gameName(challenge.game)}.</> : <>Score <strong>{challenge.goal.toLocaleString()} {challenge.unit}</strong> in {gameName(challenge.game)}.</>}</p>
            <span className="daily-challenge-rule">{challenge.game === "nzp" ? "One game" : "One run"}</span>
          </div>
        </div>
        <div className="daily-challenge-progress">
          <div className="daily-challenge-score"><strong>{(challenge.complete ? challenge.goal : challenge.best || 0).toLocaleString()}</strong><span>/ {challenge.goal.toLocaleString()} {challenge.unit}</span><em>{challenge.complete ? "Complete · reward unlocked" : "best run today"}</em></div>
          <progress max={challenge.goal} value={challenge.complete ? challenge.goal : Math.min(challenge.goal, challenge.best || 0)} aria-label="Daily challenge progress" />
        </div>
        <div className="daily-challenge-rewards">
          <div className="daily-challenge-reward"><Award size={18} aria-hidden="true" /><div><strong>{challenge.reward}</strong><span>Title + card accent</span></div></div>
          {challenge.xp ? <div className="daily-xp-reward"><Zap size={18} aria-hidden="true" /><div><strong>+{challenge.xp.total.toLocaleString()} XP</strong><span>{challenge.complete ? "Earned today" : `${challenge.xp.base} base + ${challenge.xp.bonus.toLocaleString()} streak`}</span></div></div> : null}
        </div>
        {card ? <div className="daily-streak-panel"><Flame size={20} aria-hidden="true" /><div><strong>{card.currentStreak || 0}<span> day streak</span></strong><small>Best {card.bestStreak || 0} days · each day in a row adds 10 bonus XP, a missed day resets it</small></div><span className="daily-streak-status">{challenge.complete ? "Today secured" : card.currentStreak ? "Keep it going" : "Start one today"}</span></div> : null}
        <button type="button" className="daily-challenge-play" onClick={() => { setOpen(false); onPlay(challenge.game); }}>{challenge.complete ? "Play again" : "Play challenge"} <ArrowUpRight size={16} aria-hidden="true" /></button>
        <small className="daily-challenge-note">{data?.user ? "Progress saves after an accepted run." : "Sign in before playing to save progress."}</small>
      </section> : null}
      </div> : null}
      {view === "records" && card ? <section className="passport-records-panel" aria-label="Personal bests"><h3><Trophy size={14} aria-hidden="true" />Your high scores</h3><div className="passport-records">{card.records.map((record) => <div key={record.game} className={record.best === null ? "is-empty" : undefined}><img src={coverFor(record.game)} alt="" /><span>{gameName(record.game)}</span><strong>{record.best === null ? "No run yet" : record.best.toLocaleString()}</strong><small>{record.best === null ? "Play to set a record" : record.game === "madrace" ? "highest level" : "best score"}</small></div>)}</div></section> : null}
      {view === "customize" && card && edit ? <section className="passport-customize">
        <form className="passport-form" onSubmit={save} onChange={() => setSaveMessage("")}>
          <div className="passport-fields">
            <label>Title<select value={edit.title} disabled={busy} onChange={(event) => setEdit({ ...edit, title: event.target.value })}>{card.titles.map((title) => <option key={title}>{title}</option>)}</select></label>
            <label>Favorite game<select value={edit.favoriteGame} disabled={busy} onChange={(event) => setEdit({ ...edit, favoriteGame: event.target.value })}><option value="">Choose a game</option>{PLAYER_GAMES.map((game) => <option key={game.id} value={game.id}>{game.name}</option>)}</select></label>
            <label>Card accent<select value={edit.accent} disabled={busy} onChange={(event) => setEdit({ ...edit, accent: event.target.value })}>{["default", ...card.cosmetics].map((accent) => <option key={accent} value={accent}>{accent === "default" ? "Classic green" : accent}</option>)}</select></label>
          </div>
          <fieldset disabled={busy}><legend>Badge collection · {edit.featuredBadges.length}/3 featured</legend><p className="passport-collection-hint">Choose up to three earned badges. Earned streak badges stay yours.</p><div className="passport-badge-options" tabIndex={0} role="region" aria-label="Badge collection">{collection.map((badge) => {
            const earned = badge.earned !== false;
            return <label key={badge.id} className={earned ? "is-earned" : "is-locked"}>
              <input type="checkbox" aria-label={`Feature ${badge.label}`} checked={edit.featuredBadges.includes(badge.id)} disabled={!earned || (!edit.featuredBadges.includes(badge.id) && edit.featuredBadges.length >= 3)} onChange={(event) => setEdit({ ...edit, featuredBadges: event.target.checked ? [...edit.featuredBadges, badge.id] : edit.featuredBadges.filter((id) => id !== badge.id) })} />
              <PlayerBadge badge={badge} /><span className="badge-requirement">{badge.description}</span>
              <span className="badge-xp">+{badge.xp?.toLocaleString()} XP {earned ? "earned" : "on unlock"}</span>
              <span className="badge-unlock-status">{earned ? "Unlocked" : <><LockKeyhole size={11} aria-hidden="true" />{badge.progress} / {badge.target} {badge.metric === "streak" ? "best streak" : "daily wins"}</>}</span>
              {!earned ? <progress value={badge.progress} max={badge.target} aria-label={`${badge.label} progress`} /> : null}
            </label>;
          })}</div></fieldset>
          <div className="passport-save-row"><button type="submit" disabled={busy}>{busy ? "Saving…" : "Save passport"}</button><span className="passport-save-status" role="status" aria-live="polite">{saveMessage}</span></div>
        </form>
      </section> : null}
      {view === "inbox" && data?.user ? <CommunityInbox inbox={data.inbox} onNavigate={() => setOpen(false)} /> : null}
      </div>
      <nav className="player-hub-nav" aria-label="Passport sections">{[
        ["passport", "Passport", Award], ["records", "Records", Trophy], ["customize", "Customize", SlidersHorizontal], ["inbox", "Inbox", Inbox]
      ].filter(([id]) => data?.user || id === "passport").map(([id, label, Icon]) => <button key={id} type="button" aria-current={view === id ? "page" : undefined} onClick={() => setView(id)}><Icon size={15} aria-hidden="true" /><span>{label}</span>{id === "inbox" && data?.inbox?.unread ? <b>{data.inbox.unread}</b> : null}</button>)}</nav>
    </Dialog.Content></Dialog.Portal>
  </Dialog.Root>;
}
