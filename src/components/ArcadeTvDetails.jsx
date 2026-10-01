/** Decorative cabinet hardware; game controls remain in the modal header. */
export function ArcadeTvDetails({ channel }) {
  return (
    <aside className="arcade-tv-hardware" aria-hidden="true">
      <div className="arcade-tv-maker"><strong>DAI VISION</strong><span>COLOR SYSTEM / 86</span></div>
      <div className="arcade-tv-channel"><small>AV CHANNEL</small><strong>{channel}</strong><span><i /> SIGNAL LOCKED</span></div>
      <div className="arcade-tv-tuner"><span className="arcade-tv-dial"><i /></span><small>UHF · VHF</small></div>
      <div className="arcade-tv-speaker" />
      <div className="arcade-tv-power"><i /><span>STEREO SOUND</span></div>
    </aside>
  );
}
