import { useEffect, useMemo, useRef, useState } from "react";
import { Coins, ShoppingBag } from "lucide-react";
import { MARKET_TACKLE } from "../../shared/buddy-market.mjs";
import { catchPrice, fishermanVisit, nextFishermanVisit } from "../../shared/buddy-fisherman.mjs";
import { BuddyCoinIcon } from "./BuddyCoinIcon";
import { BuddyMarketWallet } from "./BuddyChestOpening";
import { MarketItemIcon } from "./BuddyMarketArt";
import { BuddyCollectibleIcon } from "./BuddyCollectibleIcon";
import { FISHER_SPRITES } from "../lib/pixelWorld/fisherman";
import { flipped } from "../lib/pixelWorld/core";
import "../styles/buddy-market.css";

// El reloj del pescador: si esta ahora (y hasta cuando) o cuando vuelve.
export function useFisherman(refreshMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), refreshMs);
    return () => clearInterval(timer);
  }, [refreshMs]);
  return { now, visit: fishermanVisit(now), next: nextFishermanVisit(now) };
}
const timeFormat = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
const dayFormat = new Intl.DateTimeFormat(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" });
export function fishermanWhen({ visit, next }) {
  if (visit) return `Here until ${timeFormat.format(visit.to)}`;
  if (!next) return "On the road";
  const sameDay = new Date(next.from).toDateString() === new Date().toDateString();
  return `Next stop: around ${(sameDay ? timeFormat : dayFormat).format(next.from)}`;
}

// El retrato: el pescador junto a su carretilla, sobre un trozo de prado.
function FisherPortrait() {
  const ref = useRef(null);
  useEffect(() => {
    const g = ref.current?.getContext("2d");
    if (!g) return;
    const S = FISHER_SPRITES(), man = flipped(S.stand);
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, 76, 42);
    for (let x = 0; x < 76; x++) { g.fillStyle = x % 5 ? "#4a8a3a" : "#5aa043"; g.fillRect(x, 38, 1, 2); g.fillStyle = "#7a5a32"; g.fillRect(x, 40, 1, 2); }
    g.drawImage(S.cart, 30, 39 - S.cart.height);
    g.drawImage(man, 6, 39 - man.height);
  }, []);
  return <canvas ref={ref} className="fisher-portrait" width="76" height="42" aria-hidden="true" />;
}

// La estanteria de aparejos del pescador (cañas y señuelos para el valle).
function FisherTackle({ wallet, here, onBuy }) {
  return <section className="market-tackle" aria-labelledby="fisher-tackle-title">
    <div className="market-tackle-head">
      <span className="market-tackle-sign" id="fisher-tackle-title">RODS &amp; LURES</span>
      <p>Tackle for the valley fish. Equip one rod and one lure in Buddy's inventory.</p>
    </div>
    <ul className="market-tackle-list">{MARKET_TACKLE.map((item) => {
      const owned = wallet.owned.includes(item.id);
      return <li className={`market-tackle-item ${owned ? "is-owned" : ""}`} key={item.id} data-item={item.id}>
        <div className="market-tackle-art"><MarketItemIcon id={item.id} scale={3} /></div>
        <div className="market-tackle-copy"><small>{item.slot === "rod" ? "ROD" : "LURE"} · {item.perk}</small><h4>{item.label}</h4><p>{item.description}</p></div>
        <div className="market-tackle-buy">
          <span className="market-tackle-price" aria-label={`${item.price} gold`}><BuddyCoinIcon /><strong>{item.price}</strong></span>
          <button type="button" disabled={owned || !here || wallet.coins < item.price} onClick={() => onBuy(item.id)} aria-label={owned ? `${item.label}: owned` : `Buy ${item.label} for ${item.price} coins`}><ShoppingBag size={13} aria-hidden="true" />{owned ? "Owned" : !here ? "Away" : wallet.coins < item.price ? `Need ${item.price - wallet.coins}` : "Buy"}</button>
        </div>
      </li>;
    })}</ul>
  </section>;
}

const SELL_FILTERS = [
  { id: "all", label: "All" },
  { id: "fish", label: "Fish" },
  { id: "other", label: "Junk & shells" }
];

