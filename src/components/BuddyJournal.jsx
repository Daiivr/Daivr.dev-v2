import { useEffect, useRef, useState } from "react";
import { useScrollEdges } from "../hooks/useScrollEdges";
import { bayer, line, px, rect } from "../lib/pixelWorld/core";
import { catchSprite, isCatchArt } from "../lib/pixelWorld/catches";
import { findSprite } from "../lib/pixelWorld/finds";
import { FINDS } from "../lib/pixelWorld/events/creatures";
import { BuddyCollectibleIcon } from "./BuddyCollectibleIcon";
import { PixelIcon } from "./BuddyMenuDecor";

// La pecera del diario en pixel: agua, arena, algas, burbujas y la pieza a
// doble tamaño meciendose (en silueta mientras no se ha encontrado).
const TANK_W = 80, TANK_H = 56;
function specimenSprite(id) {
  if (isCatchArt(id)) return catchSprite(id);
  return findSprite(id) || FINDS()[id] || null;
}
function drawSpecimen(g, t, img, found) {
  for (let y = 0; y < TANK_H; y++) for (let x = 0; x < TANK_W; x++) {
    const f = y < 3 ? 0 : 1 + (y - 3) / (TANK_H - 3) * 3, i = Math.floor(f);
    px(g, x, y, ["#7ad8e8", "#2a8aa2", "#227690", "#1a6280", "#14506c"][Math.min(4, i + (y >= 3 && bayer(x, y) < f - i ? 1 : 0))]);
  }
  rect(g, 0, 49, TANK_W, 7, "#d0b67e"); rect(g, 0, 49, TANK_W, 1, "#e8d4a0");
  for (let x = 1; x < TANK_W; x += 3) px(g, x, 51 + (x % 3), x % 2 ? "#b89a62" : "#f472d0");
  for (const [x0, len] of [[6, 16], [12, 10], [66, 18], [72, 11]]) for (let k = 0; k < len; k++) px(g, x0 + Math.round(Math.sin(t * 1.6 + k * 0.5 + x0) * 1.2), 48 - k, k % 3 ? "#2f8a3a" : "#7ac84a");
  for (let k = 0; k < 5; k++) { const e = (t * 0.45 + k * 0.2) % 1; px(g, 56 + (k % 3), Math.round(47 - e * 42), "#dff8ff"); }
  if (img) {
    const bob = Math.round(Math.sin(t * 1.8) * 1.5), w = img.width * 2, h = img.height * 2;
    if (!found) { g.globalAlpha = 0.35; g.filter = "brightness(0)"; }
    g.drawImage(img, Math.round(TANK_W / 2 - w / 2), Math.round(26 - h / 2) + bob, w, h);
    g.filter = "none"; g.globalAlpha = 1;
  }
  g.globalAlpha = 0.3; line(g, 4, 2, 14, 22, "#ffffff"); g.globalAlpha = 1;
}
function SpecimenTank({ id, found }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current, g = canvas?.getContext("2d");
    if (!g) return undefined;
    g.imageSmoothingEnabled = false;
    const img = specimenSprite(id);
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const t0 = performance.now();
    let frame = 0, last = -Infinity;
    drawSpecimen(g, 0, img, found);
    if (reduce) return undefined;
    const tick = (now) => {
      frame = requestAnimationFrame(tick);
      if (now - last < 50) return;
      last = now;
      drawSpecimen(g, Math.max(0, (now - t0) / 1000), img, found);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [id, found]);
  return <canvas ref={ref} className="buddy-specimen-canvas" width={TANK_W} height={TANK_H} aria-hidden="true" />;
}

// Los catalogos se hojean igual, asi que comparten reja y ficha en vez de
// vivir en secciones con maquetas distintas.
const ARCHIVE_SETS = {
  fish: {
    label: "Fish",
    kicker: "void archive",
    unknownName: "Unknown species",
    unknownNote: "Not scanned yet. Keep fishing the footer void and it will end up here.",
    source: "Void fishing",
    tag: (entry) => entry.rarity,
    note: (entry) => entry.lore
  },
  // Los peces de Stardew: salen de la misma caña, pero pican mas en su
  // estacion, a sus horas y con su tiempo (la ficha lo chiva mientras faltan).
  valley: {
    label: "Valley",
    kicker: "valley journal",
    unknownName: "Uncaught valley fish",
    unknownNote: "Not caught yet. Valley fish bite more in their own season, hours and weather.",
    tag: (entry) => entry.rarity,
    note: (entry) => entry.lore
  },
  finds: {
    label: "Patrol finds",
    kicker: "footer scanner",
    unknownName: "Unknown signal",
    unknownNote: "Buddy has not turned this one up yet. It shows up while patrolling the footer.",
    source: "Footer patrol",
    tag: () => "recovered",
    note: (entry) => entry.line
  }
};

