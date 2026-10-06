import { useCallback, useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, Gamepad2, LogIn, Trophy, X } from "lucide-react";
import { ArcadeTvDetails, ArcadeTvPower } from "./ArcadeTvDetails";
import { DailyChallengeNotice } from "./DailyChallengeNotice";
import { RankingAvatar } from "./RankingAvatar";
import { TV_CLOSE_MS, useTvPowerOn } from "../hooks/useTvPowerOn";
import { useDailyChallengeNotice } from "../hooks/useDailyChallengeNotice";
import { armRunToken, runTokenFor } from "../lib/runTokens";
import "../styles/konami-games.css";
import "../styles/nzp.css";

const NZP_GAME_URL = "/nzp/index.html";
const number = (value) => Number(value || 0).toLocaleString("en-US");
const BOARDS = {
  round: { tab: "ROUND", heading: "HIGHEST ROUND", format: (value) => `ROUND ${value}` },
  kills: { tab: "KILLS", heading: "ZOMBIES KILLED", format: (value) => `${number(value)} KILLS` },
  score: { tab: "MONEY", heading: "MONEY EARNED", format: (value) => `${number(value)} PTS` }
};
const MAPS = { ndu: "Nacht der Untoten", nzp_warehouse2: "Warehouse", nzp_xmas2: "Tikhaya Noch", nzp_warehouse: "Warehouse (Classic)", christmas_special: "Christmas Special", lexi_house: "House", lexi_temple: "Temple", lexi_overlook: "Overlook" };
const mapName = (id) => MAPS[id] || id || "";

