// Nucleo de XP compartido del hero (ArcadeCanvas). Lo usan el canvas y el
// servidor, que ahora suma incrementos en vez de aceptar el estado entero.

export function xpForLevel(level) {
  return Math.round(95 + level * 42 + level ** 1.45 * 18);
}

export function normalizeXpState(value = {}) {
  return {
    level: Math.max(1, Math.floor(Number(value.level) || 1)),
    xp: Math.max(0, Math.floor(Number(value.xp) || 0)),
    total: Math.max(0, Math.floor(Number(value.total) || 0))
  };
}

export function addXpToState(state, amount) {
  const next = normalizeXpState(state);
  const gain = Math.max(0, Math.floor(Number(amount) || 0));
  next.xp += gain;
  next.total += gain;
  while (next.xp >= xpForLevel(next.level)) {
    next.xp -= xpForLevel(next.level);
    next.level += 1;
  }
  return next;
}

// Techo de XP por segundo para un solo visitante. Un paquete vale como mucho
// 17 + 2 * 4 + 0,8 * nivel. En reposo llegan unos 3 paquetes por segundo y el
// overclock los sube a unos 8 durante cinco segundos; solo clicando nodos sin
// parar se pasa de 12, y entonces el exceso se recorta (es cosmetico: el
// nucleo vuelve al valor del servidor en el siguiente guardado).
export const MAX_PACKETS_PER_SECOND = 12;

export function xpRateCeiling(level) {
  return MAX_PACKETS_PER_SECOND * Math.ceil(17 + 2 * 4 + Math.max(1, Number(level) || 1) * 0.8 + 1);
}
