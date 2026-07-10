import { useEffect, useRef, useState } from "react";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&/<>[]{}=+*";
const SCRAMBLE_REFRESH_MS = 48;

function isScrambleTarget(char) {
  return /[A-Za-z0-9]/.test(char);
}

function randomGlyph() {
  return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
}

function buildFrame(text, settledCount, scrambled) {
  let output = "";
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (index < settledCount || !isScrambleTarget(char)) {
      output += char;
    } else {
      output += scrambled[index] || char;
    }
  }
  return output;
}

function scrambleAll(text) {
  return [...text].map((char) => (isScrambleTarget(char) ? randomGlyph() : char));
}

/*
  Mide como quedo partido en lineas el texto FINAL (los glifos aleatorios
  tienen otro ancho y re-acomodan palabras entre lineas a mitad de animacion).
  Devuelve las lineas para bloquearlas durante el decode, o null si es una
  sola linea / la medicion no cuadra.
*/
function measureFinalLines(innerSpan, text) {
  const node = innerSpan?.firstChild;
  if (!node || node.nodeType !== Node.TEXT_NODE || node.nodeValue !== text) return null;

  const lines = [];
  let currentTop = null;
  let currentWords = [];
  const range = document.createRange();
  const wordPattern = /\S+/g;

  for (const match of text.matchAll(wordPattern)) {
    range.setStart(node, match.index);
    range.setEnd(node, match.index + match[0].length);
    const top = range.getBoundingClientRect().top;

    if (currentTop !== null && Math.abs(top - currentTop) > 3) {
      lines.push(currentWords.join(" "));
      currentWords = [];
    }
    currentTop = top;
    currentWords.push(match[0]);
  }

  if (currentWords.length) lines.push(currentWords.join(" "));
  range.detach();

  if (lines.length < 2 || lines.join(" ") !== text) return null;
  return lines;
}

/*
  Texto que se "descifra" al entrar en pantalla: glifos aleatorios que se
  resuelven de izquierda a derecha, una sola vez. Los espacios y signos quedan
  anclados, y en titulos multilinea las palabras se bloquean en su linea final
  (medida antes de animar) para que nada salte de renglon a mitad del efecto.
  data-no-random-glitch evita que useRandomGlitchWords se superponga mientras
  decodifica.
*/
export function DecodeText({ text, as: Tag = "span", className = "", duration = 900, delay = 0 }) {
  const elementRef = useRef(null);
  const [display, setDisplay] = useState(text);
  const [isDecoding, setIsDecoding] = useState(false);
  const [lockedLines, setLockedLines] = useState(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || typeof IntersectionObserver === "undefined") return undefined;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;

    let rafId = 0;
    let delayTimer = 0;
    let played = false;

    function play() {
      let startTime = 0;
      let lastScramble = 0;
      let scrambled = scrambleAll(text);

      const innerSpan = element.querySelector("[data-decode-inner]");
      setLockedLines(measureFinalLines(innerSpan, text));
      setIsDecoding(true);

      function frame(now) {
        if (!startTime) startTime = now;
        if (now - lastScramble >= SCRAMBLE_REFRESH_MS) {
          scrambled = scrambleAll(text);
          lastScramble = now;
        }

        const progress = Math.min(1, (now - startTime) / duration);
        const settledCount = Math.floor(progress * text.length);

        if (progress < 1) {
          setDisplay(buildFrame(text, settledCount, scrambled));
          rafId = window.requestAnimationFrame(frame);
        } else {
          setDisplay(text);
          setIsDecoding(false);
          setLockedLines(null);
        }
      }

      rafId = window.requestAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (played || !entries.some((entry) => entry.isIntersecting)) return;
        played = true;
        observer.disconnect();
        delayTimer = window.setTimeout(play, delay);
      },
      { threshold: 0.25 }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      window.clearTimeout(delayTimer);
      window.cancelAnimationFrame(rafId);
    };
  }, [text, duration, delay]);

  // Con lineas bloqueadas, el frame se rebana por longitudes de linea (misma
  // cadena, mismos indices) y cada linea se pinta como bloque sin re-wrap.
  let content = display;
  if (lockedLines) {
    const segments = [];
    let cursor = 0;
    for (const line of lockedLines) {
      segments.push(display.slice(cursor, cursor + line.length));
      cursor += line.length + 1;
    }
    content = segments.map((segment, index) => (
      <span className="decode-line" key={index}>
        {segment}
      </span>
    ));
  }

  return (
    <Tag
      aria-label={text}
      className={className}
      ref={elementRef}
      {...(isDecoding ? { "data-no-random-glitch": true } : {})}
    >
      <span aria-hidden="true" data-decode-inner="">
        {content}
      </span>
    </Tag>
  );
}
