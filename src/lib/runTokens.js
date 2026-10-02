// Fichas de partida firmadas por el servidor (server/run-tokens.mjs).
//
// Se piden en cuanto se abre el juego, antes de que el iframe arranque, porque
// el servidor compara la duracion de cada marcador con el tiempo que ha pasado
// desde que emitio la ficha. Una ficha pedida al terminar la partida diria que
// no ha pasado nada y el marcador se rechazaria.
//
// La guardan aqui y no en el modal porque el aviso del reto diario
// (useDailyChallengeNotice) tambien envia marcadores del mismo juego.

const requests = new Map();

export function armRunToken(game) {
  const request = fetch(`/api/${game}/run`, {
    method: "POST",
    credentials: "include",
    headers: { Accept: "application/json" }
  })
    .then((response) => (response.ok ? response.json() : {}))
    .then((payload) => (typeof payload?.token === "string" ? payload.token : ""))
    .catch(() => "");
  requests.set(game, request);
  return request;
}

export function runTokenFor(game) {
  return requests.get(game) || Promise.resolve("");
}
