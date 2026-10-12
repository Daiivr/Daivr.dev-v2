import "../styles/konami-games.css";
import { ArrowLeft, Gamepad2, LogIn, Play, RotateCcw, Trophy, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { RankingAvatar } from "./RankingAvatar";
import { ArcadeTvDetails, ArcadeTvPower, ArcadeTvVolume } from "./ArcadeTvDetails";
import { useDailyChallengeNotice } from "../hooks/useDailyChallengeNotice";
import { useModalPresence } from "../hooks/useModalPresence";
import { TV_CLOSE_MS, useTvPowerOn } from "../hooks/useTvPowerOn";
import { DailyChallengeNotice } from "./DailyChallengeNotice";
import { armRunToken, runTokenFor } from "../lib/runTokens";

// Fader de volumen de la tele. Cada cartucho con fader guarda su volumen en
// `key` (el juego lee esa misma clave de localStorage al arrancar), lo recibe
// en `message` al moverlo y avisa con `ready` para que se le mande el actual.
// La mesa de pinball es ruidosa y el cartucho se abre sin avisar: arranca bajo
// y el que quiera mas lo sube.
const PINBALL_VOLUME = { key: "daivr.pinballVolume.v1", fallback: 0.1, message: "daivr:pinball-volume", ready: "daivr:pinball-ready" };
const POKESURVIVOR_VOLUME = { key: "daivr.pokesurvivor.volume.v1", fallback: 0.6, message: "daivr:pokesurvivor-volume", ready: "daivr:pokesurvivor-ready" };

// PokéSurvivor ranks seconds survived.
const clock = (seconds) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

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
    volume: PINBALL_VOLUME,
    ranking: { api: "space-cadet-pinball", heading: "TOP CADETS", scanning: "READING THE TABLE...", format: (value) => Number(value).toLocaleString("en-US"), saving: (value) => `LOGGING ${Number(value).toLocaleString("en-US")}...`, saved: (value, rank) => `${Number(value).toLocaleString("en-US")} LOGGED // RANK #${rank}` }
  },
  // The game saves its own runs (Discord login inside the cartridge, server/pokesurvivor.mjs)
  // and reports them here with daivr:pokesurvivor-run. Esc pauses the game. Volume
  // and full screen live on the set (the game hides its own buttons inside it).
  pokesurvivor: {
    title: "POKE.SURVIVOR",
    subtitle: "SECRET PROGRAM // DISK 06",
    src: "/pokesurvivor/index.html",
    controls: "WASD / ARROWS MOVE // 1-4 OR Q/E SWAP MOVES",
    escHint: "ESC PAUSES",
    volume: POKESURVIVOR_VOLUME,
    fullscreen: true,
    ranking: { api: "pokesurvivor", heading: "LONGEST SURVIVORS", scanning: "COUNTING THE HORDE...", format: clock, detail: (entry) => `LV ${entry.bestLevel || 1}`, saved: (value, rank) => `SURVIVED ${clock(value)} // RANK #${rank}` }
  }
};

