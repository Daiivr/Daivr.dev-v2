import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, ChevronLeft, ChevronRight, Code2, Image as ImageIcon, Link as LinkIcon, MessageSquareText, Plus, Search, Shuffle, X, ZoomIn } from "lucide-react";
import { patchNotes } from "../data/site";
import { patchStories } from "../data/patchStories";
import { patchDeskObjects } from "../data/patchDesk";
import { PatchDeskObject } from "./PatchDeskObject";
import { filterReleases, releaseFromUrl } from "../../shared/patch-map.mjs";

const RELEASES = patchNotes.map((patch) => ({ ...patch, story: patchStories[patch.version] }));
const LABELS = { new: "New", buff: "Improved", fix: "Fixed", nerf: "Changed", known: "Known issue" };
const dateLabel = (date) => date ? new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Before the rebuild";
const releaseId = (version) => `journal-${version.replace(/\W/g, "-")}`;

function linkedRelease() {
  if (!new URLSearchParams(window.location.search).has("release")) return null;
  return RELEASES.find((patch) => patch.version === releaseFromUrl(RELEASES, window.location.search));
}
function ReleaseImage({ image, eager = false }) {
  const [failed, setFailed] = useState(false);
  return failed ? <div className="patch-image-unavailable"><ImageIcon size={26} aria-hidden="true" /><span>This image is unavailable.</span></div> : <img src={image.src} alt={image.alt} loading={eager ? "eager" : "lazy"} decoding="async" onError={() => setFailed(true)} />;
}

function ReleaseGallery({ patch, theme }) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const images = patch.story?.images || [];
  if (!images.length) return null;
  const image = images[index];
  const step = (amount) => setIndex((current) => (current + amount + images.length) % images.length);
  return <Dialog.Root open={open} onOpenChange={setOpen}>
    <figure className="patch-gallery">
      <Dialog.Trigger asChild><button type="button" className="patch-cover" aria-label={`Enlarge ${image.label} image`}>
        <ReleaseImage key={image.src} image={image} />
        <span className="patch-image-kind">{image.kind}</span><span className="patch-image-expand"><ZoomIn size={15} aria-hidden="true" /> View image</span>
      </button></Dialog.Trigger>
      <figcaption><span>{image.caption}</span><span>{index + 1} / {images.length}</span></figcaption>
      {images.length > 1 ? <div className="patch-gallery-choices" role="group" aria-label="Release images">{images.map((item, itemIndex) => <button key={item.src} type="button" aria-pressed={index === itemIndex} onClick={() => setIndex(itemIndex)}><ImageIcon size={14} aria-hidden="true" />{item.label}</button>)}</div> : null}
    </figure>
    <Dialog.Portal>
      <Dialog.Overlay className={`patch-lightbox-overlay ${theme === "glitch" ? "theme-glitch" : ""}`} />
      <Dialog.Content className={`patch-lightbox ${theme === "glitch" ? "theme-glitch" : ""}`} onKeyDown={(event) => { if (images.length > 1 && ["ArrowLeft", "ArrowRight"].includes(event.key)) { event.preventDefault(); step(event.key === "ArrowLeft" ? -1 : 1); } }}>
        <header><div><span>{patch.version} / GALLERY</span><Dialog.Title>{image.label}</Dialog.Title></div><Dialog.Close asChild><button type="button" aria-label="Close release image"><X size={22} aria-hidden="true" /></button></Dialog.Close></header>
        <div className="patch-lightbox-image"><ReleaseImage key={image.src} image={image} eager /></div>
        <Dialog.Description>{image.kind}. {image.caption}</Dialog.Description>
        {images.length > 1 ? <div className="patch-lightbox-nav"><button type="button" onClick={() => step(-1)}><ChevronLeft size={17} aria-hidden="true" /> Previous image</button><span aria-live="polite">{index + 1} / {images.length}</span><button type="button" onClick={() => step(1)}>Next image <ChevronRight size={17} aria-hidden="true" /></button></div> : null}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}

