import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

// Una linea que dice que es cada proyecto. La comparten el indice, las hojas
// que asoman y las fichas del abanico.
function projectRole(project) {
  return project.visual === "tradedex" ? "Discord automation" : "Live server map";
}

export function ProjectFolder({ items, selectedProjectTitle, onSelect }) {
  const [open, setOpen] = useState(false);
  useEffect(() => { if (selectedProjectTitle) setOpen(true); }, [selectedProjectTitle]);

  return (
    <section className={`project-folder-console${open ? " is-open" : ""}`} aria-label="Project directory">
      <header className="project-folder-status">
        <span><i /> /workspace/projects</span>
        <strong>{open ? "directory open" : "ready to explore"}</strong>
      </header>

      <div className="project-folder-intro">
        <span>FROM THE WORKBENCH</span>
        <h3>Small builds. <em>Real use.</em></h3>
        <p>Community bots and tools for the worlds I spend time in. Open a file to take a closer look.</p>
        {/* Indice de lo que hay dentro, no botones: si estas filas abrian los
            proyectos, la carpeta sobraba. Se abre desde la carpeta; pasar por
            encima de una fila la entreabre para senalarla. */}
        <h4 className="project-folder-intro-index">In this folder</h4>
        <ul aria-label="Projects in this directory">
          {items.map((project) => (
            <li className={`project-folder-intro-item is-${project.visual}`} key={project.title}>
              <span className="project-folder-intro-logo">
                <img src={project.image} alt="" decoding="async" />
              </span>
              <span className="project-folder-intro-copy">
                <strong>{project.title}</strong>
                <small>{projectRole(project)}</small>
                <span className="project-folder-intro-stack">
                  {project.tags.slice(0, 3).map((tag) => <i key={tag}>{tag}</i>)}
                </span>
              </span>
              <span className="project-folder-intro-file" aria-hidden="true">FILE_{project.kicker}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="project-folder-stage">
        <div className="project-folder-object">
          <span className="project-folder-tab" aria-hidden="true">PRJ</span>
          <span className="project-folder-back" aria-hidden="true" />

          {/* Las hojas que asoman son las fichas de verdad, en el mismo orden
              que el abanico: el primer proyecto a la izquierda, el hueco
              reservado en medio y el segundo a la derecha. */}
          <div className="project-folder-papers" aria-hidden="true">
            {[items[0], null, items[1]].map((project, index) => (
              <span
                className={`project-folder-paper is-paper-${["one", "two", "three"][index]} ${project ? `is-${project.visual}` : "is-soon"}`}
                key={project?.title || "soon"}
              >
                <span className="project-folder-paper-label">
                  <b>{project ? project.title : "Soon"}</b>
                  <small>{project ? projectRole(project) : "Slot reserved"}</small>
                </span>
                {project ? <img src={project.image} alt="" decoding="async" /> : null}
              </span>
            ))}
          </div>

          <div className="project-folder-files" id="project-folder-files" role="group" aria-label="Available projects">
            {items.map((project) => {
              const selected = selectedProjectTitle === project.title;

              return (
                <button
                  aria-controls="project-lanyard-dock"
                  aria-expanded={selected}
                  aria-label={`Open ${project.title} project details`}
                  className={`project-folder-file is-${project.visual}${selected ? " is-selected" : ""}`}
                  disabled={!open}
                  key={project.title}
                  onClick={() => onSelect(project)}
                  type="button"
                >
                  <span className="project-folder-file-head">
                    <span className="project-folder-file-slot">FILE_{project.kicker}</span>
                    <i aria-hidden="true" />
                  </span>
                  <span className="project-folder-file-logo">
                    <img src={project.image} alt="" aria-hidden="true" decoding="async" />
                  </span>
                  <strong>{project.title}</strong>
                  <em>{projectRole(project)}</em>
                  <small>{selected ? "project open" : "open project"}<ArrowRight size={11} aria-hidden="true" /></small>
                </button>
              );
            })}

            <article
              aria-disabled="true"
              aria-label="More projects coming soon"
              className="project-folder-file is-soon"
            >
              <span className="project-folder-file-head">
                <span className="project-folder-file-slot">FILE_03</span>
                <i aria-hidden="true" />
              </span>
              <span className="project-folder-soon-mark" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <strong>SOON...</strong>
              <em>slot reserved</em>
              <small>in the works</small>
            </article>
          </div>

          <button
            aria-controls="project-folder-files"
            aria-expanded={open}
            aria-label={open ? "Close projects folder" : "Open projects folder"}
            className="project-folder-front-button arcade-focus"
            onClick={() => setOpen((current) => !current)}
            type="button"
          >
            <span className="project-folder-front-piece is-left" aria-hidden="true" />
            <span className="project-folder-front-piece is-right" aria-hidden="true" />
            <span className="project-folder-front-copy">
              <span className="project-folder-stamp" aria-hidden="true">open source</span>
              <span className="project-folder-label">
                <i aria-hidden="true">archive // {String(items.length).padStart(2, "0")} files</i>
                <strong>PROJECTS.DIR</strong>
                <b aria-hidden="true" />
              </span>
              <small>{open ? "close directory" : "open directory ↗"}</small>
            </span>
          </button>

          {/* Abierta, el frontal se quedaba en blanco: el objeto mas grande de
              la escena sin nada escrito. El canto conserva la etiqueta. */}
          <span className="project-folder-edge" aria-hidden="true">
            <b>PROJECTS.DIR</b>
            <i />
            <em>{String(items.length).padStart(2, "0")} PROJECTS</em>
          </span>
        </div>
      </div>

      <p className="project-folder-hint">
        {open ? "select a project file // click folder to close" : "click folder // reveal project files"}
      </p>
    </section>
  );
}
