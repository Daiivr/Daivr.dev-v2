import { ArrowLeft, Gamepad2, LogIn, RotateCcw, Trophy, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const GAME_CONFIG = {
  "cross-road": {
    title: "CROSS.ROAD",
    subtitle: "SECRET PROGRAM // DISK 03",
    src: "/cross-road/index.html",
    controls: "ARROWS TO MOVE // CROSS EVERY LANE"
  },
  "rubiks-cube": {
    title: "THE.CUBE",
    subtitle: "SECRET PROGRAM // DISK 04",
    src: "/rubiks-cube/index.html",
    controls: "DOUBLE CLICK TO START // DRAG TO TWIST"
  }
};

function formatDuration(value) {
  const seconds = Math.max(0, Math.floor(Number(value || 0) / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function ArcadeEmbedModal({ game, open, onBack, onClose }) {
  const [instance, setInstance] = useState(0);
  const [rankingOpen, setRankingOpen] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [me, setMe] = useState(null);
  const [myScore, setMyScore] = useState(null);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [status, setStatus] = useState("");
  const config = GAME_CONFIG[game];
  const hasRanking = game === "cross-road";

  const loadLeaderboard = useCallback(async (quiet = false) => {
    if (!quiet) setRankingLoading(true);
    try {
      const [topResponse, meResponse] = await Promise.all([
        fetch("/api/cross-road/leaderboard?limit=10", { credentials: "include" }),
        fetch("/api/cross-road/me", { credentials: "include" })
      ]);
      if (!topResponse.ok || !meResponse.ok) throw new Error("ranking-offline");
      const top = await topResponse.json();
      const mine = await meResponse.json();
      setLeaderboard(top.leaderboard || []); setMe(mine.user || null); setMyScore(mine.score || null);
    } catch { setStatus("RANKING LINK OFFLINE"); }
    finally { setRankingLoading(false); }
  }, []);

  useEffect(() => {
    if (!open || !hasRanking) return;
    setRankingOpen(false); setStatus(""); loadLeaderboard();
  }, [hasRanking, loadLeaderboard, open]);

  useEffect(() => {
    if (!open) return undefined;
    function onMessage(event) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "daivr:arcade-close") onClose();
      if (event.data?.type !== "daivr:cross-score") return;
      const score = Math.max(0, Number(event.data.score) || 0);
      const durationMs = Math.max(0, Number(event.data.durationMs) || 0);
      setStatus(me ? `SAVING ROAD ${score}...` : "DISCORD LINK REQUIRED TO RANK");
      if (!me) return;
      fetch("/api/cross-road/score", { method:"POST", credentials:"include", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ score, durationMs }) })
        .then(async (response) => { const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || "save-failed"); setMyScore(data.score || null); setLeaderboard(data.leaderboard || []); setStatus(`ROAD ${score} SECURED // RANK #${data.score?.rank || "?"}`); })
        .catch((error) => setStatus(String(error.message || "SAVE FAILED").toUpperCase()));
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [me, onClose, open]);

  if (!open || !config) return null;

  return (
    <div className="arcade-embed-backdrop">
      <section className="arcade-embed-modal" role="dialog" aria-modal="true" aria-label={config.title}>
        <header>
          <div className="arcade-embed-title"><button type="button" onClick={onBack} aria-label="Back to game library"><ArrowLeft size={17} /></button><span><small>{config.subtitle}</small><strong><Gamepad2 size={19} /> {config.title}</strong></span></div>
          <div>{hasRanking ? <button className={rankingOpen ? "is-active" : ""} type="button" onClick={() => setRankingOpen((value) => !value)} aria-label="Toggle Cross Road leaderboard"><Trophy size={16} /></button> : null}<button type="button" onClick={() => setInstance((value) => value + 1)} aria-label={`Restart ${config.title}`}><RotateCcw size={16} /></button><button type="button" onClick={onClose} aria-label={`Close ${config.title}`}><X size={18} /></button></div>
        </header>
        <div className="arcade-embed-screen"><iframe key={instance} src={config.src} title={config.title} />
          {rankingOpen ? <aside className="tower-ranking cross-road-ranking" aria-label="Cross Road leaderboard">
            <header><div><small>RANKING.SYS</small><strong>TOP ROAD RUNNERS</strong></div><button type="button" onClick={() => loadLeaderboard()}>REFRESH</button></header>
            {me ? <div className="tower-ranking-self"><img src={me.avatarUrl} alt="" /><span><small>LINKED AS {me.username}</small><strong>{myScore ? `#${myScore.rank} // ROAD ${myScore.bestScore} // ${formatDuration(myScore.bestDurationMs)}` : "NO RUN RECORDED"}</strong></span></div> : <a href="/api/comments/auth/discord"><LogIn size={15} /> CONNECT DISCORD TO RANK</a>}
            {rankingLoading ? <p>SCANNING LANES...</p> : <ol>{leaderboard.map((entry) => <li className={entry.discordId === me?.id ? "is-player" : ""} key={entry.discordId}><b>{String(entry.rank).padStart(2,"0")}</b><img src={entry.avatarUrl} alt="" /><span>{entry.username}</span><em>ROAD {entry.bestScore}</em><small>{formatDuration(entry.bestDurationMs)}</small></li>)}</ol>}
          </aside> : null}
        </div>
        <footer><span>{config.controls}</span><b>{status || "PROGRAM ONLINE"}</b><em>ESC TO CLOSE</em></footer>
      </section>
    </div>
  );
}
