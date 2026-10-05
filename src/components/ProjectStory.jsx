import { useState } from "react";
import { ArrowLeft, ArrowUpRight, BookOpen, Copy, Flag, GitBranch, Terminal, X } from "lucide-react";
import { projectStories } from "../data/projectStories";

export function ProjectStory({ project, onBack, onClose, backRef }) {
  const [status, setStatus] = useState("");
  const [imageFailed, setImageFailed] = useState(false);
  const story = projectStories[project.title];
  if (!story) return null;
  const url = `${window.location.origin}/#project-${story.slug}`;
  async function copy() {
    try { await navigator.clipboard.writeText(url); setStatus("Project link copied."); }
    catch { setStatus(`Share: ${url}`); }
  }
  return <article className={`project-story project-story-${story.slug}`} aria-label={`${project.title} project story`}>
    <div className="project-story-titlebar">
      <button className="project-story-back" type="button" onClick={onBack} ref={backRef}><ArrowLeft size={15} aria-hidden="true" />Back to overview</button>
      <span className="project-story-route"><Terminal size={14} aria-hidden="true" /> ~/projects/{story.slug}/brief</span>
      <button className="project-story-close" type="button" onClick={onClose} aria-label={`Close ${project.title} project`}><X size={17} aria-hidden="true" /></button>
    </div>
    <div className="project-story-body">
      {/* Cabecera con la imagen al lado: el titulo y la vista previa son lo
          primero que se ve, y el resto se lee de arriba abajo en tarjetas. */}
      <header className="project-story-hero">
        <div className="project-story-heading"><span className="pixel-label">{story.eyebrow}</span><h3>{project.title}<span aria-hidden="true">_</span></h3><p>{story.headline}</p><div className="project-story-tags">{story.focus.map((item) => <span key={item}>{item}</span>)}</div></div>
        <figure><div className="project-story-preview-label"><span>VISUAL PREVIEW</span><span aria-hidden="true">[ {story.slug} ]</span></div><img src={imageFailed ? project.image : project.modal.previewImage || project.image} onError={() => setImageFailed(true)} loading="lazy" alt={`${project.title} ${project.modal.previewImage && !imageFailed ? "desktop interface" : "project artwork"}`} /><figcaption>{imageFailed ? `${project.title} project artwork` : story.imageCaption}</figcaption></figure>
      </header>
      <div className="project-story-cards"><section data-index="01"><h4><span>01</span> The problem</h4><p>{story.problem}</p></section><section data-index="02"><h4><span>02</span> What I built</h4><p>{story.contribution}</p></section></div>
      <section className="project-story-workflow"><h4><span>03</span> How it works</h4><ol>{story.workflow.map((step, index) => <li key={step}><span aria-hidden="true">{index + 1}</span><p>{step}</p></li>)}</ol></section>
      <section className="project-story-outcome"><span className="project-story-outcome-icon" aria-hidden="true"><Flag size={20} /></span><div><h4><span>04</span> The result</h4><p>{story.outcome}</p></div></section>
      <footer><a href={project.repoHref || project.href} target="_blank" rel="noreferrer"><GitBranch size={14} aria-hidden="true" /> Source code <ArrowUpRight size={13} aria-hidden="true" /></a><a href={`${project.repoHref || project.href}#readme`} target="_blank" rel="noreferrer"><BookOpen size={14} aria-hidden="true" /> Documentation <ArrowUpRight size={13} aria-hidden="true" /></a><button type="button" onClick={copy}><Copy size={14} aria-hidden="true" /> Copy link</button></footer>
      {status ? <p className="project-story-status" role="status">{status}</p> : null}
    </div>
  </article>;
}