function formatDuration(value) {
  const seconds = Math.max(0, Math.floor(Number(value || 0) / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function readStoredVolume(settings) {
  if (!settings) return 0;
  try {
    const stored = window.localStorage.getItem(settings.key);
    const value = Number(stored);
    return stored !== null && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : settings.fallback;
  } catch { return settings.fallback; }
}

export function ArcadeEmbedModal({ game, open, onBack, onClose }) {
  const [instance, setInstance] = useState(0);
  const [rankingOpen, setRankingOpen] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [me, setMe] = useState(null);
  const [myScore, setMyScore] = useState(null);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [volume, setVolume] = useState(() => readStoredVolume(GAME_CONFIG[game]?.volume));
  const [gameOver, setGameOver] = useState(null);
  const frameRef = useRef(null);
  const daily = useDailyChallengeNotice({ game, open, frameRef });
  // While it fades out, `game` has already moved on (to the library, say): keep
  // showing the cartridge that was in.
  const presence = useModalPresence(open ? game : null, TV_CLOSE_MS);
  const shownGame = presence.item;
  const switchingOff = presence.state === "closed";
  const gameOverPresence = useModalPresence(gameOver);
  const shownGameOver = gameOverPresence.item;
  const powered = useTvPowerOn(open, game);
  const config = GAME_CONFIG[shownGame];
  const ranking = config?.ranking;
  const hasRanking = Boolean(ranking);
  const volumeSettings = config?.volume;

  // Each cartridge has its own volume: read it again when another one goes in.
  useEffect(() => { setVolume(readStoredVolume(GAME_CONFIG[game]?.volume)); }, [game]);

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

  // La ficha se pide al abrir (y en cada reinicio del iframe), antes de que el
  // juego empiece a contar; el servidor mide las partidas desde ese momento.
  useEffect(() => {
    if (open && ranking) armRunToken(ranking.api);
  }, [instance, open, ranking]);

  // El iframe es del mismo origen, asi que el volumen y el nombre viajan por
  // postMessage en vez de tocar su DOM: el juego los aplica sobre su propio
  // AudioContext y sobre la tabla de traducciones del wasm.
  const postToGame = useCallback((message) => {
    const frame = frameRef.current;
    if (!frame?.contentWindow) return;
    frame.contentWindow.postMessage(message, window.location.origin);
  }, []);

  const changeVolume = useCallback((value) => {
    if (!volumeSettings) return;
    const next = Math.min(1, Math.max(0, Number(value)));
    setVolume(next);
    try { window.localStorage.setItem(volumeSettings.key, String(next)); } catch { /* almacenamiento bloqueado */ }
    postToGame({ type: volumeSettings.message, value: next });
  }, [postToGame, volumeSettings]);

  // Like NZ:P: the set's FULL SCREEN button enlarges the game frame itself.
  const fullscreen = useCallback(() => {
    const frame = frameRef.current;
    if (!frame?.requestFullscreen) { setStatus("FULL SCREEN IS UNAVAILABLE IN THIS BROWSER"); return; }
    frame.requestFullscreen().then(() => frame.contentWindow?.focus(), () => setStatus("FULL SCREEN IS UNAVAILABLE IN THIS BROWSER"));
  }, []);

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
      if (volumeSettings && event.data?.type === volumeSettings.ready) {
        postToGame({ type: volumeSettings.message, value: volume });
        if (event.data.type === "daivr:pinball-ready" && me?.username) postToGame({ type: "daivr:pinball-player", name: me.username });
        return;
      }
      // PokéSurvivor submits its runs itself and tells the set how it went;
      // signing in inside the cartridge also refreshes the trophy panel.
      if (event.data?.type === "daivr:pokesurvivor-login") { loadLeaderboard(true); window.dispatchEvent(new Event("daivr-player-progress")); return; }
      if (event.data?.type === "daivr:pokesurvivor-run" && ranking) {
        const seconds = Math.max(0, Number(event.data.t) || 0);
        const score = event.data.score && Number.isFinite(Number(event.data.score.rank)) ? event.data.score : null;
        if (score) setMyScore(score);
        setStatus(score ? ranking.saved(seconds, score.rank) : event.data.mode === "g" ? `GROUP RUN // ${clock(seconds)} SURVIVED` : event.data.signedIn ? `${clock(seconds)} SURVIVED` : "DISCORD LINK REQUIRED TO RANK");
        loadLeaderboard(true);
        window.dispatchEvent(new Event("daivr-player-progress"));
        return;
      }
      if (!ranking) return;
      if (event.data?.type !== "daivr:cross-score" && event.data?.type !== "daivr:pinball-score") return;
      const score = Math.max(0, Number(event.data.score) || 0);
      const durationMs = Math.max(0, Number(event.data.durationMs) || 0);
      setStatus(me ? ranking.saving(score) : "DISCORD LINK REQUIRED TO RANK");
      if (!me) return;
      runTokenFor(ranking.api).then((runToken) => fetch(`/api/${ranking.api}/score`, { method:"POST", credentials:"include", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ score, durationMs, runToken }) }))
        .then(async (response) => { const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || "save-failed"); setMyScore(data.score || null); setLeaderboard(data.leaderboard || []); setStatus(ranking.saved(score, data.score?.rank || "?")); window.dispatchEvent(new Event("daivr-player-progress")); })
        .catch((error) => setStatus(String(error.message || "SAVE FAILED").toUpperCase()));
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [loadLeaderboard, me, myScore, onClose, open, postToGame, ranking, rankingOpen, volume, volumeSettings]);

  // El nombre puede llegar despues del arranque (login ya hecho, fetch en vuelo).
  useEffect(() => {
    if (!open || shownGame !== "space-cadet-pinball" || !me?.username) return;
    postToGame({ type: "daivr:pinball-player", name: me.username });
  }, [me, open, postToGame, shownGame]);

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

  if (!config) return null;

  // The set's volume fader (ArcadeTvVolume) works in 0-100; the games in 0-1.
  const volumeControl = config?.volume ? { value: volume * 100, onChange: (next) => changeVolume(next / 100), label: `${config.title} volume` } : null;

  return (
    <div className="arcade-embed-backdrop motion-backdrop" data-state={presence.state}>
      <section className="arcade-embed-modal arcade-tv motion-panel" data-state={presence.state} role="dialog" aria-modal="true" aria-label={config.title}>
        <header>
          <div className="arcade-embed-title"><button type="button" onClick={onBack} aria-label="Back to game library"><ArrowLeft size={17} /></button><span><small>{config.subtitle}</small><strong><Gamepad2 size={19} /> {config.title}</strong></span></div>
          <div>{hasRanking ? <button className={rankingOpen ? "is-active" : ""} type="button" onClick={() => setRankingOpen((value) => !value)} aria-label={`Toggle ${config.title} leaderboard`}><Trophy size={16} /></button> : null}<button type="button" onClick={() => { setGameOver(null); setInstance((value) => value + 1); }} aria-label={`Restart ${config.title}`}><RotateCcw size={16} /></button><button type="button" onClick={onClose} aria-label={`Close ${config.title}`}><X size={18} /></button></div>
        </header>
        <div className="arcade-embed-screen">{powered ? <iframe key={instance} ref={frameRef} src={config.src} title={config.title} allow="autoplay; fullscreen" onLoad={(event) => { if ((game === "cross-road" || game === "pokesurvivor") && !rankingOpen) event.currentTarget.contentWindow?.focus(); }} /> : null}
          <ArcadeTvPower powered={powered} off={switchingOff} />
          <DailyChallengeNotice notice={daily.notice} onDismiss={daily.dismiss} onRetry={daily.retry} onClose={onClose} />
          {shownGameOver ? (
            <div className="pinball-gameover motion-backdrop" data-state={gameOverPresence.state} role="dialog" aria-modal="true" aria-label="Game over">
              <div className="motion-panel" data-state={gameOverPresence.state}>
                <small>TABLE CLOSED // DISK 05</small>
                <h3>GAME OVER</h3>
                <b>{Number(shownGameOver.score).toLocaleString("en-US")}</b>
                <p>FINAL SCORE <i>•</i> {formatDuration(shownGameOver.durationMs)} ON THE TABLE</p>
                {me ? (
                  <span className={shownGameOver.score > shownGameOver.previousBest ? "pinball-gameover-rank is-best" : "pinball-gameover-rank"}>
                    <RankingAvatar src={me.avatarUrl} name={me.username} loading="eager" />
                    <em>{shownGameOver.score > shownGameOver.previousBest ? "NEW PERSONAL BEST" : `BEST ${ranking.format(shownGameOver.previousBest)}`}</em>
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
            {me ? <div className="tower-ranking-self"><RankingAvatar src={me.avatarUrl} name={me.username} loading="eager" /><span><small>LINKED AS {me.username}</small><strong>{myScore ? `#${myScore.rank} // ${ranking.format(myScore.bestScore)} // ${ranking.detail ? ranking.detail(myScore) : formatDuration(myScore.bestDurationMs)}` : "NO RUN RECORDED"}</strong></span></div> : <a href="/api/comments/auth/discord"><LogIn size={15} /> CONNECT DISCORD TO RANK</a>}
            {rankingLoading ? <p>{ranking.scanning}</p> : <ol>{leaderboard.map((entry) => <li className={entry.discordId === me?.id ? "is-player" : ""} key={entry.discordId}><b>{String(entry.rank).padStart(2,"0")}</b><RankingAvatar src={entry.avatarUrl} name={entry.username} /><span>{entry.username}</span><em>{ranking.format(entry.bestScore)}</em><small>{ranking.detail ? ranking.detail(entry) : formatDuration(entry.bestDurationMs)}</small></li>)}</ol>}
          </aside> : null}
        </div>
        <ArcadeTvDetails channel={{ "cross-road": "03", "rubiks-cube": "04", "space-cadet-pinball": "05", pokesurvivor: "06" }[shownGame]} powered={powered} off={switchingOff} volume={volumeControl} onFullscreen={config.fullscreen ? fullscreen : undefined} />
        <footer>
          <span>{config.controls}</span>
          {volumeControl ? <ArcadeTvVolume compact {...volumeControl} /> : null}
          <b>{status || "PROGRAM ONLINE"}</b><em>{config.escHint || "ESC TO CLOSE"}</em>
        </footer>
      </section>
    </div>
  );
}
