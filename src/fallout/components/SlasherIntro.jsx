import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";

// One complete pass of the supplied 169-frame animation.
const ANIMATION_MS = 5070;

export function SlasherIntro({ onFinish }) {
  const dialogRef = useRef(null);
  const timerRef = useRef(null);
  const [reducedMotion, setReducedMotion] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    // A failed or slow image must never hold the guide closed.
    const fallback = window.setTimeout(onFinish, reducedMotion ? 1400 : 10000);
    return () => window.clearTimeout(fallback);
  }, [onFinish, reducedMotion]);

  function playIntro() {
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(onFinish, ANIMATION_MS);
  }

  return <dialog ref={dialogRef} className="fo-slasher-intro" aria-labelledby="fo-slasher-intro-title" onCancel={event => { event.preventDefault(); onFinish(); }}>
    <div className="fo-slasher-intro-content">
      <span className="fo-slasher-intro-eyebrow">WASTELAND FIELD LIBRARY / SPECIAL ISSUE</span>
      <div className="fo-slasher-intro-art" aria-hidden="true">
        {!reducedMotion && <img src="/fallout/slasher-intro.gif" alt="" width="1011" height="403" onLoad={playIntro} onError={onFinish} />}
      </div>
      <h2 id="fo-slasher-intro-title">The Slasher Season <span>event Guides.</span></h2>
      <p>Follow the laughter. Find the masks.</p>
      <button type="button" onClick={onFinish} autoFocus>Enter guide <ArrowRight size={17} aria-hidden="true" /></button>
    </div>
  </dialog>;
}