const STATE_FILTERS = [
  { id: "all", label: "All" },
  { id: "discovered", label: "Found" },
  { id: "unknown", label: "Missing" }
];
const RARITIES = ["common", "uncommon", "rare", "legendary", "mythic", "junk", "treasure"];

// Cuando pica mejor cada pez del valle, en palabras (horas pasada la
// medianoche como 26 = 2am).
const SEASON_NAMES = { spring: "Spring", summer: "Summer", fall: "Fall", winter: "Winter" };
const clock = (hour) => { const h = hour % 24; return `${h % 12 || 12}${h < 12 ? "am" : "pm"}`; };
function valleyFacts(entry) {
  return [
    ["Where", entry.habitat],
    ["Season", entry.seasons.length >= 4 ? "Any season" : entry.seasons.map((season) => SEASON_NAMES[season]).join(", ")],
    ["Time", entry.hours ? `${clock(entry.hours[0])} – ${clock(entry.hours[1])}` : "Any time"],
    ["Weather", entry.weather === "rain" ? "Rain" : entry.weather === "sun" ? "Sunny" : "Any"]
  ];
}

// La ficha grande: una sola copia del texto que antes se repetia en cada
// casilla sin escanear, ahora con sitio para leerse.
function SpecimenFile({ entry, set }) {
  if (!entry) return null;
  const tag = entry.discovered ? set.tag(entry) : "unscanned";

  return (
    <div className="buddy-specimen">
      <div className="buddy-section-heading">
        <span className="buddy-modal-kicker">{set.kicker}</span>
        {entry.discovered ? <span className="buddy-specimen-count">×{entry.count}</span> : null}
      </div>
      <div className={`buddy-preview-screen buddy-specimen-tank ${entry.discovered ? "is-discovered" : ""}`} style={{ "--journal-color": entry.discovered ? entry.color : "#517366" }}>
        {specimenSprite(entry.id) ? <SpecimenTank id={entry.id} found={entry.discovered} /> : <BuddyCollectibleIcon className="buddy-specimen-art" id={entry.id} color={entry.color} unknown={!entry.discovered} />}
      </div>
      <div className="buddy-specimen-file">
        <span className={`buddy-specimen-tag rarity-${tag}`}>{tag}</span>
        <strong>{entry.discovered ? entry.name : set.unknownName}</strong>
        <p>{entry.discovered ? set.note(entry) : set.unknownNote}</p>
        {entry.set === "valley" ? (
          <dl className="buddy-specimen-facts is-valley">
            {entry.discovered ? <div><dt>Collected</dt><dd>{entry.count} {entry.count === 1 ? "time" : "times"}</dd></div> : null}
            {valleyFacts(entry).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>
        ) : entry.discovered ? <dl className="buddy-specimen-facts"><div><dt>Collected</dt><dd>{entry.count} {entry.count === 1 ? "time" : "times"}</dd></div><div><dt>Source</dt><dd>{set.source}</dd></div></dl> : null}
      </div>
    </div>
  );
}

export function BuddyJournal({ buddy }) {
  const pageRef = useScrollEdges();
  const stageRef = useScrollEdges();
  const gridRef = useScrollEdges();
  const [dataset, setDataset] = useState("fish");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [rarity, setRarity] = useState("all");
  const [sort, setSort] = useState("catalogue");

  const set = ARCHIVE_SETS[dataset];
  const total = buddy.adventure.stationFishTotal;
  const discovered = buddy.adventure.discoveredFishCount;
  const valleyTotal = buddy.adventure.valleyFishTotal;
  const valleyFound = buddy.adventure.discoveredValleyCount;
  const isValley = dataset === "valley";
  const finds = buddy.adventure.finds.length;
  const foundCount = buddy.adventure.discoveredFindCount;
  const pct = (value, max) => (max ? Math.round((value / max) * 100) : 0);

  const entries = dataset === "finds" ? buddy.adventure.finds
    : buddy.adventure.fishJournal.filter((entry) => entry.set === (isValley ? "valley" : "station"));
  const foundInSet = entries.filter((entry) => entry.discovered).length;
  const stateCounts = { all: entries.length, discovered: foundInSet, unknown: entries.length - foundInSet };

  const visible = entries.filter((entry) => {
    const matchesFilter = filter === "all" || (filter === "discovered" ? entry.discovered : !entry.discovered);
    const searchable = entry.discovered
      ? `${entry.name} ${set.tag(entry)} ${set.note(entry) || ""}`
      : `${set.unknownName} unscanned missing`;
    return matchesFilter && (rarity === "all" || dataset === "finds" || (entry.discovered && entry.rarity === rarity)) && searchable.toLowerCase().includes(query.trim().toLowerCase());
  }).sort((a, b) => sort === "count" ? b.count - a.count : sort === "name" ? (a.discovered ? a.name : "zzz").localeCompare(b.discovered ? b.name : "zzz") : 0);

  // El id elegido puede quedarse fuera al cambiar de catalogo o de filtro: la
  // ficha cae hacia el primer hallazgo real para no abrir en un hueco vacio.
  const selected = visible.find((entry) => entry.id === selectedId)
    || visible.find((entry) => entry.discovered)
    || visible[0];

  return (
    <div className="buddy-journal" ref={pageRef}>
      <div className="buddy-journal-stage" ref={stageRef}>
        <SpecimenFile entry={selected} set={set} />
        <div className="buddy-journal-summary"><span>Total catches<strong>{buddy.adventure.totalCatches}</strong></span><span>Rare catches<strong>{buddy.adventure.rareCatches}</strong></span><span>{isValley ? "Valley" : "Catalogue"}<strong>{isValley ? pct(valleyFound, valleyTotal) : pct(discovered, total)}%</strong></span></div>

        <div className="buddy-journal-progress">
          <div className="buddy-section-heading"><h3>Archive progress</h3></div>
          {isValley ? (buddy.adventure.completeValleyForTesting ? <button type="button" className="buddy-journal-test" disabled={buddy.adventure.valleyComplete} onClick={buddy.adventure.completeValleyForTesting}>{buddy.adventure.valleyComplete ? "Test valley complete" : "Complete valley for testing"}</button> : null)
            : buddy.adventure.completeJournalForTesting ? <button type="button" className="buddy-journal-test" disabled={buddy.adventure.journalComplete} onClick={buddy.adventure.completeJournalForTesting}>{buddy.adventure.journalComplete ? "Test journal complete" : "Complete journal for testing"}</button> : null}
          {/* (el diario de siempre abre NZ:P y lo de Miku; el del valle, el traje de pescador) */}
          <p className="buddy-journal-reward" role="status">{isValley
            ? (buddy.adventure.valleyComplete ? "Fisherman outfit unlocked — Buddy can wear it from the costume slot." : "Catch every valley fish to unlock the fisherman outfit.")
            : (buddy.adventure.journalComplete ? "NZ:P unlocked — find your new cartridge in the secret game library." : "Complete every catch and patrol find to unlock NZ:P in the secret game library.")}</p>
          <div className="buddy-journal-meters">
            <div>
              <PixelIcon name="fish" />
              <span>species scanned</span>
              <b>{discovered}<small> / {total}</small></b>
              <i className="buddy-journal-meter" aria-hidden="true"><b style={{ width: `${pct(discovered, total)}%` }} /></i>
            </div>
            <div>
              <PixelIcon name="search" />
              <span>patrol finds</span>
              <b>{foundCount}<small> / {finds}</small></b>
              <i className="buddy-journal-meter" aria-hidden="true"><b style={{ width: `${pct(foundCount, finds)}%` }} /></i>
            </div>
            <div>
              <PixelIcon name="fish" />
              <span>valley fish</span>
              <b>{valleyFound}<small> / {valleyTotal}</small></b>
              <i className="buddy-journal-meter" aria-hidden="true"><b style={{ width: `${pct(valleyFound, valleyTotal)}%` }} /></i>
            </div>
          </div>
          <div className="buddy-journal-tallies">
            <span><PixelIcon name="radar" />leviathan sightings<b>{buddy.adventure.leviathanSightings}</b></span>
            {buddy.adventure.krakenSightings > 0 ? <span><PixelIcon name="radar" />kraken sightings<b>{buddy.adventure.krakenSightings}</b></span> : null}
            <span><PixelIcon name="bug" />bugs deleted<b>{buddy.adventure.bugsDefeated}</b></span>
          </div>
        </div>
      </div>

      <div className="buddy-archive-panel">
        <div className="buddy-section-heading">
          <div>
            <span className="buddy-modal-kicker">{set.kicker}</span>
            <h3>{set.label} <b>{entries.length}</b></h3>
          </div>
          <span>Pick an entry to read its file</span>
        </div>

        <div className="buddy-journal-toolbar">
          <div className="buddy-loot-filters is-dataset" role="group" aria-label="Archive catalogue">
            {Object.entries(ARCHIVE_SETS).map(([id, item]) => (
              <button
                className={`buddy-loot-filter ${dataset === id ? "is-active" : ""}`}
                type="button"
                key={id}
                onClick={() => { setDataset(id); setRarity("all"); setQuery(""); setSelectedId(""); }}
                aria-pressed={dataset === id}
              >
                {item.label}
                <b>{id === "fish" ? total : id === "valley" ? valleyTotal : finds}</b>
              </button>
            ))}
          </div>
          <div className="buddy-loot-filters" role="group" aria-label="Filter entries">
            {STATE_FILTERS.map((item) => (
              <button
                className={`buddy-loot-filter ${filter === item.id ? "is-active" : ""}`}
                type="button"
                key={item.id}
                onClick={() => setFilter(item.id)}
                aria-pressed={filter === item.id}
              >
                {item.label}
                <b>{stateCounts[item.id]}</b>
              </button>
            ))}
          </div>
          <label className="buddy-journal-search">
            <PixelIcon name="search" />
            <input
              type="search"
              aria-label="Search journal"
              placeholder="Search your discoveries…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>
        <div className="buddy-journal-sortbar"><span>{visible.length} entries in view</span>{dataset !== "finds" ? <label>Rarity<select aria-label="Filter journal rarity" value={rarity} onChange={(event) => setRarity(event.target.value)}><option value="all">All rarities</option>{RARITIES.map((value) => <option key={value}>{value}</option>)}</select></label> : null}<label>Sort<select aria-label="Sort journal" value={sort} onChange={(event) => setSort(event.target.value)}><option value="catalogue">Catalogue</option><option value="count">Most caught</option><option value="name">Name</option></select></label></div>

        <div className="buddy-archive-scroll" ref={gridRef}>
          <div className="buddy-archive-grid">
            {visible.length ? visible.map((entry) => {
              const tag = entry.discovered ? set.tag(entry) : "unknown";
              return (
                <button
                  className={`buddy-archive-tile rarity-${tag} ${entry.discovered ? "is-found" : "is-unknown"} ${entry.id === selected?.id ? "is-selected" : ""}`}
                  style={{ "--journal-color": entry.color }}
                  type="button"
                  key={entry.id}
                  onClick={() => setSelectedId(entry.id)}
                  onFocus={() => setSelectedId(entry.id)}
                  aria-current={entry.id === selected?.id ? "true" : undefined}
                >
                  <span className="buddy-archive-art"><BuddyCollectibleIcon id={entry.id} color={entry.color} unknown={!entry.discovered} /></span>
                  <span>{entry.discovered ? entry.name : "???"}</span>
                  <small className="buddy-archive-rarity">{entry.discovered ? tag : "undiscovered"}</small>
                  {entry.discovered && entry.count > 1 ? <b>×{entry.count}</b> : null}
                </button>
              );
            }) : (
              <div className="buddy-loot-empty">
                <PixelIcon name="search" />
                <strong>{query ? "No matching discoveries" : "Nothing here yet"}</strong>
                <p>{query ? "Try another name or rarity, or choose a different filter." : set.unknownNote}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
