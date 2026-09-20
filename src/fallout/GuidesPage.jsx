import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, BookOpen, ChevronRight, Compass } from "lucide-react";
import { FalloutBackdrop } from "./components/FalloutBackdrop";
import { FieldGuides, GuideFacts } from "./components/FieldGuides";
import { SlasherIntro } from "./components/SlasherIntro";
import { SlasherSurvey } from "./components/SlasherSurvey";
import { GuideChapters } from "./components/GuideChapters";
import { SLASHER_GUIDE as guide } from "./data/guides";
import { FALLOUT_PAGES, GUIDES_PATH, SLASHER_PATH } from "./data/pages";
import "./fallout.css";
import "./field-station.css";
import "./operations.css";
import "./guides.css";
import "./guide-pages.css";
import "./slasher-guide.css";

function SlasherGuide() {
  return <div className="fo-slasher-layout">
    <GuideChapters />
    <div className="fo-slasher-content">
      <header id="guide-overview" className="fo-hunt-header">
        <div className="fo-hunt-title">
          <span className="fo-hunt-season">THE SLASHER SEASON <i /> COLLECTABLE GUIDE</span>
          <h1>Pint-Sized<br /><span>Slasher Masks.</span></h1>
          <p>A little laughter. A long trail of bodies.<br />Your field companion to all 108 masks in Appalachia.</p>
          <div className="fo-hunt-actions"><a href="#locations"><Compass size={18} aria-hidden="true" />Start the hunt<ChevronRight size={16} aria-hidden="true" /></a><a href="#rewards">See the rewards <span aria-hidden="true">↗</span></a></div>
        </div>
        <figure className="fo-hunt-subject"><span>APPALACHIA / CASE 001</span><img src="/fallout/slasher-character.png" width="474" height="474" alt="The Pint-Sized Slasher in a striped outfit and grinning clown mask" fetchPriority="high" /><figcaption><b>THE PINT-SIZED SLASHER</b><span>Listen closely. He's nearby.</span></figcaption></figure>
      </header>
      <div className="fo-hunt-stats"><GuideFacts /><a href="#rewards"><strong>93</strong><span>MASKS TO EARN<br />ALL FOUR REWARDS</span><ChevronRight size={16} aria-hidden="true" /></a></div>
    <section id="field-notes" className="fo-guide-instructions" aria-labelledby="fo-before-title"><header className="fo-guide-section-heading"><span className="fo-kicker">01 / BEFORE YOU GO</span><h2 id="fo-before-title">Listen. Locate. Investigate.</h2></header><ol><li><b>01</b><div><h3>Tune in to the case.</h3><p>Open the Pip-Boy radio and tune to Breaking News to begin The Slasher story. Follow the opening investigation, Masked Truth, while searching the wasteland.</p></div></li><li><b>02</b><div><h3>Find the mask itself.</h3><p>The collectables sit on masked victims. Listen for laughter nearby, approach the body, and aim directly at its mask. An empty corpse inventory does not mean the mask is missing.</p></div></li><li><b>03</b><div><h3>Work one area at a time.</h3><p>Choose a region below, then open a landmark’s local survey. Check every numbered position before moving on. If two dots sit close together, make a second pass rather than assuming they mark one pickup.</p></div></li></ol><div className="fo-guide-field-tip"><Compass size={22} aria-hidden="true" /><p><strong>Our suggested starting circuit:</strong> Wavy Willard’s Water Park → Pioneer Scout Camp → Alpine River Cabins → Camden Park. Each area has three surveyed positions. This is a convenient shortlist, not a shortest-path route.</p></div></section>
    <SlasherSurvey />
    <section id="rewards" className="fo-hunt-rewards" aria-labelledby="fo-guide-rewards-title">
      <header className="fo-guide-section-heading"><span className="fo-kicker">03 / THE PAYOFF</span><h2 id="fo-guide-rewards-title">Make every mask count.</h2><p>Four stages, four rewards. Each challenge starts a fresh count.</p></header>
      <ol>{guide.rewards.map(({ masks, total, reward, image }, index) => <li key={masks}>
        <div className="fo-hunt-reward-stage"><span>CHALLENGE {String(index + 1).padStart(2, "0")}</span><b>{total}<small> TOTAL</small></b></div>
        <img src={image} alt={reward} width="540" height="540" loading="lazy" decoding="async" />
        <h3>{reward}</h3><p><strong>{masks}</strong> {index ? "more masks" : "masks to begin"}</p>
      </li>)}</ol>
      <p className="fo-hunt-reward-note">3 + 10 + 30 + 50 = <strong>93 masks.</strong> The remaining 15 locations give you alternatives along the way.</p>
    </section>
    <section id="field-questions" className="fo-guide-faq" aria-labelledby="fo-guide-faq-title"><header className="fo-guide-section-heading"><span className="fo-kicker">04 / FIELD QUESTIONS</span><h2 id="fo-guide-faq-title">When the trail goes quiet.</h2></header><details><summary>Is a living Phantom the same as a mask pickup?</summary><p>No. Fighting Pint-Sized Phantoms and taking masks from the victims are different activities. For this directory, look for the stationary collectable at the plotted point.</p></details><details><summary>The body is empty. What should I check?</summary><p>Target the mask directly instead of the corpse’s loot window. Check the surrounding vertical space as well: the illustrated game map cannot show which floor, ledge, or side of an obstacle is accessible.</p></details><details><summary>Can I repeat a stop by changing servers?</summary><p>Player reports describe these as one-time character pickups. If you already took a mask, move to a different point rather than planning a server-hop loop around the same corpse.</p></details><details><summary>Why does this guide show 59 search areas?</summary><p>The 108 positions are grouped by the closest named map landmark. That can place an outlying mask under a different name from a walking route. Each point appears once; the area count does not mean there are additional masks.</p></details><details><summary>Do I need all 108 for the challenge rewards?</summary><p>The four stages total 93 pickups. The remaining points give you alternatives if a location is awkward to reach. Check your current challenge stage in the game before setting out.</p></details></section>
    <details className="fo-guide-references"><summary>Field references & survey notes</summary><p>Original guide text with mask pins plotted on the Fallout 76 game map. Map artwork © Bethesda, provided through Mappalachia. Positions and landmark names come from the game-data extract in Mappalachia 2.0.5.2 for game version 1.7.26.13, reviewed 17 September 2026. Regions follow game boundaries; three boundary-gap points use the nearest region. Pins use the Appalachia worldspace bounds supplied with the map. Bearings are calculated from map icons, not tested walking instructions.</p><ul><li><a href="https://github.com/AHeroicLlama/Mappalachia/releases/tag/2.0.5.2" target="_blank" rel="noreferrer">Mappalachia game-data release ↗</a></li><li><a href="https://fallout.bethesda.net/en-US/news/fallout-76-the-slasher-release-notes" target="_blank" rel="noreferrer">Bethesda: The Slasher release notes ↗</a></li><li><a href="https://nukaknights.com/articles/the-slasher-pint-sized-slasher-event-all-rewards.html" target="_blank" rel="noreferrer">Quest and collectable reference ↗</a></li><li><a href="https://www.crimenetgazette.com/post/fallout-76-slasher-masks-you-need-how-many" target="_blank" rel="noreferrer">Challenge-stage reference ↗</a></li><li><a href="https://www.reddit.com/r/fo76/comments/1whbbj1/private_session_pint_sized_slasher/" target="_blank" rel="noreferrer">Player observations: finding pickups ↗</a></li><li><a href="https://www.reddit.com/r/fo76/comments/1whokmm/pintsized_slasher_masks/" target="_blank" rel="noreferrer">Player observations: repeat pickups ↗</a></li></ul></details>
    </div>
  </div>;
}

