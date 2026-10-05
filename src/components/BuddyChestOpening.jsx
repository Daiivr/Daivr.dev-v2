import { BuddyCoinIcon as PixelCoin } from "./BuddyCoinIcon";
import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { CHEST_MIN_COINS, CHEST_MAX_COINS } from "../../shared/buddy-market.mjs";
import "../styles/buddy-chest-opening.css";
import { useHangingSign } from "../hooks/useHangingSign";
import { useModalPresence } from "../hooks/useModalPresence";

function TreasureChest() {
  return <svg viewBox="0 0 96 80" className="chest-reveal-chest" aria-hidden="true" shapeRendering="crispEdges">
    <ellipse cx="48" cy="74" rx="43" ry="4" fill="#000" opacity=".35" />
    <path d="M9 38h78v31h-5v5H14v-5H9z" fill="#37271e" />
    <path d="M13 41h70v26h-5v4H18v-4h-5z" fill="#8d5831" />
    <path d="M14 44h68v3H14m0 12h68v2H14" fill="#b78143" />
    <path d="M15 51h66v2H15m4 15h58v2H19" fill="#593c27" />
    <path d="M20 42h7v29h-7m49-29h7v29h-7" fill="#ddb260" />
    <path d="M21 43h2v27h-2m47-27h2v27h-2" fill="#ffe2a1" />
    <path d="M33 48h12v1H33m20 9h11v1H53m-21 5h9v1h-9" fill="#d49b58" />
    <path d="M13 37h70v7H13z" fill="#1e2118" />
    <path className="chest-reveal-seam" d="M15 39h66v3H15z" fill="#ffe8a1" />
    <g className="chest-reveal-lid">
      <path d="M9 38V24h5v-7h8v-5h52v5h8v7h5v14z" fill="#3e2c21" />
      <path d="M13 35V25h5v-6h7v-3h46v3h7v6h5v10z" fill="#a56b39" />
      <path d="M17 27h62v3H17m7-11h48v3H24" fill="#c99550" />
      <path d="M25 16h6v20h-8V22h2m40-6h6v6h2v14h-8" fill="#dfb564" />
      <path d="M26 17h2v18h-2m38-18h2v18h-2" fill="#fff0b2" />
      <path d="M11 34h74v6H11z" fill="#d5a557" /><path d="M13 34h70v2H13z" fill="#ffe1a1" />
      <path d="M41 31h14v17H41z" fill="#563b24" /><path d="M43 32h10v13H43z" fill="#eac16c" />
      <path d="M46 35h4v4h-1v3h-2v-3h-1z" fill="#493722" />
    </g>
    <path d="M21 62h3v3h-3m48-3h3v3h-3" fill="#71562e" />
  </svg>;
}

const SPARKS = Array.from({ length: 14 }, (_, i) => ({
  "--spark-x": `${Math.cos(i * Math.PI * 2 / 14) * (85 + i % 3 * 18)}px`,
  "--spark-y": `${Math.sin(i * Math.PI * 2 / 14) * 90 - 40}px`,
  "--spark-delay": `${1000 + i % 4 * 65}ms`
}));

