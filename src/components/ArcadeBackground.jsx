const rainLines = [
  "01 fn dx AI",
  "</> sys 404",
  "run dai.exe",
  "{ } bot sync",
  "$ npm start",
  "XP +07",
  "VR node 01",
  "const game",
  "queue online",
  "scan // ok",
  "0xDAI",
  "build pass"
];

export function ArcadeBackground() {
  return (
    <div className="arcade-bg" aria-hidden="true">
      <div className="arcade-bg-grid" />
      <div className="arcade-bg-circuit">
        {Array.from({ length: 10 }, (_, index) => (
          <span key={`trace-${index}`} style={{ "--i": index }} />
        ))}
      </div>
      <div className="arcade-bg-rain">
        {rainLines.map((line, index) => (
          <span key={line} style={{ "--i": index, "--delay": `${index * -0.84}s` }}>
            {line}
          </span>
        ))}
      </div>
      <div className="arcade-bg-packets">
        {Array.from({ length: 8 }, (_, index) => (
          <span key={`packet-${index}`} style={{ "--i": index, "--delay": `${index * -0.66}s` }} />
        ))}
      </div>
    </div>
  );
}
