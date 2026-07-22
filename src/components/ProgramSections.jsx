import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, Bot, Check, Code2, Cpu, Download, ExternalLink, Gamepad2, GitFork, Github, Globe2, Lock, ShieldCheck, Star, Terminal, Twitch, X } from "lucide-react";
import { FaDiscord, FaSteam } from "react-icons/fa6";
import { useEffect, useRef, useState } from "react";
import { now, projects, roomStats, socialLinks, stack } from "../data/site";
import { DecodeText } from "./DecodeText";
import { DiscordPresencePanel } from "./DiscordPresencePanel";
import { GameShelf } from "./GameShelf";
import { PatchNotes } from "./PatchNotes";

const statIcons = {
  forks: GitFork,
  issues: Terminal,
  stars: Star
};

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
  if (scanData?.vt?.status === "pending" || scanData?.scan?.status === "pending") return "scanning";

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

  useEffect(() => {
    let cancelled = false;

    async function loadTradeDexInfo() {
      try {
        const response = await fetch(TRADEDEX_INFO_ENDPOINT, { cache: "no-store" });
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

      <div className="project-console-grid">
        {projects.map((project) => (
          <ProjectCard project={project} scanInfo={projectScanInfo[project.title]} key={project.title} />
        ))}
      </div>
    </div>
  );
}

function ProjectCard({ project, scanInfo }) {
  const [open, setOpen] = useState(false);
  const [liveScan, setLiveScan] = useState(null);
  const [scanError, setScanError] = useState("");
  const effectiveScan = liveScan || scanInfo || null;

  useEffect(() => () => unlockProjectPageWidth(), []);

  useEffect(() => {
    if (!open || project.modal.type !== "download") return undefined;

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
          ["init", "downloading", "hashing", "querying", "submitting", "analyzing"].includes(data?.stage);

        if (shouldPoll && !cancelled) timer = window.setTimeout(loadScan, 4000);
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
  }, [open, project.modal.type]);

  function handleOpenChange(nextOpen) {
    if (nextOpen) {
      lockProjectPageWidth();
      window.dispatchEvent(new CustomEvent("daivr-buddy-quest-progress", {
        detail: { type: "cartridge", id: `project:${project.title}` }
      }));
    } else {
      unlockProjectPageWidth();
    }

    setOpen(nextOpen);
  }

  return (
    <Dialog.Root modal={false} open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <button className={`project-card arcade-focus project-card-${project.visual}`} type="button">
          <ProjectCardContent project={project} scanData={effectiveScan} />
        </button>
      </Dialog.Trigger>

      <ProjectModal project={project} scanData={effectiveScan} scanError={scanError} onClose={() => handleOpenChange(false)} />
    </Dialog.Root>
  );
}

function ProjectCardContent({ project, scanData }) {
  const virusTotalBadge = getVirusTotalBadge(project, scanData);
  const releaseBadge = scanData?.tag || project.badge || project.status;

  return (
    <>
      <div className="project-card-media">
        <span className="project-card-cartridge-top" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="project-card-grid" aria-hidden="true" />
        <span className="project-card-glow" aria-hidden="true" />
        <span className="project-card-scan" aria-hidden="true" />
        <span className="project-card-corner project-card-corner-tl" aria-hidden="true" />
        <span className="project-card-corner project-card-corner-tr" aria-hidden="true" />
        <span className="project-card-corner project-card-corner-bl" aria-hidden="true" />
        <span className="project-card-corner project-card-corner-br" aria-hidden="true" />
        <span className="project-card-index">[ {project.kicker} ]</span>
        <span className="project-card-release">{releaseBadge}</span>

        {project.image ? (
          <img className="project-card-logo" src={project.image} alt={`${project.title} preview`} loading="eager" decoding="async" fetchPriority="high" />
        ) : (
          <div className="project-card-placeholder">
            <Cpu size={48} aria-hidden="true" />
          </div>
        )}

        {project.icon ? <img className="project-card-emblem" src={project.icon} alt="" loading="eager" decoding="async" fetchPriority="high" aria-hidden="true" /> : null}

        <dl className="project-card-stats" aria-label={`${project.title} GitHub stats`}>
          {project.stats.map(([label, value]) => {
            const StatIcon = statIcons[label] || Github;
            return (
              <div className="project-card-stat" key={label}>
                <StatIcon size={14} aria-hidden="true" />
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            );
          })}
        </dl>
      </div>

      <div className="project-card-body">
        <div className="project-card-meta">
          <span>cartridge // {project.kicker}</span>
          <span>{project.channel}</span>
        </div>

        <div className="project-card-title-row">
          <h3>{project.title}</h3>
          <span className={virusTotalBadge ? `project-scan-badge ${virusTotalBadge.className}` : ""}>
            {project.modal.type === "download" ? <ShieldCheck size={13} aria-hidden="true" /> : <Globe2 size={13} aria-hidden="true" />}
            {virusTotalBadge?.label || project.status}
          </span>
        </div>

        <div className="project-card-summary">
          <span>system summary</span>
          <p>{project.description}</p>
        </div>

        <div className="project-card-stack">
          <span>runtime stack</span>
          <ul className="project-card-tags">
            {project.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        </div>

        <div className="project-card-footer">
          <span>{project.meta}</span>
          <strong>
            {project.modal.type === "download" ? <Download size={16} aria-hidden="true" /> : <Globe2 size={16} aria-hidden="true" />}
            <span>{project.modal.type === "download" ? "Open gate" : "Open details"}</span>
            <ArrowRight size={15} aria-hidden="true" />
          </strong>
        </div>
      </div>
    </>
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
  const assetName = scanData?.asset?.name || "TradeDex_1.9.1.exe";
  const assetSize = formatBytes(scanData?.asset?.size) || modal.asset;
  const shaLabel = shortHash(scanData?.sha256) || modal.sha;
  const engines = stats?.total ? `${stats.total} engines` : modal.engines;
  const progress = Math.round(
    scanData?.progress != null
      ? Math.max(0, Math.min(1, Number(scanData.progress))) * 100
      : modal.progress
  );
  const state = getVirusTotalState(project, scanData);
  const statsDetail = stats
    ? `engines ${stats.total} · clean ${(stats.harmless || 0) + (stats.undetected || 0)} · susp ${stats.suspicious || 0} · mal ${stats.malicious || 0}`
    : vtPending
      ? "analysis queued in VirusTotal"
      : null;

  let verdict = modal.verdict;
  let status = modal.status;
  if (scanError || scanData?.status === "error") {
    verdict = "SCANNER.FAIL";
    status = scanError || scanData?.error || "scan failed";
  } else if (isPending || vtPending || state === "scanning") {
    verdict = "SCANNING...";
    status = vtPending ? "queued in VirusTotal" : "gate locked";
  } else if (state === "flagged") {
    verdict = "MALICIOUS";
    status = "gate sealed";
  } else if (state === "false-positive") {
    verdict = "FALSE POSITIVE";
    status = "single detection review";
  } else if (state === "clean") {
    verdict = "CLEAN";
    status = "gate open";
  }

  return {
    release: scanData?.tag || modal.release,
    asset: assetSize,
    assetName,
    sha: shaLabel,
    engines,
    progress,
    verdict,
    status,
    state,
    statsDetail,
    virusTotalUrl: vt?.permalink || null,
    submitted: Boolean(vt?.submitted),
    canDownload: (state === "clean" || state === "false-positive") && !scanError && scanData?.status === "done",
    needsDownloadWarning: state === "false-positive"
  };
}

function DownloadGate({ project, scanData, scanError }) {
  const modal = project.modal;
  const view = buildDownloadGateView(project, scanData, scanError);
  const terminalRows = [
    { type: "prompt", content: modal.command },
    { type: "blank" },
    { type: "command", label: "init scanner", state: scanData ? "OK" : ".." },
    {
      type: "command",
      label: "pull asset",
      state: scanData?.asset ? "OK" : ".."
    },
    ...(scanData?.asset ? [{ type: "detail", detail: `${view.assetName} · ${view.asset}` }] : []),
    {
      type: "command",
      label: "compute sha-256",
      state: scanData?.sha256 ? "OK" : ".."
    },
    ...(scanData?.sha256 ? [{ type: "detail", detail: view.sha }] : []),
    {
      type: "command",
      label: "query virustotal",
      state: scanData?.vt || scanData?.status === "error" ? (scanData?.status === "error" ? "ERR" : "OK") : ".."
    },
    ...(view.submitted ? [{ type: "command", label: "upload sample", state: "OK" }] : []),
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

      <div className="project-verdict-grid">
        <div className="project-verdict-card project-verdict-primary">
          <span>security verdict</span>
          <strong>{view.verdict}</strong>
          <small>{view.status}</small>
        </div>
        <Metric label="release" value={view.release} />
        <Metric label="asset" value={view.asset} />
        <Metric label="sha" value={view.sha} />
        <Metric label="engines" value={view.engines} />
      </div>

      <div className="project-scan-progress" style={{ "--project-progress": `${view.progress}%` }}>
        <div>
          <span>{view.state && view.state !== "scanning" ? "verdict received" : "awaiting verdict"}</span>
          <strong>{view.progress}%</strong>
        </div>
        <i />
        <ol aria-label="Scan checkpoints">
          {[0, 1, 2, 3, 4, 5, 6].map((item) => <li key={item} />)}
        </ol>
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
                <X size={15} aria-hidden="true" />
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
        virusTotalUrl={view.state === "false-positive" ? view.virusTotalUrl : null}
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
          <img src={project.image} alt="" loading="eager" decoding="async" fetchPriority="high" />
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

function Metric({ label, value }) {
  return (
    <div className="project-verdict-card">
      <span>{label}</span>
      <strong>{value}</strong>
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
          virusTotalUrl && needsWarning ? (
            <a className="arcade-focus project-modal-locked is-warning is-link" href={virusTotalUrl} target="_blank" rel="noreferrer">
              <Check size={18} aria-hidden="true" />
              <span>VT report</span>
              <ExternalLink size={15} aria-hidden="true" />
            </a>
          ) : (
            <div className={`project-modal-locked${needsWarning ? " is-warning" : canDownload ? " is-online" : ""}`}>
              {gateLocked ? <Lock size={18} aria-hidden="true" /> : <Check size={18} aria-hidden="true" />}
              <span>{needsWarning ? "review required" : canDownload ? "gate open" : "waiting..."}</span>
              {gateLocked ? <X size={15} aria-hidden="true" /> : null}
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
