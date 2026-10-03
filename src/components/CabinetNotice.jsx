import { createPortal } from "react-dom";
import "../styles/cabinet-notice.css";

// Body-level portals keep the complete panel (including its text) above the
// cabinet's isolated, filtered screen and the application's stacking contexts.
export function CabinetNotice({ className = "", label, channel, children, actions, collapsed = false }) {
  return createPortal(
    <aside className={`cabinet-notice ${className}${collapsed ? " is-collapsed" : ""}`} aria-label={label}>
      {collapsed ? children : <>
        <header className="cabinet-notice-header"><span><i aria-hidden="true" />{channel}</span><b aria-hidden="true">DAI VISION</b></header>
        <div className="cabinet-notice-screen" role="status" aria-live="polite" aria-atomic="true">{children}</div>
        <div className="cabinet-notice-actions">{actions}</div>
      </>}
    </aside>, document.body,
  );
}
