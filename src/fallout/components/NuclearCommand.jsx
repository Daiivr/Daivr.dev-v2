import { Check, Copy, Radiation } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SILOS } from "../data/sources";
import { countdown, formatDate } from "../data/time";
import { SiloDiagram } from "./TerminalArt";
import { FeedNote, PanelHeading } from "./TerminalPanel";

export function NuclearCommand({ feed, loading, now, onRetry }) {
  const [copied, setCopied] = useState("");
  const [message, setMessage] = useState("");
  const timer = useRef(null);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const usable = feed.status === "current" && !!feed.data;

  async function copy(silo) {
    try {
      await navigator.clipboard.writeText(feed.data.codes[silo.id]);
      setCopied(silo.id);
      setMessage(`${silo.name} launch code copied.`);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(""), 2200);
    } catch {
      setMessage("Clipboard unavailable. Select the code to copy it manually.");
    }
  }

  return <section className="fo-panel fo-nuclear" id="codes" aria-labelledby="fo-codes-title">
    <PanelHeading number="01" label="NUCLEAR COMMAND" status={loading ? "SYNCING" : usable ? "SOURCE CURRENT" : "AWAITING SIGNAL"} />
    <div className="fo-section-title"><div><span className="fo-kicker">AUTOMATED MISSILE SILO NETWORK</span><h2 id="fo-codes-title" tabIndex={-1}>Nuclear launch codes.</h2></div><Radiation className="fo-radiation" size={44} aria-hidden="true" /></div>
    <div className="fo-silos">
      {SILOS.map((silo, index) => <article className="fo-silo" key={silo.id}>
        <div className="fo-silo-top"><span>SITE {silo.letter}</span><span>AUTH / {silo.file}</span></div>
        <div className="fo-silo-body"><div><h3>{silo.name}</h3><span className="fo-micro">LAUNCH AUTHORIZATION</span><div className={`fo-code${loading && !feed.data ? " is-loading" : ""}`} aria-label={usable ? `${silo.name} code ${feed.data.codes[silo.id].split("").join(" ")}` : `${silo.name} code unavailable`}>{usable ? feed.data.codes[silo.id] : "— — — —"}</div></div><SiloDiagram variant={index} /></div>
        <div className="fo-silo-controls"><span className="fo-status"><i />{usable ? "READY TO COPY" : loading ? "RECEIVING" : "UNCONFIRMED"}</span><button type="button" disabled={!usable} onClick={() => copy(silo)} aria-label={`Copy ${silo.name} launch code`}>{copied === silo.id ? <Check size={15} /> : <Copy size={15} />}<span>{copied === silo.id ? "Copied" : "Copy"}</span></button></div>
        <details className="fo-silo-detail"><summary>Transmission details</summary><p>{usable ? `Source-reported reset: ${formatDate(feed.data.endsAt, true)}. The countdown follows this published window.` : "Launch authorization is hidden until a current source report is available."}</p></details>
      </article>)}
    </div>
    <div className="fo-code-reset"><span><Radiation size={16} aria-hidden="true" />{usable ? "NEXT SOURCE-REPORTED RESET" : "COMMUNITY CODE TRANSMISSION"}</span>{usable ? <><strong>{countdown(feed.data.endsAt, now)}</strong><span>{formatDate(feed.data.endsAt, true)}</span></> : <button className="fo-text-button" type="button" disabled={loading} onClick={onRetry}>{loading ? "Receiving launch codes…" : "Reconnect to source ↗"}</button>}</div>
    <p className="sr-only" role="status">{message}</p>
    <FeedNote feed={feed} loading={loading} />
  </section>;
}
