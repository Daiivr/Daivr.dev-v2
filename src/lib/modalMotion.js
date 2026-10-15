// La animacion de apertura de los modales (modal-motion.css) empieza a contar en
// cuanto el modal entra en el DOM. Pero ese primer frame es el mas caro de todos
// (estilo, layout y raster del panel nuevo) y a veces tarda 100-300 ms en salir:
// cuando por fin se ve, la animacion de 260 ms ya casi ha terminado y el modal
// parece abrirse de golpe. Aqui se congela en su primer fotograma al montarse y
// arranca dos frames despues, cuando el modal ya esta pintado y los frames
// vuelven a salir seguidos.
const SELECTOR = ".motion-panel[data-state=\"open\"], .motion-backdrop[data-state=\"open\"]";
// Con movimiento reducido el panel usa modal-backdrop-in (solo opacidad).
const OPENING = new Set(["modal-panel-in", "modal-backdrop-in"]);

// Cada animacion se retiene una sola vez: si algo vuelve a escribir el mismo
// data-state, la que ya esta en marcha no vuelve a empezar.
const held = new WeakSet();

function hold(element) {
  const animations = element.getAnimations().filter((animation) => OPENING.has(animation.animationName) && !held.has(animation));
  if (!animations.length) return;
  animations.forEach((animation) => {
    held.add(animation);
    animation.pause();
    animation.currentTime = 0;
  });
  requestAnimationFrame(() => requestAnimationFrame(() => {
    // Si el modal se cerro entretanto, su animacion ya no es esta: no se toca.
    animations.forEach((animation) => {
      if (animation.playState === "paused") animation.play();
    });
  }));
}

export function installModalMotionHold() {
  if (typeof MutationObserver !== "function" || typeof Element.prototype.getAnimations !== "function") return;
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === "attributes") {
        if (record.oldValue !== "open" && record.target.matches?.(SELECTOR)) hold(record.target);
        continue;
      }
      for (const node of record.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (node.matches(SELECTOR)) hold(node);
        node.querySelectorAll(SELECTOR).forEach(hold);
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeOldValue: true, attributeFilter: ["data-state"] });
}
