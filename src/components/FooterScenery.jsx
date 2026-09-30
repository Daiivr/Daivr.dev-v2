import { useEffect, useRef } from "react";

const TREES = [
  { id: "pine-a", className: "is-pine is-far", left: "4%" },
  { id: "round-a", className: "is-round is-near", left: "15%" },
  { id: "pine-b", className: "is-pine is-near", left: "31%" },
  { id: "round-b", className: "is-round is-far", left: "52%" },
  { id: "pine-c", className: "is-pine is-near", left: "70%" },
  { id: "round-c", className: "is-round is-near", left: "87%" }
];

const GRASS = Array.from({ length: 28 }, (_, index) => ({
  id: `grass-${index}`,
  left: `${1.5 + index * 3.55}%`,
  scale: (0.72 + (index % 5) * 0.09).toFixed(2),
  delay: `${-(index % 7) * 0.19}s`
}));

function WoodlandTree({ pine }) {
  return <svg className="footer-tree-art" viewBox="0 0 58 86" aria-hidden="true">
    <g shapeRendering="crispEdges">
      <path d="M25 38h8v39h5v4H19v-4h6z" fill="var(--wood-shadow)" />
      <path d="M26 40h3v37h-5v2h7V40z" fill="var(--wood-light)" />
      <path d="M28 55h-7v-8h-3v11h10m3 6h9V52h-3v9h-6" fill="var(--wood-shadow)" />
      <g className="footer-tree-leaves">
        {pine ? <>
          <path d="M27 2h4v6h4v7h4v6h-4v4h8v7h5v6h-6v4h8v7h5v8H39v4H19v-4H3v-8h6v-7h8v-4h-6v-6h5v-7h8v-4h-5v-6h5V8h3z" fill="var(--leaf-shadow)" />
          <path d="M27 8h4v10h4v4H24v-6h3m-3 11h9v6h6v5H17v-5h7m-6 11h18v6h9v6H11v-7h7z" fill="var(--leaf-mid)" />
          <path d="M27 9h2v8h-2m-3 11h4v5h-9v3h-3v-5h8m-6 15h7v4h-8v4h-6v-4h7" fill="var(--leaf-light)" />
          <path d="M31 19h3v3h-3m3 13h4v3h-4m3 16h5v3h-5" fill="var(--leaf-glint)" />
        </> : <>
          <path d="M18 5h19v4h9v6h5v9h4v21h-5v9H39v4H16v-4H7v-8H3V25h4V15h6V9h5z" fill="var(--leaf-shadow)" />
          <path d="M18 9h16v4h10v7h5v20h-7v8H29v5H16v-5H9V27h4V17h5z" fill="var(--leaf-mid)" />
          <path d="M18 11h12v5H18v6h-6v10H8v-8h4V16h6m-5 24h9v5h-9z" fill="var(--leaf-light)" />
          <path d="M30 18h9v4h6v8h-5v7H28v-5h-5v-8h7z" fill="var(--leaf-light)" opacity=".5" />
          <path d="M14 27h5v3h-5m16-17h5v3h-5m11 23h4v3h-4m-19 7h5v3h-5" fill="var(--leaf-glint)" />
          <path d="M31 39h4v9h-4m4-13h7v4h-7" fill="var(--leaf-shadow)" />
        </>}
      </g>
      <path d="M15 80h10v-2h9v2h9v3H15z" fill="var(--leaf-shadow)" />
    </g>
  </svg>;
}

