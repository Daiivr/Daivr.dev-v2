import { useState } from "react";
import { projectStories } from "../data/projectStories";

export function ProjectStory({ project }) {
  const [status, setStatus] = useState("");
  const [imageFailed, setImageFailed] = useState(false);
  const story = projectStories[project.title];
  if (!story) return null;
  const url = `${window.location.origin}/#project-${story.slug}`;
  async function copy() {
    try { await navigator.clipboard.writeText(url); setStatus("Project link copied."); }
    catch { setStatus(`Share: ${url}`); }
  }
  return <article className="project-story" aria-label={`${project.title} project story`}>
    <header><span className="pixel-label">{story.eyebrow}</span><h3>{story.headline}</h3><div className="project-story-tags">{story.focus.map((item) => <span key={item}>{item}</span>)}</div></header>
    <div className="project-story-grid"><div><section><h4>The problem</h4><p>{story.problem}</p></section><section><h4>What I built</h4><p>{story.contribution}</p></section></div>
      <figure><img src={imageFailed ? project.image : project.modal.previewImage || project.image} onError={() => setImageFailed(true)} loading="lazy" alt={`${project.title} ${project.modal.previewImage && !imageFailed ? "desktop interface" : "project artwork"}`} /><figcaption>{imageFailed ? `${project.title} project artwork` : story.imageCaption}</figcaption></figure></div>
    <section><h4>How it works</h4><ol>{story.workflow.map((step) => <li key={step}>{step}</li>)}</ol></section>
    <section><h4>The result</h4><p>{story.outcome}</p></section>
    <footer><a href={project.repoHref || project.href} target="_blank" rel="noreferrer">Explore the source ↗</a><a href={`${project.repoHref || project.href}#readme`} target="_blank" rel="noreferrer">Read the documentation ↗</a><button type="button" onClick={copy}>Copy project link</button></footer>
    {status ? <p role="status">{status}</p> : null}
  </article>;
}
