import { useEffect } from "react";

/*
  Las secciones de #main que quedan lejos de la vista llevan data-offscreen y
  sus animaciones se pausan (index.css). Hay mas de cien en bucle repartidas por
  la pagina y el navegador las seguia moviendo y componiendo en cada frame
  aunque nadie las viera. El margen las arranca un poco antes de que entren.
  Es un atributo y no una clase porque React reescribe className al renderizar.
*/
export function useOffscreenPause(shellRef) {
  useEffect(() => {
    const shell = shellRef.current;
    const main = shell?.querySelector("#main");
    if (!main || typeof IntersectionObserver !== "function") return undefined;

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) entry.target.toggleAttribute("data-offscreen", !entry.isIntersecting);
    }, { root: shell, rootMargin: "400px 0px" });
    const watched = new WeakSet();
    const scan = () => {
      for (const section of main.children) {
        if (section.tagName !== "SECTION" || watched.has(section)) continue;
        watched.add(section);
        observer.observe(section);
      }
    };
    scan();
    // Las secciones perezosas entran despues del primer render.
    const mutations = new MutationObserver(scan);
    mutations.observe(main, { childList: true });
    return () => {
      mutations.disconnect();
      observer.disconnect();
    };
  }, [shellRef]);
}
