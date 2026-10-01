import { FastForward, Pause, Play, Rewind } from "lucide-react";

// Physical controls are decorative: presence is read-only, not a remote player.
export function DiscordDeskControls({ music, handheld }) {
  if (music) return <div className="discord-player-wheel" aria-hidden="true">
    <span className="wheel-menu">MENU</span><Rewind className="wheel-back" size={17} /><FastForward className="wheel-next" size={17} />
    <span className="wheel-play"><Play size={11} fill="currentColor" /><Pause size={11} /></span>
    <i className="wheel-center"><span /></i>
  </div>;
  if (handheld) return <div className="discord-handheld-controls" aria-hidden="true">
    <div className="discord-handheld-dpad"><i /></div>
    <div className="discord-handheld-buttons"><span><i />B</span><span><i />A</span></div>
    <div className="discord-handheld-system"><span><i />SELECT</span><span><i />START</span></div>
    <div className="discord-handheld-speaker"><i /><i /><i /><i /><i /></div>
  </div>;
  return <div className="discord-terminal-vents" aria-hidden="true"><i /><i /><i /><i /><i /></div>;
}
