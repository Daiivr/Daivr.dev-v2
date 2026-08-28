import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, Bot, Check, Code2, Copy, Cpu, Download, ExternalLink, Gamepad2, Github, Globe2, Lock, ShieldCheck, Terminal, Twitch, X } from "lucide-react";
import { FaDiscord, FaSteam } from "react-icons/fa6";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { now, projects, roomStats, socialLinks, stack } from "../data/site";
import { DecodeText } from "./DecodeText";
import { DiscordPresencePanel } from "./DiscordPresencePanel";
import { GameShelf } from "./GameShelf";
import { PatchNotes } from "./PatchNotes";
import { ProjectFolder } from "./ProjectFolder";

const ProjectLanyard = lazy(() => import("./ProjectLanyard"));

const socialIcons = {
  discord: FaDiscord,
  github: Github,
  steam: FaSteam,
  twitch: Twitch
};

const toolbeltModules = [
  { code: "UI.SYS", icon: Code2 },
  { code: "BOT.OPS", icon: Bot },
  { code: "GAME.UX", icon: Gamepad2 },
  { code: "SHIP.CHECK", icon: ShieldCheck }
];

const nowModules = [
  { code: "BUILD.SYS", icon: Code2 },
  { code: "PLAY.STATE", icon: Gamepad2 },
  { code: "LEARN.LOG", icon: Cpu }
];

const TRADEDEX_INFO_ENDPOINT = "/api/tradedex/info";
const TRADEDEX_SCAN_ENDPOINT = "/api/tradedex/scan";

function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (!value) return null;
  const mb = value / (1024 * 1024);
  return `${mb >= 10 ? Math.round(mb) : mb.toFixed(1)} MB`;
}

function shortHash(hash) {
  if (!hash) return null;
  return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
}

function getDetectionsFromStats(stats) {
  if (!stats) return null;
  return Number(stats.malicious || 0) + Number(stats.suspicious || 0);
}

function getVirusTotalState(project, scanData) {
  if (scanData?.error || scanData?.status === "error") return "flagged";
  if (scanData?.status && scanData.status !== "done") return "scanning";
  const lookupStatus = scanData?.vt?.status || scanData?.scan?.status;
  if (lookupStatus === "pending") return "scanning";
  if (["not-scanned", "unavailable"].includes(lookupStatus)) return "unavailable";

  const stats = scanData?.vt?.stats || scanData?.scan?.stats || null;
  const detections = getDetectionsFromStats(stats);
  if (detections > 1) return "flagged";
  if (detections === 1) return "false-positive";

  const verdict = scanData?.vt?.verdict || scanData?.scan?.verdict;
  if (verdict === "malicious") return "flagged";
  if (verdict === "suspicious") return "false-positive";
  if (verdict === "clean") return "clean";

  const scan = project.virusTotal;
  if (!scan) return null;

  const staticDetections = Number(scan.detections || 0);
  const modalVerdict = String(project.modal?.verdict || "").toLowerCase();
  return modalVerdict.includes("scanning")
    ? "scanning"
    : scan.state || (staticDetections > 1 ? "flagged" : staticDetections === 1 ? "false-positive" : "clean");
}

function getVirusTotalBadge(project, scanData) {
  const state = getVirusTotalState(project, scanData);
  if (!state) return null;

  if (state === "scanning") return { className: "is-scanning", label: "VT scanning" };
  if (state === "unavailable") {
    const reason = scanData?.vt?.reason || scanData?.scan?.reason;
    return {
      className: "is-scanning",
      label: reason === "hash-not-indexed" ? "VT not indexed" : "VT unavailable"
    };
  }
  if (state === "flagged") return { className: "is-flagged", label: "VT flagged" };
  if (state === "false-positive") return { className: "is-false-positive", label: "False positive" };
  return { className: "is-clean", label: "VT clean" };
}

let projectScrollUnlockTimer = null;
let projectScrollGuardCleanup = null;

function enableProjectScrollGuard() {
  if (typeof window === "undefined" || projectScrollGuardCleanup) return;

  function isInsideProjectModal(event) {
    const target = event.target;
    return target instanceof Element && Boolean(target.closest(".project-modal"));
  }

  function stopBackgroundScroll(event) {
    if (isInsideProjectModal(event)) return;
    event.preventDefault();
  }

  document.addEventListener("wheel", stopBackgroundScroll, { capture: true, passive: false });
  document.addEventListener("touchmove", stopBackgroundScroll, { capture: true, passive: false });

  projectScrollGuardCleanup = () => {
    document.removeEventListener("wheel", stopBackgroundScroll, { capture: true });
    document.removeEventListener("touchmove", stopBackgroundScroll, { capture: true });
    projectScrollGuardCleanup = null;
  };
}

