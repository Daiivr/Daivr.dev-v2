import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, FileClock } from "lucide-react";
import { patchNotes } from "../data/site";

const PATCHES_PER_PAGE = 3;

const PATCH_LABELS = {
  new: "new drop",
  buff: "buff",
  fix: "hotfix",
  nerf: "nerf",
  known: "known issue"
};

function formatPatchDate(date) {
  if (!date) return "date lost to the static";
  return date.replaceAll("-", ".");
}

export function PatchNotes() {
  const [latest] = patchNotes;
  const [activePage, setActivePage] = useState(0);
  const pageCount = Math.ceil(patchNotes.length / PATCHES_PER_PAGE);
  const pageStart = activePage * PATCHES_PER_PAGE;
  const visiblePatches = useMemo(
    () => patchNotes.slice(pageStart, pageStart + PATCHES_PER_PAGE),
    [pageStart]
  );

  const goToPage = (page) => {
    setActivePage(Math.min(Math.max(page, 0), pageCount - 1));
  };

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

      <div className="patch-personality-readout">
        <span>balance notes</span>
        <strong>{latest.codename}</strong>
        <p>{latest.summary}</p>
      </div>

      {pageCount > 1 ? (
        <nav className="patch-console-pagination" aria-label="Patch notes pages">
          <button
            className="patch-page-arrow"
            type="button"
            onClick={() => goToPage(activePage - 1)}
            disabled={activePage === 0}
            aria-label="Previous patch notes page"
          >
            <ChevronLeft size={14} aria-hidden="true" />
          </button>
          <div className="patch-page-list">
            {Array.from({ length: pageCount }, (_, page) => (
              <button
                key={page}
                className="patch-page-button"
                type="button"
                onClick={() => goToPage(page)}
                aria-current={page === activePage ? "page" : undefined}
              >
                {String(page + 1).padStart(2, "0")}
              </button>
            ))}
          </div>
          <button
            className="patch-page-arrow"
            type="button"
            onClick={() => goToPage(activePage + 1)}
            disabled={activePage === pageCount - 1}
            aria-label="Next patch notes page"
          >
            <ChevronRight size={14} aria-hidden="true" />
          </button>
          <span className="patch-page-readout">
            page {String(activePage + 1).padStart(2, "0")} / {String(pageCount).padStart(2, "0")}
          </span>
        </nav>
      ) : null}

      <ol className="patch-console-list">
        {visiblePatches.map((patch, index) => {
          const patchIndex = pageStart + index;

          return (
            <li className={`patch-entry ${patchIndex === 0 ? "is-latest" : ""}`} key={patch.version}>
              <span className="patch-entry-node" aria-hidden="true" />
              <header className="patch-entry-head">
                <div className="patch-entry-version">
                  <strong>{patch.version}</strong>
                  <span>"{patch.codename}"</span>
                </div>
                {patchIndex === 0 ? <span className="patch-entry-badge">latest</span> : null}
                <time dateTime={patch.date || undefined}>{formatPatchDate(patch.date)}</time>
              </header>
              {patch.summary ? <p className="patch-entry-summary">{patch.summary}</p> : null}
              <ul className="patch-entry-changes">
                {patch.entries.map(([type, text], entryIndex) => (
                  <li key={entryIndex}>
                    <span className={`patch-chip is-${type}`}>{PATCH_LABELS[type] || type}</span>
                    <p>{text}</p>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>

      <footer className="patch-console-readout">
        <span>
          <FileClock size={13} aria-hidden="true" />
          {patchNotes.length} builds logged
        </span>
        <span className="patch-console-dots-trail" aria-hidden="true">··· ··· ···</span>
        <span>
          showing {pageStart + 1}-{Math.min(pageStart + visiblePatches.length, patchNotes.length)} // next patch in development
        </span>
      </footer>
    </div>
  );
}
