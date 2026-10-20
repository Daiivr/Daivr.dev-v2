import { useEffect, useRef, useState } from "react";
import { ShoppingBag, Sprout } from "lucide-react";
import { BuddyCoinIcon } from "./BuddyCoinIcon";
import { CROPS, SEED_BAG_MAX, cropById, cropSaleDay, gardenPlots, growth, nextCropSale, ripeAt } from "../../shared/buddy-market.mjs";
import { DIORAMA, createGardenDiorama, dioramaView } from "../lib/pixelWorld/gardenDiorama";
import { drawCropItem, drawPlotPreview, readWatered } from "../lib/pixelWorld/life/garden";
import { wetGardenPlots } from "../../shared/buddy-garden-water.mjs";
import { YardShop, basketExtras } from "./BuddyFarm";

// El cobertizo del huerto: su propio modal (se abre pulsando el huerto del
// prado). Arriba, el huerto en pequeño con lo que crece de verdad en cada
// parcela y su etiqueta colgando debajo; luego la cesta, que solo se vende en
// el mercado de los viernes; y los sobres: las semillas se compran cuando sea
// (a la bolsa, como mucho SEED_BAG_MAX de cada una) y se plantan en la
// siguiente parcela libre (al pasar por un sobre, esa parcela lo enseña en
// fantasma). Lo maduro lo cosecha Buddy; si no esta por ahi, desde aqui. Al
// final, el patio: espantapajaros, casita de abejas y arbol frutal (la miel y
// la fruta van a la misma cesta). Tres calabazas plantadas a la vez pueden
// juntarse en una gigante, que vale el doble.
const STAGE_GROWTHS = [0.2, 0.5, 0.8, 1];

function GardenDiorama({ plots, ghost, wet }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const drawRef = useRef(null);
  const stateRef = useRef(null);
  const viewRef = useRef(null);
  stateRef.current = { plots, ghost, wet };
  useEffect(() => {
    const canvas = canvasRef.current, wrap = wrapRef.current;
    if (!canvas || !wrap) return undefined;
    drawRef.current = createGardenDiorama(canvas);
    // (a escala entera; si entero solo cabe a 1, se recorta a lo que quepa a 2)
    const resize = new ResizeObserver(([entry]) => {
      const view = dioramaView(entry.contentRect.width - 16), { w, scale } = view;
      viewRef.current = view;
      canvas.style.width = `${w * scale}px`;
      canvas.style.height = `${DIORAMA.h * scale}px`;
      // (las etiquetas de debajo, al mismo ancho que el diorama)
      wrap.parentElement?.style.setProperty("--diorama-w", `${w * scale}px`);
      drawRef.current?.({ ...stateRef.current, view, t: performance.now() / 1000 });
    });
    resize.observe(wrap);
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let frame = 0, last = 0;
    const loop = (now) => {
      frame = window.requestAnimationFrame(loop);
      if (now - last < 90 || document.hidden) return;
      last = now;
      drawRef.current({ ...stateRef.current, view: viewRef.current, t: Math.max(0, now) / 1000 });
    };
    if (reduce) drawRef.current({ ...stateRef.current, view: viewRef.current, t: 0 });
    else frame = window.requestAnimationFrame(loop);
    return () => { window.cancelAnimationFrame(frame); resize.disconnect(); };
  }, []);
  // (sin animacion, se repinta al cambiar)
  useEffect(() => { if (drawRef.current && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) drawRef.current({ plots, ghost, wet, view: viewRef.current, t: 0 }); }, [plots, ghost, wet]);
  return <div ref={wrapRef} className="seed-garden-stage"><canvas ref={canvasRef} className="seed-garden-canvas" aria-hidden="true" /></div>;
}

// La cosecha suelta, a `scale` px por pixel de arte (sin escalados raros).
function CropCanvas({ crop, scale = 6 }) {
  const ref = useRef(null);
  useEffect(() => { if (!ref.current) return; drawCropItem(ref.current, crop); ref.current.style.width = `${ref.current.width * scale}px`; }, [crop, scale]);
  return <canvas ref={ref} className="seed-crop-art" aria-hidden="true" />;
}
function StageCanvas({ crop, value }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) drawPlotPreview(ref.current, { crop, growth: value }); }, [crop, value]);
  return <canvas ref={ref} aria-hidden="true" />;
}

function timeLeft(ms) {
  if (ms < 3600000) return `${Math.max(1, Math.ceil(ms / 60000))} min`;
  const hours = Math.max(1, Math.ceil(ms / 3600000));
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24), rest = hours % 24;
  return rest ? `${days} d ${rest} h` : `${days} d`;
}

function useClock(ms) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), ms); return () => clearInterval(timer); }, [ms]);
  return now;
}

