import { useEffect, useMemo, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { BuddyCoinIcon } from "./BuddyCoinIcon";
import { MARKET_SCHEDULE, MARKET_SPECIALS, MARKET_TIME_ZONE, marketIsOpen, marketStock, nextMarketOpening } from "../../shared/buddy-market.mjs";
import { HOSTS } from "../lib/hostAvatar";
import { BuddyMarketWallet } from "./BuddyChestOpening";
import { MarketItemIcon, MarketStandArt } from "./BuddyMarketArt";
import { useHangingSign } from "../hooks/useHangingSign";
import "../styles/buddy-market.css";

export function useMarketOpen(refreshMs = 15000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const refresh = () => setNow(new Date());
    const timer = setInterval(refresh, refreshMs);
    window.addEventListener("focus", refresh);
    return () => { clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [refreshMs]);
  const day = now.toLocaleDateString("en-US", { timeZone: MARKET_TIME_ZONE });
  const schedule = useMemo(() => ({ stock: marketStock(now), nextOpening: nextMarketOpening(now) }), [day]);
  return { now, open: marketIsOpen(now), ...schedule };
}

const openingFormat = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: MARKET_TIME_ZONE });
function MarketCountdown({ now, nextOpening }) {
  const { signRef, signEvents } = useHangingSign();
  const seconds = Math.max(0, Math.ceil((nextOpening - now) / 1000));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor(seconds % 86400 / 3600);
  const minutes = Math.floor(seconds % 3600 / 60);
  const pad = (number) => String(number).padStart(2, "0");
  return <div ref={signRef} {...signEvents} tabIndex={0} role="group" aria-label="Market opening sign" aria-description={`Opens ${openingFormat.format(nextOpening)} at midnight, New York time. Drag up or down, tap, or press Enter to swing the sign back and forth.`} className="market-countdown market-hanging-sign">
    <span>Opens in</span>
    <strong role="timer" aria-label={`Opens in ${days} days, ${hours} hours, ${minutes} minutes, ${seconds % 60} seconds`}><b>{days}<small>D</small></b><i>:</i><b>{pad(hours)}<small>H</small></b><i>:</i><b>{pad(minutes)}<small>M</small></b><i>:</i><b>{pad(seconds % 60)}<small>S</small></b></strong>
  </div>;
}

// Pedido especial: fuera de la rotacion y a la venta cada dia de mercado. Una
// anfitriona para la puerta (lib/hostAvatar.js), asi que se ve su retrato.
function MarketSpecialOrder({ item, wallet, open, onBuy }) {
  const host = HOSTS.find((entry) => entry.unlockItem === item.id);
  const owned = wallet.owned.includes(item.id);
  const saved = Math.min(wallet.coins, item.price);
  return <section className={`market-special ${owned ? "is-owned" : ""}`} aria-labelledby={`market-special-${item.id}`}>
    <div className="market-special-art">
      {host ? <img src={host.portrait} alt="" width="320" height="400" loading="lazy" decoding="async" /> : null}
      <span className="market-special-tag" aria-hidden="true">SPECIAL ORDER</span>
    </div>
    <div className="market-special-copy">
      <small>FOR YOUR GATE · EVERY MARKET DAY</small>
      <h4 id={`market-special-${item.id}`}>{item.label}<span>new host</span></h4>
      <p>{item.description}</p>
      {owned ? null : <div className="market-special-savings">
        <span className="market-special-meter" style={{ "--fill": saved / item.price }} aria-hidden="true"><i /></span>
        <small>{saved.toLocaleString("en-US")} / {item.price.toLocaleString("en-US")} gold saved</small>
      </div>}
      <div className="market-special-buy">
        <div className="market-price-sign" aria-label={`${item.price} gold`}><BuddyCoinIcon /><strong>{item.price.toLocaleString("en-US")}</strong><small>GOLD</small></div>
        <button type="button" disabled={owned || !open || wallet.coins < item.price} onClick={() => onBuy(item.id)} aria-label={owned ? `${item.label}: owned` : `Buy ${item.label} for ${item.price} coins`}><ShoppingBag size={13} aria-hidden="true" />{owned ? "On your gate roster" : !open ? "Closed" : wallet.coins < item.price ? `Need ${(item.price - wallet.coins).toLocaleString("en-US")}` : "Buy"}</button>
      </div>
    </div>
  </section>;
}

