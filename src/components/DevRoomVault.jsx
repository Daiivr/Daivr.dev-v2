import * as Dialog from "@radix-ui/react-dialog";
import { Delete, FileDown, Fingerprint, HelpCircle, Lock, LockOpen, ShieldAlert, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// La boveda del dev room. Vive detras del panel arrastrable: solo se llega a
// ella colgando la ventana del clavo, y solo se abre con el codigo.
const VAULT_CODE = "071990";
const CODE_LENGTH = VAULT_CODE.length;

// Rechazo: cuanto dura el aviso antes de vaciar el marcador solo.
const DENY_MS = 1100;

const KEYPAD = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "enter"];

// Estantes de la boveda. Todavia no hay archivos que servir, asi que se
// enseñan las ranuras vacias: el sitio existe y se ve, solo falta el contenido.
const VAULT_SHELVES = [
  { slot: "01", label: "cartridge dumps", note: "staging" },
  { slot: "02", label: "source // unreleased", note: "staging" },
  { slot: "03", label: "sprite sheets", note: "staging" },
  { slot: "04", label: "the 1997 folder", note: "sealed" }
];

// Telemetria de la puerta. Los seis cerrojos se van soltando conforme entran
// digitos, asi que el mecanismo cuenta lo mismo que el marcador.
const BOLTS = [0, 1, 2, 3, 4, 5];

// La pista: un mapa dibujado a mano con la combinacion anotada encima. No dice
// el numero por si mismo — hay que reconocer el sitio que dibuja.
const HINT_MAP = "/assets/vault/hint-map.webp";

// Lupa del plano. El papel se enseña a ~88% de su tamano real, asi que lo que
// hay escrito a mano se lee justo; la lente da el aumento sin abrir otra vista.
const LENS_SIZE = 168;
const LENS_ZOOM = 2.6;

