// Decorative paint and scoring stay attached to their respective sliding panel.
export function GatePatina({ side }) {
  const left = side === "left";

  return (
    <span className={`entry-gate-patina is-${side}`} aria-hidden="true">
      <svg className="gate-scratches" viewBox="0 0 600 800" preserveAspectRatio="none" fill="none">
        <g stroke="currentColor" strokeWidth=".8">
          {left ? (
            <>
              <path d="m72 185 39-12m-32 20 62-25m-48 33 20-9M436 290l34-47m-29 57 50-62m-32 41 22-29M80 577l76-9m-58 15 31-6M366 681l47-15m-35 21 25-9M44 358l3 49m-1 13 1 17M544 536l-3 42m-2 9-1 14" />
              <path d="m211 233 12-3m125 194 9-5m-75 218 18-6m172-240 7-10M123 711l28-2" opacity=".5" />
            </>
          ) : (
            <>
              <path d="m108 180 47 12m-42-5 28 10M411 302l53-19m-45 25 66-19m-43 28 22-10M77 470l28-39m-21 46 40-51M441 670l69-12m-54 20 38-9M546 158l-2 60m-1 9-2 14M55 617l2 25m0 10 1 39" />
              <path d="m327 163 12 4m-143 418 16-5m189-24 8-11m-61 181 28-3M164 328l9-6" opacity=".5" />
            </>
          )}
        </g>
        <g stroke="currentColor" strokeWidth="2.4" opacity=".16">
          <path d={left ? "m78 584 94-16M438 294l45-53M372 689l43-16" : "m415 310 72-24M83 480l41-50M446 680l64-16"} />
        </g>
      </svg>

      <svg className="gate-paint-tag" viewBox="0 0 260 155" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        {left ? (
          <>
            {/* Uneven hand-lettered STAY / WEIRD, with dry-brush gaps. */}
            <g strokeWidth="4.5">
              <path d="M53 25Q21 11 20 34q0 10 20 13t-4 18L13 60M67 24l48-3M89 23l-9 47M116 69l23-48 15 49m-28-18 22-2M166 21l14 24 25-24m-25 24-5 25" />
              <path d="m15 89 2 44 20-31 7 31 22-47M105 86l-27 3-6 45 27-3m-23-19 22-3M125 86l-8 46M143 132l7-47q42-4 24 20l-29 7m17-7 21 29M202 134l8-48q54 15-8 48" />
            </g>
            <path d="m10 144 211-9m-200 16 148-4M227 42l10-5-7 18 14-5" strokeWidth="2" />
            <path d="m34 65-2 12m109-7-1 9m65 55-2 11" strokeWidth="1.5" opacity=".65" />
          </>
        ) : (
          <>
            {/* NO CLIP, a little crooked, like marker on a cabinet. */}
            <g strokeWidth="5">
              <path d="m37 60 5-43 32 46 9-48M110 19q-24 10-17 35t31 6q20-14 10-33t-24-8" />
              <path d="M57 89q-43-19-43 22t40 21M79 83l-8 52 33-3M130 84l-9 48M155 133l6-48q49-4 31 20l-34 9" />
            </g>
            <path d="m24 145 177-6m-157 12 119-5m-16-91 37-17-9 16 42-7m-10-7 13 7-11 10" strokeWidth="2.5" />
            <path d="m42 60-2 13m80-12-1 9m57 39-2 16" strokeWidth="1.5" opacity=".65" />
          </>
        )}
        {/* Tiny unpainted nicks break up the marker strokes. */}
        <path d="m22 47 31-2m75 55 24-3m26 20 38-3M88 29l20-2" stroke="#04110b" strokeWidth="1.5" opacity=".75" />
        <g fill="currentColor" stroke="none" opacity=".45">
          <circle cx="7" cy="38" r="1.5" /><circle cx="231" cy="112" r="1" />
          <circle cx="54" cy="76" r="1" /><circle cx="195" cy="15" r="1.8" />
          <circle cx="218" cy="142" r="1.3" /><circle cx="8" cy="120" r=".8" />
        </g>
      </svg>

      <svg className="gate-paint-doodle" viewBox="0 0 120 110" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {left ? (
          <>
            <path d="m27 33 66-3 2 48-69 3Zm30-1 1-13m-6-1 11-1M39 48l10-1 1 9-11 1Zm29-2 11-1 1 9-11 1ZM48 66l25-2M34 82l-1 14 13-1m32-15 2 13 12-1M17 45l-6 2 1 18 6-1m84-22 7-1 1 19-7 1" />
            <path d="m8 87 7-6m-5 18 10-7M98 17l8-6m-5 17 12-2" opacity=".6" />
          </>
        ) : (
          <>
            <path d="m57 12 11 26 30-5-22 23 14 28-30-13-24 24 3-34-27-15 31-7Z" />
            <path d="m45 43 4 7m17-12 4 7M49 60q12 8 20-3m30 32 9 9m-8-20 13 4M23 18l-8-7" />
          </>
        )}
      </svg>
    </span>
  );
}
