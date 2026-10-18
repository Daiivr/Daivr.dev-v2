import { createDew } from "./dew.js";
import { createFootprints } from "./footprints.js";
import { createForage } from "./forage.js";
import { createKites } from "./kites.js";
import { createLamps } from "./lamps.js";
import { createLeaves } from "./leaves.js";
import { createMailbox } from "./mailbox.js";
import { createNightLife } from "./nightLife.js";
import { createPerchBirds } from "./perchBirds.js";
import { createSnow } from "./snow.js";
import { createTent } from "./tent.js";

// La vida del valle que no depende de Buddy (o solo un poco): pajaritos que se
// posan, hojas de otoño, el buho y los murcielagos, huellas, rocio, cometas,
// nieve que se acumula, las farolas una a una, la tienda de Pip, el buzon y el
// forraje del dia. El mundo (world.js) llama a cada capa en su sitio:
// sky (detras del valle), ground (con el fondo, iluminado), under/front (con
// Buddy, detras y delante), glow (por encima de la luz) y lights (charcos de luz).
export function createLife() {
  const birds = createPerchBirds(), leaves = createLeaves(), night = createNightLife(), prints = createFootprints();
  const dew = createDew(), kites = createKites(), snow = createSnow(), lamps = createLamps();
  const tent = createTent(), mailbox = createMailbox(), forage = createForage();
  const all = [snow, lamps, birds, leaves, night, prints, dew, kites, tent, mailbox, forage];
  const run = (name, ...args) => { for (const m of all) m[name]?.(...args); };
  return {
    birds, leaves, night, prints, dew, kites, snow, lamps, tent, mailbox, forage,
    setup: (ctx) => run("setup", ctx),
    update: (ctx) => { for (const m of all) if (m !== lamps) m.update?.(ctx); },
    sky: (g, ctx) => { kites.sky(g, ctx); night.sky(g, ctx); },
    // en el suelo, por orden: huellas y hojas caidas, la tienda, el buzon, el
    // forraje, el buho y los pajaros posados en farolas y tejado
    ground: (g, ctx) => { prints.ground(g, ctx); leaves.ground(g, ctx); tent.ground(g, ctx); mailbox.ground(g, ctx); forage.ground(g, ctx); night.ground(g, ctx); birds.ground(g, ctx); },
    under: (g, ctx) => birds.under(g, ctx),
    front: (g, ctx) => { birds.front(g, ctx); leaves.front(g, ctx); },
    glow: (g, ctx) => { dew.glow(g, ctx); night.glow(g, ctx); tent.glow(g, ctx); mailbox.glow(g, ctx); forage.glow(g, ctx); },
    lights: (list, ctx) => tent.lights(list, ctx)
  };
}
