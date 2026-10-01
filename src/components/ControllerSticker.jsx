import { useState } from "react";

export function ControllerSticker() {
  const [mirror, setMirror] = useState("translate(0 0) scale(1 1)");
  function chooseCorner(event) {
    if (event.pointerType === "touch") return;
    const svg = event.currentTarget.querySelector("svg");
    const matrix = svg.getScreenCTM();
    if (!matrix) return;
    // Invert the notebook and sticker rotations before choosing the nearest corner.
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    const left = point.x < 40;
    const top = point.y < 27;
    setMirror(`translate(${left ? 80 : 0} ${top ? 54 : 0}) scale(${left ? -1 : 1} ${top ? -1 : 1})`);
  }
  return (
            <div className="discord-controller-sticker" aria-hidden="true" onPointerEnter={chooseCorner} onPointerMove={chooseCorner}>
              <svg viewBox="0 0 80 54" fill="none">
                <g transform={mirror}>
                <g className="discord-controller-sticker-front"><g transform={mirror}>
                {/* The cream outline follows the cut of a printed vinyl sticker. */}
                <path d="M23 9C14 8 10 14 8 23L4 39C2 49 12 53 19 46L28 37H52L61 46C68 53 78 49 76 39L72 23C70 14 66 8 57 9L49 12H31Z" fill="#eee6cc" stroke="#f7f0d9" strokeWidth="3" strokeLinejoin="round" />
                <path d="M23 13C16 12 13 17 11 25L8 40C7 46 12 48 17 43L26 33H54L63 43C68 48 73 46 72 40L69 25C67 17 64 12 57 13L49 16H31Z" fill="#537a85" stroke="#293f48" strokeWidth="1.6" />
                <path d="M13 28C15 15 20 14 27 17L32 19H48L55 17C62 14 66 19 67 28L60 33H20Z" fill="#88b7bc" />
                <path d="M11 38L10 42M16 21L19 18M59 18L62 19" stroke="#d1e5cf" strokeWidth="2" strokeLinecap="round" />
                <path d="M20 20H26V25H31V31H26V36H20V31H15V25H20Z" fill="#263e49" stroke="#b8d3c4" strokeWidth="1" strokeLinejoin="round" />
                <path d="M21 22H24V27H29" stroke="#617d85" strokeWidth="1.2" />
                <circle cx="59" cy="23" r="4.4" fill="#e9b75e" stroke="#775b40" strokeWidth="1.3" />
                <circle cx="65" cy="31" r="4.4" fill="#dd8291" stroke="#794c5d" strokeWidth="1.3" />
                <path d="M57 21L59 20M63 29L65 28" stroke="#fff0cd" strokeWidth="1.4" strokeLinecap="round" />
                <path d="M35 29H39M43 29H47" stroke="#314c58" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M33 21H47" stroke="#dbe3cb" strokeWidth="1" strokeDasharray="1 2" />
                <path d="M18 39L22 35M51 20L53 19M54 31L56 33M31 24H34" stroke="#edf2d8" strokeOpacity=".4" strokeWidth=".8" />
                </g></g>
                {/* Reflect only the lifted corner across the diagonal crease. */}
                <g className="discord-controller-sticker-fold">
                  <g className="discord-controller-sticker-corner"><g transform={mirror}>
                    <path d="M23 9C14 8 10 14 8 23L4 39C2 49 12 53 19 46L28 37H52L61 46C68 53 78 49 76 39L72 23C70 14 66 8 57 9L49 12H31Z" fill="#d7d3b9" stroke="#fff4d7" strokeWidth="3" strokeLinejoin="round" />
                    <path d="M64 44Q71 50 73 43" stroke="#f7efd4" strokeWidth="2" strokeLinecap="round" />
                  </g></g>
                </g>
                </g>
              </svg>
            </div>
  );
}