function ReleaseCard({ patch, panel, onPanel, theme }) {
  const [fullSummary, setFullSummary] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const [fallbackLink, setFallbackLink] = useState("");
  const id = releaseId(patch.version);
  const images = patch.story?.images || [];
  const latest = patch === RELEASES[0];
  const counts = Object.entries(LABELS).map(([type, label]) => ({ type, label, count: patch.entries.filter(([kind]) => kind === type).length })).filter(({ count }) => count);
  const actions = [
    { key: "changes", label: "Patch notes", count: patch.entries.length, icon: Plus },
    ...(patch.story?.note ? [{ key: "note", label: "Dev comment", icon: MessageSquareText }] : []),
    ...(images.length ? [{ key: "gallery", label: "Gallery", count: images.length, icon: ImageIcon }] : [])
  ];
  async function copyLink() {
    const url = new URL(window.location.href);
    url.searchParams.set("release", patch.version);
    url.hash = "patchlog";
    try { await navigator.clipboard.writeText(url.href); setCopyStatus("Link copied"); setFallbackLink(""); }
    catch { setCopyStatus("Copy this release link:"); setFallbackLink(url.href); }
  }
  return <article id={id} className={`patch-entry ${latest ? "is-latest" : ""} ${panel ? "is-expanded" : ""}`} tabIndex={-1} aria-labelledby={`${id}-title`}>
    <div className="patch-entry-meta"><span className="patch-version">{patch.version}</span>{latest ? <span className="patch-current"><i />LATEST UPDATE</span> : null}<time dateTime={patch.date || undefined}>{dateLabel(patch.date)}</time><button type="button" className="patch-copy" onClick={copyLink} aria-label={`Copy link to ${patch.version}`} title="Copy release link">{copyStatus === "Link copied" ? <Check size={16} aria-hidden="true" /> : <LinkIcon size={16} aria-hidden="true" />}</button></div>
    <div className="patch-entry-preview"><div><h3 id={`${id}-title`}>{patch.codename}</h3><p id={`${id}-summary`} className={`patch-entry-summary ${patch.summary.length > 240 && !fullSummary ? "is-short" : ""}`}>{patch.summary}</p>{patch.summary.length > 240 ? <button type="button" className="patch-summary-toggle" aria-expanded={fullSummary} aria-controls={`${id}-summary`} onClick={() => setFullSummary(!fullSummary)}>{fullSummary ? "Less overview" : "Read full overview"}</button> : null}<div className="patch-change-counts">{counts.map(({ type, label, count }) => <span className={`is-${type}`} key={type}><i aria-hidden="true" />{count} {label.toLowerCase()}</span>)}</div></div></div>
    <div className="patch-copy-status" role="status">{copyStatus}</div>
    {fallbackLink ? <input className="patch-link-fallback" aria-label="Release link" readOnly value={fallbackLink} onFocus={(event) => event.target.select()} /> : null}
    <div className="patch-entry-actions" role="group" aria-label={`${patch.version} details`}>{actions.map(({ key, label, count, icon: Icon }) => <button key={key} type="button" id={`${id}-${key}-button`} aria-expanded={panel === key} aria-controls={`${id}-${key}`} onClick={() => onPanel(patch, panel === key ? null : key)}><Icon size={15} aria-hidden="true" /><span>{label}</span>{count ? <small>{count}</small> : null}</button>)}</div>
    {actions.map(({ key, label }) => <div key={key} id={`${id}-${key}`} className="patch-entry-content" role="region" aria-label={`${patch.version} ${label}`} hidden={panel !== key}>
      {panel === key && key === "changes" ? <><div className="patch-content-heading"><span>IN THIS BUILD</span><span>{patch.entries.length} CHANGES</span></div><ol className="patch-changes">{patch.entries.map(([type, copy], index) => <li key={index} className={`is-${type}`}><span className="patch-change-tag">{LABELS[type] || type}</span><p>{copy}</p></li>)}</ol></> : null}
      {panel === key && key === "note" ? <aside className="patch-dev-note"><span className="patch-dev-avatar" aria-hidden="true"><Code2 size={24} /></span><div><span className="patch-content-kicker">BEHIND THE BUILD</span><h4>A little context.</h4><p>{patch.story.note}</p></div></aside> : null}
      {panel === key && key === "gallery" ? <ReleaseGallery patch={patch} theme={theme} /> : null}
      {panel === key ? <button type="button" className="patch-close-entry" onClick={() => { onPanel(patch, null); document.getElementById(`${id}-${key}-button`)?.focus(); }}><X size={13} aria-hidden="true" /> Close {key === "changes" ? "notes" : key === "note" ? "comment" : "gallery"}</button> : null}
    </div>)}
  </article>;
}

