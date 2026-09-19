import { ArrowUpRight, BookOpen, Map, Search } from "lucide-react";
import { PanelHeading } from "./TerminalPanel";
import { SLASHER_GUIDE as guide } from "../data/guides";
import { GUIDES_PATH, SLASHER_PATH } from "../data/pages";
import "../guides.css";

export function GuideFacts() {
  const total = guide.regions.reduce((sum, region) => sum + region.spawns, 0);
  return <dl className="fo-guide-facts"><div><dt>Mask spawns</dt><dd>{total}</dd></div><div><dt>Search areas</dt><dd>{guide.locations}</dd></div><div><dt>Regions</dt><dd>{guide.regions.length.toString().padStart(2, "0")}</dd></div></dl>;
}

export function GuideCover() {
  return <div className="fo-guide-cover" aria-hidden="true">
    <span>RECLAMATION DIVISION</span>
    <div className="fo-guide-cover-art"><Map size={106} strokeWidth={.8} /><i><Search size={33} strokeWidth={1.4} /></i></div>
    <strong>FIELD<br />GUIDE <b>01</b></strong>
    <span className="fo-guide-stamp">COLLECTABLES</span>
    <small>APPALACHIA / LOCATION INTEL</small>
  </div>;
}

export function FieldGuides({ library = false }) {
  return <section id="guides" className="fo-panel fo-guides" aria-labelledby="fo-guides-title">
    <PanelHeading number="05" label="WASTELAND FIELD LIBRARY" status="REFERENCE ARCHIVE" amber />
    <header className="fo-guides-heading">
      <div><span className="fo-kicker">KNOW BEFORE YOU GO.</span><h2 id="fo-guides-title" tabIndex={-1}>{library ? "The collection" : "Guides"}</h2><p>Field notes for your next trip into Appalachia.</p></div>
      {library ? <BookOpen size={40} strokeWidth={1.2} aria-hidden="true" /> : <a href={GUIDES_PATH} className="fo-guide-library-link">Browse guides <ArrowUpRight size={16} aria-hidden="true" /></a>}
    </header>
    <article className="fo-guide-file" aria-labelledby="fo-slasher-title">
      <GuideCover />
      <div className="fo-guide-brief">
        <span className="fo-guide-label">G–01 <i /> COLLECTABLES / SPAWN LOCATIONS</span>
        <h3 id="fo-slasher-title">Pint-Sized<br /><span>Slasher Masks.</span></h3>
        <p>Find the masks scattered across the wasteland. Plan your search with the regional directory, survey map, and collection tips.</p>
        <GuideFacts />
        <div className="fo-guide-actions"><a className="fo-guide-open" href={SLASHER_PATH}><BookOpen size={16} aria-hidden="true" />Read guide<ArrowUpRight size={16} aria-hidden="true" /></a></div>
        <p className="fo-guide-credit">FIELD FILE 01 · COLLECTABLES</p>
      </div>
    </article>
  </section>;
}
