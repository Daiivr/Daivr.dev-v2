import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./styles/attract-mode.css";
import "./styles/cart-swap.css";
import "./styles/discord-presence.css";
import "./styles/game-shelf.css";
import "./styles/hero-entry.css";
import "./styles/workstation-materials.css";
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
import "./styles/buddy-workshop.css";
import "./styles/buddy-world-polish.css";
import "./styles/buddy-animation-gear.css";
import "./styles/buddy-body-water.css";
import "./styles/buddy-rain-hunt.css";
import "./styles/buddy-encounter-fishing.css";
import "./styles/buddy-abyss.css";
import "./styles/buddy-outage.css";
import "./styles/pixel-birds.css";
import "./styles/terminal-dialog.css";
import "./styles/madrace.css";
import "./styles/konami-library.css";
import "./styles/konami-shelves.css";
import "./styles/cursor.css";
import "./styles/seasonal-events.css";
import "./styles/mobile.css";
import "./styles/entry-avatar.css";
import "./styles/entry-gate.css";
import "./styles/cabinet-sidebar.css";
import "./styles/cabinet-topbar.css";
import "./styles/community.css";
import "./styles/discord-desk.css";
import "./styles/game-collection.css";
import "./styles/arcade-panels.css";
import "./styles/player-passport.css";
import "./styles/arcade-tv.css";
import "./styles/panel-glitch.css";

const CabinetPage = React.lazy(() => import("./App.jsx"));

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <React.Suspense fallback={null}>
      <CabinetPage />
    </React.Suspense>
  </React.StrictMode>
);
