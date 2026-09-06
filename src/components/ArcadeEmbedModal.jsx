import { ArrowLeft, Gamepad2, LogIn, Play, RotateCcw, Trophy, Volume2, VolumeX, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { RankingAvatar } from "./RankingAvatar";

const VOLUME_KEY = "daivr.pinballVolume.v1";
// La mesa es ruidosa y el cartucho se abre sin avisar: arranca bajo y el que
// quiera mas lo sube. Tiene que coincidir con el del shell del juego, que lee
// la misma clave de localStorage.
const DEFAULT_VOLUME = 0.1;

const GAME_CONFIG = {
  "cross-road": {
    title: "CROSS.ROAD",
    subtitle: "SECRET PROGRAM // DISK 03",
    src: "/cross-road/index.html",
    controls: "ARROWS TO MOVE // CROSS EVERY LANE",
    ranking: { api: "cross-road", heading: "TOP ROAD RUNNERS", scanning: "SCANNING LANES...", format: (value) => `ROAD ${value}`, saving: (value) => `SAVING ROAD ${value}...`, saved: (value, rank) => `ROAD ${value} SECURED // RANK #${rank}` }
  },
  "rubiks-cube": {
    title: "THE.CUBE",
    subtitle: "SECRET PROGRAM // DISK 04",
    src: "/rubiks-cube/index.html",
    controls: "DOUBLE CLICK TO START // DRAG TO TWIST"
  },
  "space-cadet-pinball": {
    title: "SPACE.CADET",
    subtitle: "SECRET PROGRAM // DISK 05",
    src: "/space-cadet-pinball/index.html",
    controls: "Z + / FLIPPERS // SPACE PLUNGER // F2 NEW GAME",
    volume: true,
    ranking: { api: "space-cadet-pinball", heading: "TOP CADETS", scanning: "READING THE TABLE...", format: (value) => Number(value).toLocaleString("en-US"), saving: (value) => `LOGGING ${Number(value).toLocaleString("en-US")}...`, saved: (value, rank) => `${Number(value).toLocaleString("en-US")} LOGGED // RANK #${rank}` }
  }
};

function formatDuration(value) {
  const seconds = Math.max(0, Math.floor(Number(value || 0) / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function readStoredVolume() {
  try {
    const stored = window.localStorage.getItem(VOLUME_KEY);
    const value = Number(stored);
    return stored !== null && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : DEFAULT_VOLUME;
  } catch { return DEFAULT_VOLUME; }
}

export function ArcadeEmbedModal({ game, open, onBack, onClose }) {
  const [instance, setInstance] = useState(0);
  const [rankingOpen, setRankingOpen] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [me, setMe] = useState(null);
  const [myScore, setMyScore] = useState(null);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [volume, setVolume] = useState(readStoredVolume);
  const [gameOver, setGameOver] = useState(null);
  const frameRef = useRef(null);
  const config = GAME_CONFIG[game];
  const ranking = config?.ranking;
  const hasRanking = Boolean(ranking);

  const loadLeaderboard = useCallback(async (quiet = false) => {
    if (!ranking) return;
    if (!quiet) setRankingLoading(true);
    try {
      const [topResponse, meResponse] = await Promise.all([
        fetch(`/api/${ranking.api}/leaderboard?limit=10`, { credentials: "include" }),
        fetch(`/api/${ranking.api}/me`, { credentials: "include" })
      ]);
      if (!topResponse.ok || !meResponse.ok) throw new Error("ranking-offline");
      const top = await topResponse.json();
      const mine = await meResponse.json();
      setLeaderboard(top.leaderboard || []); setMe(mine.user || null); setMyScore(mine.score || null);
    } catch { setStatus("RANKING LINK OFFLINE"); }
    finally { setRankingLoading(false); }
  }, [ranking]);

  useEffect(() => {
    setRankingOpen(false);
    setStatus("");
    setGameOver(null);
    if (open && hasRanking) loadLeaderboard();
  }, [game, hasRanking, loadLeaderboard, open]);

  // El iframe es del mismo origen, asi que el volumen y el nombre viajan por
  // postMessage en vez de tocar su DOM: el juego los aplica sobre su propio
  // AudioContext y sobre la tabla de traducciones del wasm.
  const postToGame = useCallback((message) => {
    const frame = frameRef.current;
    if (!frame?.contentWindow) return;
    frame.contentWindow.postMessage(message, window.location.origin);
  }, []);

  const changeVolume = useCallback((value) => {
    const next = Math.min(1, Math.max(0, Number(value)));
    setVolume(next);
    try { window.localStorage.setItem(VOLUME_KEY, String(next)); } catch { /* almacenamiento bloqueado */ }
    postToGame({ type: "daivr:pinball-volume", value: next });
  }, [postToGame]);

  useEffect(() => {
    if (!open) return undefined;
    function onMessage(event) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "daivr:arcade-close") {
        if (rankingOpen) setRankingOpen(false);
        else onClose();
        return;
      }
      if (event.data?.type === "daivr:pinball-playing") { setGameOver(null); return; }
      if (event.data?.type === "daivr:pinball-gameover") {
        setGameOver({ score: Math.max(0, Number(event.data.score) || 0), durationMs: Math.max(0, Number(event.data.durationMs) || 0), previousBest: Number(myScore?.bestScore || 0) });
        return;
      }
      if (event.data?.type === "daivr:pinball-ready") {
        postToGame({ type: "daivr:pinball-volume", value: volume });
        if (me?.username) postToGame({ type: "daivr:pinball-player", name: me.username });
        return;
      }
      if (!ranking) return;
      if (event.data?.type !== "daivr:cross-score" && event.data?.type !== "daivr:pinball-score") return;
      const score = Math.max(0, Number(event.data.score) || 0);
      const durationMs = Math.max(0, Number(event.data.durationMs) || 0);
      setStatus(me ? ranking.saving(score) : "DISCORD LINK REQUIRED TO RANK");
      if (!me) return;
      fetch(`/api/${ranking.api}/score`, { method:"POST", credentials:"include", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ score, durationMs }) })
        .then(async (response) => { const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || "save-failed"); setMyScore(data.score || null); setLeaderboard(data.leaderboard || []); setStatus(ranking.saved(score, data.score?.rank || "?")); })
        .catch((error) => setStatus(String(error.message || "SAVE FAILED").toUpperCase()));
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [me, myScore, onClose, open, postToGame, ranking, rankingOpen, volume]);

  // El nombre puede llegar despues del arranque (login ya hecho, fetch en vuelo).
  useEffect(() => {
    if (!open || !config?.volume || !me?.username) return;
    postToGame({ type: "daivr:pinball-player", name: me.username });
  }, [config, me, open, postToGame]);

  useEffect(() => {
    if (!open) return undefined;
    function onKeyDown(event) {
      if (event.key !== "Escape" || !rankingOpen) return;
      event.preventDefault();
      setRankingOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, rankingOpen]);

  if (!open || !config) return null;

  return (
    <div className="arcade-embed-backdrop">
      <section className="arcade-embed-modal" role="dialog" aria-modal="true" aria-label={config.title}>
        <header>
          <div className="arcade-embed-title"><button type="button" onClick={onBack} aria-label="Back to game library"><ArrowLeft size={17} /></button><span><small>{config.subtitle}</small><strong><Gamepad2 size={19} /> {config.title}</strong></span></div>
          <div>{hasRanking ? <button className={rankingOpen ? "is-active" : ""} type="button" onClick={() => setRankingOpen((value) => !value)} aria-label={`Toggle ${config.title} leaderboard`}><Trophy size={16} /></button> : null}<button type="button" onClick={() => { setGameOver(null); setInstance((value) => value + 1); }} aria-label={`Restart ${config.title}`}><RotateCcw size={16} /></button><button type="button" onClick={onClose} aria-label={`Close ${config.title}`}><X size={18} /></button></div>
        </header>
        <div className="arcade-embed-screen"><iframe key={instance} ref={frameRef} src={config.src} title={config.title} allow="autoplay; fullscreen" />
          {gameOver ? (
            <div className="pinball-gameover" role="dialog" aria-modal="true" aria-label="Game over">
              <div>
                <small>TABLE CLOSED // DISK 05</small>
                <h3>GAME OVER</h3>
                <b>{Number(gameOver.score).toLocaleString("en-US")}</b>
                <p>FINAL SCORE <i>•</i> {formatDuration(gameOver.durationMs)} ON THE TABLE</p>
                {me ? (
                  <span className={gameOver.score > gameOver.previousBest ? "pinball-gameover-rank is-best" : "pinball-gameover-rank"}>
                    <RankingAvatar src={me.avatarUrl} name={me.username} loading="eager" />
                    <em>{gameOver.score > gameOver.previousBest ? "NEW PERSONAL BEST" : `BEST ${ranking.format(gameOver.previousBest)}`}</em>
                    <strong>{myScore ? `${me.username} // RANK #${myScore.rank}` : me.username}</strong>
                  </span>
                ) : (
                  <a href="/api/comments/auth/discord"><LogIn size={15} /> CONNECT DISCORD TO RANK THIS RUN</a>
                )}
                <div className="pinball-gameover-actions">
                  <button className="is-primary" type="button" onClick={() => { setGameOver(null); postToGame({ type: "daivr:pinball-newgame" }); }}><Play size={15} /> NEW GAME</button>
                  <button type="button" onClick={() => setRankingOpen(true)}><Trophy size={15} /> RANKING</button>
                  <button type="button" onClick={onClose}><X size={15} /> EXIT CABINET</button>
                </div>
              </div>
            </div>
          ) : null}
          {hasRanking && rankingOpen ? <aside className="tower-ranking cross-road-ranking" aria-label={`${config.title} leaderboard`}>
            <header><div><small>RANKING.SYS</small><strong>{ranking.heading}</strong></div><div className="cross-road-ranking-actions"><button type="button" onClick={() => loadLeaderboard()}>REFRESH</button><button type="button" onClick={() => setRankingOpen(false)} aria-label="Close leaderboard"><X size={15} /></button></div></header>
            {me ? <div className="tower-ranking-self"><RankingAvatar src={me.avatarUrl} name={me.username} loading="eager" /><span><small>LINKED AS {me.username}</small><strong>{myScore ? `#${myScore.rank} // ${ranking.format(myScore.bestScore)} // ${formatDuration(myScore.bestDurationMs)}` : "NO RUN RECORDED"}</strong></span></div> : <a href="/api/comments/auth/discord"><LogIn size={15} /> CONNECT DISCORD TO RANK</a>}
            {rankingLoading ? <p>{ranking.scanning}</p> : <ol>{leaderboard.map((entry) => <li className={entry.discordId === me?.id ? "is-player" : ""} key={entry.discordId}><b>{String(entry.rank).padStart(2,"0")}</b><RankingAvatar src={entry.avatarUrl} name={entry.username} /><span>{entry.username}</span><em>{ranking.format(entry.bestScore)}</em><small>{formatDuration(entry.bestDurationMs)}</small></li>)}</ol>}
          </aside> : null}
        </div>
        <footer>
          <span>{config.controls}</span>
          {config.volume ? (
            <label className="arcade-embed-volume">
              {volume > 0 ? <Volume2 size={14} /> : <VolumeX size={14} />}
              <input type="range" min="0" max="1" step="0.05" value={volume} onChange={(event) => changeVolume(event.target.value)} aria-label={`${config.title} volume`} />
              <i>{Math.round(volume * 100)}</i>
            </label>
          ) : null}
          <b>{status || "PROGRAM ONLINE"}</b><em>ESC TO CLOSE</em>
        </footer>
      </section>
    </div>
  );
}
