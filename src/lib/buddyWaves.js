import { getCabinetSignal } from "./cabinetSignals";

// Saludar al jugador de un buddy de visita: el servidor se lo hace llegar a su
// pestaña por el stream del libro de visitas (`visits:wave`). Los visitantes
// de prueba (comando `visit`) no tienen jugador detras.
export async function sendBuddyWave(to) {
  const token = getCabinetSignal("visitHello")?.token;
  if (!token || !to || String(to).startsWith("test-")) return { ok: false, status: 0 };
  try {
    const response = await fetch("/api/comments/stream/wave", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, to })
    });
    return { ok: response.ok, status: response.status };
  } catch {
    return { ok: false, status: 0 };
  }
}