// Puesto del footer: un boton invisible encima del puesto que dibuja
// FooterWorld (abierto o con las contraventanas bajadas); al pasar por encima
// se ilumina el contorno y sale el cartel.
export function BuddyMarketStand({ open, onClick, onHoverChange }) {
  const hover = (value) => () => onHoverChange?.(value);
  return <button type="button" className={`buddy-market-stand ${open ? "is-open" : "is-closed"}`} onClick={onClick} onPointerEnter={hover(true)} onPointerLeave={hover(false)} onFocus={hover(true)} onBlur={hover(false)} aria-label={`Woodland market: ${open ? "open today" : "closed"}. ${MARKET_SCHEDULE}. Browse the stand.`}>
    <span className="market-stand-sign" aria-hidden="true">Woodland Market</span>
  </button>;
}

export function BuddyMarket({ buddy, onNavigate }) {
  const { now, open, stock, nextOpening } = useMarketOpen(1000);
  const [message, setMessage] = useState("");
  const wallet = buddy.adventure.market;
  return <div className="buddy-market">
    <div className="market-welcome">
      <div className="market-diorama"><MarketStandArt open={open} items={stock} /></div>
      <div className="market-welcome-copy"><span className={`market-hours ${open ? "is-open" : ""}`}><i />{open ? "OPEN TODAY" : "GONE FORAGING"}</span><h3>Good things.<br />Tiny sizes.</h3><p>Handpicked comforts for your little companion and their corner of the world.</p><strong>{MARKET_SCHEDULE}</strong><small>Open all day. Browse anytime.</small></div>
      <BuddyMarketWallet adventure={buddy.adventure} />
    </div>
    {!open ? <MarketCountdown now={now} nextOpening={nextOpening} /> : null}
    <div className="market-catalog-heading"><div><span className="buddy-modal-kicker">THREE FINDS · EACH MARKET DAY</span><h3>{open ? "Today’s little treasures" : "Next market’s little treasures"}</h3></div><span className="market-stock-count">3 pieces · rotating stock</span></div>
    <p className="market-feedback" role="status">{message || (open ? "A little something to make Buddy’s day. Each piece is yours to keep. New stock each market day." : "The shutters are down. Save your coins for Wednesday or Saturday.")}</p>
    <section className="market-stall" aria-label="Woodland goods on display">
    <div className="market-stall-awning" aria-hidden="true"><span>WOODLAND GOODS</span><i className="market-stall-lantern is-left" /><i className="market-stall-lantern is-right" /></div>
    <div className="market-catalog">{stock.map((item, index) => {
      const owned = wallet.owned.includes(item.id);
      return <article className={`market-product ${owned ? "is-owned" : ""}`} key={item.id}>
        <div className="market-product-art"><span>No. {String(index + 1).padStart(2, "0")}</span><MarketItemIcon id={item.id} /><i className={`market-display-plinth is-${item.category}`} aria-hidden="true" /><div className="market-price-sign" aria-label={`${item.price} gold`}><BuddyCoinIcon /><strong>{item.price}</strong><small>GOLD</small></div></div>
        <div className="market-product-copy"><small>{item.category === "decor" ? "FOR YOUR ROOM" : "FOR YOUR BUDDY"}</small><h4>{item.label}</h4><p>{item.description}</p><div><span className="market-product-ownership">{owned ? "In your collection" : "One to keep"}</span><button type="button" disabled={owned || !open || wallet.coins < item.price} onClick={() => setMessage(buddy.adventure.buyItem(item.id))} aria-label={owned ? `${item.label}: owned` : `Buy ${item.label} for ${item.price} coins`}><ShoppingBag size={13} aria-hidden="true" />{owned ? "Owned" : !open ? "Closed" : wallet.coins < item.price ? `Need ${item.price - wallet.coins}` : "Buy"}</button></div></div>
      </article>;
    })}</div>
    <div className="market-stall-base" aria-hidden="true"><span>SMALL WONDERS · FAIR TRADES</span></div>
    </section>
    {MARKET_SPECIALS.map((item) => <MarketSpecialOrder key={item.id} item={item} wallet={wallet} open={open} onBuy={(id) => setMessage(buddy.adventure.buyItem(id))} />)}
    <div className="market-footer"><span>Already found your favorite?</span><button type="button" onClick={() => onNavigate("inventory")}>Dress Buddy ↗</button><button type="button" onClick={() => onNavigate("room")}>Decorate the room ↗</button></div>
  </div>;
}
