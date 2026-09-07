import { useEffect, useRef } from "react";

// Un panel que corta una fila por la mitad parece roto, no parece que siga.
// El hook marca el contenedor con los bordes que todavia esconden contenido
// para que el CSS pueda desvanecer justo ese lado (y solo ese lado).
export function useScrollEdges() {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const update = () => {
      const top = node.scrollTop > 2;
      const bottom = node.scrollTop + node.clientHeight < node.scrollHeight - 2;
      node.dataset.edge = top && bottom ? "both" : top ? "top" : bottom ? "bottom" : "none";
    };

    update();
    node.addEventListener("scroll", update, { passive: true });

    // El alto util cambia al filtrar el botin, no solo al redimensionar la
    // ventana: hay que vigilar el contenido, no solo el contenedor.
    const observer = new ResizeObserver(update);
    observer.observe(node);
    for (const child of node.children) observer.observe(child);

    return () => {
      node.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  return ref;
}
