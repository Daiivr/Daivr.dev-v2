import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, Gamepad2, X } from "lucide-react";
import { ArcadeTvDetails, ArcadeTvPower } from "./ArcadeTvDetails";
import { TV_CLOSE_MS, useTvPowerOn } from "../hooks/useTvPowerOn";
import "../styles/konami-games.css";
import "../styles/nzp.css";

const NZP_GAME_URL = "/nzp/index.html";

// The cartridge boots straight into NZ:P's own menus: Solo, or Cooperative to
// host a game (server name, password, map) or browse open ones.
export function NzpModal({ onBack, onClose }) {
  const [exiting, setExiting] = useState(false);
  const [notice, setNotice] = useState("");
  const exitTimer = useRef(null);
  const frameRef = useRef(null);
  const powered = useTvPowerOn(!exiting, "nzp");

  useEffect(() => () => window.clearTimeout(exitTimer.current), []);

  function exit(callback) {
    if (exitTimer.current !== null) return;
    setExiting(true);
    exitTimer.current = window.setTimeout(callback, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : TV_CLOSE_MS);
  }

  function fullscreen() {
    const frame = frameRef.current;
    setNotice("");
    if (!frame?.requestFullscreen) return setNotice("Full screen is unavailable in this browser.");
    // Hand the keyboard back to the game once the button has done its job.
    frame.requestFullscreen().then(() => frame.contentWindow?.focus(), () => setNotice("Full screen is unavailable in this browser."));
  }

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) exit(onClose); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="arcade-embed-backdrop motion-backdrop" data-state={exiting ? "closed" : "open"}>
        <Dialog.Content className="arcade-embed-modal arcade-tv nzp-modal motion-panel" data-state={exiting ? "closed" : "open"} onEscapeKeyDown={(event) => event.preventDefault()}>
          <header>
            <div className="arcade-embed-title"><button type="button" onClick={() => exit(onBack)} aria-label="Back to secret game library"><ArrowLeft size={17} /></button><span><small>JOURNAL REWARD // CARTRIDGE 06</small><Dialog.Title asChild><strong><Gamepad2 size={19} /> NZ:P</strong></Dialog.Title></span></div>
            <div>
              <button type="button" onClick={() => exit(onClose)} aria-label="Close NZ:P"><X size={18} /></button>
            </div>
          </header>
          <div className="arcade-embed-screen">
            <Dialog.Description className="nzp-intro">The archive is complete. NZ:P opens in its own main menu: play Solo, or choose Cooperative to host or join a game with friends.</Dialog.Description>
            <section className="nzp-game" aria-label="NZ:P game">
              {powered ? <iframe ref={frameRef} src={NZP_GAME_URL} title="Nazi Zombies: Portable" allow="autoplay; fullscreen; gamepad" allowFullScreen scrolling="no" /> : null}
            </section>
            <ArcadeTvPower powered={powered} off={exiting} />
          </div>
          <ArcadeTvDetails channel="06" powered={powered} off={exiting} onFullscreen={fullscreen} />
          <footer><span>WASD TO MOVE // MOUSE TO AIM // ESC RELEASES POINTER</span><a href="https://github.com/nzp-team/nzportable" target="_blank" rel="noreferrer">NZ:P TEAM</a>{notice ? <em role="status">{notice}</em> : <b>PROGRAM ONLINE</b>}</footer>
        </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
