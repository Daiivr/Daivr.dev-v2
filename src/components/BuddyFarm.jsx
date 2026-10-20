import { useEffect, useRef, useState } from "react";
import { Flame, Hammer, PackageCheck, ShoppingBag } from "lucide-react";
import { FRUITS, HONEY, SMOKE_HOURS, SMOKER_HOOKS, TREE_GROW_DAYS, YARD_ITEMS, fruitById, smokable, smokedPrice } from "../../shared/buddy-market.mjs";
import { catchById } from "../../shared/buddy-catches.mjs";
import { fruitReady, nextFruitAt, seasonAt, treeStage } from "../../shared/buddy-farm.mjs";
import { BuddyCoinIcon } from "./BuddyCoinIcon";
import { BuddyMarketWallet } from "./BuddyChestOpening";
import { BuddyCollectibleIcon } from "./BuddyCollectibleIcon";
import { FARM_SPRITES, scarecrowSprite, treeSprite } from "../lib/pixelWorld/farmArt";
import { drawCropItem } from "../lib/pixelWorld/life/garden";
import { makeCanvas } from "../lib/pixelWorld/core";
import "../styles/buddy-market.css";

// La granja en sus modales (con la piel del mercado): el tablon de encargos
// del puesto (el encargo de hoy, lo que tienes y entregarlo), el ahumadero de
// la hoguera (colgar peces, lo que se ahuma y lo ya ahumado) y el patio del
// cobertizo del huerto (espantapajaros, abejas y un arbol frutal).

function timeLeft(ms) {
  if (ms < 3600000) return `${Math.max(1, Math.ceil(ms / 60000))} min`;
  const hours = Math.max(1, Math.ceil(ms / 3600000));
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24), rest = hours % 24;
  return rest ? `${days} d ${rest} h` : `${days} d`;
}
function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(timer); }, [ms]);
  return now;
}
// Un sprite del valle a escala entera.
function SpriteCanvas({ draw, scale = 3, className = "farm-sprite", deps = [] }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const img = draw();
    if (!img) return;
    canvas.width = img.width; canvas.height = img.height;
    const g = canvas.getContext("2d");
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, img.width, img.height);
    g.drawImage(img, 0, 0);
    canvas.style.width = `${img.width * scale}px`;
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
function ItemCanvas({ id, scale = 4 }) {
  const ref = useRef(null);
  useEffect(() => { if (!ref.current) return; drawCropItem(ref.current, id); ref.current.style.width = `${ref.current.width * scale}px`; }, [id, scale]);
  return <canvas ref={ref} className="farm-sprite" aria-hidden="true" />;
}
// Un pescado ahumado (dorado tostado), para la lista del ahumadero.
const SMOKED = (() => {
  let img = null;
  return () => {
    if (img) return img;
    const rows = ["...d..dd.", "..dbbbbdd", ".dbYbbbbd", "dbbbbbbd.", ".dbbbbd..", "..dddd..."], pal = { d: "#5a2e10", b: "#b8742a", Y: "#ffd890" };
    const [c, g] = makeCanvas(9, 6);
    rows.forEach((row, y) => [...row].forEach((ch, x) => { if (pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(x, y, 1, 1); } }));
    img = c;
    return img;
  };
})();
function OrderIcon({ order }) {
  if (order.kind === "fish") return <BuddyCollectibleIcon id={order.id} color={catchById(order.id)?.color} />;
  if (order.kind === "smoked") return <SpriteCanvas draw={SMOKED} scale={5} />;
  return <ItemCanvas id={order.id} scale={5} />;
}

