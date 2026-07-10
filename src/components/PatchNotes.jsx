import { FileClock } from "lucide-react";
import { patchNotes } from "../data/site";

function formatPatchDate(date) {
  if (!date) return "date lost to the static";
  return date.replaceAll("-", ".");
}

export function PatchNotes() {
  const [latest] = patchNotes;

  return (
    <div className="patch-console panel-strong">
      <header className="patch-console-titlebar">
        <div className="patch-console-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <span>~/daivr/patch-notes.sh</span>
        <strong>
          <span />
          firmware {latest.version}
        </strong>
      </header>

      <ol className="patch-console-list">
        {patchNotes.map((patch, index) => (
          <li className={`patch-entry ${index === 0 ? "is-latest" : ""}`} key={patch.version}>
            <span className="patch-entry-node" aria-hidden="true" />
            <header className="patch-entry-head">
              <div className="patch-entry-version">
                <strong>{patch.version}</strong>
                <span>"{patch.codename}"</span>
              </div>
              {index === 0 ? <span className="patch-entry-badge">latest</span> : null}
              <time dateTime={patch.date || undefined}>{formatPatchDate(patch.date)}</time>
            </header>
            {patch.summary ? <p className="patch-entry-summary">{patch.summary}</p> : null}
            <ul className="patch-entry-changes">
              {patch.entries.map(([type, text], entryIndex) => (
                <li key={entryIndex}>
                  <span className={`patch-chip is-${type}`}>{type}</span>
                  <p>{text}</p>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <footer className="patch-console-readout">
        <span>
          <FileClock size={13} aria-hidden="true" />
          {patchNotes.length} builds logged
        </span>
        <span className="patch-console-dots-trail" aria-hidden="true">··· ··· ···</span>
        <span>next patch // in development</span>
      </footer>
    </div>
  );
}
