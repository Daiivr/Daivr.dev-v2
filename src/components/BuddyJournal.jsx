import { useState } from "react";
import { Bug, Fish, PackageSearch, Radar, Search } from "lucide-react";
import { FISH_CATALOG } from "../data/buddyWorld";
import { useScrollEdges } from "../hooks/useScrollEdges";
import { BuddyCollectibleIcon } from "./BuddyCollectibleIcon";

// Los dos catalogos se hojean igual, asi que comparten reja y ficha en vez de
// vivir en dos secciones con maquetas distintas.
const ARCHIVE_SETS = {
  fish: {
    label: "Fish",
    kicker: "void archive",
    unknownName: "Unknown species",
    unknownNote: "Not scanned yet. Keep fishing the footer void and it will end up here.",
    tag: (entry) => entry.rarity,
    note: (entry) => entry.lore
  },
  finds: {
    label: "Patrol finds",
    kicker: "footer scanner",
    unknownName: "Unknown signal",
    unknownNote: "Buddy has not turned this one up yet. It shows up while patrolling the footer.",
    tag: () => "recovered",
    note: (entry) => entry.line
  }
};

const STATE_FILTERS = [
  { id: "all", label: "All" },
  { id: "discovered", label: "Found" },
  { id: "unknown", label: "Missing" }
];

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
      <div className="buddy-preview-screen" style={{ "--journal-color": entry.color }}>
        <BuddyCollectibleIcon
          className="buddy-specimen-art"
          id={entry.id}
          color={entry.color}
          unknown={!entry.discovered}
        />
      </div>
      <div className="buddy-specimen-file">
        <span className={`buddy-specimen-tag rarity-${tag}`}>{tag}</span>
        <strong>{entry.discovered ? entry.name : set.unknownName}</strong>
        <p>{entry.discovered ? set.note(entry) : set.unknownNote}</p>
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

  const set = ARCHIVE_SETS[dataset];
  const total = FISH_CATALOG.length;
  const discovered = buddy.adventure.discoveredFishCount;
  const finds = buddy.adventure.finds.length;
  const foundCount = buddy.adventure.discoveredFindCount;
  const pct = (value, max) => (max ? Math.round((value / max) * 100) : 0);

  const entries = dataset === "fish" ? buddy.adventure.fishJournal : buddy.adventure.finds;
  const foundInSet = entries.filter((entry) => entry.discovered).length;
  const stateCounts = { all: entries.length, discovered: foundInSet, unknown: entries.length - foundInSet };

  const visible = entries.filter((entry) => {
    const matchesFilter = filter === "all" || (filter === "discovered" ? entry.discovered : !entry.discovered);
    const searchable = entry.discovered
      ? `${entry.name} ${set.tag(entry)} ${set.note(entry) || ""}`
      : `${set.unknownName} unscanned missing`;
    return matchesFilter && searchable.toLowerCase().includes(query.trim().toLowerCase());
  });

  // El id elegido puede quedarse fuera al cambiar de catalogo o de filtro: la
  // ficha cae hacia el primer hallazgo real para no abrir en un hueco vacio.
  const selected = entries.find((entry) => entry.id === selectedId)
    || entries.find((entry) => entry.discovered)
    || entries[0];

  return (
    <div className="buddy-journal" ref={pageRef}>
      <div className="buddy-journal-stage" ref={stageRef}>
        <SpecimenFile entry={selected} set={set} />

        <div className="buddy-journal-progress">
          <div className="buddy-section-heading"><h3>Archive progress</h3></div>
          <div className="buddy-journal-meters">
            <div>
              <Fish size={15} aria-hidden="true" />
              <span>species scanned</span>
              <b>{discovered}<small> / {total}</small></b>
              <i className="buddy-journal-meter" aria-hidden="true"><b style={{ width: `${pct(discovered, total)}%` }} /></i>
            </div>
            <div>
              <PackageSearch size={15} aria-hidden="true" />
              <span>patrol finds</span>
              <b>{foundCount}<small> / {finds}</small></b>
              <i className="buddy-journal-meter" aria-hidden="true"><b style={{ width: `${pct(foundCount, finds)}%` }} /></i>
            </div>
          </div>
          <div className="buddy-journal-tallies">
            <span><Radar size={14} aria-hidden="true" />leviathan sightings<b>{buddy.adventure.leviathanSightings}</b></span>
            <span><Bug size={14} aria-hidden="true" />bugs deleted<b>{buddy.adventure.bugsDefeated}</b></span>
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
                onClick={() => setDataset(id)}
                aria-pressed={dataset === id}
              >
                {item.label}
                <b>{id === "fish" ? total : finds}</b>
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
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              aria-label="Search journal"
              placeholder="Search your discoveries…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>

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
                  <BuddyCollectibleIcon id={entry.id} color={entry.color} unknown={!entry.discovered} />
                  <span>{entry.discovered ? entry.name : "???"}</span>
                  {entry.discovered && entry.count > 1 ? <b>×{entry.count}</b> : null}
                </button>
              );
            }) : (
              <div className="buddy-loot-empty">
                <Search size={28} aria-hidden="true" />
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
