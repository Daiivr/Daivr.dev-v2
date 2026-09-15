let pagePromise;
let loadedPage;
export const FALLOUT_NAVIGATION = "daivr:enter-fallout";
export const getPreloadedFalloutPage = () => loadedPage;

export function preloadFallout() {
  pagePromise ||= import("../fallout/FalloutPage.jsx").then((module) => {
    loadedPage = module.default;
    return module;
  }).catch((error) => {
    pagePromise = null;
    throw error;
  });
  return pagePromise;
}

export async function enterFallout(event) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  const link = event.currentTarget;
  if (link.dataset.entering) return;
  link.dataset.entering = "true";
  try {
    await preloadFallout();
    if (!link.isConnected) return;
    const door = link.querySelector(".vault-door");
    const rect = door.getBoundingClientRect();
    // Measure the translated center, but keep the unrotated diameter.
    const size = door.clientWidth;
    const matrix = new DOMMatrixReadOnly(getComputedStyle(door).transform);
    const angle = Math.atan2(matrix.b, matrix.a) * 180 / Math.PI;
    const origin = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, size, angle };
    history.pushState(null, "", "/fallout");
    window.dispatchEvent(new CustomEvent(FALLOUT_NAVIGATION, { detail: origin }));
  } catch {
    window.location.assign(link.href);
  } finally {
    delete link.dataset.entering;
  }
}
