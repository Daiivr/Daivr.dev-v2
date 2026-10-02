// Viento en el bosque del footer (FooterScenery + site-footer.css): cuanto se
// mece cada cosa y cuando le llega la rafaga. Sin React ni DOM: los tests de
// Node lo importan tal cual. La fuerza del viento sale del tiempo de fuera
// (windStrength en footerSky.js).

// Cuanto se mece cada cosa (los pinos, poco; la hierba, mucho).
export const PLANT_SWAY = { grass: 2.4, bush: 1.4, berry: 1.4, shrub: 1.7, round: 0.85, pine: 0.55 };

// Las rafagas cruzan el footer de derecha a izquierda (como las nubes y la
// lluvia): lo de la derecha va por delante en el ciclo y se dobla primero.
// Retraso negativo = ya en marcha al cargar, sin un rato quieto.
export function gustDelay(leftPercent) {
  return Number((-leftPercent * 0.045).toFixed(2));
}
