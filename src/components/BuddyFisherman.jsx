import { useEffect, useMemo, useRef, useState } from "react";
import { Coins, ShoppingBag } from "lucide-react";
import { FISH_SELL_DAILY, LURES, MARKET_RODS, RESTOCK_MS, fishermanTrip, smokedPrice } from "../../shared/buddy-market.mjs";
import { catchById } from "../../shared/buddy-catches.mjs";
import { catchPrice, nextFishermanVisit } from "../../shared/buddy-fisherman.mjs";
import { BuddyCoinIcon } from "./BuddyCoinIcon";
import { BuddyMarketWallet } from "./BuddyChestOpening";
import { MarketItemIcon } from "./BuddyMarketArt";
import { BuddyCollectibleIcon } from "./BuddyCollectibleIcon";
import { FISHER_SPRITES } from "../lib/pixelWorld/fisherman";
import { flipped } from "../lib/pixelWorld/core";
import "../styles/buddy-market.css";

// El reloj del pescador para este jugador: si esta (o se fue a reponer), lo
// que le queda en el carro y cuando vuelve.
export function useFisherman(wallet, refreshMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), refreshMs);
    return () => clearInterval(timer);
  }, [refreshMs]);
  // (con la hora de ahora mismo, no la del ultimo tic: tras comprar el ultimo
  // señuelo el carro se cierra al instante)
  const trip = fishermanTrip(wallet, new Date(Math.max(now, Date.now())));
  return { now, ...trip, next: nextFishermanVisit(new Date(trip.visit && trip.gap && !trip.gap.returns ? trip.visit.to + 1 : now)) };
}
const timeFormat = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
const dayFormat = new Intl.DateTimeFormat(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" });
export function fishermanWhen({ visit, gap, next }) {
  if (visit && !gap) return `Here until ${timeFormat.format(visit.to)}`;
  if (gap?.returns) return `Restocking, back around ${timeFormat.format(gap.to)}`;
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

// La estanteria del pescador: las cañas (para siempre) y los señuelos buenos y
// los mejores (cada uno, un uso; lleva unos pocos de cada en el carro).
function FisherTackle({ wallet, clock, onBuyRod, onBuyLure }) {
  const here = clock.visit && !clock.gap;
  const buyLabel = (price, extra) => (!here ? "Away" : extra || (wallet.coins < price ? `Need ${price - wallet.coins}` : null));
  return <section className="market-tackle" aria-labelledby="fisher-tackle-title">
    <div className="market-tackle-head">
      <span className="market-tackle-sign" id="fisher-tackle-title">RODS &amp; LURES</span>
      <p>Rods are yours to keep. Each lure is one use, spent only when Buddy lands a catch. The better the lure, the more rare fish bite. Buy every lure in his cart and Marlin goes off to restock for about {Math.round(RESTOCK_MS / 60000)} minutes.</p>
    </div>
    <ul className="market-tackle-list">
      {MARKET_RODS.map((item) => {
        const owned = wallet.owned.includes(item.id), label = owned ? "Owned" : buyLabel(item.price) || "Buy";
        return <li className={`market-tackle-item ${owned ? "is-owned" : ""}`} key={item.id} data-item={item.id}>
          <div className="market-tackle-art"><MarketItemIcon id={item.id} scale={3} /></div>
          <div className="market-tackle-copy"><small>ROD · {item.perk}</small><h4>{item.label}</h4><p>{item.description}</p></div>
          <div className="market-tackle-buy">
            <span className="market-tackle-price" aria-label={`${item.price} gold`}><BuddyCoinIcon /><strong>{item.price}</strong></span>
            <button type="button" disabled={owned || !here || wallet.coins < item.price} onClick={() => onBuyRod(item.id)} aria-label={owned ? `${item.label}: owned` : `Buy ${item.label} for ${item.price} coins`}><ShoppingBag size={13} aria-hidden="true" />{label}</button>
          </div>
        </li>;
      })}
      {LURES.filter((item) => item.seller === "fisherman").map((item) => {
        const stock = clock.stock?.[item.id] ?? 0, left = wallet.lureLeft?.[item.id] || 0;
        const label = buyLabel(item.price, here && !stock ? "Sold out" : null);
        return <li className="market-tackle-item is-pack" key={item.id} data-item={item.id}>
          <div className="market-tackle-art"><MarketItemIcon id={item.id} scale={3} /></div>
          <div className="market-tackle-copy">
            <small>{item.tier === "best" ? "BEST LURE" : "GOOD LURE"} · {item.perk}</small><h4>{item.label}</h4><p>{item.description}</p>
            <span className="fisher-pack-meta"><b>{here ? `${stock} of ${item.stock} left in his cart` : `${item.stock} per trip`}</b>{left ? <i>You have {left}</i> : null}</span>
          </div>
          <div className="market-tackle-buy">
            <span className="market-tackle-price" aria-label={`${item.price} gold each`}><BuddyCoinIcon /><strong>{item.price}</strong></span>
            <div className="fisher-lure-buttons">
              <button type="button" disabled={Boolean(label)} onClick={() => onBuyLure(item.id, 1)} aria-label={`Buy one ${item.label} for ${item.price} coins`}><ShoppingBag size={13} aria-hidden="true" />{label || "Buy 1"}</button>
              {!label && stock > 1 ? <button type="button" onClick={() => onBuyLure(item.id, stock)} aria-label={`Buy all ${stock} ${item.label}s in his cart`}>×{stock}</button> : null}
            </div>
          </div>
        </li>;
      })}
    </ul>
  </section>;
}

const SELL_FILTERS = [
  { id: "all", label: "All" },
  { id: "fish", label: "Fish" },
  { id: "other", label: "Junk & shells" }
];

export function BuddyFisherman({ buddy, onNavigate }) {
  const wallet = buddy.adventure.market;
  const clock = useFisherman(wallet);
  const here = Boolean(clock.visit && !clock.gap);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("all");
  const sold = wallet.sold || {};
  const room = Math.max(0, FISH_SELL_DAILY - (wallet.soldToday || 0));
  // Lo que se le puede vender: lo pescado que aun no se ha vendido, ahumado ni
  // entregado en el tablon.
  const fishLeft = wallet.fishLeft;
  const catches = useMemo(() => buddy.adventure.fishJournal
    .filter((item) => item.count > 0 && catchPrice(item) > 0)
    .map((item) => ({ item, price: catchPrice(item), left: Math.max(0, fishLeft?.[item.id] ?? item.count - (sold[item.id] || 0)) }))
    .filter((entry) => entry.left > 0), [buddy.adventure.fishJournal, sold, fishLeft]);
  // Y los ahumados del ahumadero de la hoguera (a mas del doble).
  const smoked = Object.entries(wallet.smoker?.ready || {}).filter(([, n]) => n > 0).map(([id, n]) => ({ item: catchById(id), n, price: smokedPrice(catchById(id)) }));
  const shown = catches.filter((entry) => filter === "all" || (filter === "fish" ? entry.item.kind === "fish" : entry.item.kind !== "fish"));
  // (lo que paga por lo de la lista, sin pasar del tope de hoy)
  let budget = room, worth = 0;
  for (const entry of shown) { const n = Math.min(entry.left, budget); worth += n * entry.price; budget -= n; }
  const sell = (id, amount) => setMessage(buddy.adventure.sellCatch(id, amount));
  const sellShown = () => {
    let total = 0, count = 0, left = room;
    for (const entry of shown) {
      if (left <= 0) break;
      const n = Math.min(entry.left, left);
      buddy.adventure.sellCatch(entry.item.id, n);
      total += n * entry.price; count += n; left -= n;
    }
    setMessage(left <= 0 ? `Sold ${count} for ${total} coins. That's all Marlin can carry today.` : `Sold ${count} for ${total} coins. Your journal keeps every entry.`);
  };
  const status = here ? "AT THE FOOTER" : clock.gap?.returns ? "RESTOCKING" : "ON THE ROAD";
  const quote = here ? "\"Ahoy, little bot. Rods and lures for the valley water, and I pay fair for a good fish.\""
    : clock.gap?.returns ? "\"Cleaned me out! Off to fetch more lures. Won't be long.\""
      : "\"Gone fishing further down the valley. I'll be back this way soon.\"";

  return <div className="buddy-market buddy-fisherman">
    <div className="market-welcome fisher-welcome">
      <div className="market-diorama fisher-diorama"><FisherPortrait /></div>
      <div className="market-welcome-copy">
        <span className={`market-hours ${here ? "is-open" : ""}`}><i />{status}</span>
        <h3>Marlin's<br />Bait &amp; Tackle</h3>
        <p>{quote}</p>
        <strong>{fishermanWhen(clock)}</strong>
        <small>He comes by the footer a few days a week and stays a few hours. Click him when you see his cart.</small>
      </div>
      <BuddyMarketWallet adventure={buddy.adventure} />
    </div>
    <p className="market-feedback" role="status">{message || (here ? "Buy tackle for the valley fish, or sell what Buddy has caught." : clock.gap?.returns ? "He's out restocking. His cart will be back soon." : "He's away right now. Everything here waits for his next visit.")}</p>
    <FisherTackle wallet={wallet} clock={clock} onBuyRod={(id) => setMessage(buddy.adventure.buyItem(id))} onBuyLure={(id, qty) => setMessage(buddy.adventure.buyLure(id, qty))} />
    <section className="fisher-sell" aria-labelledby="fisher-sell-title">
      <div className="market-catalog-heading">
        <div><span className="buddy-modal-kicker">A FAIR PRICE · YOUR JOURNAL KEEPS EVERY ENTRY</span><h3 id="fisher-sell-title">Sell your catch</h3></div>
        <span className="market-stock-count">Sold today {wallet.soldToday || 0} / {FISH_SELL_DAILY}</span>
      </div>
      <div className="fisher-sell-bar">
        <div className="buddy-loot-filters" role="group" aria-label="Filter catches">
          {SELL_FILTERS.map((item) => <button key={item.id} type="button" className={`buddy-loot-filter ${filter === item.id ? "is-active" : ""}`} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}</button>)}
        </div>
        <button type="button" className="fisher-sell-all" disabled={!here || !shown.length || !room} onClick={sellShown}><Coins size={13} aria-hidden="true" />{room ? `Sell all shown · ${worth}` : "Enough for today"}</button>
      </div>
      {smoked.length ? <ul className="fisher-catches fisher-smoked" aria-label="Smoked fish">{smoked.map(({ item, n, price }) => {
        const k = Math.min(n, room);
        return <li key={item.id} className="fisher-catch is-smoked" data-item={item.id}>
          <BuddyCollectibleIcon id={item.id} color={item.color} />
          <div><strong>Smoked {item.name}</strong><small>×{n} · {price} coins each</small></div>
          <div className="fisher-catch-buttons">
            <button type="button" disabled={!here || !room} onClick={() => setMessage(buddy.adventure.sellSmoked(item.id, 1))} aria-label={`Sell one smoked ${item.name} for ${price} coins`}>Sell 1</button>
            {n > 1 ? <button type="button" disabled={!here || !room} onClick={() => setMessage(buddy.adventure.sellSmoked(item.id, k))}>{k < n ? k : "All"} · {k * price}</button> : null}
          </div>
        </li>;
      })}</ul> : null}
      {shown.length ? <ul className="fisher-catches">{shown.map(({ item, price, left }) => (
        <li key={item.id} className="fisher-catch" data-item={item.id}>
          <BuddyCollectibleIcon id={item.id} color={item.color} />
          <div><strong>{item.name}</strong><small>×{left} · {price} {price === 1 ? "coin" : "coins"} each</small></div>
          <div className="fisher-catch-buttons">
            <button type="button" disabled={!here || !room} onClick={() => sell(item.id, 1)} aria-label={`Sell one ${item.name} for ${price} coins`}>Sell 1</button>
            {left > 1 ? <button type="button" disabled={!here || !room} onClick={() => sell(item.id, Math.min(left, room))} aria-label={`Sell ${Math.min(left, room)} ${item.name} for ${Math.min(left, room) * price} coins`}>{Math.min(left, room) < left ? `${Math.min(left, room)}` : "All"} · {Math.min(left, room) * price}</button> : null}
          </div>
        </li>
      ))}</ul> : <p className="fisher-empty">{catches.length ? "Nothing in this pile." : "Nothing to sell yet. Let Buddy fish for a while."}</p>}
    </section>
    <div className="market-footer"><span>Equip new tackle in the Fishing tab.</span><button type="button" onClick={() => onNavigate("smoker")}>Smoker ↗</button><button type="button" onClick={() => onNavigate("fishing")}>Fishing gear ↗</button><button type="button" onClick={() => onNavigate("journal")}>Catch journal ↗</button><button type="button" onClick={() => onNavigate("market")}>Woodland market ↗</button></div>
  </div>;
}