function ChestReveal({ receipt, open, wallet, onClose, onAnother, opener, walletRef }) {
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
      <Dialog.Content className={`chest-reveal motion-panel motion-from-center ${revealed ? "is-revealed" : "is-opening"}`}
        onCloseAutoFocus={(event) => { event.preventDefault(); (opener.current?.disabled ? walletRef.current : opener.current)?.focus(); }}>
        <Dialog.Close className="chest-reveal-close" aria-label="Close chest reward"><X size={18} /></Dialog.Close>
        <span className="chest-reveal-kicker">SALVAGED FROM THE VOID</span>
        <Dialog.Title className="chest-reveal-title">{revealed ? "A little buried fortune." : "Something’s rattling…"}</Dialog.Title>
        <Dialog.Description className="chest-reveal-description">{revealed ? "Another little treasure for your next market day." : "Let’s see what the tide left inside."}</Dialog.Description>
        <div className="chest-reveal-stage" aria-hidden="true">
          <div className="chest-reveal-halo" /><div className="chest-reveal-rays" />
          <div className="chest-reveal-sparks">{SPARKS.map((style, i) => <i key={i} style={style} />)}</div>
          <div className="chest-reveal-flying-coins">{[-1, 0, 1].map((side) => <span key={side} style={{ "--coin-x": `${side * 76}px`, "--coin-rotation": `${side * 32}deg` }}><PixelCoin /></span>)}</div>
          <div className="chest-reveal-prize"><PixelCoin /><strong>+{receipt.reward}</strong><span>GOLD {receipt.reward === 1 ? "COIN" : "COINS"}</span></div>
          <div className="chest-reveal-box"><TreasureChest /></div>
          <div className="chest-reveal-table">
            <i className="chest-table-leg is-left" /><i className="chest-table-leg is-right" />
            <span className="chest-table-stretcher" />
            <span className="chest-table-top" /><span className="chest-table-apron" />
          </div>
        </div>
        <div className="chest-reveal-result" role="status" aria-live="polite">{revealed ? receipt.message : "Opening your token chest…"}</div>
        <div className="chest-reveal-balance"><PixelCoin /><span>{revealed ? <><b>{wallet.coins}</b> gold in your pouch</> : "Your reward is safely tucked away."}</span></div>
        <div className="chest-reveal-actions">
          {revealed ? <><button type="button" className="chest-reveal-primary" onClick={onClose}>Nice! Keep it <span aria-hidden="true">✓</span></button>{wallet.unopened > 0 ? <button type="button" onClick={onAnother}>Open another <span>{wallet.unopened} left</span></button> : <p>All chests opened. Time to cast another line.</p>}</> : <button type="button" onClick={() => setRevealed(true)}>Skip to reward <span aria-hidden="true">↗</span></button>}
        </div>
        <span className="chest-reveal-note">{revealed ? "Already added to your gold · yours to keep" : "1–10 coins in every chest"}</span>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}

export function BuddyMarketWallet({ adventure }) {
  const [receipt, setReceipt] = useState(null);
  const [message, setMessage] = useState("");
  const busy = useRef(false);
  const sequence = useRef(0);
  const opener = useRef(null);
  const { signRef: walletRef, signEvents } = useHangingSign();
  function openChest() {
    if (busy.current) return;
    busy.current = true;
    const result = adventure.openChest();
    setMessage(result.message);
    if (result.reward) setReceipt({ ...result, id: ++sequence.current });
    else busy.current = false;
  }
  const close = () => { setReceipt(null); busy.current = false; };
  // Keeps the reveal up while it fades out after closing.
  const reveal = useModalPresence(receipt);
  return <>
    <section ref={walletRef} {...signEvents} tabIndex={0} className="market-wallet market-hanging-sign" aria-label="Gold and treasure chests" aria-description="Drag up or down, tap, or press Enter to swing the sign back and forth.">
      <div className="market-wallet-total"><PixelCoin /><strong>{adventure.market.coins}<small>GOLD</small></strong></div>
      <button ref={opener} type="button" disabled={!adventure.market.unopened || !!receipt} onClick={openChest}>Open chest <span aria-hidden="true">↗</span></button>
      <small>{adventure.market.unopened} unopened {adventure.market.unopened === 1 ? "chest" : "chests"} · {CHEST_MIN_COINS}–{CHEST_MAX_COINS} gold each</small>
      <small role="status">{receipt ? "Your chest is opening…" : message || (!adventure.market.unopened ? "Fish up a Token Chest to find more gold." : "Open them here, even when the shop is closed.")}</small>
    </section>
    {reveal.item ? <ChestReveal key={reveal.item.id} receipt={reveal.item} open={reveal.state === "open"} wallet={adventure.market} opener={opener} walletRef={walletRef} onClose={close} onAnother={() => { if (sequence.current !== reveal.item.id) return; busy.current = false; openChest(); }} /> : null}
  </>;
}
