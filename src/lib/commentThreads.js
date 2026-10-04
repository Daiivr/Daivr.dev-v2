// Hilos del libro de visitas: a quien contesta cada respuesta y un trocito
// de ella para citarla. Puro, se prueba con node.

// A quien contesta cada respuesta: a la que diga su replyTo; en las antiguas
// (sin replyTo), si la escribe quien abrio el hilo, a la ultima respuesta de
// otra persona (no se contesta a si mismo); si no, al comentario (null).
export function replyParents(comment, replies) {
  const byId = new Map(replies.map((reply) => [String(reply.id), reply]));
  return replies.map((reply, index) => {
    if (reply.replyTo) return byId.get(String(reply.replyTo)) || null;
    const authorId = reply.author?.id;
    if (!authorId || authorId !== comment.author?.id) return null;
    for (let earlier = index - 1; earlier >= 0; earlier -= 1) {
      if (replies[earlier].author?.id !== authorId) return replies[earlier];
    }
    return null;
  });
}

export function replySnippet(reply) {
  const text = String(reply?.text || "").replace(/\s+/g, " ").trim();
  if (text) return text.length > 28 ? `${text.slice(0, 27)}…` : text;
  return reply?.gifUrl ? "GIF" : "";
}