export function FooterScenery() {
  const sceneryRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;
    const scenery = sceneryRef.current;
    if (!scenery) return undefined;

    let frame = 0;
    let lastActive = "";
    const grasses = [...scenery.querySelectorAll(".footer-grass")];
    let grassCenters = [];

    function measureGrass() {
      grassCenters = grasses.map((grass) => grass.offsetLeft + grass.offsetWidth / 2);
    }

    function trackBuddySteps() {
      const buddy = document.querySelector(".screen-buddy-root:not(.is-off)");
      const sceneryRect = scenery.getBoundingClientRect();
      const buddyRect = buddy?.getBoundingClientRect();
      const isMoving = buddy?.classList.contains("is-walk") || buddy?.classList.contains("is-sleepy");
      let active = "";

      if (buddyRect && sceneryRect.width && isMoving) {
        const footX = buddyRect.left + buddyRect.width / 2 - sceneryRect.left;
        let closestDistance = Infinity;
        grasses.forEach((grass, index) => {
          const distance = Math.abs(grassCenters[index] - footX);
          if (distance < 34 && distance < closestDistance) {
            closestDistance = distance;
            active = grass.dataset.grassId || "";
          }
        });
      }

      if (active !== lastActive) {
        grasses.forEach((grass) => grass.classList.toggle("is-stepped", grass.dataset.grassId === active));
        lastActive = active;
      }
      frame = window.requestAnimationFrame(trackBuddySteps);
    }

    measureGrass();
    window.addEventListener("resize", measureGrass);
    const visibility = new IntersectionObserver(([entry]) => {
      window.cancelAnimationFrame(frame);
      if (entry.isIntersecting) frame = window.requestAnimationFrame(trackBuddySteps);
      scenery.classList.toggle("is-in-view", entry.isIntersecting);
    });
    visibility.observe(scenery);
    return () => {
      visibility.disconnect();
      window.removeEventListener("resize", measureGrass);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const scenery = sceneryRef.current;
    const onRain = (event) => scenery?.classList.toggle("is-raining", Boolean(event.detail?.active));
    window.addEventListener("daivr-footer-rain", onRain);
    return () => window.removeEventListener("daivr-footer-rain", onRain);
  }, []);

  return (
    <div className="footer-scenery" aria-hidden="true" ref={sceneryRef}>
      <span className="footer-forest-light" />
      <svg className="footer-distant-woods" viewBox="0 0 1200 96" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 66h35v-8h36v-7h48v6h42v-9h40v-5h54v8h45v8h56v-8h44v-7h48v-9h46v9h51v12h54v7h49v-9h42v-8h55v-6h58v7h44v10h65v-8h60v-6h41v9h61v12h48V96H0z" fill="var(--forest-far)" />
        <path d="M0 80h53V65h10V54h6V44h4V33h5v11h5v10h7v11h9v15h67v-9h52v8h72V65h8V54h8V40h5v-9h5v9h5v14h8v11h9v15h96v-8h37v-7h41v13h107V65h8V55h6V43h5v-9h5v9h5v12h7v10h9v15h81v-9h35v-9h46v12h75V60h9V47h5V34h6v13h6v13h9v18h62v-9h55v10h61V64h8V51h7V40h5V30h5v10h5v11h8v13h9v16h65v16H0z" fill="var(--forest-mid)" />
      </svg>
      <span className="footer-forest-stars">{[7, 22, 39, 58, 76, 91].map((left, index) => <i key={left} style={{ left: `${left}%`, top: `${8 + index % 3 * 9}px`, "--spark-delay": `${-index * 1.3}s` }} />)}</span>
      <span className="footer-scenery-horizon" />
      {TREES.map((tree) => (
        <span className={`footer-pixel-tree ${tree.className}`} style={{ left: tree.left }} key={tree.id}>
          <WoodlandTree pine={tree.className.includes("is-pine")} />
        </span>
      ))}
      <span className="footer-forest-mist" />
      <svg className="footer-trail-details" viewBox="0 0 1200 96" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <g shapeRendering="crispEdges">
          <path d="M95 89v-4h5v-4h11v4h6v4m350 0v-5h7v-3h12v4h5v4m407 0v-4h5v-5h13v4h7v5" fill="var(--stone-shadow)" />
          <path d="M101 83h9v2h-9m372 0h11v2h-11m410-1h11v2h-11" fill="var(--stone-light)" />
          <path d="M192 88v-7h3v7m12 0v-5h2v5m625 0v-7h3v7" fill="#799d91" />
          <path d="M187 80h4v-3h6v3h4v3h-14m17 0h8v3h-8m616-6h4v-3h6v3h4v3h-14" fill="var(--mushroom-cap)" />
          <path d="M191 79h3v2h-3m638-2h3v2h-3" fill="#c5cbbb" opacity=".7" />
          <g className="footer-trail-lantern">
            <path d="M624 88V62h3v26m-2-26h16v3h-16m12 0h2v6h-2" fill="var(--wood-light)" />
            <path d="M633 70h10v13h-10z" fill="#233b3e" /><path d="M635 72h6v8h-6z" fill="#bca674" />
            <path d="M636 73h3v5h-3z" fill="#f4dfac" /><path d="M631 69h14v2h-14m1 11h12v2h-12" fill="#466663" />
          </g>
        </g>
      </svg>
      <span className="footer-fireflies">{[11, 27, 44, 65, 82, 95].map((left, index) => <i key={left} style={{ left: `${left}%`, bottom: `${17 + index % 3 * 12}px`, "--spark-delay": `${-index * 1.7}s` }} />)}</span>
      <span className="footer-grass-bed">
        {GRASS.map((grass) => (
          <i
            className="footer-grass"
            data-grass-id={grass.id}
            key={grass.id}
            style={{ left: grass.left, "--grass-scale": grass.scale, "--grass-delay": grass.delay }}
          />
        ))}
      </span>
    </div>
  );
}
