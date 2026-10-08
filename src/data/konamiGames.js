// Cartuchos de la biblioteca secreta (codigo Konami). Viven aparte del
// componente para que App pueda precargar las portadas y contar los discos sin
// arrastrar la biblioteca entera, que ahora se carga solo al abrirla.
export const KONAMI_GAMES = [
  {
    id: "madrace",
    title: "Madrace",
    program: "MADRACE.EXE",
    description: "Physics driving trials across increasingly unreasonable roads.",
    meta: "CAMPAIGN // DISCORD RANKING",
    color: "cyan",
    image: "/arcade-library/madrace-cover.webp"
  },
  {
    id: "tower-block",
    title: "Tower Block",
    program: "TOWER.BLOCK",
    description: "Time each placement, trim the edges, and build into the signal haze.",
    meta: "ENDLESS // LOCAL HIGH SCORE",
    color: "green",
    image: "/arcade-library/tower-block-cover.webp"
  },
  {
    id: "cross-road",
    title: "Cross Road",
    program: "CROSS.ROAD",
    description: "Hop through traffic, rails, rivers, and an endless field of bad decisions.",
    meta: "ENDLESS // ARROW CONTROLS",
    color: "amber",
    image: "/arcade-library/cross-road-cover.webp"
  },
  {
    id: "rubiks-cube",
    title: "The Cube",
    program: "THE.CUBE",
    description: "Scramble, twist, and solve an animated cube against the cabinet clock.",
    meta: "PUZZLE // POINTER CONTROLS",
    color: "magenta",
    image: "/arcade-library/rubiks-cube-cover.webp"
  },
  {
    id: "space-cadet-pinball",
    title: "Space Cadet",
    program: "SPACE.CADET",
    description: "The Windows table, decompiled to WebAssembly. Flip, ramp, and rank up to Fleet Admiral.",
    meta: "PINBALL // Z + / FLIPPERS",
    color: "violet",
    image: "/arcade-library/space-cadet-pinball-cover.webp"
  },
  {
    id: "nzp",
    title: "NZ:P",
    program: "NZP.EXE",
    description: "Survive the waves in Nazi Zombies: Portable. A reward for completing Buddy's entire journal.",
    meta: "SURVIVAL // ONLINE CO-OP",
    color: "amber",
    image: "/arcade-library/nzp-bunker-cover.webp",
    requiresJournal: true,
    desktopOnly: true
  }
];

export function availableKonamiGames(journalComplete = false, mobileView = false) {
  return KONAMI_GAMES.filter((game) => (!game.requiresJournal || journalComplete) && (!game.desktopOnly || !mobileView));
}