function lockProjectPageWidth() {
  if (typeof window === "undefined") return;
  if (projectScrollUnlockTimer) window.clearTimeout(projectScrollUnlockTimer);

  const root = document.documentElement;
  const bodyWidth = document.body.getBoundingClientRect().width;
  const lockWidth = Math.round(bodyWidth || root.clientWidth);
  const scrollbarWidth = Math.max(0, window.innerWidth - lockWidth);

  root.style.setProperty("--project-scrollbar-width", `${scrollbarWidth}px`);
  root.style.setProperty("--project-lock-width", `${lockWidth}px`);
  root.classList.add("project-modal-layout-lock");
  document.body.classList.add("project-modal-layout-lock");
  enableProjectScrollGuard();
}

function unlockProjectPageWidth() {
  if (typeof window === "undefined") return;
  if (projectScrollUnlockTimer) window.clearTimeout(projectScrollUnlockTimer);

  projectScrollUnlockTimer = window.setTimeout(() => {
    const root = document.documentElement;
    root.classList.remove("project-modal-layout-lock");
    document.body.classList.remove("project-modal-layout-lock");
    root.style.removeProperty("--project-scrollbar-width");
    root.style.removeProperty("--project-lock-width");
    projectScrollGuardCleanup?.();
  }, 240);
}

