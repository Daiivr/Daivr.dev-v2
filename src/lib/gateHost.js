// A slow or unavailable renderer may unlock the entrance, but cannot speak
// on behalf of an avatar that has not appeared.
export function getHostAvailability({ compact, buddyAwake, cabinetReady, hostStage, hostOverdue }) {
  const present = compact
    ? buddyAwake && cabinetReady
    : hostStage === "greeting" || hostStage === "waving";
  return { present, canProceed: present || (!compact && (hostOverdue || hostStage === "error")) };
}

// Reveal callbacks run before the WebGL frame is painted and before the CSS
// fade completes. Require two foreground frames with a visible canvas, and
// recheck after returning from a hidden/minimized page. No wall-clock timeout.
export function observeAvatarVisibility(element, onVisible) {
  const doc = element.ownerDocument;
  const win = doc.defaultView;
  let frame = 0;
  let visibleFrames = 0;
  let disposed = false;

  function check() {
    frame = 0;
    if (disposed || doc.visibilityState === "hidden") return;
    const canvas = element.querySelector("canvas");
    const style = canvas && win.getComputedStyle(canvas);
    const bounds = canvas?.getBoundingClientRect();
    const visible = bounds?.width > 0 && bounds.height > 0 &&
      style.display !== "none" && style.visibility === "visible" && Number(style.opacity) >= .99;
    visibleFrames = visible ? visibleFrames + 1 : 0;
    if (visibleFrames >= 2) onVisible(true);
    else frame = win.requestAnimationFrame(check);
  }

  function restart() {
    win.cancelAnimationFrame(frame);
    visibleFrames = 0;
    onVisible(false);
    if (doc.visibilityState !== "hidden") frame = win.requestAnimationFrame(check);
  }

  doc.addEventListener("visibilitychange", restart);
  restart();
  return () => {
    disposed = true;
    win.cancelAnimationFrame(frame);
    doc.removeEventListener("visibilitychange", restart);
  };
}
