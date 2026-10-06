import { useCallback, useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, Gamepad2, Lock, LogIn, Maximize, Play, RefreshCw, Users, X } from "lucide-react";
import { NZP_GAME_URL, NZP_MAPS, NZP_MAX_PLAYERS, NZP_PASSWORD_MAX, NZP_SESSION_NAME_MAX, normalizeNzpSessionName, nzpHostLaunch, nzpJoinLaunch, nzpMapName } from "../../shared/nzp.mjs";
import { ArcadeTvDetails, ArcadeTvPower } from "./ArcadeTvDetails";
import { TV_CLOSE_MS, useTvPowerOn } from "../hooks/useTvPowerOn";
import "../styles/konami-games.css";
import "../styles/nzp.css";

async function lobbyRequest(body, signal) {
  const response = await fetch("/api/nzp/lobby", {
    method: body ? "POST" : "GET", credentials: "include", signal,
    ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {})
  });
  const result = await response.json();
  if (!response.ok) throw Object.assign(new Error(result.error || "The lobby is unavailable."), { status: response.status, code: result.code });
  return result;
}

const leaveOnExit = (roomId) => fetch("/api/nzp/lobby", {
  method: "POST", credentials: "include", keepalive: true,
  headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "leave", roomId })
}).catch(() => {});

// Poll faster while it matters: 3 s while a session waits for the host's room,
// 5 s while the open-sessions list is on screen, otherwise a 15 s heartbeat.
function refreshDelay(lobby, open) {
  if (lobby?.room && !lobby.room.address) return 3_000;
  if (open && !lobby?.room) return 5_000;
  return 15_000;
}

