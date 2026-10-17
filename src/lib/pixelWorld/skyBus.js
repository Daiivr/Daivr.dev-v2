// Lo que FooterSky sabe del cielo y el lienzo del footer dibuja (sky.js):
// donde va el sol o la luna, la fase de la luna, las estrellas fugaces (con
// sus botones para pedir un deseo) y el arcoiris. FooterSky lo publica al
// cambiar; FooterWorld lo lee cada fotograma. Las marcas de tiempo (born) son
// de performance.now().
let scene = { sun: null, body: null, moonPhase: 0.5, fullMoon: false, stars: [], rainbow: null };

export function publishSky(next) {
  scene = { ...scene, ...next };
}

export const skyScene = () => scene;
