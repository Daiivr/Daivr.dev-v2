import * as Dialog from "@radix-ui/react-dialog";
import { Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { commands } from "../data/site";

export function TerminalDialog({ open, onOpenChange, onCommand, log }) {
  const [value, setValue] = useState("");
  const outputRef = useRef(null);

  useEffect(() => {
    if (open) outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight });
  }, [log, open]);

  function submitCommand(event) {
    event.preventDefault();
    onCommand(value);
    setValue("");
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-70 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="terminal-pop panel-strong fixed inset-x-4 bottom-4 z-80 mx-auto max-w-4xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-phosphor/20 p-4">
            <div>
              <Dialog.Title className="font-display text-lg text-phosphor">terminal</Dialog.Title>
              <Dialog.Description className="text-xs text-phosphor-soft/70">
                Type commands. Try help, run, theme, scan, clear.
              </Dialog.Description>
            </div>
            <Dialog.Close className="arcade-focus grid h-10 w-10 place-items-center border border-phosphor/25 text-phosphor-soft hover:bg-phosphor/10">
              <X size={18} aria-hidden="true" />
              <span className="sr-only">Close terminal</span>
            </Dialog.Close>
          </div>

          <div className="flex flex-wrap gap-2 p-4">
            {commands.map(([name]) => (
              <button
                className="arcade-focus min-h-10 border border-phosphor/25 px-3 text-sm font-black text-phosphor-soft hover:border-phosphor hover:bg-phosphor/10"
                key={name}
                type="button"
                onClick={() => onCommand(name)}
                data-command={name}
              >
                $ {name}
              </button>
            ))}
            <button
              className="arcade-focus min-h-10 border border-phosphor/25 px-3 text-sm font-black text-phosphor-soft hover:border-phosphor hover:bg-phosphor/10"
              type="button"
              onClick={() => onCommand("clear")}
              data-command="clear"
            >
              $ clear
            </button>
          </div>

          <pre
            className="max-h-[42vh] overflow-auto border-y border-phosphor/20 bg-ink-950/80 p-4 text-sm leading-7 text-phosphor"
            data-command-log
            ref={outputRef}
          >
            <code>{log}</code>
          </pre>

          <form className="flex items-center gap-2 p-4" onSubmit={submitCommand}>
            <label className="sr-only" htmlFor="terminal-input">Terminal command</label>
            <span className="text-phosphor">$</span>
            <input
              autoComplete="off"
              className="arcade-focus min-h-11 min-w-0 flex-1 border border-phosphor/25 bg-ink-950 px-3 text-sm text-phosphor placeholder:text-phosphor-soft/35"
              id="terminal-input"
              onChange={(event) => setValue(event.target.value)}
              placeholder="type a command..."
              value={value}
            />
            <button className="crt-button-primary min-h-11 px-3" type="submit">
              <Send size={16} aria-hidden="true" />
              <span className="sr-only">Run command</span>
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
