import { useEffect, useState } from "react";

export function useClock() {
  const [time, setTime] = useState(() => formatTime());

  useEffect(() => {
    const timer = window.setInterval(() => setTime(formatTime()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  return time;
}

function formatTime() {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date());
}
