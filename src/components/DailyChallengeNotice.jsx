import { Check, Trophy } from "lucide-react";
import { createPortal } from "react-dom";

export function DailyChallengeNotice({ notice, onDismiss, onRetry, onClose }) {
  if (!notice) return null;
  return createPortal(<aside className={`daily-game-notice is-${notice.state}`} aria-label="Daily challenge notification">
    <div role="status" aria-live="polite"><Trophy size={20} aria-hidden="true" /><div><strong>{notice.state === "complete" ? "DAILY CHALLENGE COMPLETE" : notice.state === "saving" ? "SAVING DAILY REWARD…" : "DAILY REWARD NOT SAVED"}</strong><span>{notice.name}</span><p>{notice.state === "complete" ? `+${notice.xp.toLocaleString()} XP saved. You can close the game or keep playing.` : notice.state === "saving" ? "Target reached. Wait for your reward to save before closing." : "Couldn't confirm your reward. Retry before closing the game."}</p></div></div>
    {notice.state === "complete" ? <div className="daily-game-notice-actions"><button type="button" onClick={onDismiss}>Keep playing</button><button type="button" onClick={onClose}><Check size={14} />Close game</button></div> : notice.state === "error" ? <button type="button" onClick={onRetry}>Retry save</button> : null}
  </aside>, document.body);
}
