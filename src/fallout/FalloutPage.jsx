import { ArrowLeft, ArrowUpRight, Monitor, Radiation, RefreshCw, Terminal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { recordGateReturn } from "../lib/gateReturn";
import { effectiveFeed, formatSync } from "./data/time";
import { SOURCES } from "./data/sources";
import { useFalloutIntel } from "./services/useFalloutIntel";
import { NuclearCommand } from "./components/NuclearCommand";
import { MerchantIntel } from "./components/MerchantIntel";
import { ResearchFile } from "./components/ResearchFile";
import { EventIntel } from "./components/EventIntel";
import { VaultDiagram } from "./components/TerminalArt";
import { SourceLink } from "./components/TerminalPanel";
import { TerminalBoot, useTerminalBoot } from "./components/TerminalBoot";
import { VAULT_ENTER_MS } from "./data/vaultSequence";
import { FalloutBackdrop } from "./components/FalloutBackdrop";
import "./fallout.css";
import "./field-station.css";

const NAV = [["codes", "Launch codes"], ["minerva", "Minerva"], ["axolotl", "A.X.O.L.O.T.L."], ["events", "Intel & events"]];

export default function FalloutPage() {
  const { intel, loading, connectionFailed, refresh } = useFalloutIntel();
  const mainRef = useRef(null);
  const { booting, finish, phase, stages, offline } = useTerminalBoot({ loading, intel, connectionFailed, contentRef: mainRef });
  const [now, setNow] = useState(Date.now);
  const [crt, setCrt] = useState(() => { try { return localStorage.getItem("daivr-fallout-crt") !== "off"; } catch { return true; } });
  const [command, setCommand] = useState("");
  const [commandResult, setCommandResult] = useState("Terminal ready. Type help to view available commands.");
  const wasBooting = useRef(booting);
  const feeds = Object.fromEntries(Object.entries(intel).map(([key, value]) => [key, effectiveFeed(value, now, key === "codes" || key === "axolotl")]));
  const connected = Object.values(feeds).filter((feed) => feed.status === "current").length;
  const syncs = Object.values(feeds).map((feed) => feed.fetchedAt).filter(Boolean).sort();
  const lastSync = syncs.at(-1);

  useEffect(() => {
    // Record on departure so a long visit still gets a fresh return greeting.
    // pagehide covers the cabinet links, address-bar navigation, and Back.
    const rememberVisit = () => recordGateReturn("fallout", "/fallout");
    window.addEventListener("pagehide", rememberVisit);
    return () => window.removeEventListener("pagehide", rememberVisit);
  }, []);

  useEffect(() => {
    const previous = document.title;
    const meta = document.querySelector('meta[name="description"]');
    const previousDescription = meta?.content;
    document.title = "Fallout Terminal | daivr.dev";
    if (meta) meta.content = "Fallout 76 intelligence terminal with nuclear launch codes, Minerva information, monthly axolotls, and wasteland events.";
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => { document.title = previous; if (meta) meta.content = previousDescription; window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (!booting && wasBooting.current) mainRef.current?.focus({ preventScroll: true });
    wasBooting.current = booting;
  }, [booting]);

  function toggleCrt() {
    setCrt((value) => {
      try { localStorage.setItem("daivr-fallout-crt", value ? "off" : "on"); } catch { /* Display preference is optional. */ }
      return !value;
    });
  }

  function runCommand(event) {
    event.preventDefault();
    const input = command.trim().toLowerCase();
    if (NAV.some(([id]) => id === input)) {
      const section = document.getElementById(input);
      section?.scrollIntoView({ behavior: "instant", block: "start" });
      section?.querySelector("h2")?.focus({ preventScroll: true });
      setCommandResult(`Opened ${input.toUpperCase()} file.`);
    } else if (input === "refresh") {
      refresh(); setCommandResult("Requesting a source refresh. Cached reports retain their original timestamps.");
    } else if (input === "crt") {
      toggleCrt(); setCommandResult("Display effects toggled.");
    } else if (input === "clear") {
      setCommandResult("");
    } else {
      setCommandResult(input === "help" ? "COMMANDS: codes · minerva · axolotl · events · refresh · crt · clear" : `Unknown command: ${input || "(empty)"}. Type help for the command directory.`);
    }
    setCommand("");
  }

  return <div className={`fallout-page${crt ? " has-crt" : ""}`} data-vault-phase={booting ? phase : undefined} style={{ "--vault-entry-duration": `${VAULT_ENTER_MS}ms` }}>
    <FalloutBackdrop />
    <div inert={booting} className="fo-interface">
      <a className="fo-skip" href="#fallout-main">Skip to terminal content</a>
      <header className="fo-site-bar"><a href="/" className="fo-brand" aria-label="Return to daivr.dev"><span className="fo-brand-mark" aria-hidden="true"><svg viewBox="0 0 44 40" fill="none"><path d="M7 13 19 11 22 14v10L7 27V13Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="miter" /><path d="m23 17 6 10 8-13" className="fo-brand-v" strokeWidth="3" strokeLinejoin="bevel" /><path d="M8 33h7m2 0h3" stroke="currentColor" strokeWidth="1" opacity=".4" /></svg><i /></span><span className="fo-brand-wordmark"><strong>daivr<span>.dev</span></strong><span className="fo-brand-caption">PERSONAL TERMINAL NETWORK</span></span></a><a className="fo-exit" href="/"><ArrowLeft size={14} aria-hidden="true" />Back to the cabinet</a></header>
      <div className="fo-machine">
        <div className="fo-machine-plate"><span><Radiation size={16} aria-hidden="true" />VAULT-TEC FIELD EQUIPMENT / DAI–076</span><div className="fo-machine-vents" aria-hidden="true" /><span>RECLAMATION DIVISION</span></div>
        <main id="fallout-main" ref={mainRef} tabIndex={-1} className="fo-screen">
          <div className="fo-hero">
            <div className="fo-hero-copy">
              <div className="fo-station-brand"><img src="/games/fallout-76-logo.png" width="500" height="171" alt="Fallout 76" /><span>DAI’S PERSONAL<br />WASTELAND COMPANION</span></div>
              <span className="fo-kicker">RECLAMATION STARTS WITH GOOD INTEL.</span>
              <h1>WASTELAND<span>FIELD STATION</span></h1>
              <p>Three silos. One wandering merchant. A few unusual fish.<br />Your daily briefing for life outside the vault.</p>
              <div className="fo-hero-meta"><span>ISSUED TO: DAI</span><span>APPALACHIA / EST. 2076</span></div>
            </div>
            <div className="fo-field-monitor">
              <div className="fo-monitor-label"><span>PERSONAL INFORMATION TERMINAL</span><span>VT–076</span></div>
              <div className="fo-hero-diagram"><span className="fo-monitor-corner">APPALACHIA FIELD NETWORK</span><VaultDiagram /><span className="fo-monitor-caption">A BETTER TOMORROW BEGINS WITH YOU.</span></div>
              <div className="fo-monitor-controls"><span className="fo-status"><i />{loading ? "RECEIVING REPORTS" : `${connected} OF 4 REPORTS CURRENT`}</span><div className="fo-monitor-knobs" aria-hidden="true"><i /><i /></div></div>
            </div>
          </div>
          <div className="fo-system-bar"><span className="fo-status"><i />{loading ? "ACCESSING SOURCES" : connected === 4 ? "REPORTS RECEIVED" : connected ? "PARTIAL RECEPTION" : "CONNECTION UNAVAILABLE"}</span><span>{connected}/4 CURRENT REPORTS</span><div className="fo-display-controls"><button type="button" onClick={toggleCrt} aria-pressed={crt}><Monitor size={14} aria-hidden="true" />CRT {crt ? "ON" : "OFF"}</button><button type="button" onClick={refresh} disabled={loading}><RefreshCw className={loading ? "fo-spin" : ""} size={14} aria-hidden="true" />{loading ? "Syncing" : "Refresh"}</button></div></div>
          <nav className="fo-nav" aria-label="Fallout terminal directory">{NAV.map(([id, name], index) => <a href={`#${id}`} key={id}><span>0{index + 1}</span>{name}<ArrowUpRight size={14} aria-hidden="true" /></a>)}</nav>
          <div className="fo-content">
            {connectionFailed && <div className="fo-connection-warning" role="status"><strong>CONNECTION INTERRUPTED.</strong> Reports could not be refreshed. Last successful data, if available, is marked stale.<button type="button" className="fo-text-button" onClick={refresh} disabled={loading}>Retry connection</button></div>}
            <NuclearCommand feed={feeds.codes} loading={loading} now={now} onRetry={refresh} />
            <div className="fo-dossiers"><MerchantIntel feed={feeds.minerva} loading={loading} now={now} onRetry={refresh} /><ResearchFile feed={feeds.axolotl} loading={loading} now={now} onRetry={refresh} /></div>
            <EventIntel feed={feeds.events} loading={loading} now={now} onRetry={refresh} />
            <section className="fo-command-console" aria-label="Terminal command line"><div className="fo-command-head"><Terminal size={16} aria-hidden="true" /><span>LOCAL COMMAND INTERFACE</span><span>TYPE “HELP” TO BEGIN</span></div><form onSubmit={runCommand}><label htmlFor="fo-command">guest@dai:~$</label><input id="fo-command" value={command} onChange={(event) => setCommand(event.target.value)} autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={80} placeholder="help" /><button type="submit">Execute <span aria-hidden="true">↵</span></button></form><p role="status">{commandResult || "Console cleared."}<span className="fo-cursor" aria-hidden="true">▌</span></p></section>
          </div>
          <footer className="fo-diagnostics"><div><span className="fo-status"><i />LOCAL INTERFACE READY</span><span>LAST SUCCESSFUL SOURCE FETCH: {formatSync(lastSync)}</span></div><details><summary>Data sources & transmission notes</summary><p>Community reports are checked every 15 minutes. “Source current” means a recently fetched report within its published date window, not independent in-game verification. Timings use US Eastern time; source fetch timestamps use UTC. Expired launch codes are hidden.</p><p>A.X.O.L.O.T.L. is this terminal’s file label for the monthly axolotl fishing rotation. It is not an official in-game acronym. Vault and silo schematics are original. Minerva’s portrait is from The Fallout Wiki. Game imagery belongs to Bethesda Softworks.</p><div className="fo-source-directory"><SourceLink source={{ name: "The Fallout Wiki", url: "https://fallout.wiki/wiki/Minerva" }}>Minerva portrait</SourceLink><SourceLink source={SOURCES.bethesda}>Official Fallout news</SourceLink></div></details></footer>
        </main>
        <div className="fo-machine-bottom"><div className="fo-speaker" aria-hidden="true" /><span>PROPERTY OF DAI / PLEASE DO NOT FEED THE TERMINAL</span><span className="fo-power-light" aria-hidden="true" /></div>
      </div>
      <footer className="fo-site-footer"><span>BUILT IN THE VAULT. CONNECTED TO <a href="/">DAIVR.DEV</a>.</span><span>Unofficial fan project. Fallout belongs to Bethesda Softworks.</span></footer>
    </div>
    {booting && <TerminalBoot onFinish={finish} phase={phase} stages={stages} offline={offline} />}
  </div>;
}
