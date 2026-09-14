import "../icons.css";

const GLYPHS = {
  goldBullion: "\uF400",
  axolotl: "\uF716",
  fishing: "\uE5A1",
  reward: "\uF232",
  alpha: "\uF24B",
  bravo: "\uF24C",
  charlie: "\uF24D",
};

export function FalloutIcon({ name }) {
  return <span className="fo-icon" aria-hidden="true">{GLYPHS[name]}</span>;
}
