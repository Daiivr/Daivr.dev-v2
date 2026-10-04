import { useEffect, useState } from "react";

// Fecha actual que se refresca cada 30 s: suficiente para relojes en minutos
// (status.ini de Now.log, la tarjeta de jugador de la barra lateral).
export function useMinuteClock() {
  const [date, setDate] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setDate(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  return date;
}
