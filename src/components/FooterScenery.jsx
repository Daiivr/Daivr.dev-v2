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
    frame = window.requestAnimationFrame(trackBuddySteps);
    return () => {
      window.removeEventListener("resize", measureGrass);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="footer-scenery" aria-hidden="true" ref={sceneryRef}>
      <span className="footer-scenery-horizon" />
      {TREES.map((tree) => (
        <span className={`footer-pixel-tree ${tree.className}`} style={{ left: tree.left }} key={tree.id}>
          <i className="tree-crown tree-crown-a" />
          <i className="tree-crown tree-crown-b" />
          <i className="tree-crown tree-crown-c" />
          <i className="tree-trunk" />
          <i className="tree-branch tree-branch-a" />
          <i className="tree-branch tree-branch-b" />
          <i className="tree-leaf-light" />
          <i className="tree-glow" />
        </span>
      ))}
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
