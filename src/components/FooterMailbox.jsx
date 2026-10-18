import { Suspense, useEffect, useState } from "react";
import { currentBuild } from "../lib/buildUpdate";
import { ChunkBoundary, lazyChunk } from "../lib/chunkRecovery";
import { dayNumber } from "../lib/pixelWorld/life/util";

// El buzon del footer: un boton invisible encima del buzon que dibuja el
// mundo (life/mailbox.js), junto a la hoguera. La banderita sube cuando hay
// carta: una al dia de Buddy y, si hay version nueva, una posdata con la
// actualizacion. La carta (MailboxLetter) va en su propio chunk.
const MAIL_KEY = "daivr.mailbox.v1";
const MailboxLetter = lazyChunk(() => import("./MailboxLetter"), (module) => module.MailboxLetter);

function readSeen() {
  try {
    return JSON.parse(window.localStorage.getItem(MAIL_KEY) || "null") || {};
  } catch {
    return {};
  }
}

export function useMailbox() {
  const [seen, setSeen] = useState(readSeen);
  const version = currentBuild().version || "";
  const day = dayNumber();
  const newPatch = Boolean(version) && seen.patch !== version;
  const flag = newPatch || seen.day !== day;
  function markRead() {
    const next = { patch: version || seen.patch || "", day };
    try { window.localStorage.setItem(MAIL_KEY, JSON.stringify(next)); } catch { /* sin almacenamiento: vuelve a avisar */ }
    setSeen(next);
  }
  return { flag, newPatch, version, markRead };
}

export function FooterMailbox({ mail, name, quest }) {
  const [open, setOpen] = useState(false);
  useEffect(() => { if (mail.flag) MailboxLetter.preload(); }, [mail.flag]);
  return <>
    <button type="button" className={`footer-mailbox ${mail.flag ? "has-mail" : ""}`} onClick={() => setOpen(true)} onPointerEnter={() => MailboxLetter.preload()}
      aria-label={mail.flag ? "Mailbox: you have a new letter from Buddy" : "Mailbox: read Buddy's letter again"} />
    {open ? <ChunkBoundary><Suspense fallback={null}>
      <MailboxLetter newPatch={mail.newPatch} name={name} quest={quest} onClose={() => { setOpen(false); mail.markRead(); }} />
    </Suspense></ChunkBoundary> : null}
  </>;
}
