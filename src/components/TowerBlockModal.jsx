import { ArrowLeft, Blocks, LogIn, RotateCcw, Trophy, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const BEST_KEY = "daivr.tower-block.best.v1";

function formatDuration(value) {
  const seconds = Math.max(0, Math.floor(Number(value || 0) / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function TowerBlockModal({ open, onBack, onClose }) {
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => Math.max(0, Number(localStorage.getItem(BEST_KEY)) || 0));
  const [instance, setInstance] = useState(0);
  const [rankingOpen, setRankingOpen] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [me, setMe] = useState(null);
  const [myScore, setMyScore] = useState(null);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const frameRef = useRef(null);

  const loadLeaderboard = useCallback(async (quiet = false) => {
    if (!quiet) setRankingLoading(true);
    try {
      const [topResponse, meResponse] = await Promise.all([
        fetch("/api/tower-block/leaderboard?limit=10", { credentials: "include" }),
        fetch("/api/tower-block/me", { credentials: "include" })
      ]);
      if (!topResponse.ok || !meResponse.ok) throw new Error("ranking-offline");
      const top = await topResponse.json();
      const mine = await meResponse.json();
      setLeaderboard(top.leaderboard || []);
      setMe(mine.user || null);
      setMyScore(mine.score || null);
    } catch {
      setSaveStatus("RANKING LINK OFFLINE");
    } finally {
      setRankingLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setRankingOpen(false);
    setSaveStatus("");
    loadLeaderboard();
  }, [loadLeaderboard, open]);

  useEffect(() => {
    if (!open) return undefined;
    function onMessage(event) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "daivr:tower-close") onClose();
      if (event.data?.type !== "daivr:tower-score") return;
      const next = Math.max(0, Number(event.data.score) || 0);
      const durationMs = Math.max(0, Number(event.data.durationMs) || 0);
      setScore(next);
      setBest((current) => {
        const value = Math.max(current, next);
        localStorage.setItem(BEST_KEY, String(value));
        return value;
      });
      setSaveStatus(me ? `SAVING STACK ${next}...` : "DISCORD LINK REQUIRED TO RANK");
      if (me) {
        fetch("/api/tower-block/score", {
          method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ score: next, durationMs })
        }).then(async (response) => {
          const data = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(data.error || "save-failed");
          setMyScore(data.score || null);
          setLeaderboard(data.leaderboard || []);
          setSaveStatus(`STACK ${next} SECURED // RANK #${data.score?.rank || "?"}`);
        }).catch((error) => setSaveStatus(String(error.message || "SAVE FAILED").toUpperCase()));
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [me, onClose, open]);

  if (!open) return null;

  return (
    <div className="tower-modal-backdrop">
      <section className="tower-modal" role="dialog" aria-modal="true" aria-labelledby="tower-modal-title">
        <header>
          <div className="tower-modal-title">
            <button type="button" onClick={onBack} aria-label="Back to game library"><ArrowLeft size={17} /></button>
            <span><small>SECRET PROGRAM // DISK 02</small><strong id="tower-modal-title"><Blocks size={19} /> TOWER.BLOCK</strong></span>
          </div>
          <div className="tower-modal-stats"><span>LAST <b>{score}</b></span><span>BEST <b>{best}</b></span><button className={rankingOpen ? "is-active" : ""} type="button" onClick={() => setRankingOpen((value) => !value)} aria-label="Toggle Tower Block leaderboard"><Trophy size={16} /></button><button type="button" onClick={() => { setScore(0); setInstance((value) => value + 1); }} aria-label="Restart Tower Block"><RotateCcw size={16} /></button><button type="button" onClick={onClose} aria-label="Close Tower Block"><X size={18} /></button></div>
        </header>
        <div className="tower-modal-screen">
          <iframe key={instance} ref={frameRef} src="/tower-block/index.html" title="Tower Block minigame" />
          {rankingOpen ? <aside className="tower-ranking" aria-label="Tower Block leaderboard">
            <header><div><small>RANKING.SYS</small><strong>TOP BUILDERS</strong></div><button type="button" onClick={() => loadLeaderboard()}>REFRESH</button></header>
            {me ? <div className="tower-ranking-self"><img src={me.avatarUrl} alt="" /><span><small>LINKED AS {me.username}</small><strong>{myScore ? `#${myScore.rank} // ${myScore.bestScore} BLOCKS // ${formatDuration(myScore.bestDurationMs)}` : "NO TOWER RECORDED"}</strong></span></div> : <a href="/api/comments/auth/discord"><LogIn size={15} /> CONNECT DISCORD TO RANK</a>}
            {rankingLoading ? <p>SCANNING TOWERS...</p> : <ol>{leaderboard.map((entry) => <li className={entry.discordId === me?.id ? "is-player" : ""} key={entry.discordId}><b>{String(entry.rank).padStart(2,"0")}</b><img src={entry.avatarUrl} alt="" /><span>{entry.username}</span><em>{entry.bestScore} BLOCKS</em><small>{formatDuration(entry.bestDurationMs)}</small></li>)}</ol>}
          </aside> : null}
        </div>
        <footer><span>SPACE / CLICK TO PLACE</span><b>{saveStatus || "BUILD SIGNAL ONLINE"}</b><em>ESC TO CLOSE</em></footer>
      </section>
    </div>
  );
}
