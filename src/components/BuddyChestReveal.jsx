import { BuddyCoinIcon as PixelCoin } from "./BuddyCoinIcon";
import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { CHEST_H, CHEST_W, createChestScene } from "../lib/pixelWorld/chest.js";
import { menuSkinVars } from "../lib/pixelWorld/menuSkin.js";
import "../styles/buddy-chest-opening.css";

// El modal del cofre al abrirse (chunk aparte: la escena, la piel de los menus
// y su hoja solo bajan cuando se abre el mercado; BuddyMarketWallet lo precarga).
// La escena del cofre en pixel art (src/lib/pixelWorld/chest.js): cae al
// muelle, tiembla, salta el candado, se abre y escupe las monedas. Al saltar la
// animacion (o con movimiento reducido) va directa al cofre abierto.
function ChestScene({ coins, revealed }) {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  useEffect(() => {
    const scene = createChestScene(canvasRef.current, { coins });
    sceneRef.current = scene;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      scene.skipTo(3);
      scene.draw();
      return undefined;
    }
    let frame = 0, last = performance.now();
    const loop = (now) => {
      scene.step(Math.min(0.05, Math.max(0, (now - last) / 1000)));
      last = now;
      scene.draw();
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [coins]);
  useEffect(() => {
    if (!revealed) return;
    sceneRef.current?.skipTo(2.6);
    sceneRef.current?.draw();
  }, [revealed]);
  return <canvas ref={canvasRef} className="chest-reveal-scene" width={CHEST_W} height={CHEST_H} aria-hidden="true" />;
}

export function ChestReveal({ receipt, open, wallet, onClose, onAnother, opener, walletRef }) {
  const [revealed, setRevealed] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    if (revealed) return;
    const timer = setTimeout(() => setRevealed(true), 1800);
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reduce = () => { if (preference.matches) setRevealed(true); };
    preference.addEventListener("change", reduce);
    return () => { clearTimeout(timer); preference.removeEventListener("change", reduce); };
  }, [revealed]);

  return <Dialog.Root open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="chest-reveal-backdrop motion-backdrop" />
      <Dialog.Content className={`chest-reveal motion-panel motion-from-center ${revealed ? "is-revealed" : "is-opening"}`} style={menuSkinVars()}
        onCloseAutoFocus={(event) => { event.preventDefault(); (opener.current?.disabled ? walletRef.current : opener.current)?.focus(); }}>
        <Dialog.Close className="chest-reveal-close" aria-label="Close chest reward"><X size={16} strokeWidth={3} /></Dialog.Close>
        <div className="chest-reveal-sign">
          <span className="chest-reveal-kicker">SALVAGED FROM THE VOID</span>
          <Dialog.Title className="chest-reveal-title">{revealed ? "A little buried fortune." : "Something’s rattling…"}</Dialog.Title>
        </div>
        <div className="chest-reveal-page">
          <Dialog.Description className="chest-reveal-description">{revealed ? "Another little treasure for your next market day." : "Let’s see what the tide left inside."}</Dialog.Description>
          <div className="chest-reveal-stage" aria-hidden="true">
            <ChestScene coins={receipt.reward} revealed={revealed} />
            <div className="chest-reveal-prize"><PixelCoin /><strong>+{receipt.reward}</strong><span>GOLD {receipt.reward === 1 ? "COIN" : "COINS"}</span></div>
          </div>
          <div className="chest-reveal-result" role="status" aria-live="polite">{revealed ? receipt.message : "Opening your token chest…"}</div>
          <div className="chest-reveal-balance"><PixelCoin /><span>{revealed ? <><b>{wallet.coins}</b> gold in your pouch</> : "Your reward is safely tucked away."}</span></div>
          <div className="chest-reveal-actions">
            {revealed ? <><button type="button" className="chest-reveal-primary" onClick={onClose}>Nice! Keep it <span aria-hidden="true">✓</span></button>{wallet.unopened > 0 ? <button type="button" onClick={onAnother}>Open another <span>{wallet.unopened} left</span></button> : <p>All chests opened. Time to cast another line.</p>}</> : <button type="button" onClick={() => setRevealed(true)}>Skip to reward <span aria-hidden="true">↗</span></button>}
          </div>
          <span className="chest-reveal-note">{revealed ? "Already added to your gold · yours to keep" : "1–10 coins in every chest"}</span>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
