const EVENT_COPY = {
  halloween: ["CORRUPTED CABINET", "Spectral process detected in memory sector 0x31."],
  winter: ["WINTER SIGNAL", "Aurora online // snow packets accumulating."],
  birthday: ["DAI BIRTHDAY EVENT", "August 24 // party protocol and bonus XP online."],
  anniversary: ["CABINET ANNIVERSARY", "Dai.exe v2 launched July 2 // another year in the arcade."],
  "april-fools": ["CRITICAL UPDATE", "A completely trustworthy operating system upgrade."]
};

const EVENT_ICONS = {
  halloween: "☠",
  winter: "❄",
  birthday: "★",
  anniversary: "02",
  "april-fools": "!"
};

/* Aviso del evento activo, mostrado en el splash de entrada: el visitante se
   entera de que hay temporada ANTES de entrar, no con un toast a posteriori. */
export function SeasonalSplashNotice({ event }) {
  const copy = EVENT_COPY[event];
  if (!copy) return null;
  return (
    <aside className={`splash-season-notice is-${event}`}>
      <span className="splash-season-notice-icon" aria-hidden="true">{EVENT_ICONS[event]}</span>
      <div>
        <span className="splash-season-notice-kicker"><i aria-hidden="true" />event active</span>
        <strong>{copy[0]}</strong>
        <small>{copy[1]}</small>
      </div>
    </aside>
  );
}
