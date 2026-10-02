// Calendario de eventos de temporada. Lo leen la puerta de entrada (chunk de
// arranque) y App; el decorado pesado vive en SeasonalEvent.jsx y solo se
// descarga cuando hay un evento activo.

const VALID_PREVIEWS = new Set(["halloween", "winter", "birthday", "anniversary", "april-fools"]);

export function getSeasonalEvent(date = new Date()) {
  const preview = new URLSearchParams(window.location.search).get("season");
  if (VALID_PREVIEWS.has(preview)) return preview;

  const month = date.getMonth() + 1;
  const day = date.getDate();
  if (month === 4 && day === 1) return "april-fools";
  if (month === 7 && day >= 1 && day <= 3) return "anniversary";
  if (month === 8 && day >= 23 && day <= 25) return "birthday";
  if ((month === 10 && day >= 25) || (month === 11 && day === 1)) return "halloween";
  if (month === 12 || (month === 1 && day <= 7)) return "winter";
  return null;
}
