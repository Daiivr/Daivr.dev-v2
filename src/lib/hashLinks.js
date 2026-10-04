// Un enlace a la ficha que ya esta en la URL (#project-tradedex dos veces) no
// dispara hashchange, asi que el segundo clic no hacia nada. Se avisa a mano,
// igual que el comando open del terminal. Solo para #project-*: esas anclas no
// tienen elemento al que saltar; las de seccion (#home, #games) las desplaza
// el navegador aunque el hash no cambie.
export function reopenSameHash(event) {
  const { hash } = event.currentTarget;
  if (!hash.startsWith("#project-") || window.location.hash !== hash) return;
  event.preventDefault();
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}
