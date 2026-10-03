import { Check, RefreshCw, Trophy } from "lucide-react";
import { CabinetNotice } from "./CabinetNotice";

export function DailyChallengeNotice({ notice, onDismiss, onRetry, onClose }) {
  if (!notice) return null;
  const complete = notice.state === "complete";
  const saving = notice.state === "saving";
  return <CabinetNotice className={`daily-game-notice is-${notice.state}`} label="Daily challenge notification" channel="DAILY CHALLENGE"
    actions={complete ? <><button className="is-primary" type="button" onClick={onDismiss}>Keep playing</button><button type="button" onClick={onClose}><Check size={13} aria-hidden="true" />Close game</button></> : saving ? <span className="cabinet-notice-waiting"><RefreshCw size={12} aria-hidden="true" />Saving your reward…</span> : <button className="is-primary" type="button" onClick={onRetry}><RefreshCw size={13} aria-hidden="true" />Retry save</button>}>
    <h2><Trophy size={18} aria-hidden="true" />{complete ? "Challenge complete" : saving ? "Target reached" : "Reward not saved"}</h2>
    <p className="cabinet-notice-subtitle" title={notice.name}>{notice.name}</p>
    <p>{complete ? <><b className="cabinet-notice-xp">+{Number(notice.xp || 0).toLocaleString()} XP</b> Saved. Keep going or call it a day.</> : saving ? "Please wait for confirmation before closing." : "Your reward needs another try. Keep the game open."}</p>
  </CabinetNotice>;
}
