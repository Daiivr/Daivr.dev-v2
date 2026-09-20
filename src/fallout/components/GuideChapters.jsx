import { useEffect, useRef, useState } from "react";
import { ArrowUp, BookOpen, Compass, HelpCircle, Radio, Trophy } from "lucide-react";

const chapters = [
  ["guide-overview", "Overview", BookOpen],
  ["field-notes", "Before you go", Radio],
  ["locations", "Find the masks", Compass],
  ["rewards", "The rewards", Trophy],
  ["field-questions", "Field questions", HelpCircle],
];

export function GuideChapters() {
  const [active, setActive] = useState("guide-overview");
  const railRef = useRef(null);
  useEffect(() => {
    const page = railRef.current?.closest(".fallout-page");
    const update = () => {
      const current = chapters.filter(([id]) => {
        const section = document.getElementById(id);
        return section && section.getBoundingClientRect().top <= 180;
      }).at(-1);
      setActive(current?.[0] || "guide-overview");
    };
    update();
    // Fallout scrolls inside its own page container, independently of the window.
    page?.addEventListener("scroll", update, { passive: true });
    return () => page?.removeEventListener("scroll", update);
  }, []);

  return <aside ref={railRef} className="fo-chapter-rail">
    <div className="fo-chapter-edition"><BookOpen size={24} aria-hidden="true" /><span>FIELD GUIDE<strong>NO. 01</strong></span></div>
    <span className="fo-chapter-label">IN THIS GUIDE</span>
    <nav className="fo-chapter-nav" aria-label="Guide contents">
      {chapters.map(([id, label, Icon], index) => <a key={id} href={`#${id}`} onClick={() => setActive(id)} aria-current={active === id ? "location" : undefined}><Icon size={16} aria-hidden="true" /><span>{label}</span><small>{String(index).padStart(2, "0")}</small></a>)}
    </nav>
    <div className="fo-chapter-note"><span>FIELD REMINDER</span><p>An empty inventory?<br />Aim at the mask itself.</p></div>
    <a className="fo-chapter-top" href="#guide-overview"><ArrowUp size={14} aria-hidden="true" />Back to top</a>
  </aside>;
}
