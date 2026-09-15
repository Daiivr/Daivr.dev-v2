import "../styles/vault-tooltip.css";

// Keep the tooltip with its control, including when the vault camera moves.
export function VaultControlHint({ id, label, detail, shortcut }) {
  return <span id={id} className="vault-control-hint" role="tooltip">
    <span className="vault-hint-label">{label}{shortcut && <kbd>{shortcut}</kbd>}</span>
    <span className="vault-hint-detail">{detail}</span>
  </span>;
}

export const vaultHintEvents = {
  onPointerEnter: (event) => { delete event.currentTarget.dataset.hintDismissed; },
  onFocus: (event) => { delete event.currentTarget.dataset.hintDismissed; },
  onKeyDown: (event) => {
    if (event.key === "Escape") event.currentTarget.dataset.hintDismissed = "true";
  },
};
