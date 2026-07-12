import { LogIn, RotateCcw, Trophy, Volume2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const VOLUME_KEY = "daivr.madrace.volume.v1";

function formatTime(value) {
  const ms = Number(value);
  if (!Number.isFinite(ms) || ms < 0) return "--";
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const tenths = Math.floor((ms % 1000) / 100);
  return minutes ? `${minutes}:${String(seconds).padStart(2, "0")}.${tenths}` : `${seconds}.${tenths}s`;
}

export function MadraceModal({ open, onClose }) {
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [me, setMe] = useState(null);
  const [myScore, setMyScore] = useState(null);
  const [launchRestore, setLaunchRestore] = useState(null);
  const [gameInstance, setGameInstance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [volume, setVolume] = useState(() => Math.max(0, Math.min(100, Number(localStorage.getItem(VOLUME_KEY) ?? 12))));
  const frameRef = useRef(null);
  const closeRef = useRef(null);
  const launchConfiguredRef = useRef(false);

  const loadScores = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const [topResponse, meResponse] = await Promise.all([
        fetch("/api/madrace/leaderboard?limit=10", { credentials: "include" }),
        fetch("/api/madrace/me", { credentials: "include" })
      ]);
      if (!topResponse.ok || !meResponse.ok) throw new Error("leaderboard-offline");
      const top = await topResponse.json();
      const mine = await meResponse.json();
      setLeaderboard(top.leaderboard || []);
      setMe(mine.user || null);
      setMyScore(mine.score || null);
      if (!launchConfiguredRef.current) {
        launchConfiguredRef.current = true;
        setLaunchRestore(mine.score?.highestLevel > 0 ? {
          level: mine.score.highestLevel + 1,
          baseTimeMs: mine.score.bestTimeMs || 0
        } : null);
      }
      return mine.score || null;
    } catch {
      setStatus("RANKING LINK OFFLINE");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    loadScores();
    launchConfiguredRef.current = false;
    setLaunchRestore(null);
    setStatus("");
    setLeaderboardOpen(false);
    const shell = document.querySelector(".app-shell");
    const previousOverflow = shell?.style.overflow;
    if (shell) shell.style.overflow = "hidden";
    window.setTimeout(() => closeRef.current?.focus(), 80);

    function onKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (shell) shell.style.overflow = previousOverflow || "";
    };
  }, [loadScores, onClose, open]);

  useEffect(() => {
    if (!open) return undefined;
    function onMessage(event) {
      if (event.origin !== window.location.origin) return;
      const data = event.data || {};
      if (data.type === "daivr:drive-mad-score-saving") setStatus(`SAVING LEVEL ${data.level || "?"}...`);
      if (data.type === "daivr:drive-mad-score-error") {
        setStatus(data.status === 401 ? "DISCORD LINK REQUIRED TO SAVE" : String(data.error || "SAVE FAILED").toUpperCase());
      }
      if (data.type === "daivr:drive-mad-score-updated") {
        setStatus(`LEVEL ${data.score?.highestLevel || data.level} SECURED`);
        setMyScore(data.score || null);
        loadScores(true);
      }
      if (data.type === "daivr:game-ready") sendVolume(volume, 800);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [loadScores, open, volume]);

  function sendVolume(nextVolume, fadeMs = 180) {
    frameRef.current?.contentWindow?.postMessage({
      type: "daivr:set-volume",
      volume: Math.max(0, Math.min(1, nextVolume / 100)),
      fadeMs
    }, window.location.origin);
  }

  function updateVolume(event) {
    const next = Number(event.target.value);
    setVolume(next);
    localStorage.setItem(VOLUME_KEY, String(next));
    sendVolume(next);
  }

  async function resetScore() {
    if (!me || !window.confirm("Reset your Madrace leaderboard score and local game progress?")) return;
    setStatus("RESETTING RUN...");
    const response = await fetch("/api/madrace/me", { method: "DELETE", credentials: "include" });
    if (!response.ok) {
      setStatus("RESET FAILED");
      return;
    }
    setMyScore(null);
    setStatus("RUN RESET // LEVEL 01 READY");
    frameRef.current?.contentWindow?.postMessage({ type: "daivr:drive-mad-reset-score" }, window.location.origin);
    loadScores(true);
  }

  async function refreshAndResume() {
    setStatus("SYNCING RANK // RELOADING CHECKPOINT...");
    const score = await loadScores(true) || myScore;
    const nextLevel = score?.highestLevel > 0 ? score.highestLevel + 1 : 1;
    setLaunchRestore(score?.highestLevel > 0 ? {
      level: nextLevel,
      baseTimeMs: score.bestTimeMs || 0
    } : null);
    setGameInstance((value) => value + 1);
    setStatus(`CHECKPOINT LOADED // LEVEL ${String(nextLevel).padStart(2, "0")}`);
  }

  const gameSrc = useMemo(() => {
    if (loading) return "";
    const params = new URLSearchParams();
    if (me?.id) params.set("discordId", String(me.id));
    if (launchRestore?.level > 1) {
      params.set("restoreLevel", String(launchRestore.level));
      params.set("restoreBaseTimeMs", String(launchRestore.baseTimeMs || 0));
    }
    return `/madrace/index.html${params.size ? `?${params}` : ""}`;
  }, [launchRestore, loading, me?.id]);

  if (!open) return null;

  return (
    <div className="madrace-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="madrace-modal" role="dialog" aria-modal="true" aria-labelledby="madrace-title">
        <header className="madrace-header">
          <div>
            <span className="madrace-kicker">SECRET PROGRAM // KONAMI CLEARANCE</span>
            <h2 id="madrace-title">MADRACE.EXE</h2>
          </div>
          <div className="madrace-actions">
            <button type="button" className={leaderboardOpen ? "is-active" : ""} onClick={() => setLeaderboardOpen((value) => !value)}>
              <Trophy size={14} /> TOP 10
            </button>
            <button className="madrace-close" type="button" onClick={onClose} ref={closeRef} aria-label="Close Madrace">
              <X size={19} />
            </button>
          </div>
        </header>

        <div className="madrace-screen">
          {gameSrc ? (
            <iframe
              key={gameInstance}
              ref={frameRef}
              src={gameSrc}
              title="Madrace minigame"
              allow="autoplay; fullscreen"
              onLoad={() => sendVolume(volume, 900)}
            />
          ) : <div className="madrace-boot">LOADING SECRET CARTRIDGE...</div>}

          {leaderboardOpen ? (
            <aside className="madrace-leaderboard" aria-label="Madrace leaderboard">
              <div className="madrace-leaderboard-head">
                <div><span>RANKING.SYS</span><strong>TOP DRIVERS</strong></div>
                <button type="button" onClick={refreshAndResume}>REFRESH</button>
              </div>

              {me ? (
                <div className="madrace-player-record">
                  <img src={me.avatarUrl} alt="" />
                  <div><span>LINKED AS {me.username}</span><strong>{myScore ? `#${myScore.rank} // LV ${myScore.highestLevel} // ${formatTime(myScore.bestTimeMs)}` : "NO RUN RECORDED"}</strong></div>
                  {myScore ? <button type="button" onClick={resetScore} aria-label="Reset Madrace score"><RotateCcw size={14} /></button> : null}
                </div>
              ) : (
                <a className="madrace-login" href="/api/comments/auth/discord"><LogIn size={15} /> CONNECT DISCORD TO SAVE</a>
              )}

              {loading ? <p className="madrace-ranking-status">SCANNING SCORES...</p> : (
                <ol>
                  {leaderboard.map((entry) => (
                    <li className={entry.discordId === me?.id ? "is-player" : ""} key={entry.discordId}>
                      <b>{String(entry.rank).padStart(2, "0")}</b>
                      <img src={entry.avatarUrl} alt="" loading="lazy" />
                      <span>{entry.username}</span>
                      <em>LV {entry.highestLevel}</em>
                      <small>{formatTime(entry.bestTimeMs)}</small>
                    </li>
                  ))}
                </ol>
              )}
            </aside>
          ) : null}
        </div>

        <footer className="madrace-footer">
          <span className={status.includes("FAILED") || status.includes("REQUIRED") ? "is-error" : ""}>{status || (me ? "DISCORD SAVE LINK ONLINE" : "GUEST RUN // SCORES LOCAL ONLY")}</span>
          <label><Volume2 size={14} /><input type="range" min="0" max="100" value={volume} onChange={updateVolume} /><b>{volume}%</b></label>
          <p>ARROWS / WASD TO DRIVE <i>•</i> ESC TO CLOSE</p>
        </footer>
      </section>
    </div>
  );
}
