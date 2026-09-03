import { useCallback, useEffect, useRef, useState } from "react";
import {
  BookOpenText,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileClock
} from "lucide-react";
import { patchNotes } from "../data/site";

// La vista previa se queda en tres entradas a proposito: quien quiera el resto
// tiene el boton del log completo justo debajo.
const PATCH_ENTRY_PREVIEW_LIMIT = 3;
const VISIBLE_SWAP_CARDS = 5;
const AUTO_SWAP_DELAY = 5200;
const MANUAL_PAUSE_DELAY = 8500;
const PROMOTE_DELAY = 160;
const SWAP_DURATION = 560;

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

function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  return reducedMotion;
}

export function PatchNotes() {
  const [latest] = patchNotes;
  const [activeIndex, setActiveIndex] = useState(0);
  const [outgoingIndex, setOutgoingIndex] = useState(null);
  const [fullLogMode, setFullLogMode] = useState(false);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [manualPaused, setManualPaused] = useState(false);
  const reducedMotion = useReducedMotion();
  const promoteTimerRef = useRef(null);
  const cleanupTimerRef = useRef(null);
  const manualPauseTimerRef = useRef(null);
  const wheelDeltaRef = useRef(0);
  const pointerStartRef = useRef(null);
  const deckRef = useRef(null);
  const detailRef = useRef(null);
  const activePatch = patchNotes[activeIndex];
  const hiddenEntryCount = Math.max(activePatch.entries.length - PATCH_ENTRY_PREVIEW_LIMIT, 0);
  const visibleEntries = fullLogMode
    ? activePatch.entries
    : activePatch.entries.slice(0, PATCH_ENTRY_PREVIEW_LIMIT);
  const changesId = `patch-changes-${activePatch.version.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;

  const holdAutoCycle = useCallback(() => {
    setManualPaused(true);
    window.clearTimeout(manualPauseTimerRef.current);
    manualPauseTimerRef.current = window.setTimeout(() => {
      setManualPaused(false);
    }, MANUAL_PAUSE_DELAY);
  }, []);

  const selectPatch = useCallback(
    (requestedIndex, interaction = "manual") => {
      if (outgoingIndex !== null) return;

      const nextIndex = (requestedIndex + patchNotes.length) % patchNotes.length;
      if (interaction === "manual") holdAutoCycle();
      if (nextIndex === activeIndex) return;

      window.clearTimeout(promoteTimerRef.current);
      window.clearTimeout(cleanupTimerRef.current);

      if (reducedMotion) {
        setActiveIndex(nextIndex);
        return;
      }

      setOutgoingIndex(activeIndex);
      promoteTimerRef.current = window.setTimeout(() => {
        setActiveIndex(nextIndex);
      }, PROMOTE_DELAY);
      cleanupTimerRef.current = window.setTimeout(() => {
        setOutgoingIndex(null);
      }, SWAP_DURATION);
    },
    [activeIndex, holdAutoCycle, outgoingIndex, reducedMotion]
  );

  useEffect(() => {
    if (reducedMotion || hoverPaused || manualPaused || outgoingIndex !== null || fullLogMode) return undefined;

    const autoTimer = window.setTimeout(() => {
      selectPatch(activeIndex + 1, "auto");
    }, AUTO_SWAP_DELAY);

    return () => window.clearTimeout(autoTimer);
  }, [activeIndex, fullLogMode, hoverPaused, manualPaused, outgoingIndex, reducedMotion, selectPatch]);

  useEffect(
    () => () => {
      window.clearTimeout(promoteTimerRef.current);
      window.clearTimeout(cleanupTimerRef.current);
      window.clearTimeout(manualPauseTimerRef.current);
    },
    []
  );

  const openFullLog = () => {
    setFullLogMode(true);
    holdAutoCycle();
  };

  const closeFullLog = () => {
    setFullLogMode(false);
    holdAutoCycle();
  };

  useEffect(() => {
    if (detailRef.current) detailRef.current.scrollTop = 0;
  }, [activeIndex, fullLogMode]);

  const handleWheel = useCallback((event) => {
    event.preventDefault();

    if (outgoingIndex !== null) {
      wheelDeltaRef.current = 0;
      return;
    }

    const wheelDelta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    wheelDeltaRef.current += wheelDelta;
    if (Math.abs(wheelDeltaRef.current) < 28) return;

    const direction = wheelDeltaRef.current > 0 ? 1 : -1;
    wheelDeltaRef.current = 0;
    selectPatch(activeIndex + direction);
  }, [activeIndex, outgoingIndex, selectPatch]);

  useEffect(() => {
    if (fullLogMode) return undefined;

    const deck = deckRef.current;
    if (!deck) return undefined;

    deck.addEventListener("wheel", handleWheel, { passive: false });
    return () => deck.removeEventListener("wheel", handleWheel);
  }, [fullLogMode, handleWheel]);

  const handlePointerDown = (event) => {
    if (event.pointerType !== "touch") return;
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
  };

  const handlePointerUp = (event) => {
    if (!pointerStartRef.current || event.pointerType !== "touch") return;

    const deltaX = event.clientX - pointerStartRef.current.x;
    const deltaY = event.clientY - pointerStartRef.current.y;
    pointerStartRef.current = null;

    if (Math.abs(deltaX) > 34 && Math.abs(deltaX) > Math.abs(deltaY)) {
      selectPatch(activeIndex + (deltaX < 0 ? 1 : -1));
    }
  };

  return (
    <div
      className="patch-console panel-strong"
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      onFocusCapture={() => setHoverPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHoverPaused(false);
      }}
    >
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
        <span>selected build</span>
        <strong>{activePatch.codename}</strong>
        <p>{activePatch.summary}</p>
      </div>

      <nav className="patch-swap-controller" aria-label="Patch version controls">
        <button type="button" onClick={() => selectPatch(activeIndex - 1)} aria-label="Previous patch version">
          <ChevronLeft size={15} aria-hidden="true" />
        </button>
        <label>
          <span>load version</span>
          <select value={activeIndex} onChange={(event) => selectPatch(Number(event.target.value))}>
            {patchNotes.map((patch, index) => (
              <option value={index} key={patch.version}>
                {patch.version} // {patch.codename}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={() => selectPatch(activeIndex + 1)} aria-label="Next patch version">
          <ChevronRight size={15} aria-hidden="true" />
        </button>
        <span className="patch-swap-mode">
          <i aria-hidden="true" />
          {reducedMotion ? "manual mode" : hoverPaused || manualPaused ? "auto paused" : "auto cycling"}
        </span>
      </nav>

      <div className={`patch-swap-workspace${fullLogMode ? " is-reading-full" : ""}`}>
        {!fullLogMode ? (
          <div
            className="patch-swap-deck"
            ref={deckRef}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={() => {
              pointerStartRef.current = null;
            }}
            aria-label="Patch version card stack. Scroll, swipe, or select a card to change versions."
          >
            <div className="patch-swap-guide" aria-hidden="true">
              <span>release archive</span>
              <strong>scroll // swipe</strong>
            </div>
            {patchNotes.map((patch, index) => {
              const slot = (index - activeIndex + patchNotes.length) % patchNotes.length;
              const isOutgoing = index === outgoingIndex;
              const isVisible = slot < VISIBLE_SWAP_CARDS || isOutgoing;
              const isActive = index === activeIndex && !isOutgoing;

              return (
                <button
                  className={`patch-swap-card${isActive ? " is-active" : ""}${isOutgoing ? " is-exiting" : ""}`}
                  type="button"
                  key={patch.version}
                  onClick={() => selectPatch(index)}
                  aria-pressed={isActive}
                  aria-hidden={!isVisible}
                  tabIndex={isVisible ? 0 : -1}
                  style={{
                    "--patch-swap-slot": Math.min(slot, VISIBLE_SWAP_CARDS),
                    zIndex: isOutgoing ? VISIBLE_SWAP_CARDS + 2 : VISIBLE_SWAP_CARDS - slot,
                    opacity: isVisible ? undefined : 0,
                    pointerEvents: isVisible ? undefined : "none"
                  }}
                >
                  <span className="patch-swap-card-index">{String(index + 1).padStart(2, "0")}</span>
                  <span className="patch-swap-card-version">{patch.version}</span>
                  <strong>{patch.codename}</strong>
                  <time dateTime={patch.date || undefined}>{formatPatchDate(patch.date)}</time>
                  <span className="patch-swap-card-summary">{patch.summary}</span>
                  <span className="patch-swap-card-command">{isActive ? "build loaded" : "select build"}</span>
                </button>
              );
            })}
          </div>
        ) : null}

        <article
          ref={detailRef}
          className={`patch-entry patch-swap-detail${fullLogMode ? " is-full-log" : ""}${activeIndex === 0 ? " is-latest" : ""}`}
        >
          {fullLogMode ? (
            <button className="patch-full-log-back" type="button" onClick={closeFullLog}>
              <ChevronLeft size={14} aria-hidden="true" />
              back to version stack
            </button>
          ) : null}
          <span className="patch-entry-node" aria-hidden="true" />
          <header className="patch-entry-head">
            <div className="patch-entry-version">
              <strong>{activePatch.version}</strong>
              <span>"{activePatch.codename}"</span>
            </div>
            {activeIndex === 0 ? <span className="patch-entry-badge">latest</span> : null}
            <time dateTime={activePatch.date || undefined}>{formatPatchDate(activePatch.date)}</time>
          </header>
          {activePatch.summary ? <p className="patch-entry-summary">{activePatch.summary}</p> : null}
          <ul className="patch-entry-changes" id={changesId}>
            {/* El tipo pasa a la fila entera y no solo a la etiqueta: cada
                entrada era un parrafo desnudo sin caja, y en una lista de cinco
                no habia forma de separar una de otra de un vistazo. */}
            {visibleEntries.map(([type, copy], entryIndex) => (
              <li className={`is-${type}`} key={entryIndex}>
                <span className="patch-chip">{PATCH_LABELS[type] || type}</span>
                <p>{copy}</p>
                <i className="patch-entry-index" aria-hidden="true">{String(entryIndex + 1).padStart(2, "0")}</i>
              </li>
            ))}
          </ul>
          {!fullLogMode && hiddenEntryCount > 0 ? (
            <button
              className="patch-entry-read-more"
              type="button"
              onClick={openFullLog}
              aria-expanded={false}
              aria-controls={changesId}
            >
              <BookOpenText size={14} aria-hidden="true" />
              <span>{`read full log (+${hiddenEntryCount})`}</span>
              <ChevronDown size={14} aria-hidden="true" />
            </button>
          ) : null}
        </article>
      </div>

      <footer className="patch-console-readout">
        <span>
          <FileClock size={13} aria-hidden="true" />
          {patchNotes.length} builds logged
        </span>
        <span className="patch-console-dots-trail" aria-hidden="true">··· ··· ···</span>
        <span>
          selected {String(activeIndex + 1).padStart(2, "0")} / {String(patchNotes.length).padStart(2, "0")} // next patch in development
        </span>
      </footer>
    </div>
  );
}
