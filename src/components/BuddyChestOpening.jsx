import { BuddyCoinIcon as PixelCoin } from "./BuddyCoinIcon";
import { Suspense, useEffect, useRef, useState } from "react";
import { CHEST_MIN_COINS, CHEST_MAX_COINS, GIANT_CHEST_MIN_COINS, GIANT_CHEST_MAX_COINS } from "../../shared/buddy-market.mjs";
import { useHangingSign } from "../hooks/useHangingSign";
import { useModalPresence } from "../hooks/useModalPresence";
import { ChunkBoundary, lazyChunk } from "../lib/chunkRecovery";

// El modal del cofre (escena de pixel, piel y hoja) va en su propio chunk.
const ChestReveal = lazyChunk(() => import("./BuddyChestReveal"), (module) => module.ChestReveal);

export function BuddyMarketWallet({ adventure }) {
  const [receipt, setReceipt] = useState(null);
  const [message, setMessage] = useState("");
  const busy = useRef(false);
  const sequence = useRef(0);
  const opener = useRef(null);
  const { signRef: walletRef, signEvents } = useHangingSign();
  // (giant: el cofre gigante del Leviatan o del Kraken)
  function openChest(giant = false) {
    if (busy.current) return;
    busy.current = true;
    const result = giant ? adventure.openGiantChest() : adventure.openChest();
    setMessage(result.message);
    if (result.reward) setReceipt({ ...result, id: ++sequence.current });
    else busy.current = false;
  }
  const close = () => { setReceipt(null); busy.current = false; };
  // Keeps the reveal up while it fades out after closing.
  const reveal = useModalPresence(receipt);
  // Con el mercado abierto, el cofre ya se baja: al pulsar se pinta sin esperar.
  useEffect(() => { ChestReveal.preload(); }, []);
  return <>
    <section ref={walletRef} {...signEvents} tabIndex={0} className="market-wallet market-hanging-sign" aria-label="Gold and treasure chests" aria-description="Drag up or down, tap, or press Enter to swing the sign back and forth.">
      <div className="market-wallet-total"><PixelCoin /><strong>{adventure.market.coins}<small>GOLD</small></strong></div>
      <button ref={opener} type="button" disabled={!adventure.market.unopened || !!receipt} onClick={() => openChest()}>Open chest <span aria-hidden="true">↗</span></button>
      <small>{adventure.market.unopened} unopened {adventure.market.unopened === 1 ? "chest" : "chests"} · {CHEST_MIN_COINS}–{CHEST_MAX_COINS} gold each</small>
      {adventure.market.giantUnopened > 0 ? <>
        <button type="button" className="market-wallet-giant" disabled={!!receipt} onClick={() => openChest(true)}>Open giant chest <span aria-hidden="true">↗</span></button>
        <small>{adventure.market.giantUnopened} giant {adventure.market.giantUnopened === 1 ? "chest" : "chests"} from the deep · {GIANT_CHEST_MIN_COINS}–{GIANT_CHEST_MAX_COINS} gold</small>
      </> : null}
      <small role="status">{receipt ? "Your chest is opening…" : message || (!adventure.market.unopened ? "Fish up a Token Chest to find more gold." : "Open them here, even when the shop is closed.")}</small>
    </section>
    {reveal.item ? <ChunkBoundary><Suspense fallback={null}><ChestReveal key={reveal.item.id} receipt={reveal.item} open={reveal.state === "open"} wallet={adventure.market} opener={opener} walletRef={walletRef} onClose={close} onAnother={() => { if (sequence.current !== reveal.item.id) return; busy.current = false; openChest(Boolean(reveal.item.giant) && adventure.market.giantUnopened > 0); }} /></Suspense></ChunkBoundary> : null}
  </>;
}