export function DevRoomVault({ active }) {
  const [entry, setEntry] = useState("");
  const [status, setStatus] = useState("locked");
  const denyTimerRef = useRef(0);
  const rootRef = useRef(null);

  const clearDenyTimer = () => window.clearTimeout(denyTimerRef.current);

  const submit = useCallback((code) => {
    if (code === VAULT_CODE) {
      setStatus("open");
      return;
    }
    setStatus("denied");
    clearDenyTimer();
    denyTimerRef.current = window.setTimeout(() => {
      setEntry("");
      setStatus("locked");
    }, DENY_MS);
  }, []);

  const pressDigit = useCallback((digit) => {
    if (status === "open") return;
    setStatus((current) => (current === "denied" ? "locked" : current));
    setEntry((current) => {
      if (current.length >= CODE_LENGTH) return current;
      const next = current + digit;
      // La puerta responde al sexto digito sola: obligar a pulsar ENTER
      // despues de teclear seis numeros es un paso de mas.
      if (next.length === CODE_LENGTH) submit(next);
      return next;
    });
  }, [status, submit]);

  const pressClear = useCallback(() => {
    if (status === "open") return;
    clearDenyTimer();
    setEntry("");
    setStatus("locked");
  }, [status]);

  const pressEnter = useCallback(() => {
    if (status === "open") return;
    setEntry((current) => {
      if (current.length === CODE_LENGTH) submit(current);
      return current;
    });
  }, [status, submit]);

  // Teclado fisico: la boveda solo escucha cuando esta a la vista y el foco no
  // esta en otro sitio donde escribir numeros signifique otra cosa.
  useEffect(() => {
    if (!active) return undefined;

    function onKeyDown(event) {
      const el = document.activeElement;
      if (el && el !== document.body && !rootRef.current?.contains(el)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (/^[0-9]$/.test(event.key)) {
        event.preventDefault();
        pressDigit(event.key);
        return;
      }
      if (event.key === "Backspace") {
        event.preventDefault();
        setEntry((current) => current.slice(0, -1));
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, pressDigit]);

  // Al descolgar el panel la boveda vuelve a su estado cerrado, salvo que ya
  // se hubiera abierto: eso se queda ganado.
  useEffect(() => {
    if (active || status === "open") return;
    clearDenyTimer();
    setEntry("");
    setStatus("locked");
  }, [active, status]);

  useEffect(() => () => clearDenyTimer(), []);

  // El modal se abre solo al ceder la puerta, y se puede volver a abrir desde
  // el boton de la boveda ya abierta.
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);

  useEffect(() => {
    if (status === "open") setArchiveOpen(true);
  }, [status]);

  const filled = status === "open" ? CODE_LENGTH : entry.length;
  const statusCopy = status === "open"
    ? "vault open"
    : status === "denied"
      ? "code rejected"
      : filled > 0
        ? `${filled} / ${CODE_LENGTH} entered`
        : "sealed";

  return (
    <div className={`vault is-${status}`} ref={rootRef}>
      <span className="vault-corner is-tl" aria-hidden="true" />
      <span className="vault-corner is-tr" aria-hidden="true" />
      <span className="vault-corner is-bl" aria-hidden="true" />
      <span className="vault-corner is-br" aria-hidden="true" />
      <div className="vault-haze" aria-hidden="true" />

      <header className="vault-plate">
        <span className="vault-plate-tag">dai-core // vault</span>
        <span className="vault-plate-side">
          <button
            aria-label="Show the hint left with this vault"
            className="vault-hint arcade-focus"
            type="button"
            onClick={() => setHintOpen(true)}
          >
            <HelpCircle size={12} aria-hidden="true" />
            <span>hint</span>
          </button>
          <span className="vault-plate-state">
            {status === "open" ? <LockOpen size={12} aria-hidden="true" /> : <Lock size={12} aria-hidden="true" />}
            {status === "open" ? "unsealed" : "sealed"}
          </span>
        </span>
      </header>

      {/* Mecanismo y marcador en una columna, teclado en la otra. Apilados en
          vertical la boveda pedia mas alto del que hay en el bay y la fila del
          grid la aplastaba: el teclado se salia por debajo de su propio borde.
          En horizontal sobra sitio, asi que ahi es donde crece. */}
      <div className="vault-mech">
      <div className="vault-door">
        <div className="vault-rings" aria-hidden="true">
          <span className="vault-ring is-outer" />
          <span className="vault-ring is-mid" />
          <span className="vault-ring is-inner" />
          <span className="vault-ticks" />
        </div>

        <div className="vault-bolts" aria-hidden="true">
          {BOLTS.map((bolt) => (
            <i className={bolt < filled ? "is-released" : ""} key={bolt} style={{ "--bolt": bolt }} />
          ))}
        </div>

        <div className="vault-hub" aria-hidden="true">
          {status === "open"
            ? <LockOpen size={26} />
            : status === "denied"
              ? <ShieldAlert size={26} />
              : <Fingerprint size={26} />}
        </div>
      </div>

      <div className="vault-readout">
        <p className="vault-code" aria-hidden="true">
          {Array.from({ length: CODE_LENGTH }, (_, index) => (
            <b className={index < filled ? "is-set" : ""} key={index}>
              {status === "open" ? VAULT_CODE[index] : index < entry.length ? "*" : ""}
            </b>
          ))}
        </p>
        <p className="vault-status" role="status">{statusCopy}</p>
      </div>
      </div>

      <div className="vault-keypad">
        {KEYPAD.map((key) => {
          if (key === "clear") {
            return (
              <button
                aria-label="Clear the entered code"
                className="vault-key is-util arcade-focus"
                disabled={status === "open"}
                key={key}
                type="button"
                onClick={pressClear}
              >
                <Delete size={14} aria-hidden="true" />
              </button>
            );
          }
          if (key === "enter") {
            return (
              <button
                aria-label="Submit the code"
                className="vault-key is-util is-enter arcade-focus"
                disabled={status === "open"}
                key={key}
                type="button"
                onClick={pressEnter}
              >
                <span aria-hidden="true">ok</span>
              </button>
            );
          }
          return (
            <button
              className="vault-key arcade-focus"
              disabled={status === "open"}
              key={key}
              type="button"
              onClick={() => pressDigit(key)}
            >
              {key}
            </button>
          );
        })}
      </div>

      <footer className="vault-foot">
        {status === "open" ? (
          <button className="vault-open-archive arcade-focus" type="button" onClick={() => setArchiveOpen(true)}>
            <FileDown size={13} aria-hidden="true" /> open the archive
          </button>
        ) : (
          <span className="vault-foot-hint">six digits // keypad or number row</span>
        )}
      </footer>

      <VaultArchive open={archiveOpen} onOpenChange={setArchiveOpen} />
      <VaultHint open={hintOpen} onOpenChange={setHintOpen} />
    </div>
  );
}

/* La pista. El mapa lleva la combinacion escrita, asi que no se regala nada
   explicandolo: o reconoces el sitio o te quedas mirando un plano. */
function VaultHint({ open, onOpenChange }) {
  const [mapFailed, setMapFailed] = useState(false);
  const [lens, setLens] = useState(null);
  const mapRef = useRef(null);
  const wrapRef = useRef(null);

  // El contenido del dialogo se desmonta al cerrar, pero este estado vive en el
  // componente de fuera: sin esto la lente reaparecia congelada en la posicion
  // vieja en cuanto se volvia a abrir la nota.
  useEffect(() => {
    if (!open) setLens(null);
  }, [open]);

  function trackLens(event) {
    const img = mapRef.current;
    const wrap = wrapRef.current;
    // Un puntero grueso (dedo) no tiene hover: la lente se quedaria clavada.
    if (!img || !wrap || event.pointerType === "touch") return;

    const imgBox = img.getBoundingClientRect();
    const wrapBox = wrap.getBoundingClientRect();
    const x = event.clientX - imgBox.left;
    const y = event.clientY - imgBox.top;

    if (x < 0 || y < 0 || x > imgBox.width || y > imgBox.height) {
      setLens(null);
      return;
    }

    setLens({
      // Posicion dentro del envoltorio, que es quien la contiene...
      left: event.clientX - wrapBox.left,
      top: event.clientY - wrapBox.top,
      // ...pero el recorte se calcula contra la imagen, que va centrada dentro.
      bgWidth: imgBox.width * LENS_ZOOM,
      bgHeight: imgBox.height * LENS_ZOOM,
      bgX: -(x * LENS_ZOOM - LENS_SIZE / 2),
      bgY: -(y * LENS_ZOOM - LENS_SIZE / 2)
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="archive-overlay" />
        <Dialog.Content className="archive-panel is-hint" aria-describedby="hint-note">
          <div className="archive-scan" aria-hidden="true" />

          <header className="archive-head">
            <span className="archive-head-tag">dai-core // recovered note</span>
            <Dialog.Close className="archive-close arcade-focus" aria-label="Close the hint">
              <X size={16} aria-hidden="true" />
            </Dialog.Close>
          </header>

          <figure className="hint-figure">
            {mapFailed ? (
              <div className="hint-map-missing" role="img" aria-label="Hand-drawn map, artwork missing">
                <span>map not mounted</span>
                <small>{HINT_MAP}</small>
              </div>
            ) : (
              <div
                className={`hint-map-wrap ${lens ? "is-magnifying" : ""}`}
                ref={wrapRef}
                onPointerMove={trackLens}
                onPointerLeave={() => setLens(null)}
              >
                <img
                  alt="A hand-drawn floor plan on stained paper, marked with an entrance, several crossed-out rooms, a circled cage and a scrawled cage code."
                  className="hint-map"
                  ref={mapRef}
                  src={HINT_MAP}
                  onError={() => setMapFailed(true)}
                />
                {lens ? (
                  <span
                    aria-hidden="true"
                    className="hint-lens"
                    style={{
                      left: `${lens.left}px`,
                      top: `${lens.top}px`,
                      backgroundImage: `url(${HINT_MAP})`,
                      backgroundSize: `${lens.bgWidth}px ${lens.bgHeight}px`,
                      backgroundPosition: `${lens.bgX}px ${lens.bgY}px`
                    }}
                  />
                ) : null}
              </div>
            )}
          </figure>

          <div className="hint-body">
            <Dialog.Title className="hint-title">Somebody drew you a map</Dialog.Title>
            {/* Guiño, no cita: quien haya hecho ese camino reconoce el plano de
                inmediato, y quien no, sigue teniendo la otra via. */}
            <Dialog.Description className="hint-note" id="hint-note">
              It turned up folded into the back of the cabinet, soft at the corners.
              Rooms crossed off one by one, a single cage ringed twice, the number
              scrawled beside it in the same red pen. If you have ever walked out of
              a vault with nothing and gone looking for an overseer who left before
              you did, you have stood in this room already — and you wrote this
              number down the first time too.
            </Dialog.Description>
            <p className="hint-alt">
              Never made that walk? The same six digits are hidden somewhere else on
              this site. Go and find them.
            </p>
          </div>

          <footer className="archive-foot">
            <span>source unlogged</span>
            <span className="archive-foot-dot" aria-hidden="true" />
            <span>two ways in, one combination</span>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* El interior de la boveda. Cuando haya ficheros iran aqui; de momento las
   ranuras estan a la vista y vacias, que dice mas que una pagina en blanco. */
function VaultArchive({ open, onOpenChange }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="archive-overlay" />
        <Dialog.Content className="archive-panel" aria-describedby="archive-note">
          <div className="archive-scan" aria-hidden="true" />

          <header className="archive-head">
            <span className="archive-head-tag">dai-core // archive</span>
            <Dialog.Close className="archive-close arcade-focus" aria-label="Close the archive">
              <X size={16} aria-hidden="true" />
            </Dialog.Close>
          </header>

          <div className="archive-body">
            <p className="archive-kicker"><LockOpen size={13} aria-hidden="true" /> vault unsealed</p>
            <Dialog.Title className="archive-title">SOON</Dialog.Title>
            <Dialog.Description className="archive-note" id="archive-note">
              You got the code, so the door is yours. The shelves are still being
              filled — dumps, unreleased source and a few things from 1997.
            </Dialog.Description>
          </div>

          <ul className="archive-shelves">
            {VAULT_SHELVES.map((item) => (
              <li key={item.slot}>
                <b>{item.slot}</b>
                <span>{item.label}</span>
                <em>{item.note}</em>
              </li>
            ))}
          </ul>

          <footer className="archive-foot">
            <span>manifest empty // 00 files</span>
            <span className="archive-foot-dot" aria-hidden="true" />
            <span>check back later</span>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