// --- El tablon de encargos ---------------------------------------------------
const WHERE = {
  fish: "Buddy catches these fishing (the Valley and Station journals).",
  crop: "Grow it in the garden: buy seeds in the Garden Shed.",
  honey: "The bee house fills a jar every two days.",
  fruit: "Pick it from your fruit tree.",
  smoked: "Hang a fish in the campfire smoker for an hour."
};
export function BuddyBoard({ buddy, onNavigate }) {
  useNow(30_000);
  const wallet = buddy.adventure.market, order = wallet.order;
  const [message, setMessage] = useState("");
  const done = (wallet.orders || []).length, earned = (wallet.orders || []).reduce((sum, entry) => sum + (entry.reward || 0), 0);
  const ready = !order.done && order.have >= order.n;
  return <div className="buddy-market buddy-board">
    <div className="market-welcome board-welcome">
      <div className="market-diorama board-diorama"><SpriteCanvas draw={() => FARM_SPRITES().board[order.done ? "done" : "note"]} scale={6} /></div>
      <div className="market-welcome-copy">
        <span className={`market-hours ${order.done ? "" : "is-open"}`}><i />{order.done ? "DONE FOR TODAY" : "NEW REQUEST"}</span>
        <h3>Help<br />Wanted</h3>
        <p>"Someone in the valley needs a hand. Bring what's on the note and the reward is yours."</p>
        <small>A new note goes up every morning (New York time), and Buddy pins it to the board on the market stand.</small>
      </div>
      <BuddyMarketWallet adventure={buddy.adventure} />
    </div>
    <p className="market-feedback" role="status">{message || (order.done ? "That's today's request done. Come back tomorrow for a new one." : ready ? "You have everything. Deliver it for the reward!" : `You have ${order.have} of ${order.n}.`)}</p>
    <article className={`board-note ${order.done ? "is-done" : ""}`} aria-labelledby="board-note-title">
      <span className="board-note-pin" aria-hidden="true" />
      <div className="board-note-art"><OrderIcon order={order} /></div>
      <div className="board-note-copy">
        <small>WANTED · {order.day}</small>
        <h4 id="board-note-title">{order.n} × {order.label}</h4>
        <p>{WHERE[order.kind]}</p>
        <span className="board-note-progress" aria-label={`You have ${Math.min(order.have, order.n)} of ${order.n}`}>
          <i className="seed-tag-meter" style={{ "--fill": Math.min(1, order.have / order.n) }}><b /></i>
          <em>{Math.min(order.have, order.n)} / {order.n}</em>
        </span>
      </div>
      <div className="board-note-reward">
        <span className="market-tackle-price" aria-label={`${order.reward} gold reward`}><BuddyCoinIcon /><strong>{order.reward}</strong></span>
        <button type="button" disabled={!ready} onClick={() => setMessage(buddy.adventure.deliverOrder())}>
          <PackageCheck size={13} aria-hidden="true" />{order.done ? "Delivered" : ready ? "Deliver" : `Need ${order.n - order.have}`}
        </button>
      </div>
      {order.done ? <span className="board-note-stamp" aria-hidden="true">DONE</span> : null}
    </article>
    <dl className="board-stats">
      <div><dt>Requests done</dt><dd>{done}</dd></div>
      <div><dt>Rewards earned</dt><dd><BuddyCoinIcon />{earned}</dd></div>
    </dl>
    <div className="market-footer"><span>Where to get things:</span><button type="button" onClick={() => onNavigate("garden")}>Garden Shed ↗</button><button type="button" onClick={() => onNavigate("smoker")}>Smoker ↗</button><button type="button" onClick={() => onNavigate("fishing")}>Fishing gear ↗</button></div>
  </div>;
}

