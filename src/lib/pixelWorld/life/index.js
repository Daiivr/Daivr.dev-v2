import { createDew } from "./dew.js";
import { createFootprints } from "./footprints.js";
import { createForage } from "./forage.js";
import { createFisherman } from "./fisherman.js";
import { createGarden } from "./garden.js";
import { createKites } from "./kites.js";
import { createLamps } from "./lamps.js";
import { createLeaves } from "./leaves.js";
import { createMailbox } from "./mailbox.js";
import { createNightLife } from "./nightLife.js";
import { createPerchBirds } from "./perchBirds.js";
import { createSnow } from "./snow.js";
import { createTackleRack } from "./tackleRack.js";
import { createTent } from "./tent.js";

// La vida del valle que no depende de Buddy (o solo un poco): pajaritos que se
// posan, hojas de otoño, el buho y los murcielagos, huellas, rocio, cometas,
// nieve que se acumula, las farolas una a una, la tienda de Pip, el buzon, el
// forraje del dia y el huerto. El mundo (world.js) llama a cada capa en su sitio:
// sky (detras del valle), ground (con el fondo, iluminado), under/front (con
// Buddy, detras y delante), glow (por encima de la luz) y lights (charcos de luz).
export function createLife() {
  const birds = createPerchBirds(), leaves = createLeaves(), night = createNightLife(), prints = createFootprints();
  const dew = createDew(), kites = createKites(), snow = createSnow(), lamps = createLamps();
  const tent = createTent(), mailbox = createMailbox(), forage = createForage(), garden = createGarden(), fisher = createFisherman(), rack = createTackleRack();
  const all = [snow, lamps, birds, leaves, night, prints, dew, kites, tent, mailbox, forage, garden, fisher, rack];
  const run = (name, ...args) => { for (const m of all) m[name]?.(...args); };
  return {
    birds, leaves, night, prints, dew, kites, snow, lamps, tent, mailbox, forage, garden, fisher, rack,
    setup: (ctx) => run("setup", ctx),
    update: (ctx) => { for (const m of all) if (m !== lamps) m.update?.(ctx); },
    sky: (g, ctx) => { kites.sky(g, ctx); night.sky(g, ctx); },
    // en el suelo, por orden: huellas y hojas caidas, la tienda, el buzon, el
    // huerto, el forraje, el buho y los pajaros posados en farolas y tejado
    ground: (g, ctx) => { prints.ground(g, ctx); leaves.ground(g, ctx); tent.ground(g, ctx); mailbox.ground(g, ctx); rack.ground(g, ctx); garden.ground(g, ctx); forage.ground(g, ctx); night.ground(g, ctx); birds.ground(g, ctx); },
    // (el pescador y su carretilla, detras de Pip: el pasa por el sendero)
    under: (g, ctx) => { fisher.under(g, ctx); birds.under(g, ctx); },
    front: (g, ctx) => { tent.front(g, ctx); birds.front(g, ctx); leaves.front(g, ctx); },
    glow: (g, ctx) => { dew.glow(g, ctx); night.glow(g, ctx); tent.glow(g, ctx); mailbox.glow(g, ctx); forage.glow(g, ctx); garden.glow(g, ctx); fisher.glow(g, ctx); rack.glow(g, ctx); },
    lights: (list, ctx) => { tent.lights(list, ctx); fisher.lights(list, ctx); },
    // despues de la capa de Buddy (lo que brilla de lo que esta en ella)
    after: (g, ctx) => fisher.after(g, ctx)
  };
}
