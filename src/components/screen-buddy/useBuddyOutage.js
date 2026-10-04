import { useEffect, useState } from "react";
import { LINES } from "./buddyLines";

/*
  Apagon: la pagina parpadea y se va a negro (App pinta el apagon via
  onPowerOutage), Buddy saca la linterna, encuentra el cuadro electrico, tira
  de la palanca y vuelve la luz. Muy raro por su cuenta (cada 8 min como
  poco); el comando `blackout` lo fuerza.
*/

const OUTAGE_COOLDOWN_MS = 8 * 60 * 1000;

export function useBuddyOutage(core) {
  const [outagePhase, setOutagePhase] = useState("");
  const [api] = useState(() => createOutage(core, { setOutagePhase }));

  useEffect(() => {
    api.cooldownRef.current = Date.now();
    const onOutageSignal = (event) => void core.runAdmin(event, api.start);
    window.addEventListener("daivr-buddy-outage", onOutageSignal);
    return () => {
      window.removeEventListener("daivr-buddy-outage", onOutageSignal);
      core.onPowerOutageRef.current?.("");
    };
  }, [api, core]);

  return { api, view: { outagePhase } };
}

function createOutage(core, { setOutagePhase }) {
  const { moodRef, moodGenRef, facingRef, onPowerOutageRef, reduceMotion } = core;
  const { beginBuddyEvent, endBuddyEvent, freezeAtCurrentPosition, updateMood, updateFacing, facingForDirection, inwardEventDirection, schedule, say, pickLine, playFx } = core;
  const cooldownRef = { current: 0 };

  function startPowerOutage() {
    if (!beginBuddyEvent("outage")) return;
    cooldownRef.current = Date.now();
    freezeAtCurrentPosition();
    updateFacing(facingForDirection(inwardEventDirection(facingRef.current > 0 ? -1 : 1)));
    updateMood("outage");
    const generation = moodGenRef.current;
    setOutagePhase("flicker");
    onPowerOutageRef.current?.("flicker");
    say("power fluctuation detected...", 1500);

    schedule(() => {
      if (moodGenRef.current !== generation || moodRef.current !== "outage") return;
      setOutagePhase("search");
      onPowerOutageRef.current?.("blackout");
      say(pickLine(LINES.outage), 2600);
    }, 1200);

    schedule(() => {
      if (moodGenRef.current !== generation || moodRef.current !== "outage") return;
      setOutagePhase("fix");
      say(pickLine(LINES.outageFix), 2300);
    }, 5100);

    schedule(() => {
      if (moodGenRef.current !== generation || moodRef.current !== "outage") return;
      setOutagePhase("restore");
      onPowerOutageRef.current?.("restore");
      playFx("static", 900);
      say("POWER RESTORED. totally intentional.", 2800, { topic: "outageFix" });
    }, 7600);

    // La pagina vuelve a la normalidad y la caja se despide con un
    // apagado CRT (colapsa a linea y a punto) antes de desmontarse.
    schedule(() => {
      if (moodGenRef.current !== generation || moodRef.current !== "outage") return;
      setOutagePhase("stow");
      onPowerOutageRef.current?.("");
    }, 10400);

    schedule(() => {
      if (moodGenRef.current !== generation || moodRef.current !== "outage") return;
      setOutagePhase("");
      updateMood("idle");
      endBuddyEvent("outage");
    }, 11200);
  }

  const canStart = (now = Date.now()) => !reduceMotion && now - cooldownRef.current > OUTAGE_COOLDOWN_MS;

  // El modo attract apaga el apagon a medias y devuelve la luz.
  function abort() {
    if (moodRef.current !== "outage") return;
    setOutagePhase("");
    onPowerOutageRef.current?.("");
  }

  return { cooldownRef, start: startPowerOutage, canStart, abort };
}
