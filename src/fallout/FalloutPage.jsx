import { ArrowLeft, Monitor, Radiation, RefreshCw, Terminal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { recordGateReturn } from "../lib/gateReturn";
import { effectiveFeed, formatSync } from "./data/time";
import { useFalloutIntel } from "./services/useFalloutIntel";
import { NuclearCommand } from "./components/NuclearCommand";
import { MerchantIntel } from "./components/MerchantIntel";
import { ResearchFile } from "./components/ResearchFile";
import { EventIntel } from "./components/EventIntel";
import { FieldNavigation, FieldSignal } from "./components/FieldBriefing";
import { StationFooter } from "./components/StationFooter";
import { TerminalBoot, useTerminalBoot } from "./components/TerminalBoot";
import { VAULT_ENTER_MS } from "./data/vaultSequence";
import { FalloutBackdrop } from "./components/FalloutBackdrop";
import "./fallout.css";
import "./field-station.css";
import "./operations.css";

const NAV = [["codes", "Launch codes"], ["minerva", "Minerva"], ["axolotl", "A.X.O.L.O.T.L."], ["events", "Intel & events"]];

export default function FalloutPage({ entryOrigin }) {
  const { intel, loading, connectionFailed, refresh } = useFalloutIntel();
  const mainRef = useRef(null);
  const { booting, finish, phase, stages, offline, finishApproach } = useTerminalBoot({ loading, intel, connectionFailed, contentRef: mainRef, entryOrigin });
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
    return () => { window.removeEventListener("pagehide", rememberVisit); rememberVisit(); };
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
      <div className="fo-desk-layout">
        <aside className="fo-desk-rail" aria-label="Field station controls">
          <div className="fo-rail-brand"><img src="/games/fallout-76-logo.png" width="500" height="171" alt="Fallout 76" /><span>PERSONAL FIELD TERMINAL</span></div>
          <div className="fo-rail-label">TUNE / SELECT CHANNEL<span>VT–04</span></div>
          <FieldNavigation feeds={feeds} loading={loading} now={now} booting={booting} />
          <FieldSignal feeds={feeds} loading={loading} connected={connected} />
          <div className="fo-rail-footer"><Radiation size={23} aria-hidden="true" /><span>VAULT 76<br /><b>RECLAMATION DIVISION</b></span></div>
        </aside>
        <main id="fallout-main" ref={mainRef} tabIndex={-1} className="fo-desk-main">
          <header className="fo-desk-masthead">
            <div className="fo-desk-insignia" aria-hidden="true"><span>★</span><strong>76</strong><small>RECLAMATION</small></div>
            <div className="fo-desk-title"><span className="fo-desk-eyebrow">APPALACHIA / DAI’S FIELD STATION</span><h1>WASTELAND<span>OPERATIONS DESK.</span></h1><p>Your briefing for life outside the vault.</p></div>
            <div className="fo-desk-stamp"><span>DAILY DISPATCH</span><strong>{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" }).format(now)}</strong><span>{new Intl.DateTimeFormat("en-US", { year: "numeric", timeZone: "America/New_York" }).format(now)} / EASTERN TIME</span></div>
          </header>
          <div className="fo-desk-toolbar"><span className="fo-status"><i />{loading ? "ACCESSING SOURCES" : connected === 4 ? "ALL REPORTS CURRENT" : connected ? "PARTIAL RECEPTION" : "CONNECTION UNAVAILABLE"}</span><span>SYNC / {formatSync(lastSync)}</span><div className="fo-display-controls"><button type="button" onClick={toggleCrt} aria-pressed={crt}><Monitor size={14} aria-hidden="true" />CRT {crt ? "ON" : "OFF"}</button><button type="button" onClick={refresh} disabled={loading}><RefreshCw className={loading ? "fo-spin" : ""} size={14} aria-hidden="true" />{loading ? "Syncing" : "Refresh"}</button></div></div>
          <div className="fo-content fo-desk-content">
            {connectionFailed && <div className="fo-connection-warning" role="status"><strong>CONNECTION INTERRUPTED.</strong> Reports could not be refreshed. Last successful data, if available, is marked stale.<button type="button" className="fo-text-button" onClick={refresh} disabled={loading}>Retry connection</button></div>}
            <NuclearCommand feed={feeds.codes} loading={loading} now={now} onRetry={refresh} />
            <div className="fo-dossiers"><MerchantIntel feed={feeds.minerva} loading={loading} now={now} onRetry={refresh} /><ResearchFile feed={feeds.axolotl} loading={loading} now={now} onRetry={refresh} /></div>
            <EventIntel feed={feeds.events} loading={loading} now={now} onRetry={refresh} />
            <section className="fo-command-console" aria-label="Terminal command line"><div className="fo-command-head"><Terminal size={16} aria-hidden="true" /><span>LOCAL COMMAND INTERFACE</span><span>TYPE “HELP” TO BEGIN</span></div><form onSubmit={runCommand}><label htmlFor="fo-command">guest@dai:~$</label><input id="fo-command" value={command} onChange={(event) => setCommand(event.target.value)} autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={80} placeholder="help" /><button type="submit">Execute <span aria-hidden="true">↵</span></button></form><p role="status">{commandResult || "Console cleared."}<span className="fo-cursor" aria-hidden="true">▌</span></p></section>
          </div>
          <StationFooter lastSync={lastSync} />
        </main>
      </div>
      <footer className="fo-site-footer"><span>BUILT IN THE VAULT. CONNECTED TO <a href="/">DAIVR.DEV</a>.</span><span>Unofficial fan project. Fallout belongs to Bethesda Softworks.</span></footer>
    </div>
    {booting && <TerminalBoot onFinish={finish} phase={phase} stages={stages} offline={offline} entryOrigin={entryOrigin} onApproachComplete={finishApproach} />}
  </div>;
}