export function BuddyFisherman({ buddy, onNavigate }) {
  const clock = useFisherman();
  const here = Boolean(clock.visit);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("all");
  const wallet = buddy.adventure.market;
  const sold = wallet.sold || {};
  // Lo que se le puede vender: lo pescado que aun no se ha vendido.
  const catches = useMemo(() => buddy.adventure.fishJournal
    .filter((item) => item.count > 0 && catchPrice(item) > 0)
    .map((item) => ({ item, price: catchPrice(item), left: Math.max(0, item.count - (sold[item.id] || 0)) }))
    .filter((entry) => entry.left > 0), [buddy.adventure.fishJournal, sold]);
  const shown = catches.filter((entry) => filter === "all" || (filter === "fish" ? entry.item.kind === "fish" : entry.item.kind !== "fish"));
  const worth = shown.reduce((sum, entry) => sum + entry.left * entry.price, 0);
  const sell = (id, amount) => setMessage(buddy.adventure.sellCatch(id, amount));
  const sellShown = () => {
    let total = 0;
    for (const entry of shown) { buddy.adventure.sellCatch(entry.item.id, "all"); total += entry.left * entry.price; }
    setMessage(`Sold everything shown for ${total} coins. Your journal keeps every entry.`);
  };

  return <div className="buddy-market buddy-fisherman">
    <div className="market-welcome fisher-welcome">
      <div className="market-diorama fisher-diorama"><FisherPortrait /></div>
      <div className="market-welcome-copy">
        <span className={`market-hours ${here ? "is-open" : ""}`}><i />{here ? "AT THE FOOTER" : "ON THE ROAD"}</span>
        <h3>Marlin's<br />Bait &amp; Tackle</h3>
        <p>{here ? "\"Ahoy, little bot. Rods and lures for the valley water, and I pay fair for a good fish.\"" : "\"Gone fishing further down the valley. I'll be back this way soon.\""}</p>
        <strong>{fishermanWhen(clock)}</strong>
        <small>He comes by the footer a few days a week and stays a few hours. Click him when you see his cart.</small>
      </div>
      <BuddyMarketWallet adventure={buddy.adventure} />
    </div>
    <p className="market-feedback" role="status">{message || (here ? "Buy tackle for the valley fish, or sell what Buddy has caught." : "He's away right now. Everything here waits for his next visit.")}</p>
    <FisherTackle wallet={wallet} here={here} onBuy={(id) => setMessage(buddy.adventure.buyItem(id))} />
    <section className="fisher-sell" aria-labelledby="fisher-sell-title">
      <div className="market-catalog-heading">
        <div><span className="buddy-modal-kicker">A FAIR PRICE · YOUR JOURNAL KEEPS EVERY ENTRY</span><h3 id="fisher-sell-title">Sell your catch</h3></div>
        <span className="market-stock-count">{catches.reduce((sum, entry) => sum + entry.left, 0)} to sell</span>
      </div>
      <div className="fisher-sell-bar">
        <div className="buddy-loot-filters" role="group" aria-label="Filter catches">
          {SELL_FILTERS.map((item) => <button key={item.id} type="button" className={`buddy-loot-filter ${filter === item.id ? "is-active" : ""}`} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}</button>)}
        </div>
        <button type="button" className="fisher-sell-all" disabled={!here || !shown.length} onClick={sellShown}><Coins size={13} aria-hidden="true" />Sell all shown · {worth}</button>
      </div>
      {shown.length ? <ul className="fisher-catches">{shown.map(({ item, price, left }) => (
        <li key={item.id} className="fisher-catch" data-item={item.id}>
          <BuddyCollectibleIcon id={item.id} color={item.color} />
          <div><strong>{item.name}</strong><small>×{left} · {price} {price === 1 ? "coin" : "coins"} each</small></div>
          <div className="fisher-catch-buttons">
            <button type="button" disabled={!here} onClick={() => sell(item.id, 1)} aria-label={`Sell one ${item.name} for ${price} coins`}>Sell 1</button>
            {left > 1 ? <button type="button" disabled={!here} onClick={() => sell(item.id, "all")} aria-label={`Sell all ${left} ${item.name} for ${left * price} coins`}>All · {left * price}</button> : null}
          </div>
        </li>
      ))}</ul> : <p className="fisher-empty">{catches.length ? "Nothing in this pile." : "Nothing to sell yet. Let Buddy fish for a while."}</p>}
    </section>
    <div className="market-footer"><span>Equip new tackle in Buddy's inventory.</span><button type="button" onClick={() => onNavigate("inventory")}>Dress Buddy ↗</button><button type="button" onClick={() => onNavigate("journal")}>Catch journal ↗</button><button type="button" onClick={() => onNavigate("market")}>Woodland market ↗</button></div>
  </div>;
}
