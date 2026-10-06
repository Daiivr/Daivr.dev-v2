import { useCallback, useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, Gamepad2, LogIn, Maximize, Play, Users, X } from "lucide-react";
import { NZP_GAME_URL, NZP_MAX_PLAYERS, nzpJoinUrl } from "../../shared/nzp.mjs";
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
  if (!response.ok) throw Object.assign(new Error(result.error || "The lobby is unavailable."), { status: response.status });
  return result;
}

export function NzpModal({ onBack, onClose }) {
  const [lobby, setLobby] = useState(null);
  const [status, setStatus] = useState("");
  const [authStatus, setAuthStatus] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState("");
  const [game, setGame] = useState(null);
  const [lobbyOpen, setLobbyOpen] = useState(false);
  const [exiting, setExiting] = useState(false);
  const exitTimer = useRef(null);
  const powered = useTvPowerOn(!exiting, "nzp");
  const frameRef = useRef(null);
  const lobbyRef = useRef(null);
  const activeRef = useRef(true);
  const busyRef = useRef(false);
  const revisionRef = useRef(0);
  const room = lobby?.room;
  const host = Boolean(room && room.hostId === lobby.user.id);

  useEffect(() => () => window.clearTimeout(exitTimer.current), []);

  function exit(callback) {
    if (exitTimer.current !== null) return;
    setExiting(true);
    exitTimer.current = window.setTimeout(callback, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : TV_CLOSE_MS);
  }

  function launchGame(src, mode) {
    setGame({ src, mode });
    setLobbyOpen(false);
  }

  const accept = useCallback((result) => {
    const previous = lobbyRef.current?.room;
    lobbyRef.current = result;
    setLobby(result);
    setAuthStatus(0);
    if (previous && !result.room) {
      setGame((current) => current?.mode === "coop" ? null : current);
      setStatus("The lobby has closed. Join or create another to play together.");
    }
  }, []);

  useEffect(() => {
    activeRef.current = true;
    const controller = new AbortController();
    let timer;
    async function refresh() {
      const revision = revisionRef.current;
      try {
        if (!busyRef.current) {
          const current = lobbyRef.current?.room;
          const result = await lobbyRequest(current ? { action: "heartbeat", roomId: current.id } : null, controller.signal);
          if (activeRef.current && revision === revisionRef.current) accept(result);
        }
      } catch (error) {
        if (!activeRef.current || error.name === "AbortError" || revision !== revisionRef.current) return;
        setStatus(error.message);
        if ([401, 403, 404].includes(error.status)) {
          lobbyRef.current = null;
          setLobby(null);
          setGame((current) => current?.mode === "coop" ? null : current);
          setAuthStatus(error.status === 404 ? 0 : error.status);
        }
      } finally {
        if (activeRef.current) {
          setLoading(false);
          timer = window.setTimeout(refresh, 15_000);
        }
      }
    }
    refresh();
    return () => {
      activeRef.current = false;
      controller.abort();
      window.clearTimeout(timer);
      const current = lobbyRef.current?.room;
      if (current) fetch("/api/nzp/lobby", {
        method: "POST", credentials: "include", keepalive: true,
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "leave", roomId: current.id })
      }).catch(() => {});
    };
  }, [accept]);

  async function action(body) {
    if (busyRef.current) return;
    busyRef.current = true;
    revisionRef.current += 1;
    setBusy(true);
    setStatus("");
    try {
      const result = await lobbyRequest(body);
      if (!activeRef.current) {
        if (result.room) fetch("/api/nzp/lobby", { method: "POST", credentials: "include", keepalive: true, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "leave", roomId: result.room.id }) }).catch(() => {});
        return;
      }
      accept(result);
      if (body.action === "leave") { setGame(null); setStatus(""); setAddress(""); }
      if (body.action === "publish") setStatus("Room published. Your teammates can now join the game.");
    } catch (error) {
      if (activeRef.current) {
        setStatus(error.message);
        if ([401, 403].includes(error.status)) setAuthStatus(error.status);
      }
    } finally {
      busyRef.current = false;
      if (activeRef.current) setBusy(false);
    }
  }

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
                <iframe ref={frameRef} key={game.src} src={game.src} title="Nazi Zombies: Portable" allow="autoplay; fullscreen; gamepad" allowFullScreen scrolling="no" />
              </> : <div className="nzp-launch">
                <img src="/arcade-library/nzp-cover.svg" alt="NZ:P — Survive together" />
                <h3>One more wave.</h3>
                <p>Launch the official browser edition. A keyboard and mouse are recommended.</p>
                <div className="nzp-launch-actions"><button type="button" disabled={Boolean(room)} onClick={() => launchGame(NZP_GAME_URL, "solo")}><Play size={16} /> Play solo</button><button type="button" onClick={() => setLobbyOpen(true)}><Users size={16} /> Play together</button></div>
                {room ? <small>Leave your co-op lobby to play solo.</small> : null}
              </div>)}
            </section>
            <ArcadeTvPower powered={powered} off={exiting} />
            <aside className="nzp-lobby" id="nzp-lobby-panel" aria-label="Discord co-op" hidden={!lobbyOpen}>
              <div className="nzp-lobby-heading"><h3><Users size={18} /> Play together</h3><button type="button" onClick={() => setLobbyOpen(false)} aria-label="Close co-op panel"><X size={16} /></button></div>
              {loading ? <p>Checking your Discord session…</p> : authStatus === 401 ? <>
                <p>Connect Discord to host or join a four-player lobby. Every player needs a complete Buddy journal.</p>
                <a className="nzp-button" href="/api/comments/auth/discord"><LogIn size={16} /> Connect Discord</a>
              </> : authStatus === 403 ? <p>Your saved journal is not complete yet. Allow Buddy to sync, then reopen this cartridge.</p> : lobby ? <>
                <p className="nzp-identity">Signed in as <strong>{lobby.user.username}</strong></p>
                {room ? <>
                  <div className="nzp-room-heading"><strong>{host ? "Your lobby" : "Co-op lobby"}</strong><span>{room.members.length} / {NZP_MAX_PLAYERS}</span></div>
                  <ul className="nzp-members">{room.members.map((member) => <li key={member.id}>{member.username}{member.id === room.hostId ? <small>HOST</small> : null}</li>)}</ul>
                  {host ? <>
                    <ol className="nzp-steps"><li>Launch NZ:P, then choose <strong>Cooperative</strong> and create a game.</li><li>Find its relay room number in the game console (the <strong>~</strong> key) or the <a href="https://master.frag-net.com:27950/NZP-REBOOT-WEB" target="_blank" rel="noreferrer">NZ:P server list</a>.</li><li>Publish that number below. Keep your game open while teammates join.</li></ol>
                    <button type="button" disabled={Boolean(game)} onClick={() => launchGame(NZP_GAME_URL, "coop")}><Play size={15} /> Launch host game</button>
                    <form onSubmit={(event) => { event.preventDefault(); action({ action: "publish", roomId: room.id, address }); }}>
                      <label htmlFor="nzp-room-number">NZ:P relay room number</label>
                      <input id="nzp-room-number" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="/12345" maxLength={13} required pattern="/?[0-9]{1,12}" />
                      <button type="submit" disabled={busy || !address.trim()}>Publish room</button>
                    </form>
                  </> : <>
                    <p>{room.address ? `The host is ready in ${room.address}.` : "Waiting for the host to start NZ:P and publish the game room."}</p>
                    <button type="button" disabled={busy || !room.address} onClick={() => { const src = nzpJoinUrl(room.address); if (src) launchGame(src, "coop"); }}><Play size={15} /> Join game</button>
                  </>}
                  {host && room.address ? <p>Published room: <strong>{room.address}</strong></p> : null}
                  <button type="button" className="nzp-secondary" disabled={busy} onClick={() => action({ action: "leave", roomId: room.id })}>{host ? "Close lobby" : "Leave lobby"}</button>
                </> : <>
                  <button type="button" disabled={busy || Boolean(game)} onClick={() => action({ action: "create" })}>Host a lobby</button>
                  {game ? <p>Stop your solo game before joining co-op.</p> : null}
                  <h4>Open lobbies</h4>
                  {lobby.rooms.length ? <ul className="nzp-rooms">{lobby.rooms.map((entry) => <li key={entry.id}><span><strong>{entry.host}</strong><small>{entry.players} / {NZP_MAX_PLAYERS} · {entry.ready ? "Game ready" : "Setting up"}</small></span><button type="button" disabled={busy || Boolean(game) || entry.players >= NZP_MAX_PLAYERS} onClick={() => action({ action: "join", roomId: entry.id })}>Join lobby</button></li>)}</ul> : <p>No open lobbies yet. Host one to get started.</p>}
                </>}
              </> : <button type="button" disabled={busy} onClick={async () => { try { accept(await lobbyRequest()); setStatus(""); } catch (error) { setStatus(error.message); setAuthStatus(error.status || 0); } }}>Retry connection</button>}
              <p className="nzp-status" role="status">{status}</p>
              <p>Co-op uses NZ:P's public network. <a href="https://docs.nzp.gay/server/server-setup" target="_blank" rel="noreferrer">Connection help</a></p>
            </aside>
          </div>
          <ArcadeTvDetails channel="06" powered={powered} off={exiting} />
          <footer><span>{game ? "WASD TO MOVE // MOUSE TO AIM // ESC RELEASES POINTER" : "JOURNAL COMPLETE // SURVIVE THE NEXT WAVE"}</span><a href="https://github.com/nzp-team/nzportable" target="_blank" rel="noreferrer">NZ:P TEAM</a>{game ? <button type="button" className="nzp-stop" disabled={busy || exiting} onClick={() => { if (game.mode === "coop" && room) action({ action: "leave", roomId: room.id }); else setGame(null); }}>{game.mode === "coop" ? "Stop & leave lobby" : "Stop game"}</button> : <b>PROGRAM ONLINE</b>}</footer>
        </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
