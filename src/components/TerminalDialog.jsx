import "../styles/terminal-dialog.css";
import * as Dialog from "@radix-ui/react-dialog";
import { Activity, CircleHelp, CornerDownLeft, FolderCode, Gamepad2, Grip, Palette, Play, Radio, ScanLine, SquareTerminal, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCabinetSignal } from "../lib/cabinetSignals";
import { commandSummary, terminalSuggestions } from "../lib/terminalCommands";

// El historial sobrevive a recargas: es lo primero que se echa en falta al
// volver a abrir una consola.
const HISTORY_KEY = "daivr.terminalHistory.v1";
const HISTORY_LIMIT = 40;

function loadHistory() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter((item) => typeof item === "string" && item.length <= 200).slice(0, HISTORY_LIMIT) : [];
  } catch {
    return [];
  }
}

// Los botones de la recreativa: cada uno con su color y su icono.
const QUICK_COMMANDS = [
  { name: "help", icon: CircleHelp, tone: "phosphor" },
  { name: "status", icon: Activity, tone: "cyan" },
  { name: "scan", icon: ScanLine, tone: "cabinet" },
  { name: "theme", icon: Palette, tone: "glitch" },
  { name: "run", icon: Play, tone: "phosphor" },
  { name: "attract", icon: Gamepad2, tone: "cyan" }
];

// El mismo color sigue al comando en la transcripcion, para que cada entrada
// se reconozca de un vistazo. Lo que no esta en la lista va en fosforo.
const COMMAND_TONES = {
  ...Object.fromEntries(QUICK_COMMANDS.map((item) => [item.name, item.tone])),
  play: "glitch", goto: "cyan", open: "cabinet", ls: "cyan", passport: "cabinet", rank: "cabinet",
  sound: "glitch", weather: "cyan", version: "cyan", visits: "cabinet", whoami: "glitch", now: "glitch",
  discord: "cyan", contact: "glitch", date: "cyan", echo: "phosphor"
};

function lineTone(line) {
  if (/error|not found|denied|offline/i.test(line)) return "is-error";
  if (/online|ready|active|accepted|complete|nominal|success/i.test(line)) return "is-success";
  if (/^\s*(tip|hint|usage):/i.test(line)) return "is-hint";
  if (/^[─═┌└│>]/.test(line)) return "is-system";
  return "";
}

// El log llega como un solo texto (App.runCommand): el saludo de arranque y
// despues "$ comando" con su respuesta, separados por una linea en blanco.
// Se vuelve a partir en entradas para pintar cada comando con su respuesta.
function parseTranscript(log) {
  if (!log) return [{ command: null, lines: ["Output buffer cleared. Terminal ready."] }];
  const blocks = [];
  let current = null;
  for (const text of log.split("\n")) {
    if (text.startsWith("$ ")) {
      current = { command: text.slice(2), lines: [] };
      blocks.push(current);
    } else {
      if (!current) {
        current = { command: null, lines: [] };
        blocks.push(current);
      }
      current.lines.push(text);
    }
  }
  for (const block of blocks) {
    while (block.lines.length && !block.lines.at(-1).trim()) block.lines.pop();
  }
  return blocks;
}

function blockTone(block) {
  if (!block.command) return "boot";
  if (block.lines.some((line) => /not found|no cartridge called|unknown command/i.test(line))) return "danger";
  return COMMAND_TONES[block.command.trim().split(/\s+/)[0].toLowerCase()] || "phosphor";
}

const pad = (value) => String(value).padStart(2, "0");

