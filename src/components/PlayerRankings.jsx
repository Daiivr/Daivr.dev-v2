import { useEffect, useState } from "react";
import { Flame, Trophy, TrendingUp } from "lucide-react";
import { RankingAvatar } from "./RankingAvatar";

const BOARDS = [
  { id: "level", title: "Player level", Icon: TrendingUp, value: (entry) => `LVL ${entry.level}`, detail: (entry) => `${entry.totalXp.toLocaleString()} XP`, empty: "Earn XP to join the rankings." },
  { id: "streak", title: "Best daily streak", Icon: Flame, value: (entry) => `${entry.bestStreak} days`, detail: (entry) => `${entry.currentStreak} days active`, empty: "Complete a daily challenge to start a streak." },
  { id: "completions", title: "Daily completions", Icon: Trophy, value: (entry) => entry.challengeCount.toLocaleString(), detail: () => "challenges cleared", empty: "The first daily finish is still up for grabs." }
];

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
    <p className="rankings-intro">Cabinet champions <span>Top 5 · all time</span></p>
    <div className="rankings-tabs" aria-label="Ranking category">{BOARDS.map(({ id, title }) => <button type="button" key={id} aria-pressed={active === id} onClick={() => setActive(id)}>{title}</button>)}</div>
    {error ? <p role="alert">{error} <button type="button" onClick={() => setAttempt((value) => value + 1)}>Retry</button></p> : !rankings ? <p role="status">Reading the leaderboard…</p> : <div className="player-ranking-grid">{BOARDS.map(({ id, title, Icon, value, detail, empty }) => <section key={id} className={`player-ranking-board ${active === id ? "is-active" : ""}`} aria-label={title}>
      <h3><Icon size={18} aria-hidden="true" />{title}</h3>
      <ol>{rankings[id].map((entry) => <li key={entry.user.id} className={entry.user.id === userId ? "is-you" : ""}>
        <b className="ranking-place">{String(entry.rank).padStart(2, "0")}</b>
        <RankingAvatar src={entry.user.avatarUrl} name={entry.user.username} />
        <div className="ranking-player"><strong>{entry.user.username}</strong><small>{entry.user.id === userId ? "You · " : ""}{detail(entry)}</small></div>
        <b className="ranking-value">{value(entry)}</b>
      </li>)}</ol>
      {!rankings[id].length ? <p className="ranking-empty">{empty}</p> : null}
    </section>)}</div>}
    <p className="rankings-note">Level ranks use lifetime XP. Streak ranks keep each player’s longest run, even after a missed day.</p>
  </section>;
}
