import React from "react";
import { FalloutLoader } from "./fallout/components/FalloutLoader";
import { createRoot } from "react-dom/client";
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
const isFallout = window.location.pathname.toLowerCase().replace(/\/+$/, "") === "/fallout";
const RootPage = isFallout
  ? React.lazy(() => import("./fallout/FalloutPage.jsx"))
  : React.lazy(() => import("./App.jsx"));

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <React.Suspense fallback={isFallout ? <FalloutLoader /> : null}>
      <RootPage />
    </React.Suspense>
  </React.StrictMode>
);
