import { useSyncExternalStore } from "react";

// Match mobile.css: touch input alone does not make a desktop layout mobile.
const query = "(max-width: 760px)";
const subscribe = (notify) => {
  const media = window.matchMedia(query);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};
export function useMobileView() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => true);
}
