import { Fish, PackageSearch, Radar } from "lucide-react";
import { FISH_CATALOG } from "../data/buddyWorld";
import { BuddyCollectibleIcon } from "./BuddyCollectibleIcon";

// La misma frase de veintiséis caracteres repetida en cada casilla sin escanear
// llenaba la reja de texto identico y enterraba las especies ya encontradas. La
// instruccion sube una vez a la cabecera de la seccion y la casilla vacia se
// queda con lo unico que la distingue: su silueta.
function JournalFish({ item }) {
  return (
    <article className={`buddy-journal-card rarity-${item.rarity} ${item.discovered ? "is-discovered" : "is-unknown"}`} style={{ "--journal-color": item.color }}>
      <div className={`buddy-journal-silhouette kind-${item.kind}`} style={{ "--journal-color": item.color }}>
        <BuddyCollectibleIcon id={item.id} color={item.color} unknown={!item.discovered} />
      </div>
      <div>
        <span>{item.discovered ? item.rarity : "unscanned"}</span>
        <strong>{item.discovered ? item.name : "???"}</strong>
        {item.discovered ? <p>{item.lore}</p> : null}
      </div>
      <b>{item.discovered ? `×${item.count}` : "—"}</b>
    </article>
  );
}

export function BuddyJournal({ buddy }) {
  const discovered = buddy.adventure.discoveredFishCount;
  const total = FISH_CATALOG.length;
  const finds = buddy.adventure.finds.length;
  const foundCount = buddy.adventure.discoveredFindCount;
  const pct = (value, max) => (max ? Math.round((value / max) * 100) : 0);

  return (
    <div className="buddy-journal">
      <section className="buddy-journal-summary" aria-label="Fishing journal progress">
        {/* Dos de los tres contadores son "x de y" y no mostraban ese avance en
            ninguna parte salvo el propio texto. */}
        <div>
          <Fish size={22} aria-hidden="true" />
          <span>species scanned</span>
          <strong>{discovered}/{total}</strong>
          <i className="buddy-journal-meter" aria-hidden="true"><b style={{ width: `${pct(discovered, total)}%` }} /></i>
        </div>
        <div>
          <Radar size={22} aria-hidden="true" />
          <span>leviathan sightings</span>
          <strong>{buddy.adventure.leviathanSightings}</strong>
        </div>
        <div>
          <PackageSearch size={22} aria-hidden="true" />
          <span>patrol finds</span>
          <strong>{foundCount}/{finds}</strong>
          <i className="buddy-journal-meter" aria-hidden="true"><b style={{ width: `${pct(foundCount, finds)}%` }} /></i>
        </div>
      </section>

      <section className="buddy-journal-section is-fish-catalog" aria-labelledby="fish-catalog-title">
        <header>
          <span>VOID_ARCHIVE</span>
          <h3 id="fish-catalog-title">Fish &amp; recovered objects</h3>
          <p className="buddy-journal-hint">Keep fishing the footer void to identify the remaining silhouettes.</p>
        </header>
        <div className="buddy-journal-grid">
          {buddy.adventure.fishJournal.map((item) => <JournalFish item={item} key={item.id} />)}
        </div>
      </section>

      <section className="buddy-journal-section" aria-labelledby="patrol-finds-title">
        <header>
          <span>FOOTER_SCANNER</span>
          <h3 id="patrol-finds-title">Patrol finds</h3>
        </header>
        <div className="buddy-find-ledger">
          {buddy.adventure.finds.map((item) => (
            <article className={item.discovered ? "is-discovered" : "is-unknown"} key={item.id}>
              <BuddyCollectibleIcon id={item.id} color={item.color} unknown={!item.discovered} />
              <strong>{item.discovered ? item.name : "unknown signal"}</strong>
              <span>{item.discovered ? `×${item.count}` : "not found"}</span>
            </article>
          ))}
        </div>
        <p className="buddy-bug-total">HOSTILE BUGS DELETED: <b>{buddy.adventure.bugsDefeated}</b></p>
      </section>
    </div>
  );
}