export default function GuidesPage({ path = GUIDES_PATH }) {
  const detail = path === SLASHER_PATH;
  const [introVisit, setIntroVisit] = useState(0);
  const [showIntro, setShowIntro] = useState(detail);
  const finishIntro = useCallback(() => {
    setShowIntro(false);
    requestAnimationFrame(() => {
      document.getElementById("guide-main")?.focus({ preventScroll: true });
      if (window.location.hash) document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ behavior: "instant" });
    });
  }, []);
  useEffect(() => {
    const replayOnReturn = event => {
      if (event.persisted && detail) { setIntroVisit(value => value + 1); setShowIntro(true); }
    };
    window.addEventListener("pageshow", replayOnReturn);
    return () => window.removeEventListener("pageshow", replayOnReturn);
  }, [detail]);
  const [crt] = useState(() => { try { return localStorage.getItem("daivr-fallout-crt") !== "off"; } catch { return true; } });
  useEffect(() => {
    const previousTitle = document.title;
    const meta = document.querySelector('meta[name="description"]');
    const previousDescription = meta?.content;
    document.title = FALLOUT_PAGES[path].title;
    if (meta) meta.content = FALLOUT_PAGES[path].description;
    if (window.location.hash) document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ behavior: "instant" });
    return () => { document.title = previousTitle; if (meta) meta.content = previousDescription; };
  }, [path]);
  return <div className={`fallout-page fo-guide-page${detail ? " fo-slasher-page" : ""}${crt ? " has-crt" : ""}`}><FalloutBackdrop /><div className="fo-interface">
    <a className="fo-skip" href="#guide-main">Skip to guide content</a>
    <header className="fo-site-bar"><a href={GUIDES_PATH} className="fo-guide-wordmark"><BookOpen size={25} aria-hidden="true" /><span>WASTELAND<small>FIELD LIBRARY / VAULT 76</small></span></a><a className="fo-exit" href="/fallout"><ArrowLeft size={14} aria-hidden="true" />Operations desk</a></header>
    <nav className="fo-guide-breadcrumbs" aria-label="Breadcrumb"><a href="/fallout">Field station</a><ChevronRight size={12} aria-hidden="true" />{detail ? <><a href={GUIDES_PATH}>Guides</a><ChevronRight size={12} aria-hidden="true" /><span aria-current="page">Pint-Sized Slasher Masks</span></> : <span aria-current="page">Guides</span>}</nav>
    <main id="guide-main" tabIndex={-1}>{detail ? <SlasherGuide /> : <><header className="fo-library-masthead"><span className="fo-kicker">DAI’S FIELD STATION / REFERENCE ARCHIVE</span><h1>The wasteland.<br /><span>By the book.</span></h1><p>Collectable locations and field guides, filed for your next expedition.</p><div><BookOpen size={15} aria-hidden="true" />GUIDE LIBRARY<span>01 FIELD FILE</span></div></header><FieldGuides library /></>}</main>
    <footer className="fo-guide-page-footer"><a href={detail ? GUIDES_PATH : "/fallout"}><ArrowLeft size={15} aria-hidden="true" />{detail ? "All guides" : "Back to operations"}</a><span>VAULT 76 / RECLAMATION DIVISION</span></footer>
  </div>{detail && showIntro && <SlasherIntro key={introVisit} onFinish={finishIntro} />}</div>;
}
