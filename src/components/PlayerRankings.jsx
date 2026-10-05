import { useEffect, useState } from "react";
import { Crown, Flame, Trophy, TrendingUp } from "lucide-react";
import { RankingAvatar } from "./RankingAvatar";

const SPOTS = 5;
const days = (count) => `${count} day${count === 1 ? "" : "s"}`;
// value: the big number on the right, with a small unit before or after it.
const BOARDS = [
  { id: "level", title: "Player level", subtitle: "Ranked by lifetime XP", Icon: TrendingUp, value: (entry) => ({ before: "LVL", main: entry.level }), detail: (entry) => `${entry.totalXp.toLocaleString()} XP`, empty: "Earn XP to join the rankings." },
  { id: "streak", title: "Best daily streak", subtitle: "Longest run of days in a row", Icon: Flame, value: (entry) => ({ main: entry.bestStreak, after: entry.bestStreak === 1 ? "day" : "days" }), detail: (entry) => entry.currentStreak ? `${days(entry.currentStreak)} going now` : "No run going", empty: "Complete a daily challenge to start a streak." },
  { id: "completions", title: "Daily completions", subtitle: "Daily challenges cleared", Icon: Trophy, value: (entry) => ({ main: entry.challengeCount.toLocaleString(), after: "cleared" }), detail: (entry) => `Level ${entry.level}`, empty: "The first daily finish is still up for grabs." }
];

// "#1 in Player level · #3 in Best daily streak", or how to get on a board.
function YourPlacings({ rankings, userId }) {
  if (!userId) return null;
  const placings = BOARDS.map((board) => ({ board, entry: rankings[board.id].find((entry) => entry.user.id === userId) })).filter(({ entry }) => entry);
  if (!placings.length) return <p className="rankings-you">You're not on a board yet. Clear today's challenge to claim a spot.</p>;
  return <p className="rankings-you"><span>Your placings</span>{placings.map(({ board, entry }) => <b key={board.id} className={entry.rank <= 3 ? `is-rank-${entry.rank}` : undefined}>#{entry.rank}<small>{board.title}</small></b>)}</p>;
}

export function PlayerRankings({ userId }) {
  const [rankings, setRankings] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [active, setActive] = useState("level");
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    fetch("/api/player?view=rankings", { credentials: "include", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Rankings are unavailable. Try again shortly.");
        const result = await response.json();
        if (!controller.signal.aborted) setRankings(result.rankings);
      }).catch((reason) => { if (reason.name !== "AbortError") setError(reason.message); });
    return () => controller.abort();
  }, [attempt]);
  return <section className="player-rankings" aria-label="Top five player rankings">
    <div className="rankings-intro"><p><Crown size={15} aria-hidden="true" />Cabinet champions</p><span>Top {SPOTS} · all time</span></div>
    {rankings ? <YourPlacings rankings={rankings} userId={userId} /> : null}
    <div className="rankings-tabs" aria-label="Ranking category">{BOARDS.map(({ id, title }) => <button type="button" key={id} aria-pressed={active === id} onClick={() => setActive(id)}>{title}</button>)}</div>
    {error ? <p role="alert">{error} <button type="button" onClick={() => setAttempt((value) => value + 1)}>Retry</button></p> : !rankings ? <p role="status">Reading the leaderboard…</p> : <div className="player-ranking-grid">{BOARDS.map(({ id, title, subtitle, Icon, value, detail, empty }) => {
      const entries = rankings[id];
      return <section key={id} className={`player-ranking-board ${active === id ? "is-active" : ""}`} aria-label={title}>
        <h3><Icon size={18} aria-hidden="true" /><span>{title}<small>{subtitle}</small></span></h3>
        <ol>
          {entries.map((entry) => {
            const you = entry.user.id === userId;
            const score = value(entry);
            return <li key={entry.user.id} className={[entry.rank <= 3 ? `is-rank-${entry.rank}` : "", you ? "is-you" : ""].filter(Boolean).join(" ") || undefined}>
              <b className="ranking-place">{String(entry.rank).padStart(2, "0")}</b>
              <RankingAvatar src={entry.user.avatarUrl} name={entry.user.username} />
              <div className="ranking-player"><strong>{entry.user.username}{you ? <em className="ranking-you-tag">You</em> : null}</strong><small>{detail(entry)}</small></div>
              <span className="ranking-value">{score.before ? <small>{score.before}</small> : null}<b>{score.main}</b>{score.after ? <small>{score.after}</small> : null}</span>
            </li>;
          })}
          {/* Unclaimed places, so every board shows all five spots. */}
          {Array.from({ length: Math.max(0, SPOTS - entries.length) }, (_, index) => <li key={`open-${index}`} className="is-open" aria-hidden="true">
            <b className="ranking-place">{String(entries.length + index + 1).padStart(2, "0")}</b>
            <span className="ranking-open">{!entries.length && index === 0 ? empty : "Open spot"}</span>
          </li>)}
        </ol>
        {!entries.length ? <p className="sr-only">{empty}</p> : null}
      </section>;
    })}</div>}
    <p className="rankings-note">Level ranks use lifetime XP. Streak ranks keep each player’s longest run, even after a missed day.</p>
  </section>;
}
