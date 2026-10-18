import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { patchNotes } from "../data/patchNotes";
import { dayNumber } from "../lib/pixelWorld/life/util";
import { menuSkinVars } from "../lib/pixelWorld/menuSkin.js";
import { PipSprite } from "./PipSprite";
import "../styles/mailbox-letter.css";

// La carta del buzon (FooterMailbox), en la piel de pixel de los menus: el
// cartel colgado, una hoja de pergamino con la fecha, la nota del dia de
// Buddy, la mision que tienes abierta y, si hay version nueva, una posdata
// con la actualizacion y un boton para ir al Patch.log. Firma Pip.
const NOTES = [
  "The valley was extra quiet this morning. I counted three frogs and one very confused butterfly.",
  "I tried fishing with my eyes closed. Caught nothing, but it felt very zen.",
  "The campfire and I had a long talk last night. It mostly crackled. Good listener, though.",
  "A little bird landed on the lamp post and stared at me for a full minute. I think we're friends now.",
  "I polished my visor today. You can probably see your reflection in it from up there.",
  "Somebody left footprints by the market. Turns out they were mine. Mystery solved.",
  "Fun fact: the moon looks exactly like a giant pixel when you squint.",
  "I practiced my lamp lighting. Zero singed antennas so far. New record!",
  "The market lady says the stand smells like cinnamon on Saturdays. I can't smell, but I believe her.",
  "I found a perfectly round pebble. I named it Kevin. Kevin is now my second favourite rock.",
  "Did you know the grass leans away from my feet? It's very polite grass.",
  "I've been thinking about upgrading my battery pack. Or maybe just napping more. Probably napping.",
  "The owl and I had a staring contest. The owl won. The owl always wins.",
  "Today I learned that leaves fall slower if you cheer for them. Science!",
  "I counted the stars last night. I got to 312 before I fell asleep in my tent.",
  "If you ever feel lost, follow the path. It only goes left and right. Very reassuring."
];

export function MailboxLetter({ newPatch, name, quest, onClose }) {
  const day = dayNumber(), note = NOTES[((day % NOTES.length) + NOTES.length) % NOTES.length];
  const latest = patchNotes[0];
  const date = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const firstSentence = (latest?.summary || "").split(/(?<=\.)\s/)[0];
  const readPatchNotes = () => {
    onClose();
    window.setTimeout(() => document.getElementById("patchlog")?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
  };
  return <Dialog.Root open onOpenChange={(next) => { if (!next) onClose(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="mail-letter-backdrop motion-backdrop" />
      <Dialog.Content className="mail-letter motion-panel motion-from-center" style={menuSkinVars()}>
        <Dialog.Close className="mail-letter-close" aria-label="Close the letter"><X size={16} strokeWidth={3} /></Dialog.Close>
        <div className="mail-letter-sign">
          <span>FROM THE MAILBOX</span>
          <Dialog.Title className="mail-letter-title">A letter from Buddy</Dialog.Title>
        </div>
        <div className="mail-letter-page">
          <Dialog.Description className="mail-letter-date">{date}</Dialog.Description>
          <p className="mail-letter-hello">Dear {name || "friend"},</p>
          <p>{note}</p>
          {quest ? <p className="mail-letter-quest"><b>On my list today:</b> {quest.title}. {quest.detail} <span>{quest.progress}/{quest.goal}</span></p> : <p className="mail-letter-quest"><b>On my list today:</b> nothing! Every quest is done. I'm very proud of us.</p>}
          {newPatch && latest ? <div className="mail-letter-ps">
            <p><b>P.S.</b> The cabinet got an update: <strong>{latest.version} · {latest.codename}</strong>. {firstSentence}</p>
            <button type="button" onClick={readPatchNotes}>Read the patch notes <span aria-hidden="true">↓</span></button>
          </div> : null}
          <div className="mail-letter-signoff">
            <span>— Buddy</span>
            <PipSprite className="mail-letter-pip" pose="wave" expression="happy" width={54} height={60} />
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