// The cartridge boots straight into NZ:P's own menus. Co-op lives in the game's
// Cooperative menu, and every finished (or abandoned) game is saved to the
// three rankings from the stats the game's client prints (tools/nzp-qc).
export function NzpModal({ onBack, onClose }) {
  const [exiting, setExiting] = useState(false);
  const [notice, setNotice] = useState("");
  const [rankingOpen, setRankingOpen] = useState(false);
  const [board, setBoard] = useState("round");
  const [leaderboard, setLeaderboard] = useState([]);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [me, setMe] = useState(null);
  const [myStats, setMyStats] = useState(null);
  const exitTimer = useRef(null);
  const frameRef = useRef(null);
  const meRef = useRef(null);
  const gameRef = useRef(null);
  const powered = useTvPowerOn(!exiting, "nzp");
  const daily = useDailyChallengeNotice({ game: "nzp", open: true, frameRef });
  const reportRef = useRef(daily.report);
  reportRef.current = daily.report;

  useEffect(() => () => window.clearTimeout(exitTimer.current), []);
  useEffect(() => { armRunToken("nzp"); }, []);

  const loadMe = useCallback(async () => {
    try {
      const response = await fetch("/api/nzp/me", { credentials: "include" });
      const data = response.ok ? await response.json() : {};
      meRef.current = data.user || null;
      setMe(data.user || null);
      setMyStats(data.stats || null);
    } catch {
      meRef.current = null;
    }
  }, []);

  const loadBoard = useCallback(async (name) => {
    setRankingLoading(true);
    try {
      const response = await fetch(`/api/nzp/leaderboard?board=${name}&limit=10`, { credentials: "include" });
      if (!response.ok) throw new Error("ranking-offline");
      setLeaderboard((await response.json()).leaderboard || []);
    } catch {
      setLeaderboard([]);
      setNotice("RANKING OFFLINE");
    } finally {
      setRankingLoading(false);
    }
  }, []);

  useEffect(() => { loadMe(); }, [loadMe]);
  useEffect(() => { if (rankingOpen) loadBoard(board); }, [board, loadBoard, rankingOpen]);

  // One record per game: sent at game over, or when a new game (or closing the
  // cartridge) shows the previous one was left early. Games without a kill are skipped.
  const submitGame = useCallback((game, closing = false) => {
    if (!game || game.sent || !game.kills) return;
    game.sent = true;
    if (!meRef.current) {
      if (!closing) setNotice("CONNECT DISCORD TO RANK YOUR GAMES");
      return;
    }
    const body = { round: game.round, kills: game.kills, headshots: game.headshots, score: game.score, map: game.map, durationMs: Date.now() - game.startedAt };
    if (!closing) setNotice(`SAVING ROUND ${game.round}...`);
    runTokenFor("nzp")
      .then((runToken) => fetch("/api/nzp/game", { method: "POST", credentials: "include", keepalive: true, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, runToken }) }))
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "save-failed");
        if (closing) return;
        setMyStats(data.stats || null);
        setNotice(`ROUND ${game.round} // ${number(game.kills)} KILLS LOGGED${data.stats?.ranks?.round ? ` // RANK #${data.stats.ranks.round}` : ""}`);
        window.dispatchEvent(new Event("daivr-player-progress"));
      })
      .catch((error) => { if (!closing) setNotice(String(error.message || "SAVE FAILED").toUpperCase()); });
  }, []);

  useEffect(() => {
    function receive(event) {
      const frame = frameRef.current?.contentWindow;
      if (!frame || event.source !== frame || event.origin !== window.location.origin || event.data?.type !== "nzp:stats") return;
      const { phase, round, kills, headshots, score, map } = event.data;
      let game = gameRef.current;
      // Lower counters or another map mean the last game ended without a game over.
      if (game && (map !== game.map || round < game.round || kills < game.kills || headshots < game.headshots || score < game.score)) {
        submitGame(game);
        game = null;
      }
      game ??= { startedAt: Date.now(), map };
      Object.assign(game, { round, kills, headshots, score });
      // The daily goal can complete mid-game (useDailyChallengeNotice).
      if (round > 0) reportRef.current({ metrics: { round, kills, headshots, score, map }, durationMs: Date.now() - game.startedAt });
      if (phase === "end") {
        submitGame(game);
        gameRef.current = null;
      } else gameRef.current = game;
    }
    window.addEventListener("message", receive);
    return () => {
      window.removeEventListener("message", receive);
      submitGame(gameRef.current, true);
    };
  }, [submitGame]);

  function exit(callback) {
    if (exitTimer.current !== null) return;
    setExiting(true);
    exitTimer.current = window.setTimeout(callback, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : TV_CLOSE_MS);
  }

  function fullscreen() {
    const frame = frameRef.current;
    setNotice("");
    if (!frame?.requestFullscreen) return setNotice("FULL SCREEN IS UNAVAILABLE IN THIS BROWSER");
    // Hand the keyboard back to the game once the button has done its job.
    frame.requestFullscreen().then(() => frame.contentWindow?.focus(), () => setNotice("FULL SCREEN IS UNAVAILABLE IN THIS BROWSER"));
  }

  const ranks = myStats?.ranks || {};
  const mine = myStats ? { round: myStats.bestRound, kills: myStats.totalKills, score: myStats.totalScore }[board] : 0;

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) exit(onClose); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="arcade-embed-backdrop motion-backdrop" data-state={exiting ? "closed" : "open"}>
        <Dialog.Content className="arcade-embed-modal arcade-tv nzp-modal motion-panel" data-state={exiting ? "closed" : "open"} onEscapeKeyDown={(event) => { event.preventDefault(); if (rankingOpen) setRankingOpen(false); }}>
          <header>
            <div className="arcade-embed-title"><button type="button" onClick={() => exit(onBack)} aria-label="Back to secret game library"><ArrowLeft size={17} /></button><span><small>JOURNAL REWARD // CARTRIDGE 06</small><Dialog.Title asChild><strong><Gamepad2 size={19} /> NZ:P</strong></Dialog.Title></span></div>
            <div>
              <button type="button" className={rankingOpen ? "is-active" : ""} onClick={() => setRankingOpen((value) => !value)} aria-label="Toggle NZ:P rankings" aria-expanded={rankingOpen}><Trophy size={16} /></button>
              <button type="button" onClick={() => exit(onClose)} aria-label="Close NZ:P"><X size={18} /></button>
            </div>
          </header>
          <div className="arcade-embed-screen">
            <Dialog.Description className="nzp-intro">The archive is complete. NZ:P opens in its own main menu: play Solo, or choose Cooperative to host or join a game with friends.</Dialog.Description>
            <section className="nzp-game" aria-label="NZ:P game">
              {powered ? <iframe ref={frameRef} src={NZP_GAME_URL} title="Nazi Zombies: Portable" allow="autoplay; fullscreen; gamepad" allowFullScreen scrolling="no" /> : null}
            </section>
            <ArcadeTvPower powered={powered} off={exiting} />
            <DailyChallengeNotice notice={daily.notice} onDismiss={daily.dismiss} onRetry={daily.retry} onClose={() => exit(onClose)} />
            {rankingOpen ? <aside className="tower-ranking cross-road-ranking nzp-ranking" aria-label="NZ:P rankings">
              <header><div><small>RANKING.SYS</small><strong>{BOARDS[board].heading}</strong></div><div className="cross-road-ranking-actions"><button type="button" onClick={() => { loadBoard(board); loadMe(); }}>REFRESH</button><button type="button" onClick={() => setRankingOpen(false)} aria-label="Close rankings"><X size={15} /></button></div></header>
              <div className="nzp-ranking-tabs">{Object.entries(BOARDS).map(([name, { tab }]) => <button type="button" key={name} aria-pressed={board === name} onClick={() => setBoard(name)}>{tab}</button>)}</div>
              {me ? <div className="tower-ranking-self"><RankingAvatar src={me.avatarUrl} name={me.username} loading="eager" /><span><small>LINKED AS {me.username}</small><strong>{mine ? `${ranks[board] ? `#${ranks[board]} // ` : ""}${BOARDS[board].format(mine)}${board === "round" && myStats.bestRoundMap ? ` // ${mapName(myStats.bestRoundMap).toUpperCase()}` : ""}` : "NO GAME RECORDED"}</strong></span></div> : <a href="/api/comments/auth/discord"><LogIn size={15} /> CONNECT DISCORD TO RANK</a>}
              {rankingLoading ? <p>COUNTING THE HORDE...</p> : leaderboard.length ? <ol>{leaderboard.map((entry) => <li className={entry.discordId === me?.id ? "is-player" : ""} key={entry.discordId}><b>{String(entry.rank).padStart(2, "0")}</b><RankingAvatar src={entry.avatarUrl} name={entry.username} /><span>{entry.username}</span><em>{BOARDS[board].format(entry.value)}</em><small>{board === "round" ? mapName(entry.map) : ""}</small></li>)}</ol> : <p>NO SURVIVORS ON RECORD YET</p>}
            </aside> : null}
          </div>
          <ArcadeTvDetails channel="06" powered={powered} off={exiting} onFullscreen={fullscreen} />
          <footer><span>WASD TO MOVE // MOUSE TO AIM // ESC RELEASES POINTER</span><a href="https://github.com/nzp-team/nzportable" target="_blank" rel="noreferrer">NZ:P TEAM</a>{notice ? <em role="status">{notice}</em> : <b>PROGRAM ONLINE</b>}</footer>
        </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
