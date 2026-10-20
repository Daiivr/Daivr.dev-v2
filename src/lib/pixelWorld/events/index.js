import { fishingDrawFront, fishingDrawGround, fishingDrawOverlay, fishingPose, fishingTop, fishingUpdate } from "./fishing.js";
import { rainDrawBehind, rainDrawFront, rainTop, rainUpdate } from "./rain.js";
import { creaturesDrawFront, creaturesDrawGround, creaturesDrawOverlay, creaturesPose, creaturesTop, creaturesUpdate } from "./creatures.js";
import { huntDrawBehind, huntDrawFront, huntDrawOverlay, huntPose, huntTop, huntUpdate } from "./hunt.js";
import { campfireDrawFront, campfireDrawGround, campfireDrawOverlay, campfirePose, campfireUpdate } from "./campfire.js";
import { outageDrawFront, outageDrawGround, outageDrawOverlay, outageLight, outagePose, outageUpdate } from "./outage.js";
import { chuteDrawBehind, chutePose, chuteTop, chuteUpdate } from "./chute.js";
import { deepDrawBackdrop, deepDrawFront, deepDrawGround, deepDrawOverlay, deepLight, deepPose, deepTop, deepUpdate } from "./deep.js";
import { lampsDrawFront, lampsDrawOverlay, lampsPose, lampsUpdate } from "./lamplighter.js";
import { gardenDrawFront, gardenDrawOverlay, gardenPose, gardenTop, gardenUpdate } from "./garden.js";
import { tentPose, tentUpdate } from "./tent.js";
import { flashlightDrawOverlay } from "./flashlight.js";
import { portalDrawOverlay, portalLight, portalPose, portalUpdate } from "./portal.js";
import { jelliesDrawGround, jelliesDrawOverlay, jelliesLight, jelliesPose, jelliesUpdate } from "./jellies.js";

// Los eventos de Buddy que el lienzo del footer dibuja. Cada uno puede:
// update (avanzar su estado), pose (afinar la pose de Pip), ground (en el
// suelo, antes que Buddy), behind (justo detras de Buddy), front (delante) y
// backdrop (entre el fondo y Buddy, con su propia luz), overlay (encima de la
// luz: avisos, barras, brillos) y top (hasta donde sube
// lo que dibuja sobre Pip, para subir su bocadillo) y light (apagar el mundo
// y sumar luces propias). La pose del primero que responde gana: el leviatan
// y el kraken (deep) van antes que la pesca para mandar en la pose, y despues
// para dibujarse encima del agujero.
export const EVENTS = [
  // (Pip saliendo del portal de la puerta: manda en su pose antes que nadie)
  { name: "portal", update: portalUpdate, pose: portalPose, overlay: portalDrawOverlay, light: portalLight },
  { name: "deep-pose", pose: deepPose },
  // (entrar y salir de la tienda manda sobre cualquier otra pose)
  { name: "tent", update: tentUpdate, pose: tentPose },
  { name: "fishing", update: fishingUpdate, pose: fishingPose, ground: fishingDrawGround, front: fishingDrawFront, overlay: fishingDrawOverlay, top: fishingTop },
  { name: "deep", update: deepUpdate, ground: deepDrawGround, backdrop: deepDrawBackdrop, front: deepDrawFront, overlay: deepDrawOverlay, light: deepLight, top: deepTop },
  { name: "rain", update: rainUpdate, behind: rainDrawBehind, front: rainDrawFront, top: rainTop },
  { name: "creatures", update: creaturesUpdate, pose: creaturesPose, ground: creaturesDrawGround, front: creaturesDrawFront, overlay: creaturesDrawOverlay, top: creaturesTop },
  { name: "hunt", update: huntUpdate, pose: huntPose, behind: huntDrawBehind, front: huntDrawFront, overlay: huntDrawOverlay, top: huntTop },
  { name: "campfire", update: campfireUpdate, pose: campfirePose, ground: campfireDrawGround, front: campfireDrawFront, overlay: campfireDrawOverlay },
  { name: "chute", update: chuteUpdate, pose: chutePose, behind: chuteDrawBehind, top: chuteTop },
  { name: "outage", update: outageUpdate, pose: outagePose, light: outageLight, ground: outageDrawGround, front: outageDrawFront, overlay: outageDrawOverlay },
  { name: "lamps", update: lampsUpdate, pose: lampsPose, front: lampsDrawFront, overlay: lampsDrawOverlay },
  { name: "garden", update: gardenUpdate, pose: gardenPose, front: gardenDrawFront, overlay: gardenDrawOverlay, top: gardenTop },
  { name: "flashlight", overlay: flashlightDrawOverlay },
  { name: "jellies", update: jelliesUpdate, pose: jelliesPose, ground: jelliesDrawGround, overlay: jelliesDrawOverlay, light: jelliesLight }
];
