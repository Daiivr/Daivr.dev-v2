import "../backdrop.css";

export function FalloutBackdrop() {
  return <div className="fo-world-backdrop" aria-hidden="true">
    <img src="/fallout/appalachian-dusk.webp" alt="" width="1672" height="941" decoding="async" fetchPriority="high" />
  </div>;
}
