import { useEffect, useState } from "react";
import { Coins, ShoppingBag } from "lucide-react";
import { MARKET_SCHEDULE, marketIsOpen, marketStock } from "../../shared/buddy-market.mjs";
import { MarketItemIcon, MarketStandArt } from "./BuddyMarketArt";
import "../styles/buddy-market.css";

function useMarketOpen() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const refresh = () => setNow(new Date());
    const timer = setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    return () => { clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, []);
  return { open: marketIsOpen(now), stock: marketStock(now) };
}

export function BuddyMarketStand({ onClick }) {
  const { open } = useMarketOpen();
  return <button type="button" className={`buddy-market-stand ${open ? "is-open" : "is-closed"}`} onClick={onClick} aria-label={`Woodland market: ${open ? "open today" : "closed"}. ${MARKET_SCHEDULE}. Browse the stand.`}>
    <MarketStandArt open={open} />
    <span className="market-stand-tip">{open ? "The stand is open!" : "Back Wednesday & Saturday"}<small>Browse woodland goods ↗</small></span>
  </button>;
}

export function BuddyMarket({ buddy, onNavigate }) {
  const { open, stock } = useMarketOpen();
  const [message, setMessage] = useState("");
  const wallet = buddy.adventure.market;
  return <div className="buddy-market">
    <div className="market-welcome">
      <div className="market-diorama"><MarketStandArt open={open} /></div>
      <div className="market-welcome-copy"><span className={`market-hours ${open ? "is-open" : ""}`}><i />{open ? "OPEN TODAY" : "GONE FORAGING"}</span><h3>Good things.<br />Tiny sizes.</h3><p>Handpicked comforts for your little companion and their corner of the world.</p><strong>{MARKET_SCHEDULE}</strong><small>Open all day. Browse anytime.</small></div>
      <div className="market-wallet"><Coins size={22} aria-hidden="true" /><strong>{wallet.coins}<small>GOLD</small></strong><p>Treasure from the deep,<br />comforts for the shore.</p><button type="button" onClick={() => onNavigate("journal")}>Open chests <span>↗</span></button><small>{wallet.unopened} waiting in your journal</small></div>
    </div>
    <div className="market-catalog-heading"><div><span className="buddy-modal-kicker">THREE FINDS · EACH MARKET DAY</span><h3>{open ? "Today’s little treasures" : "Next market’s little treasures"}</h3></div><span className="market-stock-count">3 pieces · rotating stock</span></div>
    <p className="market-feedback" role="status">{message || (open ? "A little something to make Buddy’s day. Each piece is yours to keep. New stock each market day." : "The shutters are down. Save your coins for Wednesday or Saturday.")}</p>
    <div className="market-catalog">{stock.map((item, index) => {
      const owned = wallet.owned.includes(item.id);
      return <article className={`market-product ${owned ? "is-owned" : ""}`} key={item.id}>
        <div className="market-product-art"><span>No. {String(index + 1).padStart(2, "0")}</span><MarketItemIcon id={item.id} /><small>{item.category === "decor" ? "FOR YOUR ROOM" : "FOR YOUR BUDDY"}</small></div>
        <div className="market-product-copy"><h4>{item.label}</h4><p>{item.description}</p><div><span><Coins size={14} aria-hidden="true" />{item.price}</span><button type="button" disabled={owned || !open || wallet.coins < item.price} onClick={() => setMessage(buddy.adventure.buyItem(item.id))} aria-label={owned ? `${item.label}: owned` : `Buy ${item.label} for ${item.price} coins`}><ShoppingBag size={13} aria-hidden="true" />{owned ? "Owned" : !open ? "Closed" : wallet.coins < item.price ? `Need ${item.price - wallet.coins}` : "Buy"}</button></div></div>
      </article>;
    })}</div>
    <div className="market-footer"><span>Already found your favorite?</span><button type="button" onClick={() => onNavigate("inventory")}>Dress Buddy ↗</button><button type="button" onClick={() => onNavigate("room")}>Decorate the room ↗</button></div>
  </div>;
}