// --- El ahumadero --------------------------------------------------------------
// El retrato: la hoguera con el tripode y lo que cuelga.
function SmokerPortrait({ hanging }) {
  const ref = useRef(null);
  const key = hanging.map((entry) => entry.id).join(",");
  useEffect(() => {
    const g = ref.current?.getContext("2d");
    if (!g) return;
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, 60, 46);
    for (let x = 0; x < 60; x++) { g.fillStyle = x % 5 ? "#4a8a3a" : "#5aa043"; g.fillRect(x, 40, 1, 2); g.fillStyle = "#7a5a32"; g.fillRect(x, 42, 1, 4); }
    const px = (x, y, c) => { g.fillStyle = c; g.fillRect(x, y, 1, 1); };
    const line = (x0, y0, x1, y1, c) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i++) px(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), c); };
    // piedras, troncos y llamas
    for (const [x, c] of [[19, "#8a8a92"], [23, "#6a6a72"], [35, "#8a8a92"], [39, "#6a6a72"]]) { g.fillStyle = c; g.fillRect(x, 38, 3, 2); }
    line(21, 37, 38, 34, "#7a4a22"); line(21, 34, 38, 37, "#5a3418");
    for (const [x, h, c] of [[27, 9, "#ffd84a"], [29, 12, "#ff9a3a"], [31, 8, "#ffd84a"], [25, 6, "#ff6a2a"], [33, 6, "#ff6a2a"]]) { g.fillStyle = c; g.fillRect(x, 35 - h, 2, h); }
    // el tripode y los peces
    line(30, 6, 19, 40, "#7a4a22"); line(30, 6, 41, 40, "#a8743e"); line(31, 6, 33, 37, "#4a2c12");
    line(25, 12, 36, 12, "#7a4a22");
    hanging.slice(0, 3).forEach((entry, i) => {
      const x = 27 + i * 3, col = catchById(entry.id)?.color || "#7a9ab8";
      px(x, 13, "#d8c8a0");
      for (let y = 14; y <= 19; y++) { px(x - 1, y, col); px(x, y, col); }
      px(x - 1, 14, "#2a1408"); px(x, 20, "#2a1408");
    });
  }, [key]);
  return <canvas ref={ref} className="fisher-portrait" width="60" height="46" aria-hidden="true" />;
}
export function BuddySmoker({ buddy, onNavigate }) {
  const now = useNow(1000);
  const wallet = buddy.adventure.market, smoker = wallet.smoker || { hanging: [], ready: {}, free: SMOKER_HOOKS };
  const [message, setMessage] = useState("");
  const raw = buddy.adventure.fishJournal.filter((item) => smokable(item) && (wallet.fishLeft?.[item.id] || 0) > 0);
  const ready = Object.entries(smoker.ready).filter(([, n]) => n > 0).map(([id, n]) => ({ item: catchById(id), n, price: smokedPrice(catchById(id)) }));
  const readyCount = ready.reduce((sum, entry) => sum + entry.n, 0);
  const hooks = Array.from({ length: SMOKER_HOOKS }, (_, i) => smoker.hanging[i] || null);
  return <div className="buddy-market buddy-smoker">
    <div className="market-welcome smoker-welcome">
      <div className="market-diorama smoker-diorama"><SmokerPortrait hanging={smoker.hanging} /></div>
      <div className="market-welcome-copy">
        <span className={`market-hours ${smoker.hanging.length ? "is-open" : ""}`}><i />{smoker.hanging.length ? "SMOKING" : readyCount ? "SMOKED FISH READY" : "COALS READY"}</span>
        <h3>Campfire<br />Smoker</h3>
        <p>"Hang a fish over the coals. In {SMOKE_HOURS === 1 ? "an hour" : `${SMOKE_HOURS} hours`} it's smoked, and worth twice as much."</p>
        <small>Sell smoked fish to Marlin when his cart is in the meadow, or bring one to the Help Wanted board. On campfire nights, if there are two or more, Buddy eats one.</small>
      </div>
      <BuddyMarketWallet adventure={buddy.adventure} />
    </div>
    <p className="market-feedback" role="status">{message || (smoker.free ? `${smoker.free} of ${SMOKER_HOOKS} hooks free.` : "All hooks are busy. Wait for one to finish.")}</p>
    <ol className="smoker-hooks" aria-label="Smoker hooks">
      {hooks.map((entry, i) => {
        if (!entry) return <li key={i} className="smoker-hook is-empty"><small>HOOK {i + 1}</small><strong>Empty</strong><span>Hang a fish below.</span></li>;
        const item = catchById(entry.id), from = Date.parse(entry.at), k = Math.max(0, Math.min(1, (now - from) / (entry.readyAt - from)));
        return <li key={i} className="smoker-hook">
          <small>HOOK {i + 1}</small>
          <BuddyCollectibleIcon id={entry.id} color={item?.color} />
          <strong>{item?.name}</strong>
          <span>Smoked in {timeLeft(entry.readyAt - now)}</span>
          <i className="seed-tag-meter" style={{ "--fill": k }} aria-hidden="true"><b /></i>
        </li>;
      })}
    </ol>
    <section className="smoker-ready" aria-labelledby="smoker-ready-title">
      <div className="market-catalog-heading">
        <div><span className="buddy-modal-kicker">SMOKED · TWICE THE PRICE AND THEN SOME</span><h3 id="smoker-ready-title">Smoked fish</h3></div>
        <span className="market-stock-count">{readyCount} ready</span>
      </div>
      {ready.length ? <ul className="fisher-catches">{ready.map(({ item, n, price }) => (
        <li key={item.id} className="fisher-catch is-smoked">
          <SpriteCanvas draw={SMOKED} scale={4} />
          <div><strong>Smoked {item.name}</strong><small>×{n} · Marlin pays {price} each</small></div>
          <div className="fisher-catch-buttons"><button type="button" onClick={() => onNavigate("fisherman")}>Sell ↗</button></div>
        </li>
      ))}</ul> : <p className="fisher-empty">Nothing smoked yet.</p>}
    </section>
    <section className="smoker-hang" aria-labelledby="smoker-hang-title">
      <div className="market-catalog-heading">
        <div><span className="buddy-modal-kicker">FROM BUDDY'S CATCH · YOUR JOURNAL KEEPS EVERY ENTRY</span><h3 id="smoker-hang-title">Hang a fish</h3></div>
      </div>
      {raw.length ? <ul className="fisher-catches">{raw.map((item) => (
        <li key={item.id} className="fisher-catch">
          <BuddyCollectibleIcon id={item.id} color={item.color} />
          <div><strong>{item.name}</strong><small>×{wallet.fishLeft[item.id]} · smoked sells for {smokedPrice(item)}</small></div>
          <div className="fisher-catch-buttons"><button type="button" disabled={!smoker.free} onClick={() => setMessage(buddy.adventure.smokeFish(item.id))}><Flame size={12} aria-hidden="true" />Hang</button></div>
        </li>
      ))}</ul> : <p className="fisher-empty">No fish to smoke. Let Buddy fish for a while.</p>}
    </section>
    <div className="market-footer"><span>Smoked fish sell to the traveling fisherman.</span><button type="button" onClick={() => onNavigate("fisherman")}>Bait &amp; Tackle ↗</button><button type="button" onClick={() => onNavigate("board")}>Help Wanted ↗</button></div>
  </div>;
}