export function ProgramSections() {
  return (
    <>
      <section className="py-16 md:py-24" id="now">
        <SectionHeading eyebrow="NOW.LOG" title="Current save-state." />
        <div className="now-console panel-strong">
          <div className="now-console-header">
            <div>
              <span className="now-console-lights" aria-hidden="true"><i /><i /><i /></span>
              <code>~/daivr/now.log</code>
            </div>
            <span className="now-console-state"><i /> {String(now.length).padStart(2, "0")} slots loaded</span>
          </div>

          <div className="now-dashboard">
            <div className="now-stream">
              {now.map((item, index) => {
                const module = nowModules[index] || { code: "STATE.LOG", icon: Cpu };
                const Icon = module.icon;

                return (
                  <article className={`interactive-card now-card is-now-${index + 1}`} key={item.title}>
                    <div className="now-card-rail">
                      <span className="now-card-index">{String(index + 1).padStart(2, "0")}</span>
                      <span className="now-card-icon"><Icon size={20} aria-hidden="true" /></span>
                    </div>

                    <div className="now-card-copy">
                      <div className="now-card-topline">
                        <p>{item.label}</p>
                        <span><i /> synced</span>
                      </div>
                      <small>{module.code}</small>
                      <h3>{item.title}</h3>
                      <p>{item.body}</p>
                      <div className="now-card-footer" aria-hidden="true">
                        <span>save slot active</span>
                        <span><i /><i /><i /><i /></span>
                      </div>
                    </div>
                    <span className="now-card-corner" aria-hidden="true" />
                  </article>
                );
              })}
            </div>

            <div className="interactive-card status-sidecar overflow-hidden">
              <div className="status-sidecar-header">
                <div>
                  <p className="pixel-label">status.ini</p>
                  <strong>room profile</strong>
                </div>
                <span className="status-sidecar-signal" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
              </div>
              <dl className="status-sidecar-list">
                {roomStats.map(([label, value]) => (
                  <div className="status-sidecar-row" key={label}>
                    <dt>{label}</dt>
                    <dd className="font-black text-white">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="status-sidecar-graph" aria-hidden="true">
                {Array.from({ length: 18 }).map((_, index) => (
                  <span key={index} />
                ))}
              </div>
              <div className="status-sidecar-footer" aria-hidden="true">
                <span>runtime stable</span>
                <i />
              </div>
            </div>
          </div>
        </div>

        <LinkConsole />
      </section>

      <section className="py-16 md:py-24" id="builds">
        <SectionHeading eyebrow="PROJECT.CONSOLE" title="Builds, bots, and tools." />
        <ProjectConsole />
      </section>

      <section className="py-16 md:py-24" id="room">
        <SectionHeading eyebrow="DISCORD.PRESENCE" title="Live room signal." />
        <DiscordPresencePanel />
      </section>

      <GameShelf />

      <section className="py-16 md:py-24" id="toolbelt">
        <SectionHeading eyebrow="TOOLBELT.DAT" title="What powers the cabinet." />
        <div className="toolbelt-console panel-strong">
          <div className="toolbelt-console-header">
            <div>
              <span className="toolbelt-console-lights" aria-hidden="true"><i /><i /><i /></span>
              <code>~/daivr/toolbelt.scan</code>
            </div>
            <span className="toolbelt-console-state"><i /> {String(stack.length).padStart(2, "0")} modules online</span>
          </div>

          <div className="toolbelt-grid">
            {stack.map((item, index) => {
              const module = toolbeltModules[index] || { code: "SYS.NODE", icon: Cpu };
              const Icon = module.icon;

              return (
                <article className={`interactive-card toolbelt-card is-module-${index + 1}`} key={item.title}>
                  <div className="toolbelt-card-header">
                    <span>MOD.{String(index + 1).padStart(2, "0")}</span>
                    <span><i /> ready</span>
                  </div>

                  <div className="toolbelt-card-icon" aria-hidden="true">
                    <Icon size={25} />
                  </div>

                  <div className="toolbelt-card-copy">
                    <p>{module.code}</p>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </div>

                  <div className="toolbelt-card-footer">
                    <span>capability online</span>
                    <span className="toolbelt-card-meter" aria-hidden="true"><i /><i /><i /><i /></span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24" id="patchlog">
        <SectionHeading eyebrow="PATCH.LOG" title="Cabinet firmware history." />
        <PatchNotes />
      </section>
    </>
  );
}

function SectionHeading({ eyebrow, title }) {
  return (
    <div className="mb-8 max-w-3xl">
      <DecodeText as="p" className="pixel-label mb-2" duration={520} text={eyebrow} />
      <DecodeText
        as="h2"
        className="font-display text-[clamp(2rem,4.8vw,4.6rem)] font-black uppercase leading-[.95] text-white text-balance"
        delay={140}
        duration={980}
        text={title}
      />
    </div>
  );
}

function LinkConsole() {
  return (
    <div className="link-console" id="links">
      <div className="link-console-titlebar">
        <div aria-hidden="true" className="link-console-lights">
          <span />
          <span />
          <span />
        </div>
        <div>
          <h3>&gt; links.sh</h3>
          <p>external route selector · verified endpoints</p>
        </div>
        <div className="link-console-status" aria-label={`${socialLinks.length} verified external routes`}>
          <span className="link-console-status-label">route table</span>
          <strong>{String(socialLinks.length).padStart(2, "0")}</strong>
          <span className="link-console-status-live"><i /> online</span>
        </div>
      </div>

      <div className="link-console-grid">
        {socialLinks.map((link, index) => {
          const Icon = socialIcons[link.icon] || Globe2;
          return (
            <a
              className={`link-console-card arcade-focus is-${link.tone}`}
              href={link.href}
              key={link.href}
              rel="noreferrer"
              target="_blank"
            >
              <span className="link-console-card-topline">
                <span className="link-console-index">route_{String(index + 1).padStart(2, "0")}</span>
                <span className="link-console-verified"><Check size={11} aria-hidden="true" /> verified</span>
              </span>
              <span className="link-console-identity">
                <span className="link-console-icon">
                  <Icon size={27} aria-hidden="true" />
                </span>
                <span className="link-console-copy">
                  <small>{link.host}</small>
                  <strong>{link.label}</strong>
                  <span>{link.summary}</span>
                </span>
              </span>
              <span className="link-console-card-footer">
                <span className="link-console-route"><i /> {link.route}</span>
                <span className="link-console-action">launch <ExternalLink size={13} aria-hidden="true" /></span>
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

function ProjectConsole() {
  const [projectScanInfo, setProjectScanInfo] = useState({});
  const [selectedProjectTitle, setSelectedProjectTitle] = useState("");
  const [liveScan, setLiveScan] = useState(null);
  const [scanError, setScanError] = useState("");
  const lanyardDockRef = useRef(null);
  const selectedProject = projects.find((project) => project.title === selectedProjectTitle) || null;

  useEffect(() => {
    let cancelled = false;

    async function loadTradeDexInfo() {
      try {
        const response = await fetch(TRADEDEX_INFO_ENDPOINT);
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled) setProjectScanInfo((current) => ({ ...current, TradeDex: data }));
      } catch (error) {
        console.error("TradeDex info lookup failed", error);
      }
    }

    loadTradeDexInfo();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (selectedProject?.modal.type !== "download") {
      setLiveScan(null);
      setScanError("");
      return undefined;
    }

    let cancelled = false;
    let timer = null;

    async function loadScan() {
      try {
        const response = await fetch(TRADEDEX_SCAN_ENDPOINT, { cache: "no-store" });
        const data = await response.json().catch(() => null);
        if (cancelled) return;

        if (!response.ok) {
          setScanError(data?.message || "No se pudo escanear el release.");
          setLiveScan({ status: "error", error: data?.message || "scan failed" });
          return;
        }

        setScanError("");
        setLiveScan(data);

        const shouldPoll =
          data?.status !== "done" ||
          data?.vt?.status === "pending" ||
          data?.vt?.status === "not-scanned" ||
          ["init", "downloading", "hashing", "querying", "submitting", "analyzing"].includes(data?.stage);

        if (shouldPoll && !cancelled) {
          const retryDelay = data?.vt?.status === "not-scanned"
            ? Math.max(5_000, Number(data?.retryAfterMs || 60_000) + 1_000)
            : 4_000;
          timer = window.setTimeout(loadScan, retryDelay);
        }
      } catch (error) {
        if (cancelled) return;
        console.error("TradeDex scan failed", error);
        setScanError("No se pudo contactar el scanner.");
        setLiveScan({ status: "error", error: "scanner unreachable" });
      }
    }

    loadScan();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [selectedProject]);

  useEffect(() => {
    if (!selectedProject) return undefined;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => {
      lanyardDockRef.current?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "nearest"
      });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [selectedProject]);

  function selectProject(project) {
    setSelectedProjectTitle((current) => current === project.title ? "" : project.title);
    window.dispatchEvent(new CustomEvent("daivr-buddy-quest-progress", {
      detail: { type: "cartridge", id: `project:${project.title}` }
    }));
  }

  const selectedScanData = selectedProject?.modal.type === "download"
    ? liveScan || projectScanInfo[selectedProject.title] || null
    : projectScanInfo[selectedProject?.title] || null;

  return (
    <div className="project-console panel-strong">
      <div className="project-console-header">
        <div className="project-console-header-copy">
          <h3>&gt; current-projects.sh</h3>
          <p><span /> workspace feed · realtime build</p>
        </div>
        <div className="project-console-telemetry">
          <span className="project-console-count">
            <small>active slots</small>
            <b>{String(projects.length).padStart(2, "0")}</b>
          </span>
          <strong><span /> building</strong>
        </div>
      </div>

      <ProjectFolder
        items={projects}
        onSelect={selectProject}
        selectedProjectTitle={selectedProjectTitle}
      />

      {selectedProject ? (
        <ProjectLanyardDock
          dockRef={lanyardDockRef}
          key={selectedProject.title}
          onClose={() => setSelectedProjectTitle("")}
          project={selectedProject}
          scanData={selectedScanData}
          scanError={scanError}
        />
      ) : null}
    </div>
  );
}

function getProjectLanyardScan(project, scanData, scanError) {
  const state = getVirusTotalState(project, scanData);
  const stats = scanData?.vt?.stats || scanData?.scan?.stats || null;
  const detections = getDetectionsFromStats(stats);
  const fileName = scanData?.asset?.name || "TradeDex latest release";
  const fileSize = formatBytes(scanData?.asset?.size) || project.modal.asset;
  const fullHash = scanData?.sha256 || "";
  const hash = shortHash(fullHash) || project.modal.sha;
  const virusTotalUrl = scanData?.vt?.permalink || (fullHash
    ? `https://www.virustotal.com/gui/file/${fullHash}`
    : null);
  const complete = scanData?.status === "done";

  return {
    state,
    detections,
    engines: Number(stats?.total || 0),
    fileName,
    fileSize,
    hash,
    virusTotalUrl,
    canOpenRelease: complete && state === "clean",
    needsWarning: complete && state === "false-positive",
    status: scanError || scanData?.error || (
      state === "clean"
        ? "VirusTotal reports no detections."
        : state === "false-positive"
          ? "One engine flagged the release; review before continuing."
          : state === "flagged"
            ? "Release access blocked by the safety gate."
            : state === "scanning"
              ? "Checking the latest release digest."
              : "VirusTotal report is currently unavailable."
    )
  };
}

function ProjectLanyardDock({ project, scanData, scanError, onClose, dockRef }) {
  const [showWarning, setShowWarning] = useState(false);
  const virusTotalBadge = getVirusTotalBadge(project, scanData);
  const scan = project.modal.type === "download"
    ? getProjectLanyardScan(project, scanData, scanError)
    : null;
  const projectFacts = project.modal.type === "site"
    ? project.modal.systems
    : [
        ["release", scanData?.tag || project.badge],
        ["asset", `${scan.fileName} · ${scan.fileSize}`],
        ["sha-256", scan.hash]
      ];

  return (
    <section
      aria-label={`${project.title} interactive project lanyard`}
      className={`project-lanyard-dock is-${project.visual}`}
      id="project-lanyard-dock"
      ref={dockRef}
    >
      <header className="project-lanyard-header">
        <div>
          <span>PROJECT.BADGE // SLOT_{project.kicker}</span>
          <strong>{project.title} access lanyard</strong>
        </div>
        <span className="project-lanyard-live"><i /> physics online</span>
        <button className="arcade-focus" type="button" onClick={onClose} aria-label="Retract project lanyard">
          <X size={17} aria-hidden="true" />
        </button>
      </header>

      <div className="project-lanyard-layout">
        <div className="project-lanyard-stage" aria-label="Draggable physics lanyard preview">
          <Suspense fallback={<div className="project-lanyard-loading">loading physics rig...</div>}>
            <ProjectLanyard project={project} />
          </Suspense>
          <span className="project-lanyard-drag-hint">drag badge // release to swing</span>
        </div>

        <article className="project-lanyard-info">
          <div className="project-lanyard-identity">
            <span className="project-lanyard-logo">
              <img src={project.image} alt="" aria-hidden="true" />
            </span>
            <div>
              <span>{project.channel}</span>
              <h3>{project.title}</h3>
              <p>{project.meta}</p>
            </div>
          </div>

          <p className="project-lanyard-summary">{project.description}</p>

          <ul className="project-lanyard-tags" aria-label={`${project.title} technology stack`}>
            {project.tags.map((tag) => <li key={tag}>{tag}</li>)}
          </ul>

          <dl className="project-lanyard-facts">
            {projectFacts.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>

          {scan ? (
            <div className={`project-lanyard-scan is-${scan.state || "scanning"}`} role="status" aria-live="polite">
              <ShieldCheck size={20} aria-hidden="true" />
              <div>
                <span>{virusTotalBadge?.label || "VT checking"}</span>
                <strong>{scan.status}</strong>
                {scan.engines ? <small>{scan.detections || 0}/{scan.engines} engine detections</small> : null}
              </div>
            </div>
          ) : null}

          <div className="project-lanyard-actions">
            <a className="arcade-focus is-primary" href={project.repoHref} target="_blank" rel="noreferrer">
              <Github size={17} aria-hidden="true" />
              <span>{project.modal.type === "site" ? "Open repository" : "View source"}</span>
              <ExternalLink size={14} aria-hidden="true" />
            </a>

            {project.modal.type === "site" ? (
              <a className="arcade-focus" href={project.href} target="_blank" rel="noreferrer">
                <Globe2 size={17} aria-hidden="true" />
                <span>Project page</span>
                <ExternalLink size={14} aria-hidden="true" />
              </a>
            ) : scan.canOpenRelease ? (
              <a className="arcade-focus" href={project.href} target="_blank" rel="noreferrer">
                <Download size={17} aria-hidden="true" />
                <span>Verified release</span>
                <ExternalLink size={14} aria-hidden="true" />
              </a>
            ) : scan.needsWarning ? (
              <button className="arcade-focus is-warning" type="button" onClick={() => setShowWarning(true)}>
                <ShieldCheck size={17} aria-hidden="true" />
                <span>Review release</span>
                <ArrowRight size={14} aria-hidden="true" />
              </button>
            ) : (
              <span className="project-lanyard-action-disabled" aria-disabled="true">
                <Lock size={17} aria-hidden="true" />
                <span>Release locked</span>
              </span>
            )}

            {scan?.virusTotalUrl ? (
              <a className="arcade-focus" href={scan.virusTotalUrl} target="_blank" rel="noreferrer">
                <ShieldCheck size={17} aria-hidden="true" />
                <span>VT report</span>
                <ExternalLink size={14} aria-hidden="true" />
              </a>
            ) : null}
          </div>

          {showWarning ? (
            <div className="project-lanyard-warning" role="alert">
              <strong>Single-detection review required</strong>
              <p>Review the VirusTotal report before opening this GitHub release.</p>
              <div>
                <button className="arcade-focus" type="button" onClick={() => setShowWarning(false)}>Cancel</button>
                <a className="arcade-focus" href={project.href} target="_blank" rel="noreferrer">
                  Continue to release <ExternalLink size={13} aria-hidden="true" />
                </a>
              </div>
            </div>
          ) : null}
        </article>
      </div>
    </section>
  );
}

function ProjectModal({ project, scanData, scanError, onClose }) {
  const modal = project.modal;
  const contentRef = useRef(null);

  return (
    <Dialog.Portal>
      <button className="project-modal-overlay" data-state="open" type="button" aria-label="Close project modal" onClick={onClose} />
      <Dialog.Content
        className={`project-modal project-modal-${modal.type}`}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          contentRef.current?.focus({ preventScroll: true });
        }}
        ref={contentRef}
        tabIndex={-1}
      >
        <div className="project-modal-windowbar">
          <div className="project-modal-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <span>dai@scanner : {modal.path}</span>
          <ProjectModalClose />
        </div>

        {modal.type === "download" ? (
          <DownloadGate project={project} scanData={scanData} scanError={scanError} />
        ) : (
          <LiveSitePanel project={project} />
        )}
      </Dialog.Content>
    </Dialog.Portal>
  );
}

function ProjectModalClose() {
  return (
    <Dialog.Close className="arcade-focus project-modal-close">
      <X size={18} aria-hidden="true" />
      <span className="sr-only">Close project modal</span>
    </Dialog.Close>
  );
}

function buildDownloadGateView(project, scanData, scanError) {
  const modal = project.modal;
  const vt = scanData?.vt || null;
  const stats = vt?.stats || null;
  const detections = getDetectionsFromStats(stats);
  const isPending = scanData?.status && scanData.status !== "done";
  const vtPending = vt?.status === "pending";
  const assetName = scanData?.asset?.name || "TradeDex_1.10.exe";
  const assetSize = formatBytes(scanData?.asset?.size) || modal.asset;
  const fullSha = scanData?.sha256 || "";
  const shaLabel = shortHash(fullSha) || modal.sha;
  const engineTotal = Number(stats?.total || 0);
  const progress = Math.round(
    scanData?.progress != null
      ? Math.max(0, Math.min(1, Number(scanData.progress))) * 100
      : modal.progress
  );
  const state = getVirusTotalState(project, scanData);
  const vtUnavailable = ["not-scanned", "unavailable"].includes(vt?.status);
  const statsDetail = stats
    ? `engines ${stats.total} · clean ${(stats.harmless || 0) + (stats.undetected || 0)} · susp ${stats.suspicious || 0} · mal ${stats.malicious || 0}`
    : vtPending
      ? "analysis queued in VirusTotal"
      : vtUnavailable
        ? vt?.reason === "missing-github-digest"
          ? "GitHub did not publish a SHA-256 digest for this asset"
          : vt?.reason === "hash-not-indexed"
            ? "release digest is not indexed by VirusTotal yet"
            : vt?.reason === "analysis-missing"
              ? "VirusTotal has no completed engine summary for this digest"
            : vt?.reason === "missing-vt-key"
                ? "VirusTotal lookup is not configured on this server"
                : "VirusTotal lookup is temporarily unavailable"
        : null;

  let verdict = modal.verdict;
  let status = modal.status;
  if (scanError || scanData?.status === "error") {
    verdict = "CHECK FAILED";
    status = scanError || scanData?.error || "scan failed";
  } else if (isPending || vtPending || state === "scanning") {
    verdict = "CHECKING FILE";
    status = vtPending ? "VirusTotal analysis is queued" : "Requesting the latest report";
  } else if (state === "flagged") {
    verdict = detections ? `${detections} THREATS FOUND` : "THREATS FOUND";
    status = stats?.total ? `${detections} of ${stats.total} engines flagged this file` : "Download blocked";
  } else if (state === "false-positive") {
    verdict = "1 DETECTION";
    status = stats?.total ? `1 of ${stats.total} engines flagged this file` : "Review recommended before downloading";
  } else if (state === "clean") {
    verdict = "NO THREATS FOUND";
    status = stats?.total ? `0 of ${stats.total} engines flagged this file` : "VirusTotal marked this file clean";
  } else if (state === "unavailable") {
    verdict = "REPORT UNAVAILABLE";
    status = vt?.reason === "hash-not-indexed"
      ? "VirusTotal has not indexed this file yet"
      : vt?.reason === "missing-github-digest"
        ? "GitHub did not publish a file hash"
        : "The VirusTotal report could not be loaded";
  }

  const reportFailed = Boolean(scanError || scanData?.status === "error");
  const reportProgress = reportFailed || state === "unavailable" ? 0 : progress;
  const reportProgressTitle = reportFailed
    ? "VirusTotal check failed"
    : state === "unavailable"
      ? "VirusTotal report unavailable"
      : state === "scanning"
        ? "Loading VirusTotal report"
        : "VirusTotal report complete";
  const reportProgressLabel = reportFailed
    ? "Could not complete"
    : state === "unavailable"
      ? "No engine data"
      : state === "scanning"
        ? `${progress}%`
        : stats?.total
          ? `${stats.total} engines checked`
          : `${progress}%`;

  return {
    release: scanData?.tag || modal.release,
    asset: assetSize,
    assetName,
    sha: shaLabel,
    fullSha,
    detections: detections ?? null,
    engineTotal,
    reportProgress,
    reportProgressTitle,
    reportProgressLabel,
    verdict,
    status,
    state,
    statsDetail,
    virusTotalUrl: vt?.permalink || (scanData?.sha256
      ? `https://www.virustotal.com/gui/file/${scanData.sha256}`
      : null),
    submitted: Boolean(vt?.submitted),
    canDownload: (state === "clean" || state === "false-positive") && !scanError && scanData?.status === "done",
    needsDownloadWarning: state === "false-positive"
  };
}

function DownloadGate({ project, scanData, scanError }) {
  const modal = project.modal;
  const view = buildDownloadGateView(project, scanData, scanError);
  const StatusIcon = view.state === "clean" || view.state === "false-positive"
    ? ShieldCheck
    : view.state === "flagged"
      ? Lock
      : view.state === "scanning"
        ? Cpu
        : Terminal;
  const terminalRows = [
    { type: "prompt", content: modal.command },
    { type: "blank" },
    { type: "command", label: "init scanner", state: scanData ? "OK" : ".." },
    {
      type: "command",
      label: "resolve asset metadata",
      state: scanData?.asset ? "OK" : ".."
    },
    ...(scanData?.asset ? [{ type: "detail", detail: `${view.assetName} · ${view.asset}` }] : []),
    {
      type: "command",
      label: "read GitHub sha-256",
      state: scanData?.sha256 ? "OK" : ".."
    },
    ...(scanData?.sha256 ? [{ type: "detail", detail: view.sha }] : []),
    {
      type: "command",
      label: "query virustotal",
      state: scanData?.vt || scanData?.status === "error" ? (scanData?.status === "error" ? "ERR" : "OK") : ".."
    },
    ...(view.statsDetail ? [{ type: "detail", detail: view.statsDetail }] : []),
    ...(scanError || scanData?.status === "error" || (scanData?.status === "done" && view.state !== "scanning")
      ? [{ type: "verdict", tone: view.state, detail: `verdict · ${view.verdict.toLowerCase()} — ${view.status}` }]
      : []),
    { type: "blank" },
    { type: "prompt", content: null }
  ];

  return (
    <>
      <header className="project-modal-hero">
        <div>
          <Dialog.Title>{modal.title} <span>// {modal.label}</span></Dialog.Title>
          <Dialog.Description>{modal.description}</Dialog.Description>
        </div>
      </header>

      <section
        className={`project-scan-summary is-${view.state || "scanning"}`}
        style={{ "--project-progress": `${view.reportProgress}%` }}
        role="status"
        aria-live="polite"
      >
        <div className="project-scan-summary-icon" aria-hidden="true">
          <StatusIcon size={25} />
        </div>
        <div className="project-scan-summary-copy">
          <span>VirusTotal result</span>
          <strong>{view.verdict}</strong>
          <p>{view.status}</p>
        </div>
        <div className="project-scan-summary-stat">
          <span>{view.engineTotal ? "engine detections" : "engine data"}</span>
          <strong>{view.engineTotal ? `${view.detections || 0}/${view.engineTotal}` : "—"}</strong>
          <small>{view.engineTotal ? "engines flagged" : "not available"}</small>
        </div>
        <div className="project-scan-meter">
          <div>
            <span>{view.reportProgressTitle}</span>
            <strong>{view.reportProgressLabel}</strong>
          </div>
          <i aria-hidden="true" />
        </div>
      </section>

      <div className="project-file-facts" aria-label="Release file details">
        <div className="project-file-fact">
          <span>Release</span>
          <strong>{view.release}</strong>
        </div>
        <div className="project-file-fact">
          <span>Download file</span>
          <strong>{view.assetName}</strong>
          <small>{view.asset}</small>
        </div>
        <ProjectHash value={view.fullSha} fallback={view.sha} />
      </div>

      <div className="project-terminal-log">
        {terminalRows.map((row, index) => (
          <p className={`project-terminal-row project-terminal-${row.type}`} key={`${row.type}-${index}`}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            {row.type === "prompt" ? (
              <strong>user@daivr <em>$</em> {row.content ? row.content : <i />}</strong>
            ) : null}
            {row.type === "command" ? (
              <>
                <strong className="project-terminal-command">
                  <span aria-hidden="true">➜</span>
                  {row.label}
                </strong>
                <b>{row.state}</b>
              </>
            ) : null}
            {row.type === "detail" ? (
              <small>
                <span aria-hidden="true">└─</span>
                {row.detail}
              </small>
            ) : null}
            {row.type === "verdict" ? (
              <strong className={`project-terminal-verdict is-${row.tone}`}>
                {row.tone === "clean" ? (
                  <Check size={15} aria-hidden="true" />
                ) : row.tone === "false-positive" ? (
                  <ShieldCheck size={15} aria-hidden="true" />
                ) : (
                  <X size={15} aria-hidden="true" />
                )}
                {row.detail}
              </strong>
            ) : null}
          </p>
        ))}
      </div>

      <ModalActions
        project={project}
        primaryIcon={Download}
        secondaryIcon={Github}
        canDownload={view.canDownload}
        downloadWarning={view.needsDownloadWarning ? view.statsDetail || "single detection review" : ""}
        virusTotalUrl={view.virusTotalUrl}
      />
      <footer className="project-modal-status">
        <span /> streaming <b>tag {view.release}</b> <b>vt {view.state || "scanning"}</b>
      </footer>
    </>
  );
}

function LiveSitePanel({ project }) {
  const modal = project.modal;

  return (
    <>
      <header className="project-modal-hero">
        <div>
          <Dialog.Title>{modal.title} <span>// {modal.label}</span></Dialog.Title>
          <Dialog.Description>{modal.description}</Dialog.Description>
        </div>
      </header>

      <div className="project-site-grid">
        <div className="project-site-preview">
          <span className="project-card-grid" aria-hidden="true" />
          <img
            src={modal.previewImage || project.image}
            alt={`${project.title} interface preview`}
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
          {project.icon ? <img className="project-site-emblem" src={project.icon} alt="" aria-hidden="true" /> : null}
        </div>
        <div className="project-site-copy">
          <span>endpoint</span>
          <strong>{modal.endpoint}</strong>
          <p>{project.meta}</p>
          <dl>
            {modal.systems.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <ModalActions project={project} primaryIcon={Globe2} secondaryIcon={Github} />
      <footer className="project-modal-status"><span /> online <b>{modal.repo}</b></footer>
    </>
  );
}

function ProjectHash({ value, fallback }) {
  const [copied, setCopied] = useState(false);
  const resetTimerRef = useRef(null);

  useEffect(() => () => {
    if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
  }, []);

  async function copyHash() {
    if (!value || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="project-file-fact project-file-hash">
      <span>SHA-256 file hash</span>
      <div>
        <code title={value || fallback}>{value || fallback}</code>
        <button
          className="arcade-focus"
          type="button"
          onClick={copyHash}
          disabled={!value}
          aria-label={copied ? "SHA-256 copied" : "Copy complete SHA-256 hash"}
        >
          {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
          <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
    </div>
  );
}

function ModalActions({
  project,
  primaryIcon: PrimaryIcon,
  secondaryIcon: SecondaryIcon,
  canDownload = true,
  downloadWarning = "",
  virusTotalUrl = null
}) {
  const [showDownloadWarning, setShowDownloadWarning] = useState(false);
  const gateLocked = project.modal.type === "download" && !canDownload;
  const needsWarning = project.modal.type === "download" && Boolean(downloadWarning);
  const reportAction = needsWarning ? "review VT report" : canDownload ? "view VT report" : "check VT report";

  function confirmDownload() {
    setShowDownloadWarning(false);
    window.open(project.href, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <div className="project-modal-actions">
        <a
          aria-disabled={gateLocked}
          className={`arcade-focus${gateLocked ? " is-disabled" : ""}`}
          href={gateLocked || needsWarning ? undefined : project.href}
          onClick={(event) => {
            if (gateLocked) {
              event.preventDefault();
              return;
            }

            if (needsWarning) {
              event.preventDefault();
              setShowDownloadWarning(true);
            }
          }}
          target="_blank"
          rel="noreferrer"
        >
          <PrimaryIcon size={18} aria-hidden="true" />
          <span>{project.modal.primaryAction}</span>
          <ExternalLink size={15} aria-hidden="true" />
        </a>
        <a className="arcade-focus" href={project.repoHref} target="_blank" rel="noreferrer">
          <SecondaryIcon size={18} aria-hidden="true" />
          <span>{project.modal.secondaryAction}</span>
          <ExternalLink size={15} aria-hidden="true" />
        </a>
        {project.modal.type === "download" ? (
          virusTotalUrl ? (
            <a
              aria-label={`${reportAction}, opens in a new tab`}
              className={`arcade-focus project-modal-locked is-report is-link${needsWarning ? " is-warning" : canDownload ? " is-online" : ""}`}
              href={virusTotalUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ShieldCheck size={18} aria-hidden="true" />
              <span>{reportAction}</span>
              <ExternalLink size={15} aria-hidden="true" />
            </a>
          ) : (
            <div className="project-modal-locked">
              <Lock size={18} aria-hidden="true" />
              <span>report unavailable</span>
              <X size={15} aria-hidden="true" />
            </div>
          )
        ) : (
          <div className="project-modal-locked is-online">
            <Check size={18} aria-hidden="true" />
            <span>{project.modal.status}</span>
          </div>
        )}
      </div>

      {showDownloadWarning ? (
        <div className="project-download-warning-shell" role="presentation">
          <div
            aria-describedby="project-download-warning-detail"
            aria-labelledby="project-download-warning-title"
            aria-modal="true"
            className="project-download-warning"
            role="alertdialog"
          >
            <button
              className="project-download-warning-close arcade-focus"
              type="button"
              aria-label="Close download warning"
              onClick={() => setShowDownloadWarning(false)}
            >
              <X size={16} aria-hidden="true" />
            </button>
            <span className="project-download-warning-kicker">VirusTotal gate</span>
            <h3 id="project-download-warning-title">False positive review</h3>
            <p id="project-download-warning-detail">{downloadWarning}</p>
            <small>Only continue if you trust the GitHub release and understand the risk.</small>
            <div className="project-download-warning-actions">
              {virusTotalUrl ? (
                <a className="arcade-focus" href={virusTotalUrl} target="_blank" rel="noreferrer">
                  VT report
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
              ) : null}
              <button className="arcade-focus" type="button" onClick={() => setShowDownloadWarning(false)}>
                Cancel
              </button>
              <button className="arcade-focus is-primary" type="button" onClick={confirmDownload}>
                Continue
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