export function BuddyGarden({ buddy, onNavigate }) {
  const now = useClock(1000);
  const adventure = buddy.adventure, wallet = adventure.market;
  const plots = gardenPlots(wallet);
  const nextFree = plots.indexOf(null);
  const [hover, setHover] = useState(null);
  const [note, setNote] = useState("");
  const time = now.getTime();
  const entries = plots.map((seed, plot) => (seed ? { plot, seedId: seed.id, crop: seed.crop, growth: growth(seed, time) } : null));
  const wet = wetGardenPlots(entries, readWatered(time), time);
  const saleDay = cropSaleDay(now);
  // (la cesta: cosechas, la gigante al doble, miel y fruta)
  const giantIds = new Set((wallet.giants || []).flatMap((group) => group.ids));
  const extras = basketExtras(wallet);
  const basketCount = CROPS.reduce((sum, crop) => sum + wallet.basket[crop.id], 0) + extras.reduce((sum, entry) => sum + entry.n, 0);
  const basketValue = wallet.seeds.filter((seed) => seed.harvested && !seed.sold && !seed.given).reduce((sum, seed) => sum + cropById(seed.crop).value * (giantIds.has(seed.id) ? 2 : 1), 0)
    + extras.reduce((sum, entry) => sum + entry.n * entry.value, 0);
  const giant = (wallet.giants || []).find((group) => group.ids.every((id) => wallet.garden.some((seed) => seed.id === id)));
  const bagCount = CROPS.reduce((sum, crop) => sum + wallet.bag[crop.id], 0);
  const status = note || (nextFree < 0 ? "Every plot is growing something. Buddy harvests what’s ripe into the basket."
    : bagCount ? `Plot ${nextFree + 1} is free: plant a seed from your bag.` : "Buy a packet of seeds, then plant it in a free plot.");
  return <div className="buddy-market buddy-garden">
    <section className="seed-shed" aria-labelledby="seed-shed-title">
      <div className="market-catalog-heading">
        <div><span className="buddy-modal-kicker">THE GARDEN · MIDDLE OF THE MEADOW</span><h3 id="seed-shed-title">Seed shed</h3></div>
        <dl className="seed-shed-stats">
          <div><dt>Gold</dt><dd><BuddyCoinIcon />{wallet.coins}</dd></div>
          <div><dt>Harvested</dt><dd>{wallet.harvestedCount}</dd></div>
          <div><dt>Sold for</dt><dd><BuddyCoinIcon />{wallet.soldCoins}</dd></div>
        </dl>
      </div>
      <p className="seed-shed-intro">Seeds are on sale any day, up to {SEED_BAG_MAX} of each in your bag. Crops grow in 6–24 hours, even while you’re away. Growing plants dry out after 15 minutes, so Buddy can water them again unless it’s raining. Buddy picks what’s ripe into the basket, ready to sell at Friday’s market for more than the seeds cost.</p>

      <div className="seed-garden">
        <GardenDiorama plots={entries} ghost={nextFree >= 0 ? hover : null} wet={wet} />
        <ol className="seed-garden-tags" aria-label="Garden plots">
          {entries.map((entry, index) => {
            const crop = entry ? cropById(entry.crop) : null;
            const big = giant && entry && giant.ids.includes(entry.seedId);
            const ripe = big ? time >= giant.ripeAt : entry?.growth >= 1;
            return <li key={index} className={`seed-tag ${ripe ? "is-ripe" : entry ? "is-growing" : "is-empty"} ${big ? "is-giant" : ""}`}>
              <small>PLOT {index + 1}</small>
              <strong>{big ? (ripe ? "GIANT pumpkin!" : "Pumpkin…?") : crop ? crop.label : "Empty"}</strong>
              {big && !ripe ? <>
                <span>{entry.growth >= 1 ? "Something big is happening…" : `Ripe in ${timeLeft(ripeAt(plots[index]) - time)}`}</span>
                <i className="seed-tag-meter" style={{ "--fill": Math.min(1, entry.growth) }} aria-hidden="true"><b /></i>
              </> : ripe ? <>
                <span>Ripe! Buddy will pick it soon.</span>
                <button type="button" onClick={() => setNote(adventure.harvest(entry.seedId))}>Pick it</button>
              </> : crop ? <>
                <span>Ripe in {timeLeft(ripeAt(plots[index]) - time)}</span>
                <i className="seed-tag-meter" style={{ "--fill": entry.growth }} aria-hidden="true"><b /></i>
              </> : <span>{hover && index === nextFree ? `${cropById(hover).label} goes here` : "Ready for seeds"}</span>}
            </li>;
          })}
        </ol>
      </div>

      <section className={`seed-basket ${saleDay ? "is-open" : ""}`} aria-labelledby="seed-basket-title">
        <div className="seed-basket-crates">
          <h4 id="seed-basket-title">Harvest basket</h4>
          <ul>
            {CROPS.map((crop) => <li key={crop.id} className={wallet.basket[crop.id] ? "" : "is-empty"}>
              <CropCanvas crop={crop.id} scale={4} />
              <b>×{wallet.basket[crop.id]}</b>
              <small>{crop.value} each</small>
            </li>)}
            {extras.map((entry) => <li key={entry.id} className={entry.n ? "" : "is-empty"}>
              <CropCanvas crop={entry.id} scale={4} />
              <b>×{entry.n}</b>
              <small>{entry.value} each</small>
            </li>)}
          </ul>
        </div>
        <div className="seed-basket-sell">
          <span className="seed-basket-sign">{saleDay ? "FRIDAY MARKET · OPEN" : "FRIDAY MARKET"}</span>
          <strong>{basketCount ? `${basketCount} ${basketCount === 1 ? "item" : "items"} · ${basketValue} gold` : "The basket is empty"}</strong>
          <span>{saleDay ? "Sell today, before midnight." : `Opens in ${timeLeft(nextCropSale(now).getTime() - time)}.`}</span>
          <button type="button" disabled={!saleDay || !basketCount} onClick={() => setNote(adventure.sellCrops())}><ShoppingBag size={13} aria-hidden="true" />{saleDay ? (basketCount ? `Sell all · +${basketValue}` : "Nothing to sell") : "Sells on Friday"}</button>
        </div>
      </section>

      <p className="market-feedback seed-shed-feedback" role="status">{status}</p>
      <div className="seed-packets">
        {CROPS.map((crop, index) => {
          const inBag = wallet.bag[crop.id], short = wallet.coins < crop.price, full = inBag >= SEED_BAG_MAX;
          const preview = { onPointerEnter: () => setHover(crop.id), onPointerLeave: () => setHover(null), onFocus: () => setHover(crop.id), onBlur: () => setHover(null) };
          return <article key={crop.id} className={`seed-packet is-${crop.id}`} {...preview}>
            <div className="seed-packet-face">
              <i className="seed-packet-no" aria-hidden="true">No. {String(index + 1).padStart(2, "0")}</i>
              <span>{crop.label.toUpperCase()}</span>
              <CropCanvas crop={crop.id} />
              <small>SEEDS</small>
            </div>
            <div className="seed-packet-copy">
              <ol className="seed-packet-stages" aria-label={`${crop.label}: sprout to ripe in ${crop.hours} hours`}>
                {STAGE_GROWTHS.map((value) => <li key={value}><StageCanvas crop={crop.id} value={value} /></li>)}
              </ol>
              <p>{crop.description}</p>
              <dl>
                <div><dt>Grows</dt><dd>{crop.hours} hours</dd></div>
                <div><dt>Sells</dt><dd>{crop.value}</dd></div>
                <div className="is-profit"><dt>Profit</dt><dd>+{crop.value - crop.price}</dd></div>
              </dl>
              <div className="seed-packet-bag" aria-label={`${inBag} of ${SEED_BAG_MAX} in your seed bag`}>
                <span>IN BAG</span>
                <span className="seed-packet-pips" aria-hidden="true">{Array.from({ length: SEED_BAG_MAX }, (_, i) => <i key={i} className={i < inBag ? "is-full" : ""} />)}</span>
                <b>{inBag}/{SEED_BAG_MAX}</b>
              </div>
              <div className="seed-packet-buy">
                <span className="seed-packet-price" aria-label={`${crop.price} gold`}><BuddyCoinIcon /><strong>{crop.price}</strong></span>
                <button type="button" disabled={full || short} onClick={() => setNote(adventure.buySeed(crop.id))} aria-label={`Buy ${crop.label.toLowerCase()} seeds for ${crop.price} coins`}>
                  <ShoppingBag size={13} aria-hidden="true" />{full ? "Bag full" : short ? `Need ${crop.price - wallet.coins}` : "Buy"}
                </button>
              </div>
              <button type="button" className="seed-packet-plant" disabled={!inBag || nextFree < 0} onClick={() => setNote(adventure.plantSeed(crop.id))}>
                <Sprout size={13} aria-hidden="true" />{!inBag ? "None in your bag" : nextFree < 0 ? "No free plot" : `Plant in plot ${nextFree + 1}`}
              </button>
            </div>
          </article>;
        })}
      </div>
      <YardShop buddy={buddy} now={time} onMessage={setNote} />
    </section>
    <div className="market-footer"><span>Need coins for seeds?</span><button type="button" onClick={() => onNavigate("market")}>Woodland market ↗</button><button type="button" onClick={() => onNavigate("board")}>Help Wanted ↗</button></div>
  </div>;
}