export function TerminalDialog({ open, onOpenChange, onCommand, log, theme }) {
  const [value, setValue] = useState("");
  const [history, setHistory] = useState(loadHistory);
  const player = useCabinetSignal("player");
  const isAdmin = player?.user?.isAdmin === true;
  const operator = String(player?.user?.username || "guest").toLowerCase().replace(/[^a-z0-9_.-]/g, "").slice(0, 16) || "guest";
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef(null);
  const outputRef = useRef(null);
  const windowRef = useRef(null);
  const dragRef = useRef(null);
  const [position, setPosition] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  // La sesion cuenta desde que la consola se monta (la primera vez que se abre).
  const sessionStart = useRef(Date.now());
  const [now, setNow] = useState(() => Date.now());

  function clampPosition(x, y) {
    const terminal = windowRef.current;
    if (!terminal) return { x, y };

    const edge = window.innerWidth <= 700 ? 8 : 12;
    return {
      x: Math.min(Math.max(edge, x), Math.max(edge, window.innerWidth - terminal.offsetWidth - edge)),
      y: Math.min(Math.max(edge, y), Math.max(edge, window.innerHeight - terminal.offsetHeight - edge))
    };
  }

  // Los comandos de diagnostico y de admin solo se sugieren a admins con sesion.
  const suggestions = useMemo(() => terminalSuggestions(value, { admin: isAdmin }), [isAdmin, value]);
  const blocks = useMemo(() => parseTranscript(log), [log]);
  const commandCount = blocks.filter((block) => block.command).length;
  const lineCount = blocks.reduce((total, block) => total + block.lines.length + (block.command ? 1 : 0), 0);

  // La sugerencia buena se escribe en gris detras del cursor, como en fish:
  // Tab la acepta.
  const top = suggestions[0]?.value || "";
  const ghost = value && top.length > value.length && top.toLowerCase().startsWith(value.toLowerCase()) ? top.slice(value.length) : "";

  useEffect(() => {
    try {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
      // Sin almacenamiento el historial dura lo que la pestana.
    }
  }, [history]);

  useEffect(() => {
    if (!open) return undefined;
    const focusTimer = window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 40);
    return () => window.clearTimeout(focusTimer);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    setNow(Date.now());
    const clock = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(clock);
  }, [open]);

  useEffect(() => {
    if (open) outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight });
  }, [log, open]);

  useEffect(() => {
    if (!open || !position) return undefined;

    const keepInsideViewport = () => setPosition((current) => (
      current ? clampPosition(current.x, current.y) : current
    ));
    window.addEventListener("resize", keepInsideViewport);
    keepInsideViewport();
    return () => window.removeEventListener("resize", keepInsideViewport);
  }, [open, position !== null]);

  function startDrag(event) {
    if (event.button !== 0 || event.target.closest("button")) return;

    const terminal = windowRef.current;
    if (!terminal) return;
    const rect = terminal.getBoundingClientRect();
    const origin = position || { x: rect.left, y: rect.top };

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: origin.x,
      originY: origin.y
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setPosition(origin);
    setIsDragging(true);
    event.preventDefault();
  }

  function moveDrag(event) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setPosition(clampPosition(
      drag.originX + event.clientX - drag.startX,
      drag.originY + event.clientY - drag.startY
    ));
  }

  function endDrag(event) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
    setIsDragging(false);
  }

  function execute(command) {
    const next = String(command || "").trim();
    if (!next) return;
    setHistory((current) => [next, ...current.filter((item) => item !== next)].slice(0, HISTORY_LIMIT));
    setHistoryIndex(-1);
    onCommand(next);
    setValue("");
    inputRef.current?.focus({ preventScroll: true });
  }

  function submitCommand(event) {
    event.preventDefault();
    execute(value);
  }

  function handleInputKeyDown(event) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "l") {
      event.preventDefault();
      execute("clear");
      return;
    }

    if (event.key === "Tab" && suggestions.length) {
      event.preventDefault();
      setValue(suggestions[0].value);
      return;
    }

    if (event.key === "ArrowUp" && history.length) {
      event.preventDefault();
      const nextIndex = Math.min(history.length - 1, historyIndex + 1);
      setHistoryIndex(nextIndex);
      setValue(history[nextIndex]);
      return;
    }

    if (event.key === "ArrowDown" && historyIndex >= 0) {
      event.preventDefault();
      const nextIndex = historyIndex - 1;
      setHistoryIndex(nextIndex);
      setValue(nextIndex >= 0 ? history[nextIndex] : "");
    }
  }

  const uptime = Math.max(0, Math.floor((now - sessionStart.current) / 1000));
  const clock = new Date(now);
  let lineNumber = 0;

  // El dialogo se porta a <body>, fuera de .app-shell: sin espejar la clase del
  // tema aqui los tokens se resuelven contra los del :root y la consola se queda
  // verde mientras el resto del sitio se vuelve rosa.
  const glitch = theme === "glitch" ? "theme-glitch" : "";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={`terminal-overlay motion-backdrop ${glitch}`} />
        <Dialog.Content
          className={`terminal-window motion-panel ${glitch} ${position ? "is-positioned" : ""} ${isDragging ? "is-dragging" : ""}`}
          aria-describedby="terminal-description"
          ref={windowRef}
          style={position ? { left: position.x, top: position.y, right: "auto", bottom: "auto", margin: 0, transform: "none" } : undefined}
        >
          <header
            className="terminal-windowbar"
            onPointerCancel={endDrag}
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
          >
            <span className="terminal-marquee" aria-hidden="true" />
            <span className="terminal-window-logo" aria-hidden="true"><SquareTerminal size={22} /></span>
            <div className="terminal-window-id">
              <span className="terminal-window-kicker"><span className="terminal-window-dots" aria-hidden="true"><i /><i /><i /></span>cabinet / operator shell</span>
              <Dialog.Title>DAI.EXE command console</Dialog.Title>
              <Dialog.Description id="terminal-description">Interactive cabinet shell with history and command completion.</Dialog.Description>
            </div>
            <div className="terminal-window-meta" aria-hidden="true">
              <span className="is-live"><i /><Radio size={12} /> signal linked</span>
              <span><small>uptime</small><b>{pad(Math.floor(uptime / 60))}:{pad(uptime % 60)}</b></span>
              <span><small>cmds</small><b>{pad(commandCount)}</b></span>
              <span className="terminal-grip" title="Drag to move"><Grip size={14} /></span>
            </div>
            <Dialog.Close className="terminal-close arcade-focus" aria-label="Close terminal">
              <X size={18} aria-hidden="true" />
            </Dialog.Close>
          </header>

          <div className="terminal-workspace">
            <section className="terminal-buffer">
              <header className="terminal-bufferbar">
                <span><FolderCode size={13} aria-hidden="true" /> ~/daivr</span>
                <div><i aria-hidden="true" /><b>{pad(lineCount)} lines</b><button className="terminal-clear arcade-focus" type="button" onClick={() => execute("clear")} aria-label="Clear terminal output" title="Clear output (Ctrl+L)"><Trash2 size={13} aria-hidden="true" /> clear</button></div>
              </header>
              <div className="terminal-screen">
                <div className="terminal-output" data-command-log ref={outputRef} role="log" aria-live="polite" aria-label="Terminal output">
                  {blocks.map((block, blockIndex) => (
                    <article className={`terminal-entry tone-${blockTone(block)} ${blockIndex === blocks.length - 1 ? "is-latest" : ""}`} key={`${blockIndex}-${block.command ?? "boot"}`}>
                      {block.command !== null ? (
                        <div className="terminal-entry-command">
                          <span className="terminal-line-number" aria-hidden="true">{pad(++lineNumber)}</span>
                          <code><span className="terminal-entry-prompt">{operator}@daivr<i>:~$</i></span> <strong>{block.command}</strong></code>
                        </div>
                      ) : null}
                      {block.lines.map((line, index) => (
                        <div className={`terminal-output-line ${lineTone(line)}`} key={`${index}-${line.slice(0, 18)}`}>
                          <span className="terminal-line-number" aria-hidden="true">{pad(++lineNumber)}</span>
                          <code>{line || " "}</code>
                        </div>
                      ))}
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <aside className="terminal-command-deck" aria-label="Quick terminal commands">
              <header>
                <span className="terminal-command-deck-label">quick commands</span>
                <em>press to run</em>
              </header>
              <div className="terminal-command-list">
                {QUICK_COMMANDS.map(({ name, icon: Icon, tone }, index) => (
                  <button className={`terminal-command-chip tone-${tone} arcade-focus`} key={name} type="button" onClick={() => execute(name)} data-command={name}>
                    <span className="terminal-command-cap" aria-hidden="true"><Icon size={16} /></span>
                    <span className="terminal-command-chip-copy"><b>{name}</b><small>{commandSummary(name)}</small></span>
                    <span className="terminal-command-chip-index" aria-hidden="true">{pad(index + 1)}</span>
                  </button>
                ))}
              </div>
              <footer className="terminal-deck-status">
                <span className="terminal-meter" key={commandCount} aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></span>
                <span><small>{history.length ? "last command" : "session"}</small><strong>{history[0] || "ready for input"}</strong></span>
              </footer>
            </aside>
          </div>

          <form className="terminal-input-zone" onSubmit={submitCommand}>
            <div className="terminal-prompt-row">
              <label htmlFor="terminal-input"><span className="sr-only">Terminal command</span><b>{operator}@daivr</b><i>:</i><strong>~$</strong></label>
              <span className="terminal-input-field">
                <span className="terminal-input-ghost" aria-hidden="true"><span>{value}</span>{ghost}</span>
                <input
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="arcade-focus"
                  id="terminal-input"
                  onChange={(event) => {
                    setValue(event.target.value);
                    setHistoryIndex(-1);
                  }}
                  onKeyDown={handleInputKeyDown}
                  placeholder="type help or press Tab to complete..."
                  ref={inputRef}
                  spellCheck="false"
                  value={value}
                />
                {ghost ? <kbd className="terminal-ghost-key" aria-hidden="true">tab</kbd> : null}
              </span>
              <button className="terminal-run-button arcade-focus" type="submit" disabled={!value.trim()} aria-label="Run terminal command">
                <CornerDownLeft size={16} aria-hidden="true" />
                run
              </button>
            </div>

            <div className={`terminal-suggestions ${suggestions.length ? "is-visible" : ""}`} aria-live="polite">
              {suggestions.map((item) => (
                <button key={item.value} type="button" onClick={() => { setValue(item.value); inputRef.current?.focus({ preventScroll: true }); }}>
                  <b>{item.label}</b><span>{item.detail}</span>
                </button>
              ))}
            </div>
          </form>

          <footer className="terminal-statusbar" aria-hidden="true">
            <span className="terminal-status-mode">{value ? "insert" : "ready"}</span>
            <span className="terminal-status-path"><FolderCode size={12} /> ~/daivr</span>
            <span className="terminal-status-user">{operator}@daivr</span>
            <span className="terminal-status-keys">
              <span><kbd>↑</kbd><kbd>↓</kbd> history</span>
              <span><kbd>tab</kbd> complete</span>
              <span><kbd>ctrl</kbd><kbd>l</kbd> clear</span>
              <span><kbd>esc</kbd> close</span>
            </span>
            <span className="terminal-status-clock">{pad(clock.getHours())}:{pad(clock.getMinutes())}</span>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