// --- El patio del huerto (en el cobertizo) -------------------------------------
const STAGE_NAMES = ["Sapling", "Bush", "Young tree", "Fruit tree"];
const SEASON_NAMES = { spring: "spring", summer: "summer", fall: "autumn" };
export function YardShop({ buddy, now, onMessage }) {
  const wallet = buddy.adventure.market, adventure = buddy.adventure;
  const season = seasonAt(now), nature = season === "fall" ? "autumn" : season;
  const lastPick = wallet.fruit?.length ? Date.parse(wallet.fruit[wallet.fruit.length - 1].at) : null;
  return <section className="yard-shop" aria-labelledby="yard-shop-title">
    <div className="market-catalog-heading">
      <div><span className="buddy-modal-kicker">BEHIND THE GARDEN FENCE · YOURS TO KEEP</span><h3 id="yard-shop-title">The yard</h3></div>
    </div>
    <ul className="market-tackle-list">
      {YARD_ITEMS.map((item) => {
        const owned = Boolean(wallet.yard?.[item.id]), tree = item.kind === "tree";
        const blocked = tree && wallet.tree && !owned;
        let status = null, action = null;
        if (owned && item.kind === "bees") {
          status = wallet.bees.readyAt <= now ? "A jar of honey is ready. Buddy will collect it." : `Next jar in ${timeLeft(wallet.bees.readyAt - now)}.`;
          if (wallet.bees.readyAt <= now) action = { label: "Collect", run: () => onMessage(adventure.collectHoney()) };
        } else if (owned && tree) {
          const base = wallet.tree, stage = treeStage(base, now), fruit = fruitById(item.fruit), hanging = fruitReady(base, lastPick, now), next = nextFruitAt(base, lastPick, now);
          status = stage < 3 ? `${STAGE_NAMES[stage]} · grown in ${timeLeft(base.at + TREE_GROW_DAYS * 86400000 - now)}`
            : hanging ? `${hanging} ${fruit.label.toLowerCase()} hanging · Buddy will pick them.`
              : seasonAt(now) === fruit.season ? `Next ${fruit.label.toLowerCase()} in ${next ? timeLeft(next - now) : "a while"}.` : `Fruits in ${SEASON_NAMES[fruit.season]}.`;
          if (stage === 3 && hanging) action = { label: "Pick", run: () => onMessage(adventure.pickFruit()) };
        } else if (owned) status = "On guard. Crows keep away from the garden.";
        const art = item.kind === "scarecrow" ? () => scarecrowSprite("") : item.kind === "bees" ? () => FARM_SPRITES().beeHouse : () => treeSprite(3, nature === "winter" ? "summer" : nature, item.fruit);
        return <li key={item.id} className={`market-tackle-item yard-item ${owned ? "is-owned" : ""}`} data-item={item.id}>
          <div className="market-tackle-art"><SpriteCanvas draw={art} scale={tree ? 2 : 3} deps={[item.id, nature]} /></div>
          <div className="market-tackle-copy">
            <small>{item.kind === "tree" ? `FRUIT TREE · ${fruitById(item.fruit).label.toUpperCase()} IN ${SEASON_NAMES[fruitById(item.fruit).season].toUpperCase()}` : item.kind === "bees" ? `HONEY · ${HONEY.value} GOLD A JAR` : "KEEPS THE CROWS AWAY"}</small>
            <h4>{item.label}</h4><p>{item.description}</p>
            {status ? <span className="fisher-pack-meta"><b>{status}</b></span> : null}
          </div>
          <div className="market-tackle-buy">
            <span className="market-tackle-price" aria-label={`${item.price} gold`}><BuddyCoinIcon /><strong>{item.price}</strong></span>
            {action ? <button type="button" onClick={action.run}><Hammer size={13} aria-hidden="true" />{action.label}</button>
              : <button type="button" disabled={owned || blocked || wallet.coins < item.price} onClick={() => onMessage(adventure.buyYard(item.id))} aria-label={owned ? `${item.label}: owned` : `Buy ${item.label} for ${item.price} coins`}>
                <ShoppingBag size={13} aria-hidden="true" />{owned ? "Owned" : blocked ? "One tree only" : wallet.coins < item.price ? `Need ${item.price - wallet.coins}` : "Buy"}
              </button>}
          </div>
        </li>;
      })}
    </ul>
  </section>;
}
// Lo de mas en la cesta: la miel y la fruta (cuando hay o se tiene).
export function basketExtras(wallet) {
  const list = [];
  if (wallet.bees || wallet.basketHoney) list.push({ id: HONEY.id, label: "Honey", n: wallet.basketHoney || 0, value: HONEY.value });
  for (const fruit of FRUITS) if (wallet.tree?.fruit === fruit.id || wallet.basketFruit?.[fruit.id]) list.push({ id: fruit.id, label: fruit.label, n: wallet.basketFruit?.[fruit.id] || 0, value: fruit.value });
  return list;
}
