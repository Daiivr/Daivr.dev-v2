// Co-op launches handed over by the website (built by shared/nzp.mjs). They are
// re-checked here because FTE joins command-line arguments back into console
// text: only plain characters may reach `+set`, `+map` and `+connect`.
const TEXT = /^[A-Za-z0-9][A-Za-z0-9 _.-]{0,31}$/;
const PASSWORD = /^[A-Za-z0-9_.-]{1,24}$/;
const MAP = /^[a-z0-9_]{1,32}$/;
const ROOM = /^\/[0-9]{1,12}$/;

// Same as NZ:P's Cooperative > Create Game > Choose Map > Start Game: four
// players (NZP_MAX_PLAYERS), Menu_StartCoop's broker listing, and the default
// game settings Menu_Maps_LoadMap applies before `map`.
const GAME_SETTINGS = { sv_gamemode: "0", sv_difficulty: "0", sv_startround: "0", sv_magic: "1", sv_headshotonly: "0", sv_maxai: "24", sv_fastrounds: "0" };
const invalid = () => new Error("This co-op session can't start. Close the game and try again.");

// `set password ""` is not expressible on the command line, so an open session
// resets the cvar instead (NZ:P's own menus save it in user_settings.cfg).
function passwordArgs(password = "") {
  if (!password) return ["+cvarreset", "password"];
  if (!PASSWORD.test(password)) throw invalid();
  return ["+set", "password", password];
}

export function nzpSessionArgs(launch) {
  if (launch?.mode === "host" && TEXT.test(launch.name) && MAP.test(launch.map)) {
    return [
      "+set", "sv_public", "2", "+set", "sv_listen_qw", "1", "+set", "maxclients", "4",
      "+set", "hostname", launch.name, ...passwordArgs(launch.password),
      ...Object.entries(GAME_SETTINGS).flatMap(([name, value]) => ["+set", name, value]),
      "+map", launch.map
    ];
  }
  if (launch?.mode === "join" && ROOM.test(launch.address)) return [...passwordArgs(launch.password), "+connect", launch.address];
  throw invalid();
}

// Printed once the Frag-Net broker assigns the hosted game its room. NZ:P's
// web engine says "Listening on /NZP-REBOOT/668" (protocol/room); upstream FTE
// says "Publicly listening on /668". Clients connect with just "/668", as the
// public server list shows (rtc://master.frag-net.com:27950/668).
export function nzpListeningRoom(text) {
  const room = /[Ll]istening on \S*?\/([0-9]{1,12})\s*$/.exec(String(text));
  return room ? `/${room[1]}` : "";
}
export const nzpBrokerFailed = (text) => /rtc broker connection to \S+ failed|Broker closing connection/.test(String(text));
