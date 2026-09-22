import { BookOpen, ExternalLink, MapPin, RotateCw, UnlockKeyhole, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import "../item-wiki.css";

export function ItemWikiModal({ item, onClose }) {
  const dialogRef = useRef(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const title = /^(Plan|Recipe):/.test(item.name) ? item.name : `Plan: ${item.name}`;
  const wikiUrl = `https://fallout.fandom.com/wiki/${encodeURIComponent(title.replaceAll(" ", "_"))}`;

  useEffect(() => {
    const trigger = document.activeElement;
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => { dialog.close(); if (trigger?.isConnected) trigger.focus({ preventScroll: true }); };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setResult(null); setError(""); setImageFailed(false); setImageLoaded(false);
    fetch(`/api/fallout/item?title=${encodeURIComponent(title)}`, { signal: controller.signal })
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error || "The wiki could not be loaded."); return data; })
      .then(setResult)
      .catch(reason => { if (!controller.signal.aborted) setError(reason.message); });
    return () => controller.abort();
  }, [title, attempt]);

  const sections = [];
  if (result) {
    let section = { heading: "Overview", text: "" };
    for (const part of result.excerpt.split(/(==+[^=]+==+)/g)) {
      if (/^==/.test(part)) {
        if (section.text.trim()) sections.push(section);
        section = { heading: part.replaceAll("=", "").trim(), text: "" };
      } else section.text += part;
    }
    if (section.text.trim()) sections.push(section);
  }

  return <dialog ref={dialogRef} className="fo-item-dialog" aria-labelledby="fo-item-title" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="fo-item-sheet">
      <header><span>M–01 / PLAN REFERENCE</span><button type="button" aria-label="Close item details" onClick={onClose} autoFocus><X size={20} /></button></header>
      <div className="fo-item-body">
        <div className="fo-item-identity"><div><span className="fo-kicker">MINERVA’S FIELD CATALOGUE</span><h2 id="fo-item-title">{item.name}</h2><span className="fo-item-type"><BookOpen size={13} /> CRAFTING {title.startsWith("Recipe:") ? "RECIPE" : "PLAN"}</span></div>
          <div className="fo-item-price"><span>MINERVA PRICE</span><strong>{item.gold.toLocaleString("en-US")}</strong><small>GOLD BULLION</small></div>
        </div>
        <div className="fo-item-reference-layout">
        <aside className="fo-item-visual">
          <figure className="fo-item-photo">
            {result?.imageUrl && !imageFailed ? <><img src={result.imageUrl} alt={item.name} width="400" height="300" loading="eager" referrerPolicy="no-referrer" onLoad={() => setImageLoaded(true)} onError={() => setImageFailed(true)} />{!imageLoaded && <span className="fo-item-photo-status">Loading item image…</span>}</> : <div className="fo-item-photo-placeholder"><BookOpen size={42} /><span>{!result && !error ? "Opening reference…" : "No image available"}</span></div>}
            <figcaption>ITEM REFERENCE<br />FALLOUT WIKI</figcaption>
          </figure>
          <a className="fo-item-wiki-link" href={result?.url || wikiUrl} target="_blank" rel="noreferrer">Full wiki entry <ExternalLink size={15} /><span className="sr-only"> (opens in a new tab)</span></a>
        </aside>
        <div className="fo-item-excerpt" aria-live="polite" aria-busy={!result && !error}>
          {!result && !error && <p className="fo-item-loading">Opening wiki reference…</p>}
          {error && <div><p>{error}</p><button className="fo-text-button" type="button" onClick={() => setAttempt(value => value + 1)}><RotateCw size={14} /> Try again</button></div>}
          {sections.map(({ heading, text }, index) => {
            const Icon = heading === "Locations" ? MapPin : heading === "Unlocks" ? UnlockKeyhole : BookOpen;
            return <section className={`fo-item-detail${heading === "Unlocks" ? " is-unlock" : ""}`} key={index}><h3><Icon size={17} /><span>{heading}</span></h3><p>{text.trim()}</p></section>;
          })}
        </div>
        </div>
      </div>
      <footer>{result ? <>Excerpt from <a href={result.url} target="_blank" rel="noreferrer">{result.source}</a> · <a href={result.licenseUrl} target="_blank" rel="noreferrer">CC BY-SA</a></> : "Item reference · Nukapedia / Fallout Wiki"}</footer>
    </div>
  </dialog>;
}
