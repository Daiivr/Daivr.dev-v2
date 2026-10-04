import { BuddyCollectibleIcon } from "../BuddyCollectibleIcon";

// Palo de la hoguera (useBuddyCampfire): sale de las manos de Buddy hacia el
// fuego con un pez o una nube en la punta. Dibujado mirando a la izquierda
// (facing 1) y espejado con --buddy-facing, como la caña de pescar.
export function BuddyCampfireStick({ phase, item, fish }) {
  if (phase === "sit") return null;
  const marshmallow = item === "marshmallow";
  return (
    <span className={`buddy-campfire-stick is-${phase} is-${item}`} aria-hidden="true">
      <svg className="buddy-campfire-stick-svg" viewBox="0 0 44 30" width="44" height="30">
        <g shapeRendering="crispEdges">
          <path d="M4 15h8v2H4zm7 1h7v2h-7zm6 1h7v2h-7zm6 1h7v2h-7zm6 1h8v2h-8z" fill="#a8743f" />
          <path d="M4 16h8v1H4zm7 1h7v1h-7zm6 1h7v1h-7zm6 1h7v1h-7zm6 1h8v1h-8z" fill="#6b4423" />
          {phase !== "eaten" && marshmallow ? (
            <g className="buddy-campfire-marshmallow">
              <path className="buddy-marshmallow-body" d="M0 9h7v8H0z" />
              <path className="buddy-marshmallow-shine" d="M1 10h2v2H1z" />
              <path className="buddy-marshmallow-toast" d="M0 15h7v2H0z" />
              <g className="buddy-marshmallow-flame">
                <path d="M1 6h1v3H1zm2-3h2v6H3zm3 3h1v3H6z" fill="#ff7a3a" />
                <path d="M3 5h2v4H3z" fill="#ffc247" />
              </g>
            </g>
          ) : null}
          {phase !== "eaten" && !marshmallow && fish ? (
            <g className="buddy-campfire-fish">
              <BuddyCollectibleIcon id={fish.id} className="buddy-campfire-fish-art" x={-5} y={7} width={17} height={13} />
              <g className="buddy-campfire-steam" fill="#c9d6d2">
                <path d="M-4 4h2v2h-2z" /><path d="M1 1h2v2H1z" /><path d="M-1 -3h2v2h-2z" />
              </g>
            </g>
          ) : null}
        </g>
      </svg>
    </span>
  );
}
