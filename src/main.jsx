import React from "react";
import { FalloutLoader } from "./fallout/components/FalloutLoader";
import { createRoot } from "react-dom/client";
import { FALLOUT_NAVIGATION, getPreloadedFalloutPage, preloadFallout } from "./lib/falloutNavigation";
import "./index.css";
import "./styles/attract-mode.css";
import "./styles/cart-swap.css";
import "./styles/discord-presence.css";
import "./styles/game-shelf.css";
import "./styles/hero-entry.css";
import "./styles/link-console.css";
import "./styles/now-dashboard.css";
import "./styles/project-console.css";
import "./styles/project-folder.css";
import "./styles/project-lanyard.css";
import "./styles/toolbelt.css";
import "./styles/comments-console.css";
import "./styles/patch-notes.css";
import "./styles/perched-birds.css";
import "./styles/screen-buddy.css";
import "./styles/site-footer.css";
import "./styles/system-pages.css";
import "./styles/footer-wildlife.css";
import "./styles/buddy-modal.css";
import "./styles/terminal-dialog.css";
import "./styles/madrace.css";
import "./styles/konami-library.css";
import "./styles/cursor.css";
import "./styles/seasonal-events.css";
import "./styles/mobile.css";
import "./styles/entry-avatar.css";
import "./styles/entry-gate.css";
import "./styles/cabinet-sidebar.css";
import "./styles/cabinet-topbar.css";

// The dedicated terminal has its own lazy entry; the portfolio's games, buddy,
// Discord polling and greeting never mount on this route.
const isFalloutPath = () => window.location.pathname.toLowerCase().replace(/\/+$/, "") === "/fallout";
const FalloutPage = React.lazy(preloadFallout);
const CabinetPage = React.lazy(() => import("./App.jsx"));

function RootPage() {
  const [route, setRoute] = React.useState(() => ({ fallout: isFalloutPath(), origin: null }));
  React.useEffect(() => {
    const enter = (event) => { window.scrollTo(0, 0); setRoute({ fallout: true, origin: event.detail }); };
    const restore = () => setRoute({ fallout: isFalloutPath(), origin: null });
    window.addEventListener(FALLOUT_NAVIGATION, enter);
    window.addEventListener("popstate", restore);
    return () => {
      window.removeEventListener(FALLOUT_NAVIGATION, enter);
      window.removeEventListener("popstate", restore);
    };
  }, []);
  // A cabinet click already awaited this module. Rendering the resolved page
  // directly avoids React.lazy briefly committing its full-size loader first.
  const TerminalPage = route.origin ? getPreloadedFalloutPage() || FalloutPage : FalloutPage;
  return <React.Suspense fallback={route.fallout && !route.origin ? <FalloutLoader /> : null}>
    {route.fallout ? <TerminalPage entryOrigin={route.origin} /> : <CabinetPage />}
  </React.Suspense>;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RootPage />
  </React.StrictMode>
);
