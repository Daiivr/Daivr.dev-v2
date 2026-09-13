// Original vault, silo, and radio schematics for this terminal.
export function VaultDiagram() {
  const teeth = Array.from({ length: 72 }, (_, index) => {
    const angle = index * Math.PI / 36;
    const radius = index % 6 < 3 ? 93 : 83;
    return `${180 + Math.cos(angle) * radius},${121 + Math.sin(angle) * radius}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 360 245" fill="none" className="fo-vault-art" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1" opacity=".22">
        <path d="M0 36h360M0 207h360M55 0v245M303 0v245M0 121h360M180 0v245" />
        <circle cx="180" cy="121" r="112" strokeDasharray="3 6" />
        <path d="M13 53h22v22M13 189h22v-22M325 53h22v22M325 189h22v-22" />
      </g>
      <polygon points={teeth} fill="#25291c" stroke="currentColor" strokeWidth="2" />
      <circle cx="180" cy="121" r="73" stroke="currentColor" strokeWidth="3" />
      <circle cx="180" cy="121" r="65" fill="#151c14" stroke="currentColor" strokeDasharray="1 5" />
      <circle cx="180" cy="121" r="51" stroke="currentColor" strokeWidth="1.5" />
      <path d="M121 89h118M121 153h118M132 69l-15-20M228 69l15-20M132 173l-15 20M228 173l15 20" stroke="currentColor" />
      {[0, 60, 120, 180, 240, 300].map((angle) => <circle key={angle} cx="180" cy="44" r="3" fill="#111710" stroke="currentColor" transform={`rotate(${angle} 180 121)`} />)}
      <text x="180" y="141" textAnchor="middle" fill="currentColor" fontFamily="Impact, sans-serif" fontSize="58" letterSpacing="2">76</text>
      <g stroke="currentColor" opacity=".7"><path d="M96 62H30v-9M260 170h70v16M240 54h65" /><circle cx="96" cy="62" r="3" /><circle cx="260" cy="170" r="3" /></g>
      <g fill="currentColor" fontSize="9" fontFamily="monospace"><text x="12" y="45">BLAST SEAL</text><text x="272" y="201">APPALACHIA</text><text x="277" y="45">DWG. 076</text><text x="132" y="239">VAULT ACCESS // DAI</text></g>
    </svg>
  );
}

export function SiloDiagram({ variant = 0 }) {
  return (
    <svg viewBox="0 0 100 135" fill="none" className="fo-silo-art" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1" opacity=".25"><path d="M10 13v112h80V13M10 30h80M10 54h80M10 78h80M10 102h80M21 13v112M79 13v112M50 0v135" /><path d="M5 9h90M5 130h90" strokeDasharray="3 3" /></g>
      <g stroke="currentColor" strokeWidth="1.5">
        <path d="M38 96V38q0-15 12-27 12 12 12 27v58l12 18H26l12-18Z" fill="#19231a" />
        <path d="M38 40h24M38 91h24M43 96v18M57 96v18M50 42v38M46 114v9h8v-9M25 125h50" />
        <path d={variant === 1 ? "M38 61h24M38 66h24" : variant === 2 ? "M38 52h24M38 73h24" : "M38 73h24"} />
        <path d="M38 83 28 98v16M62 83l10 15v16" />
      </g>
      <circle cx="50" cy="33" r="3" fill="currentColor" />
      <path d="M65 39h25M66 91h24" stroke="currentColor" strokeDasharray="2 2" opacity=".6" />
    </svg>
  );
}

export function RadioDiagram() {
  return (
    <svg viewBox="0 0 110 100" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="2"><path d="m35 87 20-65 20 65M26 87h58M43 61h24M38 76h34M49 43h12M43 61l24 15M67 61 38 76" /><circle cx="55" cy="19" r="4" /><path d="M40 8q-12 10 0 23M70 8q12 10 0 23M30 1q-20 20 0 39M80 1q20 20 0 39" opacity=".6" /></g>
    </svg>
  );
}
