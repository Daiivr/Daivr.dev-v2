import { useState } from "react";

export function ProjectFolder({ items, selectedProjectTitle, onSelect }) {
  const [open, setOpen] = useState(false);

  return (
    <section className={`project-folder-console${open ? " is-open" : ""}`} aria-label="Project directory">
      <header className="project-folder-status">
        <span><i /> /workspace/projects</span>
        <strong>{open ? "directory open" : "directory sealed"}</strong>
      </header>

      <div className="project-folder-stage">
        <div className="project-folder-object">
          <span className="project-folder-tab" aria-hidden="true">PRJ</span>
          <span className="project-folder-back" aria-hidden="true" />

          <div className="project-folder-papers" aria-hidden="true">
            <span className="project-folder-paper is-paper-one" />
            <span className="project-folder-paper is-paper-two" />
            <span className="project-folder-paper is-paper-three" />
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
                  <span className="project-folder-file-slot">FILE_{project.kicker}</span>
                  <span className="project-folder-file-logo">
                    <img src={project.image} alt="" aria-hidden="true" decoding="async" />
                  </span>
                  <strong>{project.title}</strong>
                  <small>{selected ? "lanyard active" : "open project"}</small>
                </button>
              );
            })}

            <article
              aria-disabled="true"
              aria-label="More projects coming soon"
              className="project-folder-file is-soon"
            >
              <span className="project-folder-file-slot">FILE_03</span>
              <span className="project-folder-soon-mark" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <strong>SOON...</strong>
              <small>slot reserved</small>
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
              <strong>PROJECTS.DIR</strong>
              <small>{String(items.length + 1).padStart(2, "0")} project files</small>
            </span>
          </button>

          {/* Abierta, el frontal se quedaba en blanco: el objeto mas grande de
              la escena sin nada escrito. El canto conserva la etiqueta. */}
          <span className="project-folder-edge" aria-hidden="true">
            <b>PROJECTS.DIR</b>
            <i />
            <em>{String(items.length + 1).padStart(2, "0")} FILES</em>
          </span>
        </div>
      </div>

      <p className="project-folder-hint">
        {open ? "select a project file // click folder to close" : "click folder // reveal project files"}
      </p>
    </section>
  );
}