export function NzpModal({ onBack, onClose }) {
  const [lobby, setLobby] = useState(null);
  const [status, setStatus] = useState("");
  const [authStatus, setAuthStatus] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState(null);
  const [lobbyOpen, setLobbyOpen] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [form, setForm] = useState({ name: null, map: NZP_MAPS[0].id, password: "" });
  const [unlocking, setUnlocking] = useState({ roomId: "", password: "" });
  const [tab, setTab] = useState(null);
  const exitTimer = useRef(null);
  const powered = useTvPowerOn(!exiting, "nzp");
  const frameRef = useRef(null);
  const lobbyRef = useRef(null);
  const gameRef = useRef(null);
  const openRef = useRef(false);
  const refreshRef = useRef(null);
  const joinPasswordRef = useRef("");
  const activeRef = useRef(true);
  const busyRef = useRef(false);
  const revisionRef = useRef(0);
  const room = lobby?.room;
  const host = Boolean(room && room.hostId === lobby.user.id);
  const sessionName = form.name ?? (lobby ? normalizeNzpSessionName(`${lobby.user.username} co-op`) : "");
  const cleanName = normalizeNzpSessionName(sessionName);
  // Joining is the common case, so the list leads whenever there is something to join.
  const view = tab ?? (lobby?.rooms.length ? "join" : "host");

  useEffect(() => () => window.clearTimeout(exitTimer.current), []);
  useEffect(() => { gameRef.current = game; }, [game]);
  useEffect(() => {
    openRef.current = lobbyOpen;
    if (lobbyOpen) refreshRef.current?.();
  }, [lobbyOpen]);

  function exit(callback) {
    if (exitTimer.current !== null) return;
    setExiting(true);
    exitTimer.current = window.setTimeout(callback, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : TV_CLOSE_MS);
  }

  // Co-op settings travel to the wrapper by postMessage when it asks (nzp:ready),
  // so the session password never lands in the iframe URL.
  const launchGame = useCallback((launch = null) => {
    setGame({ key: Date.now(), launch, src: launch ? `${NZP_GAME_URL}?session=${launch.mode}` : NZP_GAME_URL });
    setLobbyOpen(false);
  }, []);

  const accept = useCallback((result) => {
    const previous = lobbyRef.current?.room;
    lobbyRef.current = result;
    setLobby(result);
    setAuthStatus(0);
    if (previous && !result.room) {
      joinPasswordRef.current = "";
      setGame((current) => current?.launch ? null : current);
      setStatus("The session has ended. Join or host another to play together.");
    }
  }, []);

  useEffect(() => {
    activeRef.current = true;
    const controller = new AbortController();
    let timer;
    async function refresh() {
      window.clearTimeout(timer);
      const revision = revisionRef.current;
      try {
        if (!busyRef.current) {
          const current = lobbyRef.current?.room;
          const result = await lobbyRequest(current ? { action: "heartbeat", roomId: current.id } : null, controller.signal);
          if (activeRef.current && revision === revisionRef.current) accept(result);
        }
      } catch (error) {
        if (!activeRef.current || error.name === "AbortError" || revision !== revisionRef.current) return;
        if (error.status === 404 && lobbyRef.current) accept({ ...lobbyRef.current, room: null });
        else {
          setStatus(error.message);
          if (error.status === 401 || error.code === "journal") {
            lobbyRef.current = null;
            setLobby(null);
            setGame((current) => current?.launch ? null : current);
            setAuthStatus(error.status);
          }
        }
      } finally {
        if (activeRef.current) {
          setLoading(false);
          window.clearTimeout(timer);
          timer = window.setTimeout(refresh, refreshDelay(lobbyRef.current, openRef.current));
        }
      }
    }
    refreshRef.current = refresh;
    refresh();
    return () => {
      activeRef.current = false;
      refreshRef.current = null;
      controller.abort();
      window.clearTimeout(timer);
      const current = lobbyRef.current?.room;
      if (current) leaveOnExit(current.id);
    };
  }, [accept]);

  async function action(body) {
    if (busyRef.current) return null;
    busyRef.current = true;
    revisionRef.current += 1;
    setBusy(true);
    setStatus("");
    try {
      const result = await lobbyRequest(body);
      if (!activeRef.current) {
        if (result.room) leaveOnExit(result.room.id);
        return null;
      }
      accept(result);
      if (body.action === "leave") {
        joinPasswordRef.current = "";
        setGame(null);
        setStatus("");
      }
      return result;
    } catch (error) {
      if (activeRef.current) {
        setStatus(error.message);
        if (error.status === 401 || error.code === "journal") setAuthStatus(error.status);
      }
      return null;
    } finally {
      busyRef.current = false;
      if (activeRef.current) setBusy(false);
    }
  }

  // The host's wrapper reports the room once NZ:P's broker assigns it; the
  // session then shows as live in everyone's list.
  const publish = useCallback(async (address) => {
    const current = lobbyRef.current;
    if (!current?.room || current.room.hostId !== current.user.id || current.room.address === address) return;
    revisionRef.current += 1;
    try {
      const result = await lobbyRequest({ action: "publish", roomId: current.room.id, address });
      if (activeRef.current) accept(result);
    } catch (error) {
      if (activeRef.current) setStatus(error.message);
    }
  }, [accept]);

  useEffect(() => {
    function receive(event) {
      const frame = frameRef.current?.contentWindow;
      if (!frame || event.source !== frame || event.origin !== window.location.origin) return;
      const { type, address } = event.data || {};
      if (type === "nzp:ready") frame.postMessage({ type: "nzp:launch", launch: gameRef.current?.launch ?? null }, window.location.origin);
      else if (type === "nzp:listening" && gameRef.current?.launch?.mode === "host") publish(address);
      else if (type === "nzp:network-error") setStatus("NZ:P can't reach its co-op network yet. It retries every 30 seconds.");
    }
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [publish]);

  // A guest who joined while the host was still starting connects as soon as the room is live.
  useEffect(() => {
    if (!room || host || !room.address || game) return;
    const launch = nzpJoinLaunch({ address: room.address, password: joinPasswordRef.current });
    if (launch) launchGame(launch);
  }, [room, host, game, launchGame]);

  async function startSession(event) {
    event.preventDefault();
    const launch = nzpHostLaunch({ name: sessionName, map: form.map, password: form.password });
    if (!launch) return setStatus("Use letters, numbers, spaces and - _ . in the name, and letters, numbers or - _ . in the password.");
    if (await action({ action: "create", name: launch.name, map: launch.map, password: launch.password })) launchGame(launch);
  }

  async function joinSession(event, entry) {
    event.preventDefault();
    const password = entry.locked ? unlocking.password : "";
    if (entry.locked && unlocking.roomId !== entry.id) return setUnlocking({ roomId: entry.id, password: "" });
    joinPasswordRef.current = password;
    const result = await action({ action: "join", roomId: entry.id, password });
    if (result) setUnlocking({ roomId: "", password: "" });
    else joinPasswordRef.current = "";
  }

  function stopGame() {
    if (game?.launch && room) action({ action: "leave", roomId: room.id });
    else setGame(null);
  }

  const hostName = room?.members.find((member) => member.id === room.hostId)?.username;

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) exit(onClose); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="arcade-embed-backdrop motion-backdrop" data-state={exiting ? "closed" : "open"}>
        <Dialog.Content className="arcade-embed-modal arcade-tv nzp-modal motion-panel" data-state={exiting ? "closed" : "open"} onEscapeKeyDown={(event) => { if (lobbyOpen) { event.preventDefault(); setLobbyOpen(false); } else if (game) event.preventDefault(); }}>
          <header>
            <div className="arcade-embed-title"><button type="button" onClick={() => exit(onBack)} aria-label="Back to secret game library"><ArrowLeft size={17} /></button><span><small>JOURNAL REWARD // CARTRIDGE 06</small><Dialog.Title asChild><strong><Gamepad2 size={19} /> NZ:P</strong></Dialog.Title></span></div>
            <div>
              <button type="button" className={lobbyOpen ? "is-active" : ""} onClick={() => setLobbyOpen((value) => !value)} aria-label="Toggle Discord co-op" aria-expanded={lobbyOpen} aria-controls="nzp-lobby-panel" title="Play together"><Users size={17} /></button>
              <button type="button" disabled={!game} onClick={() => frameRef.current?.requestFullscreen?.().catch(() => setStatus("Fullscreen is unavailable in this browser."))} aria-label="Fullscreen NZ:P" title="Fullscreen"><Maximize size={16} /></button>
              <button type="button" onClick={() => exit(onClose)} aria-label="Close NZ:P"><X size={18} /></button>
            </div>
          </header>
          <div className="arcade-embed-screen">
            <Dialog.Description className="nzp-intro">The archive is complete. Survive the next wave alone, or team up with Discord players who have earned this cartridge.</Dialog.Description>
            <section className="nzp-game" aria-label="NZ:P game">
              {powered && (game ? <>
                <iframe ref={frameRef} key={game.key} src={game.src} title="Nazi Zombies: Portable" allow="autoplay; fullscreen; gamepad" allowFullScreen scrolling="no" />
              </> : <div className="nzp-launch">
                <img src="/arcade-library/nzp-cover.svg" alt="NZ:P — Survive together" />
                <h3>One more wave.</h3>
                <p>Launch the official browser edition. A keyboard and mouse are recommended.</p>
                <div className="nzp-launch-actions"><button type="button" disabled={Boolean(room)} onClick={() => launchGame()}><Play size={16} /> Play solo</button><button type="button" onClick={() => setLobbyOpen(true)}><Users size={16} /> Play together</button></div>
                {room ? <small>{host ? "Your session is open." : "You're in a co-op session."} Leave it to play solo.</small> : null}
              </div>)}
            </section>
            <ArcadeTvPower powered={powered} off={exiting} />
            <aside className="nzp-lobby" id="nzp-lobby-panel" aria-label="Discord co-op" hidden={!lobbyOpen}>
              <div className="nzp-lobby-heading"><h3><Users size={18} /> Play together</h3><button type="button" onClick={() => setLobbyOpen(false)} aria-label="Close co-op panel"><X size={16} /></button></div>
              {loading ? <p>Checking your Discord session…</p> : authStatus === 401 ? <>
                <p>Connect Discord to host or join a four-player session. Every player needs a complete Buddy journal.</p>
                <a className="nzp-button" href="/api/comments/auth/discord"><LogIn size={16} /> Connect Discord</a>
              </> : authStatus === 403 ? <p>Your saved journal is not complete yet. Allow Buddy to sync, then reopen this cartridge.</p> : lobby ? <>
                <p className="nzp-identity">Signed in as <strong>{lobby.user.username}</strong></p>
                {room ? <section className="nzp-session" aria-label={host ? "Your session" : "Joined session"}>
                  <h4>{host ? "Your session" : "Joined session"}</h4>
                  <div className="nzp-session-card">
                    <strong>{room.locked ? <Lock size={13} aria-label="Password protected" /> : null}{room.name}</strong>
                    <small>{host ? "" : `Hosted by ${hostName || "the host"} · `}{nzpMapName(room.map)} · {room.members.length} / {NZP_MAX_PLAYERS}</small>
                    <p className={room.address ? "nzp-live" : "nzp-pending"}>{room.address
                      ? host ? "Live. Friends can join from their Open sessions list." : game ? "Live. Your game is connecting." : "Live."
                      : host ? (game ? "Starting your game…" : "Waiting for your game.") : `Waiting for ${hostName || "the host"}'s game to go live…`}</p>
                  </div>
                  <ul className="nzp-members">{room.members.map((member) => <li key={member.id}>{member.username}{member.id === room.hostId ? <small>HOST</small> : null}</li>)}</ul>
                  <button type="button" className="nzp-secondary" disabled={busy} onClick={() => action({ action: "leave", roomId: room.id })}>{host ? "End session" : "Leave session"}</button>
                </section> : <>
                  <div className="nzp-tabs">
                    <button type="button" aria-pressed={view === "join"} onClick={() => setTab("join")}>Open sessions <span>{lobby.rooms.length}</span></button>
                    <button type="button" aria-pressed={view === "host"} onClick={() => setTab("host")}>Host</button>
                  </div>
                  {view === "host" ? <form className="nzp-host" onSubmit={startSession}>
                    <label htmlFor="nzp-session-name">Session name</label>
                    <input id="nzp-session-name" value={sessionName} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} maxLength={NZP_SESSION_NAME_MAX} required autoComplete="off" aria-describedby="nzp-name-hint" />
                    {cleanName !== sessionName.trim() ? <small id="nzp-name-hint">{cleanName ? `Shows as “${cleanName}”: NZ:P names use letters, numbers, spaces and - _ .` : "Use letters or numbers in the name."}</small> : null}
                    <label htmlFor="nzp-session-map">Map</label>
                    <select id="nzp-session-map" value={form.map} onChange={(event) => setForm((value) => ({ ...value, map: event.target.value }))}>
                      {NZP_MAPS.map((map) => <option key={map.id} value={map.id}>{map.name}</option>)}
                    </select>
                    <label htmlFor="nzp-session-password">Password <span>(optional)</span></label>
                    <input id="nzp-session-password" type="password" value={form.password} onChange={(event) => setForm((value) => ({ ...value, password: event.target.value }))} maxLength={NZP_PASSWORD_MAX} pattern="[A-Za-z0-9_.\-]*" autoComplete="new-password" aria-describedby="nzp-password-hint" />
                    <small id="nzp-password-hint">Leave empty for an open session. Letters, numbers, - _ and .</small>
                    <button type="submit" disabled={busy || Boolean(game)}><Play size={15} /> Start session</button>
                    {game ? <small>Stop your solo game to host or join.</small> : null}
                  </form> : <>
                  <div className="nzp-rooms-heading"><p>Live sessions accept players right away. A lock means you need the host's password.</p><button type="button" className="nzp-icon" disabled={busy} onClick={() => refreshRef.current?.()} aria-label="Refresh open sessions" title="Refresh"><RefreshCw size={14} /></button></div>
                  {lobby.rooms.length ? <ul className="nzp-rooms">{lobby.rooms.map((entry) => {
                    const full = entry.players >= NZP_MAX_PLAYERS;
                    const asking = entry.locked && unlocking.roomId === entry.id;
                    return <li key={entry.id}>
                      <form onSubmit={(event) => joinSession(event, entry)}>
                        <span>
                          <strong>{entry.locked ? <Lock size={12} aria-label="Password protected" /> : null}{entry.name}</strong>
                          <small>{entry.host} · {nzpMapName(entry.map)} · {entry.players} / {NZP_MAX_PLAYERS} · <b className={entry.ready ? "nzp-live" : "nzp-pending"}>{entry.ready ? "Live" : "Starting"}</b></small>
                        </span>
                        {asking ? <div className="nzp-unlock">
                          <label className="nzp-intro" htmlFor={`nzp-unlock-${entry.id}`}>Password for {entry.name}</label>
                          <input id={`nzp-unlock-${entry.id}`} type="password" value={unlocking.password} onChange={(event) => setUnlocking({ roomId: entry.id, password: event.target.value })} maxLength={NZP_PASSWORD_MAX} placeholder="Password" required autoFocus autoComplete="off" />
                          <button type="submit" disabled={busy || !unlocking.password}>Join</button>
                          <button type="button" className="nzp-icon" onClick={() => setUnlocking({ roomId: "", password: "" })} aria-label="Cancel"><X size={14} /></button>
                        </div> : <button type="submit" disabled={busy || Boolean(game) || full}>{full ? "Full" : "Join"}</button>}
                      </form>
                    </li>;
                  })}</ul> : <div className="nzp-empty">
                    <p>No open sessions yet. Host one and it shows up here for everyone who unlocked NZ:P.</p>
                    <button type="button" onClick={() => setTab("host")}><Play size={15} /> Host a session</button>
                  </div>}
                  {game ? <small>Stop your solo game to join a session.</small> : null}
                  </>}
                </>}
              </> : <button type="button" disabled={busy} onClick={async () => { try { accept(await lobbyRequest()); setStatus(""); } catch (error) { setStatus(error.message); setAuthStatus(error.status === 401 || error.code === "journal" ? error.status : 0); } }}>Retry connection</button>}
              <p className="nzp-status" role="status">{status}</p>
              <p className="nzp-note">Sessions run on NZ:P's public network, where hosted games are also listed in-game. <a href="https://docs.nzp.gay/server/server-setup" target="_blank" rel="noreferrer">Connection help</a></p>
            </aside>
          </div>
          <ArcadeTvDetails channel="06" powered={powered} off={exiting} />
          <footer><span>{game ? "WASD TO MOVE // MOUSE TO AIM // ESC RELEASES POINTER" : "JOURNAL COMPLETE // SURVIVE THE NEXT WAVE"}</span><a href="https://github.com/nzp-team/nzportable" target="_blank" rel="noreferrer">NZ:P TEAM</a>{game ? <button type="button" className="nzp-stop" disabled={busy || exiting} onClick={stopGame}>{game.launch ? host ? "Stop & end session" : "Stop & leave session" : "Stop game"}</button> : <b>PROGRAM ONLINE</b>}</footer>
        </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
