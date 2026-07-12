import * as Dialog from "@radix-ui/react-dialog";
import { Keyboard, Radio, Send, Sparkles, Terminal, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const COMMAND_HINTS = [
  { name: "help", detail: "command index" },
  { name: "status", detail: "cabinet telemetry" },
  { name: "scan", detail: "index cartridges" },
  { name: "ls", detail: "list page nodes" },
  { name: "goto", detail: "jump to a node" },
  { name: "theme", detail: "crt / glitch" },
  { name: "run", detail: "boot Dai.exe" },
  { name: "attract", detail: "start arcade demo" },
  { name: "whoami", detail: "operator profile" },
  { name: "now", detail: "current save-state" },
  { name: "discord", detail: "presence link" },
  { name: "contact", detail: "open channel" },
  { name: "date", detail: "local clock" },
  { name: "echo", detail: "repeat text" },
  { name: "clear", detail: "clear output" },
  { name: "exit", detail: "close terminal" }
];

const QUICK_COMMANDS = ["help", "status", "scan", "theme", "run", "attract"];

function lineTone(line) {
  if (line.startsWith("$ ")) return "is-command";
  if (/error|not found|denied|offline/i.test(line)) return "is-error";
  if (/online|ready|active|accepted|complete|nominal|success/i.test(line)) return "is-success";
  if (/^\s*(tip|hint|usage):/i.test(line)) return "is-hint";
  if (/^[─═┌└│>]/.test(line)) return "is-system";
  return "";
}

export function TerminalDialog({ open, onOpenChange, onCommand, log }) {
  const [value, setValue] = useState("");
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef(null);
  const outputRef = useRef(null);
  const windowRef = useRef(null);
  const dragRef = useRef(null);
  const [position, setPosition] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  function clampPosition(x, y) {
    const terminal = windowRef.current;
    if (!terminal) return { x, y };

    const edge = window.innerWidth <= 700 ? 8 : 12;
    return {
      x: Math.min(Math.max(edge, x), Math.max(edge, window.innerWidth - terminal.offsetWidth - edge)),
      y: Math.min(Math.max(edge, y), Math.max(edge, window.innerHeight - terminal.offsetHeight - edge))
    };
  }

  const suggestions = useMemo(() => {
    const query = value.trim().toLowerCase().split(/\s+/)[0];
    if (!query) return [];
    return COMMAND_HINTS.filter((item) => item.name.startsWith(query) && item.name !== query).slice(0, 4);
  }, [value]);

  useEffect(() => {
    if (!open) return undefined;
    const focusTimer = window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 40);
    return () => window.clearTimeout(focusTimer);
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
    setHistory((current) => [next, ...current.filter((item) => item !== next)].slice(0, 40));
    setHistoryIndex(-1);
    onCommand(next);
    setValue("");
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
      const [, ...args] = value.trim().split(/\s+/);
      setValue(`${suggestions[0].name}${args.length ? ` ${args.join(" ")}` : ""}`);
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

  const outputLines = log ? log.split("\n") : ["Output buffer cleared. Terminal ready."];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="terminal-overlay" />
        <Dialog.Content
          className={`terminal-window ${position ? "is-positioned" : ""} ${isDragging ? "is-dragging" : ""}`}
          aria-describedby="terminal-description"
          ref={windowRef}
          style={position ? { left: position.x, top: position.y, right: "auto", bottom: "auto", margin: 0, transform: "none" } : undefined}
        >
          <header
            className={`terminal-windowbar ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
            onPointerCancel={endDrag}
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
          >
            <div className="terminal-window-id">
              <span className="terminal-window-dots" aria-hidden="true"><i /><i /><i /></span>
              <Terminal size={17} aria-hidden="true" />
              <div>
                <Dialog.Title>DAI.EXE command console</Dialog.Title>
                <Dialog.Description id="terminal-description">Interactive cabinet shell with history and command completion.</Dialog.Description>
              </div>
            </div>
            <div className="terminal-window-meta" aria-hidden="true">
              <span><Radio size={12} /> signal linked</span>
              <span><Keyboard size={12} /> / to open</span>
            </div>
            <Dialog.Close className="terminal-close arcade-focus" aria-label="Close terminal">
              <X size={18} aria-hidden="true" />
            </Dialog.Close>
          </header>

          <div className="terminal-command-deck" aria-label="Quick terminal commands">
            <span className="terminal-command-deck-label"><Sparkles size={12} aria-hidden="true" /> quick_exec</span>
            <div>
              {QUICK_COMMANDS.map((name) => (
                <button className="terminal-command-chip arcade-focus" key={name} type="button" onClick={() => execute(name)} data-command={name}>
                  <span>$</span> {name}
                </button>
              ))}
            </div>
          </div>

          <div className="terminal-output" data-command-log ref={outputRef} role="log" aria-live="polite" aria-label="Terminal output">
            {outputLines.map((line, index) => (
              <div className={`terminal-output-line ${lineTone(line)}`} key={`${index}-${line.slice(0, 18)}`}>
                <span className="terminal-line-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <code>{line || " "}</code>
              </div>
            ))}
          </div>

          <form className="terminal-input-zone" onSubmit={submitCommand}>
            <div className="terminal-prompt-row">
              <label htmlFor="terminal-input"><span className="sr-only">Terminal command</span><b>guest@daivr</b><i>:</i><strong>~$</strong></label>
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
              <button className="terminal-run-button arcade-focus" type="submit" disabled={!value.trim()} aria-label="Run terminal command">
                <Send size={16} aria-hidden="true" />
                run
              </button>
            </div>

            <div className={`terminal-suggestions ${suggestions.length ? "is-visible" : ""}`} aria-live="polite">
              {suggestions.map((item) => (
                <button key={item.name} type="button" onClick={() => setValue(item.name)}>
                  <b>{item.name}</b><span>{item.detail}</span>
                </button>
              ))}
            </div>

            <footer className="terminal-hints" aria-hidden="true">
              <span><kbd>↑</kbd><kbd>↓</kbd> history</span>
              <span><kbd>tab</kbd> complete</span>
              <span><kbd>ctrl</kbd>+<kbd>l</kbd> clear</span>
              <span><kbd>esc</kbd> close</span>
              <em>shell_status: ready</em>
            </footer>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