const VISITS_KEY = "daivr:patch-desk:discoveries:v1";
function readVisits() {
  try {
    const saved = JSON.parse(localStorage.getItem(VISITS_KEY) || "[]");
    return Array.isArray(saved) ? [...new Set(saved.filter((id) => patchDeskObjects.some((object) => object.id === id)))] : [];
  } catch { return []; }
}

export function PatchNotes({ theme, interactive = true }) {
  const [initial] = useState(linkedRelease);
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("archive");
  const [version, setVersion] = useState(initial?.version || RELEASES[0].version);
  const [query, setQuery] = useState("");
  const [panel, setPanel] = useState("changes");
  const [visited, setVisited] = useState(readVisits);
  const [hovered, setHovered] = useState(null);
  const openerRef = useRef(null);
  const readerRef = useRef(null);
  const deskRef = useRef(null);
  const initialHandled = useRef(false);
  const object = patchDeskObjects.find((item) => item.id === topic);
  const releases = object ? object.versions.map((value) => RELEASES.find((entry) => entry.version === value)).filter(Boolean) : filterReleases(RELEASES, { query });
  const active = releases.find((entry) => entry.version === version) || releases[0];
  const index = releases.indexOf(active);

  useEffect(() => {
    if (!interactive || initialHandled.current) return;
    initialHandled.current = true;
    if (initial) setOpen(true);
  }, [initial, interactive]);

  useEffect(() => {
    if (!interactive) return;
    const restore = () => {
      const patch = linkedRelease();
      if (patch && window.location.hash === "#patchlog") {
        setTopic("archive"); setQuery(""); setVersion(patch.version); setPanel("changes"); setOpen(true);
      } else setOpen(false);
    };
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, [interactive]);

  function remember(id) {
    const next = [...new Set([...visited, id])];
    setVisited(next);
    try { localStorage.setItem(VISITS_KEY, JSON.stringify(next)); } catch { /* Exploration works without storage. */ }
  }
  function writeLink(patch) {
    const url = new URL(window.location.href);
    url.searchParams.set("release", patch.version); url.hash = "patchlog";
    if (url.href !== window.location.href) window.history.pushState(window.history.state, "", url);
  }
  function explore(id, trigger) {
    const selected = patchDeskObjects.find((item) => item.id === id);
    const patch = selected ? RELEASES.find((entry) => entry.version === selected.versions[0]) : RELEASES[0];
    openerRef.current = trigger;
    setTopic(id); setQuery(""); setVersion(patch.version);
    setPanel(selected && id !== "monitor" && patch.story?.note ? "note" : "changes");
    if (selected) remember(id);
    setOpen(true); writeLink(patch);
  }
  function close(nextOpen) {
    setOpen(nextOpen);
    if (!nextOpen) {
      const url = new URL(window.location.href);
      url.searchParams.delete("release");
      window.history.replaceState(window.history.state, "", url);
    }
  }
  function selectRelease(patch) {
    setVersion(patch.version);
    setPanel(object && topic !== "monitor" && patch.story?.note ? "note" : "changes");
    readerRef.current?.scrollTo({ top: 0 });
    writeLink(patch);
  }
  function surprise(event) {
    const unseen = patchDeskObjects.filter((item) => !visited.includes(item.id));
    const pool = unseen.length ? unseen : patchDeskObjects;
    explore(pool[Math.floor(Math.random() * pool.length)].id, event.currentTarget);
  }
  const hint = patchDeskObjects.find((item) => item.id === hovered);

  return <div className="patch-console patch-desk" ref={deskRef} tabIndex={-1}>
    <header className="patch-desk-intro"><div><span className="patch-journal-signal"><i /> A FEW THINGS LEFT ON THE DESK</span><p>Pick something up. There’s a story behind it.</p></div><div className="patch-discoveries" aria-label={`${visited.length} of 6 objects explored`}><span>{visited.length} / 6 explored</span><div aria-hidden="true">{patchDeskObjects.map((item) => <i key={item.id} className={visited.includes(item.id) ? "is-found" : ""} />)}</div></div></header>
    <div className="patch-desk-scene" role="group" aria-label="Explore Dai's developer desk">
      <div className="patch-desk-wall" aria-hidden="true"><span>DAI’S WORKSPACE</span><span>ALASKA / NIGHT SHIFT</span></div>
      <div className="patch-desk-shelf" aria-hidden="true" /><div className="patch-desk-surface" aria-hidden="true" /><div className="patch-desk-cable" aria-hidden="true" />
      {patchDeskObjects.map((item, itemIndex) => <button type="button" key={item.id} className={`patch-desk-object desk-${item.id} ${visited.includes(item.id) ? "is-discovered" : ""}`} aria-label={`Explore ${item.label}${visited.includes(item.id) ? ", already discovered" : ""}`} aria-haspopup="dialog" onPointerEnter={() => setHovered(item.id)} onPointerLeave={() => setHovered(null)} onFocus={() => setHovered(item.id)} onBlur={() => setHovered(null)} onClick={(event) => explore(item.id, event.currentTarget)}>
        <PatchDeskObject kind={item.id} /><span className="patch-object-label"><small>{String(itemIndex + 1).padStart(2, "0")}</small>{item.label}{visited.includes(item.id) ? <Check size={12} aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}</span>
      </button>)}
    </div>
    <footer className="patch-desk-footer"><p>{hint ? hint.hint : visited.length === 6 ? "Every corner explored. Thanks for stopping by Dai’s desk." : "Six objects. A few stories. Follow your curiosity."}</p><div><button type="button" onClick={surprise}><Shuffle size={15} aria-hidden="true" />Surprise me</button><button type="button" onClick={(event) => explore("archive", event.currentTarget)}><Search size={15} aria-hidden="true" />Find a release</button></div></footer>
    <Dialog.Root open={open && interactive} onOpenChange={close}>
      <Dialog.Portal>
        <Dialog.Overlay className="patch-discovery-overlay" />
        <Dialog.Content className={`patch-console patch-discovery ${theme === "glitch" ? "theme-glitch" : ""}`} onCloseAutoFocus={(event) => { event.preventDefault(); (openerRef.current || deskRef.current)?.focus({ preventScroll: true }); }}>
          <header className="patch-discovery-header"><div><span>{object ? `DESK DISCOVERY / ${object.label}` : "PATCH.LOG / RELEASE ARCHIVE"}</span><Dialog.Title>{object ? object.title : "Looking for a particular build?"}</Dialog.Title></div><Dialog.Close asChild><button type="button" aria-label="Back to the developer desk"><X size={22} aria-hidden="true" /></button></Dialog.Close></header>
          <Dialog.Description className="patch-discovery-context">{object ? object.context : "Search a feature, a fix, or a version. The whole archive is here, one release at a time."}</Dialog.Description>
          {!object ? <div className="patch-archive-tools"><label className="patch-journal-search"><Search size={16} aria-hidden="true" /><span className="sr-only">Search releases</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search all releases…" /></label><label><span className="sr-only">Choose release</span><select aria-label="Choose release" value={active?.version || ""} onChange={(event) => selectRelease(releases.find((entry) => entry.version === event.target.value))} disabled={!releases.length}>{releases.length ? releases.map((entry) => <option key={entry.version} value={entry.version}>{entry.version} · {entry.codename}</option>) : <option value="">No matching releases</option>}</select></label></div> : null}
          <div className="patch-discovery-reader" ref={readerRef}>{active ? <ReleaseCard key={active.version} patch={active} theme={theme} panel={panel} onPanel={(_, nextPanel) => setPanel(nextPanel)} /> : <div className="patch-no-results"><Search size={28} aria-hidden="true" /><h3>No matching releases.</h3><button type="button" onClick={() => setQuery("")}>Clear search</button></div>}</div>
          <footer className="patch-discovery-nav"><button type="button" disabled={index <= 0} onClick={() => selectRelease(releases[index - 1])} aria-label="Previous related release"><ChevronLeft size={18} aria-hidden="true" /><span>Previous</span></button><span role="status">{active ? `${index + 1} / ${releases.length} ${object ? "related builds" : "releases"}` : "0 releases"}</span><button type="button" disabled={!active || index >= releases.length - 1} onClick={() => selectRelease(releases[index + 1])} aria-label="Next related release"><span>Next</span><ChevronRight size={18} aria-hidden="true" /></button></footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </div>;
}
